# Setting up the daily task on your Mac

This only has to happen once.

1. **Put the folder in iCloud Drive.** Unzip `Job Hunt 2026.zip` and drag the `Job Hunt 2026`
   folder into **iCloud Drive** in Finder. The full path ends up as
   `~/Library/Mobile Documents/com~apple~CloudDocs/Job Hunt 2026`.

2. **Start a Claude session that runs on your Mac,** not in the cloud. Either works:
   - In the Claude desktop app, start a local session (Cowork, or Claude Code set to run locally)
     and give it access to the `Job Hunt 2026` folder in iCloud Drive.
   - Or open Terminal, `cd` into the folder, and run `claude remote-control`. The session then
     appears in the Claude app.

3. **Paste this into that session:**

   > Set up a scheduled task that runs every day at 6:47 AM on this Mac. Each run should follow
   > `Job Hunt 2026/_system/DAILY-RUN.md` in my iCloud Drive exactly: find the five best new jobs,
   > never repeat one, and save each job's resume, cover letter, and job description and company
   > research sheet into its own folder inside `Job Hunt 2026`. Every document is a PDF with a Word
   > copy next to it, and the reference sheet is always a PDF. Before scheduling,
   > run the one-time setup in section 1 of that file and do one test run so I can check it.

   The task needs the Indeed, ZipRecruiter, Dice, and Google Drive connectors switched on.

## Good to know

- The task runs on your Mac, so the Mac has to be on and awake at run time. If it's asleep, the
  run waits until it wakes.
- `_system/seen-jobs.csv` is the record of every job already handled. Don't delete it, or old
  jobs can come back.
- To change what it looks for (pay floor, commute, job types), edit section 4 of `DAILY-RUN.md`,
  or ask Claude to.
