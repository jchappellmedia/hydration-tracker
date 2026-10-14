#!/usr/bin/env python3
"""Record a finished daily run: dedup ledger, repo tracker, daily log, and run.json.

    python3 finalize_daily.py <workflow-result.json> <repo dir> <date>

Writes run.json (input for assemble_run.py) next to the result file, appends every
screened job to Job Hunt 2026/_system/seen-jobs.csv and applications/_tracker.csv,
and writes Job Hunt 2026/_daily-log/<date>.md.
"""
import csv
import json
import os
import sys

res_path, repo, run_date = sys.argv[1:4]
res = json.load(open(res_path))
JH = os.path.join(repo, "Job Hunt 2026")

picks = [p for p in res.get("picks", []) if p and not p.get("failed")]
json.dump({"picks": picks}, open(os.path.join(os.path.dirname(res_path), "run.json"), "w"), indent=1)

pick_keys = {p["v"]["key"] for p in picks}


def status_of(v):
    if v["key"] in pick_keys:
        return "top5"
    if v.get("pass"):
        return "screened-not-picked"
    r = (v.get("reject_reason") or "").lower()
    if any(w in r for w in ("pay", "salary", "$", "commission")):
        return "skipped-pay"
    if any(w in r for w in ("commute", "location", "remote", "state", "relocat", "on-site", "onsite")):
        return "skipped-location"
    if any(w in r for w in ("staffing", "unnamed", "confidential", "license", "rule 4", "excluded", "mlm")):
        return "skipped-excluded"
    return "skipped-fit"


verdicts = res.get("verdicts", [])
seen_path = os.path.join(JH, "_system", "seen-jobs.csv")
with open(seen_path, "a", newline="") as f:
    w = csv.writer(f)
    for v in verdicts:
        w.writerow([run_date, v["company"], v["title"], status_of(v), "daily run " + run_date])

tracker = os.path.join(repo, "applications", "_tracker.csv")
with open(tracker, "a", newline="") as f:
    w = csv.writer(f)
    for v in verdicts:
        st = status_of(v)
        folder = ""
        if st == "top5":
            p = next(p for p in picks if p["v"]["key"] == v["key"])
            folder = os.path.relpath(p["dir"], repo)
        note = v.get("summary") or v.get("reject_reason") or ""
        w.writerow([run_date, v["company"], v["title"], v.get("location", ""), v.get("pay_text", ""),
                    "daily run (ZipRecruiter/Dice/Snagajob/web)", v.get("apply_url", ""),
                    "queued" if st == "top5" else st, folder, note[:600]])

counts = res.get("counts", {})
lines = [f"# Daily Job Hunt: {run_date}", "",
         f"Sources down: {', '.join(res.get('unavailable', [])) or 'none'}.", "",
         f"Found {counts.get('raw', '?')} results, {counts.get('unique', '?')} new after removing repeats, "
         f"screened {counts.get('screened', '?')}, {counts.get('passed', '?')} passed the rules, "
         f"{counts.get('survivors', '?')} had enough posting text to build.", "", "## Today's picks", ""]
for p in picks:
    v, jd = p["v"], p.get("jd") or {}
    lines.append(f"- **{v['company']}**, {v['title']}: {v.get('pay_text', '')}; {v.get('location', '')}; "
                 f"fit {v.get('fit')}; posting {'word for word' if jd.get('verbatim') else 'best available text'}.")
lines += ["", "## Screened out", ""]
for v in verdicts:
    if v["key"] not in pick_keys:
        lines.append(f"- {v['company']}, {v['title']}: {status_of(v)}. {(v.get('reject_reason') or v.get('summary') or '')[:200]}")
os.makedirs(os.path.join(JH, "_daily-log"), exist_ok=True)
open(os.path.join(JH, "_daily-log", f"{run_date}.md"), "w").write("\n".join(lines) + "\n")
print(json.dumps({"picks": len(picks), "verdicts": len(verdicts)}))
