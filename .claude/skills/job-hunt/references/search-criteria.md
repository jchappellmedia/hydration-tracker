# Search Criteria

## Hard filters

A job must clear **all** of these to reach the auto-apply path.

### 1. Pay: $75,000/year or better

- Hourly postings: **$36.06/hr** is the equivalent. Round to ≥ $36/hr.
- Posted range: qualifies if the **midpoint** ≥ $75k. A range of $68k–$109k has a midpoint of $88.5k → qualifies.
- No pay listed: research it. Levels.fyi, Glassdoor, or comparable postings from the same employer. If you still cannot establish it, mark `queued` with a note rather than guessing — an unlisted salary is not the same as a low one.
- **Commission-only "$100k–$300k" ads do not qualify.** See exclusions.

### 2. Location: remote, or a real ≤30-minute commute

Home base is 441 S Maple, Mesa AZ 85206 — east Mesa, near Superstition Springs.

**Remote** qualifies outright. So does hybrid where the office is in the green tier below.

| Tier | Cities | Verdict |
|---|---|---|
| Green (~15–30 min) | Mesa (all), Gilbert, Apache Junction, Chandler (east/central), Tempe (east & central), Queen Creek (north), Higley, Val Vista | Qualifies |
| Yellow (~30–40 min) | Tempe (west/ASU), Scottsdale (south of Indian School), Chandler (west/Ocotillo), Phoenix (Sky Harbor, Arcadia, east Phoenix), Fountain Hills | Queue for review — let Joshua judge the drive |
| Red (40+ min) | Phoenix (downtown, north, west), Glendale, Peoria, Surprise, Avondale, Goodyear, Buckeye, Anthem, Cave Creek, Casa Grande, Maricopa | Skip |

Phoenix is the trap: "Phoenix, AZ" spans everything from a 25-minute drive to a 55-minute one. Check the actual street address or office location before deciding, and when it is genuinely unclear, queue it rather than skipping — a good job lost to a bad guess is expensive.

### 3. Fit against the profile

Rate Strong / Partial / Weak using `candidate-profile.md`.

- **Strong** — auto-apply eligible.
- **Partial** — eligible if the gaps are learnable rather than hard credentials. A missing license or a hard "X years in industry Y" requirement makes it queue-only.
- **Weak** — skip and log. Do not burn an application on a role the resume cannot honestly support.

## Exclusions — never auto-apply

These come from real postings Joshua and I reviewed together. Each one is here for a reason.

1. **Commission-only / 100% commission / 1099 door-to-door.** The "$150k is our low end" ads clear the salary filter on paper and mislead it completely. Median earnings are far below the headline and turnover is severe. Surface them in the report as an FYI if the fit is otherwise interesting, but never submit automatically.
2. **Unnamed employers.** If the posting will not say what company it is, it cannot be verified — no license lookup, no reviews, no BBB. Queue with a note to get the name first.
3. **Roles requiring a credential he does not hold** where that credential is stated as required (insurance license, securities licenses, CDL, clinical certifications). Queue it with the licensing path noted; do not submit something that will be rejected at screen one.
4. **MLM, "be your own boss", franchise-purchase, or pay-to-start** postings. Skip entirely, no queue.
5. **Anything requiring an upfront payment, equipment purchase, or "training fee."** Skip entirely.
6. **Applications whose screening questions need his personal or legal disclosure** — criminal history, disability status, immigration status, salary negotiation. See `application-playbook.md`; these queue.

## Search matrix

Run the Indeed MCP `search_jobs` across these. Titles and locations multiply out; do not try to be clever with a single mega-query.

**Locations to query:** `Mesa, AZ` · `Gilbert, AZ` · `Tempe, AZ` · `Chandler, AZ` · `Scottsdale, AZ` · `Phoenix, AZ` · `remote`

**Title queries — creative/media (his strongest documented fit):**
- Video Producer · Video Editor · Videographer · Multimedia Specialist · Senior Multimedia Specialist
- Content Producer · Creative Director · Media Specialist · Video Content Manager
- Photographer · Motion Graphics Designer

**Title queries — marketing (degree + certs):**
- Marketing Manager · Marketing Director · Digital Marketing Manager
- Content Marketing Manager · Brand Manager · Social Media Manager
- Marketing Analytics Manager · Growth Marketing Manager

**Title queries — adjacent/leadership:**
- Communications Manager · Creative Project Manager · Production Manager

### If the Indeed connector is unavailable

Scheduled runs sometimes fire without connector tools attached, and the Indeed MCP is flaky on its own. Do not abandon the run — fall back to `WebSearch` and work the same matrix:

- `"<title>" jobs Mesa OR Gilbert OR Chandler OR Tempe AZ $75,000`
- `"<title>" remote jobs hiring salary`
- `site:boards.greenhouse.io <title> Arizona` — also `lever.co`, `myworkdayjobs.com`, `breezy.hr`
- East Valley employers hiring directly: Banner Health, Dignity Health, Valleywise Health, Mesa Public Schools, Gilbert Public Schools, Chandler Unified, Maricopa County, City of Mesa, City of Chandler, ASU, Mesa Community College, Charter One / Leona Group, American Leadership Academy

Direct-employer career pages are the better source anyway; they carry the jobs aggregators miss and the applications are more automatable. Note in the report which discovery path was used, so a connector outage does not look like a quiet week in the market.

Sector note: education, healthcare, government, and higher-ed employers in the East Valley are unusually good matches — Charter One, GCE, ALA, and the AZ Legislature all sit in that world, and those employers pay salaried with benefits. Weight them up.

## Daily volume

Apply to **3–5 jobs per run**, best-fit first. If fewer than 3 clear the bar, apply to fewer and say so — padding the day with weak applications damages his prospects rather than improving them.

Log every job examined, including the skips. The tracker is how tomorrow's run knows what yesterday already saw.
