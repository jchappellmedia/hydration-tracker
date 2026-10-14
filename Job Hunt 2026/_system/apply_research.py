#!/usr/bin/env python3
"""Swap fresh company research into existing job folders and rebuild their reference sheets.

    python3 apply_research.py <workflow-output.json> <Job Hunt 2026 dir> <applications dir> slug=folder-prefix ...

The workflow output is a list of {key, research, slugs?}. Each slug's job.json (in
applications/ and in its Job Hunt 2026 folder) gets the new research block.
"""
import glob, json, os, subprocess, sys

out_path, jh, apps = sys.argv[1:4]
o = json.load(open(out_path))
items = o.get("result", o) if isinstance(o, dict) else o
for it in items:
    r = it.get("research")
    if not r:
        print("no research for", it.get("key")); continue
    for slug in it.get("slugs") or [it["key"]]:
        app = os.path.join(apps, slug, "job.json")
        job = json.load(open(app))
        folders = [d for d in glob.glob(os.path.join(jh, "*")) if os.path.exists(os.path.join(d, "job.json"))
                   and json.load(open(os.path.join(d, "job.json"))).get("role") == job.get("role")
                   and json.load(open(os.path.join(d, "job.json"))).get("company_file") == job.get("company_file")]
        lc = r.pop("location_check", None)
        job["reference"]["research"] = r
        if lc:
            job["reference"]["facts"].append(["Location check", lc])
        json.dump(job, open(app, "w"), indent=1, ensure_ascii=False)
        for d in folders:
            json.dump(job, open(os.path.join(d, "job.json"), "w"), indent=1, ensure_ascii=False)
            res = subprocess.run(["node", os.path.join(jh, "_system", "build_docs.js"), os.path.join(d, "job.json"), d, "--only", "reference"],
                                 capture_output=True, text=True)
            ref = os.path.join(d, "reference.html")
            if os.path.exists(ref):
                os.replace(ref, os.path.join(apps, slug, "build-reference.html"))
            pages = [l.strip() for l in res.stdout.splitlines() if "reference_pages" in l or "reference_docx_pages" in l]
            print(slug, "->", os.path.basename(d), res.returncode, pages, "pros", len(r.get("pros", [])), "cons", len(r.get("cons", [])))
