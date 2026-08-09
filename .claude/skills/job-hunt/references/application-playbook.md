# Application Playbook

How to actually get an application submitted, what may be sent automatically, and what has to wait for Joshua.

## The gate

Auto-submit only when **every** one of these is true:

1. The job passes pay, geography, and fit (`search-criteria.md`).
2. It hits none of the exclusions.
3. The employer is named.
4. Every required field can be answered truthfully from the answer bank below.
5. It is not already in `applications/_tracker.csv`.

Anything failing a check gets `status=queued`, materials fully built, and a one-line reason in the report. Queued is a good outcome — it means the work is done and Joshua just has to press the button.

**Never falsify a field to get past a gate.** Not years of experience, not a license, not a degree, not a salary history. A padded answer either gets caught at interview or lands him a job he cannot do, and both are worse than not applying. If a required question can only be answered by overstating, queue it and explain.

## Preference order

1. **Direct company career portals** (Workday, Greenhouse, Lever, iCIMS, Breezy, SmartRecruiters). Most automatable, and applying direct beats an aggregator anyway.
2. **Indeed Easy Apply** — works when a session is authenticated.
3. **Email applications** — when the posting gives an address, use the Gmail MCP to draft. Draft only; Joshua sends. See below.
4. **LinkedIn Easy Apply** — heavy bot detection, expect failure.
5. **Text/SMS instructions** ("text MONDAY to…") — cannot be automated here. Surface the instruction in the report so Joshua can send it himself.

## Browser mechanics

Chromium is pre-installed at `/opt/pw-browsers/chromium` with `PLAYWRIGHT_BROWSERS_PATH` already set. Never run `playwright install`.

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/opt/pw-browsers/chromium",
        headless=True,
        args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    )
    ctx = browser.new_context(
        storage_state="~/.config/job-hunt/session.json",  # if it exists
        viewport={"width": 1440, "height": 900},
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    )
    page = ctx.new_page()
```

Working rules:

- **Screenshot before submitting.** Save it to the application folder as `pre-submit.png`. It is the only evidence of what was actually sent, and it is what you attach when something goes wrong.
- **Screenshot after submitting** as `confirmation.png`. If there is no visible confirmation, treat the submission as **failed**, not successful. Optimistic logging here is how a job silently never gets applied to.
- Upload the PDFs, not the HTML.
- Go at human pace. A 1–3 second gap between fields avoids a lot of bot detection.
- Never auto-accept anything that looks like a contract, background-check authorization, or arbitration agreement. Those are Joshua's to sign — stop and queue.

## When it fails

It will fail sometimes, and that is expected rather than a malfunction. Indeed, LinkedIn, and ZipRecruiter actively fight automation; this environment's network policy also rejects some hosts outright (403 at the proxy). CAPTCHAs cannot be solved here, and Workday-style portals sometimes require creating an account with email verification.

On failure: keep the materials, set `status=queued`, write the specific blocker in the notes column, and include the direct apply URL in the report. Do not retry the same posting more than twice in one run, and never disable TLS verification or work around the proxy.

## Credentials

Joshua's logins are **not** stored in this repo, ever. Two supported paths:

- **Session file** — he logs in once and exports browser storage state to `~/.config/job-hunt/session.json` (outside the repo, gitignored by location). Playwright reuses it. Sessions expire; when they do, applications start failing and the report should say "session expired, please refresh."
- **Environment variables** — `JOBHUNT_INDEED_EMAIL` etc., set in the environment configuration, never committed.

With neither available, every aggregator application queues. Direct company portals that allow guest applications still work, which is another reason to prefer them.

## Screening question answer bank

Answer from this list. Anything not covered here means the application queues.

| Question | Answer |
|---|---|
| Legally authorized to work in the US? | Yes |
| Require sponsorship now or in future? | No |
| Willing to undergo a background check? | Yes |
| Valid driver's license? | Yes |
| Reliable transportation? | Yes |
| Willing to relocate? | Open to it — say "willing to relocate" only if the posting is outside metro Phoenix |
| Highest education | Master's degree |
| Years of professional experience | 7+ (2018–present) |
| Years in video/media production | 7+ |
| Years in marketing | 6+ (Lightbox 2019–present, plus Master's 2024) |
| Years in people/team leadership | 6+ (teams of 5–20 at Lightbox) |
| Adobe Premiere / After Effects / Creative Suite | Expert / Advanced |
| DaVinci Resolve | Expert |
| Google Analytics / Meta Business Manager | Meta yes; Google Analytics — coursework through the Marketing Analytics specialization, not daily hands-on |
| Klaviyo / Mailchimp | No hands-on platform experience |
| Google Ads / TikTok Ads | No — Meta/Facebook ads only |
| Insurance or securities license | No — not currently licensed |
| Can start | Two weeks' notice |
| Salary expectation | **Queue — Joshua answers this one.** See below. |
| Criminal history / convictions | **Queue — Joshua answers this one.** |
| Disability / veteran / race (EEO) | Leave blank or "decline to self-identify" — these are voluntary |
| Cover letter field | Paste the tailored cover letter body, no letterhead |
| "Why do you want to work here?" | Draw from the cover letter's second paragraph |

**Salary expectation** always queues rather than being answered automatically. A number entered on his behalf can cost him thousands before a conversation even starts. When the field is required and cannot be skipped, stop and ask. Useful anchor for when he does answer: his floor is $75k, and for salaried professional roles the upper half of a posted band is the right target given the Master's.

**Criminal history** always queues. He has never stated an answer and it is not something to assume.

## Email applications

Use the Gmail MCP `create_draft` — **draft only, never send.** Sending an email to an employer in his name is not reversible and not something to do without his eyes on it.

- Subject: `Application — <Role> — Joshua Chappell`
- Body: the cover letter, minus letterhead
- Attach both PDFs
- Report the draft so he can review and send

## After a successful submission

1. Log to the tracker with `status=applied`, the URL, and the folder.
2. Save `confirmation.png` in the application folder.
3. Include it in the report with the apply link.
4. Note the LinkedIn outreach targets from `5-linkedin-outreach.md` — same-day outreach after applying is the highest-leverage follow-up available, and it is the one step that consistently has to be done by hand.
