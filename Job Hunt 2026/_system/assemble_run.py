#!/usr/bin/env python3
"""Assemble a finished daily run into the Job Hunt 2026 folder.

    python3 assemble_run.py <run.json> <Job Hunt 2026 dir> <date>

run.json holds, per pick: the screening verdict ("v"), the posting capture ("jd"),
the company research ("research"), and the working directory ("dir") that has
job.json (resume + cover letter content) and jd-verbatim.md. This script adds
the reference sheet to job.json, builds every document into
"<date> - <Company> - <Role>/", and cleans up the build leftovers.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date as _date

run_path, jh_dir, run_date = sys.argv[1], sys.argv[2], sys.argv[3]
SYS = os.path.join(jh_dir, "_system")
run = json.load(open(run_path))
nice_date = _date.fromisoformat(run_date).strftime("%B %-d, %Y")

TIER = {
    "A": "posted minimum meets your $76k floor",
    "B": "range starts under $76k; midpoint clears it",
    "C": "not posted; estimate only",
}


def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"[/:\\]", "-", str(s))).strip()


out = []
for p in run["picks"]:
    v, jd, research, wd = p["v"], p["jd"], p.get("research") or {}, p["dir"]
    job = json.load(open(os.path.join(wd, "job.json")))
    jd_text = open(os.path.join(wd, "jd-verbatim.md"), encoding="utf-8").read().strip()
    company = jd.get("company_exact") or v["company"]
    role = jd.get("title_exact") or v["title"]
    apply_url = jd.get("apply_url") or v.get("apply_url") or jd.get("posting_url")

    mode = (v.get("work_mode") or "").lower()
    if mode == "remote":
        where = "Remote (open to Arizona residents)"
    else:
        mins = v.get("commute_minutes")
        where = f"About {int(mins)} min drive from 85206" if mins else "Commute not estimated"
    pay = jd.get("pay_exact") or v.get("pay_text") or "Not posted"
    facts = [
        ["Pay", f"{pay} ({TIER.get(v.get('pay_tier'), 'see notes')})"],
        ["Location", jd.get("location_exact") or v.get("location") or ""],
        ["Work mode / commute", f"{(v.get('work_mode') or 'unknown').capitalize()}. {where}"],
        ["Fit", f"{v.get('fit')}{', leadership role' if v.get('management') else ''} ({v.get('category', '')})"],
        ["Posted", jd.get("posted_date") or v.get("posted") or "Not stated"],
        ["Employment type", jd.get("employment_type") or "Not stated"],
        ["Found on", f"{jd.get('source_tool') or v.get('jd_tool') or ''} (job ID {jd.get('source_ref') or v.get('jd_ref') or 'n/a'})"],
    ]
    if jd.get("posting_url") and jd.get("posting_url") != apply_url:
        facts.append(["Posting page", f"[{jd['posting_url']}]({jd['posting_url']})"])

    if jd.get("verbatim"):
        jd_source = (f"Copied word for word from the {jd.get('source_tool')} listing "
                     f"(job ID {jd.get('source_ref')}) on {nice_date}. Check the live posting before applying in case it has changed.")
    else:
        jd_source = (f"A word-for-word copy could not be captured from the job board on {nice_date}. "
                     "This is the fullest text available. Open the apply link to read the live posting.")

    job["company"], job["role"] = company, role
    job["reference"] = {
        "apply_url": apply_url,
        "facts": facts,
        "why": v.get("why_good") or [],
        "gaps": v.get("gaps") or [],
        "jd_source": jd_source,
        "jd_text": jd_text,
        "research": research,
    }

    folder = os.path.join(jh_dir, clean(f"{run_date} - {company} - {role}")[:120])
    os.makedirs(folder, exist_ok=True)
    json.dump(job, open(os.path.join(folder, "job.json"), "w"), indent=1, ensure_ascii=False)
    json.dump(job, open(os.path.join(wd, "job.json"), "w"), indent=1, ensure_ascii=False)

    env = dict(os.environ)
    res = subprocess.run(["node", os.path.join(SYS, "build_docs.js"), os.path.join(folder, "job.json"), folder],
                         capture_output=True, text=True, env=env)
    report = {}
    try:
        report = json.loads(res.stdout[res.stdout.index("{"):])
    except Exception:
        pass
    for leftover in ("resume.html", "cover-letter.html", "reference.html"):
        src = os.path.join(folder, leftover)
        if os.path.exists(src):
            shutil.move(src, os.path.join(wd, leftover))
    prev = os.path.join(folder, "resume_preview.png")
    if os.path.exists(prev):
        shutil.move(prev, os.path.join(wd, "resume_preview.png"))
    out.append({"company": company, "role": role, "folder": folder, "exit": res.returncode,
                "report": report, "stderr": res.stderr[-800:]})

print(json.dumps(out, indent=1))
