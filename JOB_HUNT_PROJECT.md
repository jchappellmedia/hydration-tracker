# Job Hunt Project — Joshua Chappell

Everything the automated job search needs: what it does, how it decides, where things live, and what has to stay in human hands.

The executable instructions live in the **`job-hunt` skill** (`.claude/skills/job-hunt/`). This file is the orientation layer — read it to understand the system; read the skill to run it.

---

## Objective

Find jobs that fit Joshua's background and pay at least **$75,000/year**, that are **remote** or within a **30-minute commute of 441 S Maple, Mesa AZ 85206**. Build tailored application materials for each. Submit what can be submitted safely, and queue the rest for one-click review.

Runs two ways:

- **Scheduled** — a daily automated pass: discover, screen, build, apply, report.
- **Ad-hoc** — paste a job description or link into chat and the same machinery runs for that single job.

---

## How a run works

```
Read the living Google Doc (CV)      ← always first; it changes
        ↓
Read applications/_tracker.csv       ← never apply twice
        ↓
Discover  (Indeed MCP, title × location matrix)
        ↓
Screen    (pay ≥ $75k · remote or ≤30 min · fit · exclusions)
        ↓
Rank      → top 3–5 only
        ↓
Build     (5 documents per job, resume + cover letter → PDF)
        ↓
Apply     (auto-submit if every gate passes, else queue)
        ↓
Log       (tracker + daily log)
        ↓
Report    (chat summary + PDFs attached)
        ↓
Commit and push                      ← container is ephemeral
```

---

## Where things live

| Path | What it is |
|---|---|
| `.claude/skills/job-hunt/SKILL.md` | The operating instructions |
| `.claude/skills/job-hunt/references/candidate-profile.md` | CV knowledge base, known gaps, angle library, standing preferences |
| `.claude/skills/job-hunt/references/search-criteria.md` | Pay floor, commute tiers, search matrix, exclusions |
| `.claude/skills/job-hunt/references/writing-style.md` | Style rules, cover letter template |
| `.claude/skills/job-hunt/references/application-playbook.md` | Submission mechanics, answer bank, credentials |
| `.claude/skills/job-hunt/scripts/render_pdf.sh` | HTML → PDF with page-count check |
| `.claude/skills/job-hunt/assets/` | Resume and cover letter templates |
| `applications/<company>-<role>/` | One folder per job, 5 documents + PDFs |
| `applications/_tracker.csv` | Every job ever seen; the deduplication record |
| `applications/_daily-log/<date>.md` | What each run did |
| `JOB_HUNTING_INSTRUCTIONS.md` | Joshua's original instruction document |

---

## The five documents

Every job produces the same set:

1. **Job Description Reference** — the posting, a plain-English summary, company info, apply link.
2. **Tailored Resume** — one page, HTML → PDF.
3. **Cover Letter** — Joshua's template, HTML → PDF.
4. **Application Analysis** — ATS keywords, fit rating, honest gaps, certification links, interview prep.
5. **LinkedIn Outreach** — who to contact and what to say.

---

## Principles the system runs on

These came out of building fourteen real applications together, and they matter more than any individual rule.

**Rearrange, never invent.** Resume content is drawn from Joshua's Google Doc and reassembled — reordered, trimmed, connected. No new experience, no borrowed phrasing, no inflated numbers. Every line has to survive being asked about in an interview.

**Name the gaps.** When a posting requires something he doesn't have — an insurance license, automotive clients, Klaviyo — it stays off the resume and goes into the analysis document in plain language. A gap he knows about is one he can prepare for.

**Honest fit ratings.** "Partial" is a common and useful answer. Rating everything Strong makes the rating worthless.

**Quality over volume.** 3–5 tailored applications per day. His name is on each one.

**Duplicate applications are worse than missed ones.** The tracker gets checked before anything else.

**No confirmation means it failed.** An application is only "applied" when there is a confirmation screenshot.

---

## What stays in human hands

Deliberately not automated:

- **Salary expectations.** A number entered on his behalf can cost thousands before a conversation starts.
- **Criminal history questions.** Never assumed.
- **Signing anything** — background check authorizations, arbitration agreements, offer documents.
- **Sending emails.** Gmail drafts are prepared; Joshua sends them.
- **Commission-only roles.** The "$150k is our low end" ads pass the pay filter on paper and mislead it completely. Surfaced as FYI, never auto-submitted.
- **Unnamed employers.** No company name means no license lookup, no reviews, no verification.
- **LinkedIn outreach.** Highest-leverage follow-up there is, and it needs to sound like him.

---

## Known limits

Honest about what will and won't work:

- **Aggregators fight automation.** Indeed, LinkedIn, and ZipRecruiter block bots; the environment's network policy also 403s some hosts. Direct company portals (Workday, Greenhouse, Lever, Breezy) work far more reliably, and applying direct is better anyway.
- **CAPTCHAs cannot be solved here.** Those applications queue.
- **Sessions expire.** When aggregator applications start failing in bulk, the session file needs refreshing.
- **Indeed's MCP is flaky.** `get_job_details` by raw URL job ID frequently errors; searching by title and location, then pulling details from the search result ID, is the reliable path.
- **Instagram, LinkedIn, and some company sites return 403** to direct fetches. Ask for pasted text rather than guessing at a posting's contents.

---

## Setup checklist

Optional, but each one unlocks more automation:

- [ ] **Browser session** — log into Indeed once, export storage state to `~/.config/job-hunt/session.json` (outside the repo). Without it, aggregator applications queue.
- [ ] **Criminal history answer** — add to the answer bank in `application-playbook.md` so those applications stop queuing.
- [ ] **Target salary number** — a figure to use when a required field won't accept a skip.
- [ ] **Google Doc access** — the Drive connector must be authorized for the CV re-read to work.
- [ ] **Scheduled trigger** — a daily Routine that runs the skill.

---

## Application history

Fourteen documents across five roles, all committed under `applications/`:

| Company | Role | Fit | Status |
|---|---|---|---|
| Omni Advertising | Regional Automotive Video Editor | Partial — no automotive clients | Materials ready |
| Tatum Management Group | Marketing Director | Partial → Strong on credentials | Materials ready |
| Valleywise Health | Sr Multi Media Specialist | **Strong** — best documented fit | Materials ready |
| Edward Jones | Financial Advisor (entry) | Strong for their hiring profile | Materials ready |
| Insurance Rep (Phoenix) | Insurance Representative | Blocked on license | Company name needed |
| Discount Pro Home | Roofing / Home Improvement Sales | Commission-only — verify first | Materials ready |

---

## Open items

- **Website repo access** — building a hidden Charter One portfolio page on lightbox-digital.com is blocked; `add_repo` needs an approval that doesn't render on mobile. Retry from desktop claude.ai/code.
- **Charter One reel mapping** — which Instagram reel is Radiance, which is Swayze, which is homecoming hallways.
- **Google Doc cleanup** — the doc still lists Sora; Joshua now uses OpenClaw.
