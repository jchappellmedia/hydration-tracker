# Daily Job Hunt — Scheduled Task Setup

## What happened on the first run

The Routine fired and behaved correctly: its environment had the Indeed and Google Drive connectors, but **no GitHub access**. Because the deduplication tracker lived only in the repo, it could not confirm what had already been applied to — so it stopped instead of risking duplicate applications. That was the safety rule working as designed.

The real problem was architectural: the run had a single point of failure. That is now fixed on my side, and there are two things for you to do.

---

## Fix 1 — Install the skill to your account (required)

The skill lives in the repo. **No repo access means no skill**, so this is the step that matters most.

Ask me for the `.skill` file (or use the one sent earlier), then click **Save skill** on the file card. That installs it into your profile, and every session — including scheduled runs — can use it whether or not the repo is attached.

## Fix 2 — Attach the repo to the Routine (recommended, not required)

In **claude.ai → Routines → Daily Job Hunt → environment/sources**, add the `jchappellmedia/hydration-tracker` repo.

With the repo attached, the run commits everything and you get full version history. Without it, the run still works — it now falls back to Google Drive — but the application folders live only in the chat report and the attachments.

---

## What I changed so this cannot halt the run again

The tracker now has a second home that scheduled runs can always reach:

- **`Job Hunt Tracker (master)`** in your Google Drive — seeded with all seven jobs from this session.
- Each run also writes a **`Job Hunt Log <date>`** file. Reading the master plus every log file rebuilds the complete dedup record.

Drive files cannot be edited in place by the tools, hence the one-file-per-run approach. The run only stops now if *both* the repo and Drive are unreachable — at which point it genuinely cannot know what has already been sent.

---

## The Routine prompt

Replace the existing prompt with this version:

```
Run the daily job hunt for Joshua Chappell.

Use the `job-hunt` skill and follow its scheduled-run workflow end to end.

Notes for this environment:
- If GitHub access is unavailable, DO NOT halt. Read the dedup record from Google
  Drive instead: the file "Job Hunt Tracker (master)" plus every file titled
  "Job Hunt Log <date>". The union of those is the authoritative list of jobs
  already seen.
- If the Google Doc CV is unreachable, fall back to references/candidate-profile.md
  in the skill and say so in the report.
- If the Indeed connector is unavailable, use the WebSearch fallback in
  references/search-criteria.md and note which discovery path you used.

Then:
1. Screen for pay at or above $75,000/year, and remote or within a 30-minute
   commute of Mesa AZ 85206.
2. Rank by fit and take the top 3-5. Fewer is fine if fewer qualify — do not pad
   the day with weak applications.
3. Build all five documents per job. Render resume and cover letter to PDF and
   verify each resume is exactly one page.
4. Apply where every gate in the application playbook passes. Queue everything
   else with the specific blocker named.
5. Log every job examined — to the repo tracker if reachable, and always to a new
   Google Drive file titled "Job Hunt Log <today's date>".
6. Report in chat and attach PDFs with SendUserFile for anything applied or queued.
7. If the repo is reachable, commit and push to claude/job-hunting-instructions-2y6kgj.

Lead the report with anything queued that needs my decision. If nothing clears the
bar today, say so plainly rather than lowering the bar.
```

---

## Three things that expand what it can submit on its own

Until these exist, applications get built and queued rather than submitted — the safe default, not a failure.

1. **A logged-in Indeed session** exported to `~/.config/job-hunt/session.json`. Without it, aggregator applications queue; direct company portals (Workday, Greenhouse, Lever, Breezy) still work.
2. **Your criminal-history answer** — add it to the answer bank in `references/application-playbook.md`.
3. **A target salary number** for when a required field will not accept a skip.

## Permanently manual, by design

Signing anything · sending emails (drafts get prepared, you send) · commission-only roles · unnamed employers · LinkedIn outreach.
