#!/usr/bin/env python3
"""Convert an existing resume.html (+ cover-letter.html) into build_docs.js content.

    python3 html_to_job.py <application dir> <company> <company_file> <role> > job.json

Used to bring applications built before the Job Hunt 2026 system into the new
PDF + Word format without rewriting a word of them.
"""
import json
import os
import re
import sys

from bs4 import BeautifulSoup, NavigableString

app, company, company_file, role = sys.argv[1:5]


def inline(el):
    """Element contents -> text with **bold** and [label](url) kept."""
    out = []
    for c in el.children:
        if isinstance(c, NavigableString):
            out.append(str(c))
        elif c.name in ("strong", "b", "mark"):
            out.append(f"**{inline(c).strip()}**")
        elif c.name == "a" and c.get("href", "").startswith("http"):
            out.append(f"[{c.get_text(' ', strip=True)}]({c['href']})")
        elif c.name == "br":
            out.append(" ")
        else:
            out.append(inline(c))
    return re.sub(r"\s+", " ", "".join(out)).strip()


def links_and_email(contact):
    email, links = None, []
    for a in contact.find_all("a"):
        href = a.get("href", "")
        if href.startswith("mailto:"):
            email = href[7:]
        elif href.startswith("http"):
            links.append({"label": a.get_text(" ", strip=True), "url": href})
    return email, links


job = {"company": company, "company_file": company_file, "role": role}

soup = BeautifulSoup(open(os.path.join(app, "resume.html"), encoding="utf-8").read(), "html.parser")
email, links = links_and_email(soup.select_one(".contact"))
R = {"email": email or "jchappellmedia@gmail.com", "links": links,
     "summary": inline(soup.select_one(".summary")), "jobs": [], "skills": [],
     "education": [], "certifications": [], "extra_sections": []}
for h2 in soup.find_all("h2"):
    head = h2.get_text(" ", strip=True)
    sec = h2.parent
    if head.lower() == "experience":
        for j in sec.select(".job"):
            first = j.select_one(".job-head > span")
            comp = j.select_one(".job-company").get_text(" ", strip=True)
            title = re.sub(r"^\s*,\s*", "", first.get_text(" ", strip=True)[len(comp):]).strip()
            meta = j.select_one(".job-meta").get_text(" ", strip=True)
            loc, _, dates = [x.strip() for x in meta.partition("|")]
            dates = dates.replace("–", "-").replace("—", "-")
            R["jobs"].append({"company": comp, "title": title, "location": loc, "dates": dates,
                              "bullets": [inline(li) for li in j.select("li")]})
    elif head.lower() == "skills":
        text = sec.find("p").get_text(" ", strip=True)
        R["skills"] = [re.sub(r"\s+", " ", x).strip() for x in text.split("•") if x.strip()]
    elif head.lower().startswith("education"):
        R["education_heading"] = head
        for line in sec.select(".edu-line"):
            strong = line.find("strong")
            if strong:
                span = line.find("span")
                date = span.get_text(" ", strip=True).lstrip("| ").strip() if span else ""
                full = line.get_text(" ", strip=True)
                degree = full[len(strong.get_text(" ", strip=True)):]
                if span:
                    degree = degree[: degree.rfind(span.get_text(" ", strip=True))]
                R["education"].append({"school": strong.get_text(" ", strip=True),
                                       "degree": degree.strip(" ,"), "date": date})
            else:
                R["certifications"] += [re.sub(r"\s+", " ", x).strip()
                                        for x in line.get_text(" ", strip=True).split("•") if x.strip()]
    else:
        lines = [inline(x) for x in sec.select(".edu-line, li, p")] or [inline(sec)]
        R["extra_sections"].append({"heading": head, "lines": lines})
job["resume"] = R

cl = os.path.join(app, "cover-letter.html")
if os.path.exists(cl):
    soup = BeautifulSoup(open(cl, encoding="utf-8").read(), "html.parser")
    contact = soup.select_one(".contact")
    email, links = links_and_email(contact) if contact else (None, [])
    paras = [p for p in soup.find_all("p") if p.find_parent(class_="head") is None]
    sign = [p for p in paras if "sign" in (p.get("class") or [])]
    body = [p for p in paras if p not in sign]
    closing = "Sincerely,"
    if sign:
        closing = sign[0].get_text("\n", strip=True).split("\n")[0]
    job["cover_letter"] = {"email": email or R["email"], "links": links,
                           "greeting": inline(body[0]), "paragraphs": [inline(p) for p in body[1:]],
                           "closing": closing}

json.dump(job, sys.stdout, indent=1, ensure_ascii=False)
