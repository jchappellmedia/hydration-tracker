# Daily Job Hunt: Top Five

The procedure for Joshua Chappell's daily job hunt. A scheduled task on his Mac runs it every
morning and saves the results into this folder (`iCloud Drive/Job Hunt 2026`), which iCloud then
syncs to his other devices.

Follow it top to bottom. Where it disagrees with the `job-hunt` skill (which was written for
auto-applying from a cloud session), **this file wins**. Nothing gets submitted on Joshua's behalf.
He reviews each folder and applies himself.

---

## 0. Paths

```
JH   = ~/Library/Mobile Documents/com~apple~CloudDocs/Job Hunt 2026      (this folder)
SYS  = $JH/_system
```

If `JH` doesn't exist at that path, look for a folder named `Job Hunt 2026` in iCloud Drive or
the current working directory. Stop and say so if you can't find it. Never create a second copy.

## 1. One-time setup (skip if already done)

```bash
cd "$SYS" && npm install          # docx + playwright-core, about 30 MB, local to _system
```

The document builder also needs Google Chrome (it looks in `/Applications/Google Chrome.app`;
set `CHROME_BIN` if Chrome lives somewhere else). LibreOffice is optional. If it's installed, the
builder uses it to confirm each Word resume is exactly one page.

## 2. Load the ground truth

1. Re-read Joshua's **living CV**, a Google Doc. Use the Google Drive connector's
   `read_file_content` with fileId `12ejSK4KqGYDSxFD8F6Ab1uZIQr-vafTE_cNElmBIhxc`.
   If Drive isn't available, use `$SYS/references/candidate-profile.md` and say so in the report.
2. Read `$SYS/references/candidate-profile.md` in full. It holds the standing preferences and
   known gaps, and it **overrides the live doc on the standing corrections**: OpenClaw not Sora,
   Mesa AZ on documents, no em dashes, the Premiere/RFK precision note, the $10k rule, and the
   7x rule.
3. Read `$SYS/references/writing-style.md`.

## 3. Never repeat a job

Build the "already seen" set **before searching** from:

- `$SYS/seen-jobs.csv`, the master ledger. Every row is off the table.
- Every existing job folder name in `$JH`. Each folder is named `YYYY-MM-DD - Company - Role`.
- If Google Drive is connected: the doc `Job Hunt Tracker (master)` and every Drive doc whose title
  contains `Job Hunt Log`. Cloud sessions log there.

Match on company plus role, ignoring case, punctuation, "Inc/LLC/Corp", and words like "Remote".
A different role at a company seen before is allowed, but mention it. The **same job reposted**
(same company, same or near-identical title) counts as a duplicate.

## 4. Search rules (set by Joshua, 2026-10-14)

**Pay floor: $76,000/year ($36.54/hour).**
- Tier A: posted minimum is $76k or more. Prefer these.
- Tier B: posted range starts below $76k but its midpoint is $76k or more. Allowed; flag it.
- Tier C: no pay posted, but solid evidence puts it at $76k or more. Use only to fill slots; flag it.
- Reject: a posted max or midpoint under $76k, and any commission-only or 1099 sales role.

**Location: within about a 30-minute drive of 85206 (east Mesa), or remote.**
- Usually fine: Mesa, Gilbert, Chandler (east and central), Queen Creek, Apache Junction,
  San Tan Valley (north), Tempe (east and central).
- Borderline, so estimate the drive: Tempe near ASU, west Chandler, the Sky Harbor area, south Scottsdale.
- No: downtown, north, or west Phoenix, Glendale, Peoria, the West Valley, north Scottsdale, and anywhere out of state.
- Remote counts **only if an Arizona resident can take it**. Reject remote jobs that require living
  in another state or city, that list eligible states without Arizona, or that require regular office days elsewhere.

**What he wants:** management or leadership roles in media, video, creative, content, marketing,
brand, or communications. Remote is preferred. He also asked to be **surprised** with roles in
other fields where his skills honestly transfer: enrollment or education marketing, creative or
marketing operations, communications or public information, customer education or training video,
production management, partnerships, or AI content production.

**Exclude:** unnamed or confidential employers; MLM, franchise, or pay-to-start offers; roles that
require a license he doesn't hold; staffing posts that hide the client; and postings older than
about 30 days.

## 5. Discover across several boards

Use every source that's available and note any that aren't.

| Source | How | Gives full posting text? |
|---|---|---|
| Indeed | connector `search_jobs` / `get_job_details` / `get_company_data` | Yes |
| Dice | connector `search_jobs` / `get_job_details` | Yes |
| ZipRecruiter | connector `search_jobs` (salary_min 76000, radius 25 mi of "Mesa, AZ 85206", plus REMOTE) | No. Find the same job elsewhere |
| Snagajob | connector `search_jobs` (mostly hourly; quick pass) | Partial |
| Web | WebSearch / WebFetch: Monster, LinkedIn, Greenhouse, Lever, Ashby, Workday, company career pages | When the page can be fetched |

Run a real matrix rather than one query: about 12 titles across Mesa, Gilbert, Chandler, Tempe, and
remote. Cover media and video leadership, marketing leadership, communications, and a "surprise"
sweep. East Valley employers that hire for this work: ASU, Banner Health, City of Mesa, Town of
Gilbert, City of Chandler, City of Tempe, the Mesa, Chandler, and Gilbert school districts, Maricopa
Community Colleges, Intel, Northrop Grumman, Boeing Mesa, Isagenix, Carvana, GoDaddy, Keap, Waymo,
Dexcom, SRP, and Desert Financial.

## 6. Screen, then pick the top five

For each new candidate, get the **full posting text** and check pay tier, commute, remote
eligibility, exclusions, and fit (Strong / Partial / Weak against the profile). Most candidates
should fail; that's correct.

Rank the survivors and take the **five best**. Weigh these three questions:
1. How likely is an interview, given his real record against the stated requirements?
2. How well does it match what he asked for: management, media/marketing, remote, and pay tier A?
3. How safe and high-quality is it: the employer, the pay clarity, the commute, how fresh the post is, and whether the posting text is available?

Allow at most one or two "surprise" picks. Prefer jobs whose posting text can be captured word for
word. If fewer than five qualify, deliver fewer and say why. **Never pad with weak jobs.**

## 7. Build each job's folder

Folder: `$JH/YYYY-MM-DD - <Company> - <Role>/`. Use today's date and strip `/` and `:` from names.

### 7a. Content file

Write `job.json` in the job folder. `$SYS/templates/example-job.json` shows the exact shape and the
quality bar. You write the words; `build_docs.js` handles all layout.

- `company`, `company_file` (CamelCase, used in file names), `role`
- `resume`: `links`, `summary`, `jobs[]` (company, title, location, dates, up to 4 bullets),
  `skills[]`, `education[]`, `certifications[]`
- `cover_letter`: `greeting`, `links`, `paragraphs[]`, `closing`
- `reference`: see 7c

**Resume rules (non-negotiable):**
- Rearrange his real material. Never invent experience, tools, metrics, or titles. Every line must
  trace to the profile. **Leave gaps off the resume** and name them in the reference sheet.
- Write a 3-sentence summary aimed at this posting, in his voice: short declarative sentences,
  strong verbs (crafted, delivered, built, slashed, commanded), numbers early.
- Up to 4 bullets per job. Lead with what matters most for this job, and reorder jobs using the angle library.
- **No em dashes or en dashes.** Date ranges use a plain hyphen: "Sep 2019 - Present".
- The contact line says Mesa, AZ. Lightbox Digital's location stays "Glendale, AZ". Write "OpenClaw", never "Sora".
- Don't lead with the $10k figure. Keep the 7x claim off cover letters. Never attach a Premiere claim to RFK Jr.
- He has no formal manager title. Describe leadership truthfully: he directed crews of 5 to 20 and owns a company.
- Creative and marketing roles get 2 or 3 portfolio links. Other roles get LinkedIn only.

**Cover letter:** use the writing-style template exactly, including the greeting
"Hello <Company> Employee," and the fixed opening and closing lines. Write a 1 or 2 paragraph
middle framed as **value delivered to the employer**, tied to the posting, and quoting resume
phrasing verbatim where the two overlap. Keep it to one page.

### 7b. Build and check

```bash
cd "$SYS"
node build_docs.js "<job folder>/job.json" "<job folder>" --only resume   # status must be OK; Word pages must be 1
node build_docs.js "<job folder>/job.json" "<job folder>" --only cover    # 1 page PDF and Word
```

`OVERFLOW` means cut the weakest bullet. `UNDERFILL` means add a true, relevant bullet or skill.
Look at `resume_preview.png` before moving on.

### 7c. Reference sheet: job description, apply link, company research

**The reference sheet is always delivered as a PDF**, with clickable links: the apply button at the
top and a numbered source link on every research point. A Word copy sits next to it. A run that
leaves the sheet as Markdown, HTML, or Word only is not finished.

`job.json` → `reference`:
- `apply_url`: the link he clicks to apply. Keep it intact.
- `facts`: rows of `[label, value]`: Pay (and its tier), Location and commute, Work mode, Posted, Source, Job ID.
- `why`: 2 to 4 bullets on why it made the top five. `gaps`: honest gaps, each with the short answer he can give in an interview.
- `jd_source`: where the text came from and when. `jd_text`: **the posting word for word**, in the
  same words and order, with nothing summarized, fixed, or left out. If a word-for-word copy truly
  can't be captured, say so plainly in `jd_source` and include the fullest text available.
- `research`: what employees say about working there, from **Glassdoor and Reddit** (plus Indeed
  company reviews when available). Fill `overview`, the `glassdoor`, `indeed`, and `reddit` blocks,
  4 to 7 `pros` and 4 to 7 `cons` (each with `sources` URLs), `red_flags`, `bottom_line`, and
  `sources`. **Every pro and con cites a real URL a tool returned.** Never invent ratings, review counts, quotes, or threads.

Then build everything:

```bash
node build_docs.js "<job folder>/job.json" "<job folder>"
```

That produces the following in the job folder. Check that all seven files exist and that the reference-sheet **PDF** opens before you move on:

```
Joshua_Chappell_Resume_<Co>.pdf / .docx
Joshua_Chappell_CoverLetter_<Co>.pdf / .docx
Job Description & Company Research - <Company>.pdf / .docx
Apply Here - <Company>.webloc
```

Remove the build leftovers (`resume.html`, `cover-letter.html`, `reference.html`,
`resume_preview.png`). Keep `job.json` so a later run can rebuild the documents.

### 7d. Honesty pass

Before finishing, reread the resume and cover letter against the profile as a skeptic. Fix any line
he couldn't defend in an interview, rebuild, and confirm the page counts again.

## 8. Record it

- Append every job you examined to `$SYS/seen-jobs.csv`, including the skips, with
  `first_seen,company,role,status,source`. Status is `top5`, `skipped-pay`, `skipped-location`,
  `skipped-fit`, `skipped-excluded`, or `duplicate`. **This file is what keeps tomorrow's run from repeating today's.**
- Write `$JH/_daily-log/YYYY-MM-DD.md`: the sources used (and any that were down), the counts found
  and screened out, the five picks with one line each, and anything Joshua should know.
- If Google Drive is connected, also create a Drive doc titled `Job Hunt Log YYYY-MM-DD` listing
  every job examined as `date | company | role | location | pay | status | notes`. Cloud sessions use it to avoid duplicates.

## 9. Report

End with a short summary: the five jobs (company, role, pay, location or remote, and fit in one
line), the counts, and any honest concerns. Link each job folder.
