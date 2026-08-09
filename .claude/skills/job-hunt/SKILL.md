---
name: job-hunt
description: Joshua Chappell's automated job search and application system. Use this skill whenever a job description or job posting link is pasted into the chat (Indeed, LinkedIn, ZipRecruiter, Breezy, Workday, a company careers page, or plain pasted job text), whenever the user asks to find jobs, apply to a job, tailor a resume or cover letter for a role, run the daily job hunt, check application status, or asks for "Feedback on Full Resume". Also use it for scheduled/recurring daily job-hunt runs. Trigger this even when the user only says something like "make a resume for this one", "apply to this", "what's out there today", or pastes a posting with no instructions at all — a pasted job description is itself the trigger.
---

# Job Hunt

Automated job discovery, tailored application materials, and submission for Joshua Chappell.

Two entry points, same machinery:

- **Ad-hoc** — a job description or link appears in chat. Build materials for that one job, apply, log it.
- **Scheduled** — the daily run. Discover jobs, screen them, build materials, apply, report.

## Workspace

Everything is written under a single job-hunt workspace. Pick it once at the start of a run:

- If the working directory is a git repo that already has an `applications/` folder, use that. Commit and push at the end of every run — those containers are ephemeral and unpushed work is lost.
- Otherwise create and use `~/Job Hunt/` (or the working directory the user has set up for this). No git required; just keep the same folder across runs so the tracker accumulates.

Inside the workspace:

```
applications/
  _tracker.csv              every job ever seen — the deduplication record
  _daily-log/<date>.md      what each run did
  <company>-<role>/         one folder per job, five documents + PDFs
```

## Before anything else

Read these two files. They are the ground truth and they change over time:

- `references/candidate-profile.md` — Joshua's experience, education, links, and the master source rules.
- `references/search-criteria.md` — salary floor, geography, what to skip.

The profile file mirrors a **living Google Doc**. Re-read the live doc at the start of every run so new experience gets picked up:
`https://docs.google.com/document/d/12ejSK4KqGYDSxFD8F6Ab1uZIQr-vafTE_cNElmBIhxc/edit`
(Google Drive MCP → `read_file_content` with fileId `12ejSK4KqGYDSxFD8F6Ab1uZIQr-vafTE_cNElmBIhxc`.) If the doc is unreachable, fall back to the profile reference and say so in the report.

## Ad-hoc: a job lands in chat

1. Get the full posting text. If given a link, try the Indeed MCP (`search_jobs` by title+location, then `get_job_details`) — direct page fetches of Indeed/LinkedIn/ZipRecruiter return 403. If you cannot retrieve it, ask for the pasted text rather than guessing at requirements.
2. Create `applications/<company>-<role-slug>/` in the workspace.
3. Produce all five documents in this order (see **Deliverables** below).
4. Apply — see `references/application-playbook.md`.
5. Append to the tracker.

Skip the salary/geography screen here. If Joshua pasted it, he wants it. Still tell him honestly in the analysis if the pay or location is bad.

## Scheduled: the daily run

1. **Load** the profile and criteria.
2. **Read the tracker** at `applications/_tracker.csv` first. Everything already there is off the table — never apply twice. This matters more than anything else in the run; a duplicate application is worse than a missed one.
3. **Discover.** Run the Indeed MCP `search_jobs` across the query × location matrix in `references/search-criteria.md`. Cast wide; screening comes next.
4. **Screen** each hit against the salary floor, geography, and exclusions. Most candidates die here — that is correct and expected.
5. **Rank** survivors by fit against the profile. Take the top 3–5. Volume is not the goal; a tailored application beats five generic ones, and Joshua's name is attached to every submission.
6. **Build** the five documents per job.
7. **Apply** per the playbook — auto-submit what qualifies, queue the rest.
8. **Log** every job to the tracker, including ones skipped and why.
9. **Report** — see **Reporting** below.
10. **Save the work.** In a git repo, commit and push. Otherwise confirm the workspace files are written where the next run will find them.

## Deliverables per job

Create these in `applications/<company>-<role-slug>/`, in this order:

1. `1-job-reference.md` — full posting, plain-English summary, company info, pay, apply link, application details.
2. `resume.html` + PDF — tailored, one page. See **Resume rules**.
3. `cover-letter.html` + PDF — see `references/writing-style.md` for the template.
4. `4-application-analysis.md` — ATS keyword check, fit rating (Strong/Partial/Weak) with reasoning, gaps named honestly, skills to learn with certification links, interview prep.
5. `5-linkedin-outreach.md` — 1–3 decision-makers to target, a short tailored message for each.

Name PDFs `Joshua_Chappell_Resume_<Company>.pdf` and `Joshua_Chappell_CoverLetter_<Company>.pdf`.

## Resume rules

The whole method is **rearranging Joshua's real material, not writing new material.** Treat his experience as fixed blocks: reorder them, pick the relevant ones, drop bullets, add a connecting word. Never invent experience, tools, metrics, or phrasing he did not write. Only add wording where clarity genuinely requires it.

This is not a stylistic preference — it is what keeps him honest in an interview. Every line on the page has to be something he can defend out loud.

When the job requires something he does not have (a license, automotive clients, Klaviyo), **do not paper over it.** Leave it off the resume and name it plainly in the analysis document. His trust in these documents depends on them being accurate, and a gap he knows about is one he can address; a gap he discovers in the interview is one that sinks him.

Mechanics:
- One page, always. Fill it — an obviously short resume reads as a thin candidate. Verify page count after rendering.
- Max 4 bullets per job, 1–2 lines each. Include dates and location for every position.
- Lead with whatever is most impressive *for this specific job*. The ordering of jobs changes per application; a marketing role leads with Charter One, a sales role leads with the business ownership.
- 3-sentence professional summary, active voice, aimed at this posting.
- Skills section at the bottom, prioritized for the posting.
- Header: name, Mesa AZ, phone, email, LinkedIn, and 1–2 portfolio links **only when they help** (creative roles yes; finance, insurance, and sales roles no).
- Build from `assets/resume-template.html` — it is tuned for one page, 0.5" margins, and clean Word paste.

Then render and verify — run the bundled script from the skill directory:

```bash
<skill-dir>/scripts/render_pdf.sh <app-dir>/resume.html "Joshua_Chappell_Resume_<Company>.pdf" --preview
```

`--preview` also writes a PNG. Read it — the page count tells you it fits, but only
looking at it tells you whether the bottom third is dead space.

The script prints the page count. **Two pages means fix it and re-render** — tighten `line-height`, `.job` margin, and `li` margin rather than shrinking the font. Lots of white space at the bottom is the opposite failure; open the spacing up until the content reaches the bottom margin.

## Writing style

Read `references/writing-style.md` before writing any prose. In short: clear and direct, active voice, no adverbs, no buzzwords, calm confidence rather than enthusiasm, Flesch 80+. Industry jargon is fine where it is the real word for the thing.

## Reporting

End every run with a summary in chat covering:

- What was found and what was screened out (with counts).
- What was applied to, with links.
- What is **queued for review** and exactly why — this is the part Joshua acts on, so lead with it if the list is non-empty.
- Any honest concerns about a role he should know before an interview.

Attach the PDFs with `SendUserFile` for anything queued or applied.

Write the same summary to `applications/_daily-log/<YYYY-MM-DD>.md` in the workspace.

## Tracker

`applications/_tracker.csv` in the workspace, one row per job ever seen:

```
date,company,role,location,pay,source,url,status,folder,notes
```

`status` is one of: `applied`, `queued`, `skipped-pay`, `skipped-location`, `skipped-fit`, `skipped-excluded`, `duplicate`, `failed`.

Create the file with that header row if it does not exist. Check it before every application.

## "Feedback on Full Resume"

When Joshua asks for this by name, he wants an HR recruiter's read on the *master* Google Doc content, not a tailored resume: which bullets are weak, which could be reworded to land harder, where fresh professional language would help. Give concrete rewrites, keep the same calm register, and stay inside his real material.

## Reference files

- `references/candidate-profile.md` — full CV knowledge base.
- `references/search-criteria.md` — salary, geography, search queries, exclusions.
- `references/writing-style.md` — style rules, cover letter template.
- `references/application-playbook.md` — how to actually submit, what to auto-apply vs. queue, screening-question answers.
- `assets/resume-template.html`, `assets/cover-letter-template.html` — starting points.
- `scripts/render_pdf.sh` — HTML → PDF with page-count verification.
