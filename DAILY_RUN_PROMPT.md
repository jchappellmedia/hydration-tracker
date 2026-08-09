# Daily Job Hunt — Scheduled Task Setup

The skill is installed and works right now for anything pasted into chat. This file is only about the **daily automated run**.

## Why you have to create the schedule yourself

Creating a Routine from inside a session needs a one-tap approval that isn't rendering on your device (the same gate that blocked repo access earlier). Creating it from the claude.ai UI skips that gate — and it's the better path anyway, because the UI lets you **attach connectors**. Routines created from inside a session carry none, which would leave the daily run without Indeed or Google Drive.

## Setup

1. Go to **claude.ai → Routines** (or Settings → Routines).
2. **New Routine.**
3. Name: `Daily Job Hunt`
4. Schedule: **Weekdays at 7:00 AM** (Arizona / Phoenix time).
5. Environment: the same one this session uses — it has the repo with the skill.
6. **Connectors: attach Indeed and Google Drive.** This is the step that matters. Without them the run falls back to WebSearch and the offline CV copy, which works but is weaker.
7. Paste the prompt below.
8. Turn on notifications so you get the morning report on your phone.

## The prompt

```
Run the daily job hunt for Joshua Chappell.

Invoke the `job-hunt` skill (in .claude/skills/job-hunt/ of this repo) and follow its
scheduled-run workflow end to end:

1. Re-read the living CV Google Doc, then the search criteria. If the Google Drive
   connector is unavailable, fall back to references/candidate-profile.md and say so
   in the report.
2. Read applications/_tracker.csv first — never apply to anything already listed there.
3. Discover jobs via the Indeed MCP across the title x location matrix. If the Indeed
   connector is unavailable, use the WebSearch fallback in references/search-criteria.md
   and note which path you used.
4. Screen for pay at or above $75,000/year, and remote or within a 30-minute commute
   of Mesa AZ 85206.
5. Rank by fit and take the top 3-5. Fewer is fine if fewer qualify — do not pad the
   day with weak applications.
6. Build all five documents per job. Render resume and cover letter to PDF with
   .claude/skills/job-hunt/scripts/render_pdf.sh and verify each resume is exactly
   one page.
7. Apply where every gate in the application playbook passes. Queue everything else
   with the specific blocker named.
8. Log every job examined to the tracker, including skips and the reason.
9. Write the run summary to applications/_daily-log/<today>.md, report it in chat, and
   attach PDFs with SendUserFile for anything applied or queued.
10. Commit and push to branch claude/job-hunting-instructions-2y6kgj — the container
    is ephemeral.

Lead the report with anything queued that needs my decision. If nothing clears the bar
today, say so plainly rather than lowering the bar.
```

## What you'll get each morning

- Counts: how many jobs found, how many screened out and why.
- Anything **applied to**, with links and confirmation screenshots.
- Anything **queued** and the exact blocker — this is your action list.
- PDFs attached.
- Honest flags on any role worth knowing about before an interview.

## Three things that expand what it can submit on its own

Until these exist, applications get built and queued rather than submitted. That's the safe default, not a failure.

1. **A logged-in Indeed session** exported to `~/.config/job-hunt/session.json`. Without it, aggregator applications queue; direct company portals (Workday, Greenhouse, Lever, Breezy) still work.
2. **Your criminal-history answer** — add it to the answer bank in `references/application-playbook.md`.
3. **A target salary number** for when a required field won't accept a skip.

## Permanently manual, by design

Signing anything · sending emails (drafts get prepared, you send) · commission-only roles · unnamed employers · LinkedIn outreach.
