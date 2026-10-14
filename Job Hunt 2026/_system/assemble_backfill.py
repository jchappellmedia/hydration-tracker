#!/usr/bin/env python3
"""Build Job Hunt 2026 folders for applications made before the folder existed.

    python3 assemble_backfill.py <backfill.json> <journal.jsonl> <Job Hunt 2026 dir> <applications dir>

backfill.json lists [slug, date, company, company_file, role] per job. The workflow
journal holds one research result per employer ("research:<key>" agents), each with
company research plus per-job apply link, facts, fit notes, and the posting file.
"""
import json
import os
import re
import shutil
import subprocess
import sys

rows_path, journal, jh_dir, apps = sys.argv[1:5]
SYS = os.path.join(jh_dir, "_system")
rows = json.load(open(rows_path))

labels, results = {}, {}
for line in open(journal):
    try:
        j = json.loads(line)
    except ValueError:
        continue
    if j.get("type") == "started":
        labels[j["key"]] = j.get("label", "")
    elif j.get("type") == "result":
        results[labels.get(j.get("key"), "")] = j.get("result")

per_job, research_for = {}, {}
for label, res in results.items():
    if not label.startswith("research:") or not isinstance(res, dict):
        continue
    for jb in res.get("jobs", []):
        per_job[jb["slug"]] = jb
        research_for[jb["slug"]] = res.get("research") or {}


def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"[/:\\]", "-", str(s))).strip()


out = []
for slug, date, company, company_file, role in rows:
    app = os.path.join(apps, slug)
    jb = per_job.get(slug)
    if not jb:
        out.append({"slug": slug, "error": "no research result"})
        continue
    job = json.load(open(os.path.join(app, "job.json")))
    jd_file = jb.get("jd_file") or ""
    if not os.path.isabs(jd_file):
        jd_file = os.path.join(app, os.path.basename(jd_file or "jd-verbatim.md"))
    for cand in (jd_file, os.path.join(app, "jd-verbatim.md"), os.path.join(app, "jd-saved.md")):
        if os.path.exists(cand):
            jd_file = cand
            break
    jd_text = open(jd_file, encoding="utf-8").read().strip() if os.path.exists(jd_file) else ""
    facts = [[str(a), str(b)] for a, b, *_ in (jb.get("facts") or []) if a]
    if jb.get("apply_note"):
        facts.append(["How to apply", jb["apply_note"]])
    job["reference"] = {
        "apply_url": jb.get("apply_url") or "",
        "facts": facts,
        "why_heading": "Why it fit",
        "why": jb.get("why") or [],
        "gaps": jb.get("gaps") or [],
        "gaps_note": ("Suggested answers carried over from the original analysis. Some assume a course or "
                      "certification is under way; say those only if they are true when you interview."),
        "jd_source": jb.get("jd_source") or "",
        "jd_text": jd_text or "The posting text was not saved for this application.",
        "research": research_for.get(slug, {}),
    }
    json.dump(job, open(os.path.join(app, "job.json"), "w"), indent=1, ensure_ascii=False)

    folder = os.path.join(jh_dir, clean(f"{date} - {company} - {role}")[:120])
    os.makedirs(folder, exist_ok=True)
    shutil.copy(os.path.join(app, "job.json"), os.path.join(folder, "job.json"))
    res = subprocess.run(["node", os.path.join(SYS, "build_docs.js"), os.path.join(folder, "job.json"), folder],
                         capture_output=True, text=True)
    report = {}
    try:
        report = json.loads(res.stdout[res.stdout.index("{"):])
    except ValueError:
        pass
    for leftover in ("resume.html", "cover-letter.html", "reference.html", "resume_preview.png"):
        src = os.path.join(folder, leftover)
        if os.path.exists(src):
            os.replace(src, os.path.join(app, "build-" + leftover))
    out.append({"slug": slug, "folder": os.path.basename(folder), "exit": res.returncode,
                "jd_status": jb.get("jd_status"), "apply": jb.get("apply_url"),
                "files": [(f["file"], f.get("pages")) for f in report.get("files", [])],
                "fit": report.get("resume_fit"), "stderr": res.stderr[-400:]})

print(json.dumps(out, indent=1))
