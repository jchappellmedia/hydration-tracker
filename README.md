# CCAT Prep — Cognitive Aptitude Trainer

A web app for practicing and preparing for the **Criteria Cognitive Aptitude Test (CCAT)** — a 50-question, 15-minute test of problem-solving, critical thinking, and learning ability. Free to start; **Pro** unlocks the full bank and unlimited simulations.

**Live site:** https://jchappellmedia.github.io/hydration-tracker/

## Pricing

| | Free | Pro |
|---|---|---|
| Full 50-question timed simulations | 1 total | **Unlimited** |
| Question bank | ~40% | **All 240+** |
| Questions per practice session | 10 | **No cap** |
| Untimed generated drills | 10 per session | **Endless** |
| Answer review after a simulation | — | **Every question** |
| Explanations during topic practice | Yes | Yes |
| Study guide & percentile chart | Yes | Yes |
| Progress synced across devices | — | **Yes** |

Two one-time purchases, no subscription: **7-Day Sprint $9** and **Lifetime Pro
$29**. Payment runs on Stripe Payment Links and is live — see
[docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) for how it works and how to
operate it.

## Features

- **Full Simulation** — 50 mixed questions on a real 15-minute countdown, no feedback until the end, just like the real exam. Auto-grades and estimates your percentile.
- **Practice by Topic** — drill Verbal, Math & Logic, or Spatial & Abstract reasoning with instant explanations after every question.
- **Endless Drill** — unlimited, procedurally generated number-series, arithmetic, and percentage problems.
- **Quick 10** — a fast 3-minute mixed warm-up.
- **Study Guide** — strategies, formulas, question-type breakdowns, and a score→percentile chart.
- **Progress Tracking** — score history and per-area accuracy, kept in your browser; Pro also syncs it across devices.
- Light/dark theme, fully responsive, works offline once loaded.

## Question areas

The bank holds **240+ questions** built to mirror the real CCAT, weighted to the actual section mix (~34% verbal, ~34% numerical, ~22% spatial, ~10% logic).

| Area | Examples |
|------|----------|
| **Verbal** | analogies, synonyms/antonyms, sentence completion, odd-one-out, word relationships, and two-column **attention-to-detail** matching |
| **Math & Logic** | number series, percentages, ratios, multi-step word problems, averages, plus **deductive-reasoning & seating-arrangement** logic puzzles |
| **Spatial & Abstract** | the three official visual formats — **next-in-series**, **odd-one-out**, and **3×3 matrices** — plus figure analogies, rotation & mirrors (rendered as real SVG figures with five answer choices) |

## Tech

Static HTML/CSS/JavaScript — no build step, no bundler. Hosted on GitHub Pages.
Accounts, entitlements and payments are handled by Supabase (Postgres + Edge
Functions) and Stripe; without them the app still runs, just free-tier only.

```
index.html                              # app shell + nav
css/styles.css                          # styling (light/dark)
js/questions.js                         # question bank + procedural generators
js/app.js                               # quiz engine, scoring, views, router
js/config.js                            # public config: Supabase keys, plans, free limits
js/account.js                           # auth, entitlement lookup, Stripe Checkout
js/paywall.js                           # free-tier limits, upgrade modal, auth modal

supabase/migrations/                    # entitlements, progress sync, webhook event log
supabase/functions/stripe-webhook/      # verifies Stripe's signature, grants access
docs/STRIPE_SETUP.md                    # how payments work + operations runbook
```

### Design

The theme is called **Examination**, and it is aimed at one specific person:
someone who has been emailed an assessment link with a 48-hour deadline, is
anxious about it, and is deciding whether this tool is serious enough to trust
with $29. Everything follows from that.

- **Paper and ink, not navy and neon.** Warm off-white with near-black type by
  default; a warm-charcoal "ink" mode for late-night revision. Paper is the
  default because the real CCAT is sat on a white screen — practising on white
  is closer to the thing being rehearsed.
- **Instrument Serif** for display, **IBM Plex Sans** for structure, **IBM Plex
  Mono** for every number. Scores, timers, prices and percentiles are all
  tabular mono, so nothing shifts width as a clock counts down.
- **Hairline rules, 3px corners, no drop shadows.** Grids are printed tables
  whose cells share a rule, not floating cards.
- **One signal colour.** Amber is reserved for time and the primary action, so
  urgency still means something when it shows up.
- **No decorative emoji.** Practice modes are numbered `I`–`VI` the way an exam
  paper numbers its sections; locked controls carry a small `PRO` tag, which
  names what unlocks them instead of just showing a padlock.
- **Exam mode.** During a timed simulation the header, footer and page ruling
  are removed entirely. Navigation is noise under a clock, and a simulation
  should feel like the thing it simulates.
- **The clock never blinks.** It shifts amber then red as time runs down, but it
  does not flash — a flashing clock spikes panic in exactly the person least
  able to afford it, and the colour carries the same information.

`prefers-reduced-motion` disables all animation.

### How access is granted

Checkout runs on Stripe Payment Links — hosted pages owned by Stripe — with
the buyer's user id attached as `client_reference_id`, so no Stripe secret key
exists anywhere in this project's infrastructure and the amount charged can't
be edited from the client. When the payment clears, Stripe calls the webhook,
which verifies the signature and writes a row to `ccat_entitlements` using the
service-role key. That table has an RLS policy for `select` and none for
`insert`/`update` — a user can read their own entitlement and can never create
one.

The paywall *UI* is client-side and a determined visitor can unlock it in
devtools; the question bank ships in the page, so it was never secret. What's
not forgeable is the payment record. `docs/STRIPE_SETUP.md` covers this and what
to do if you later want a paywall that holds against that.

## Disclaimer

This is an independent study tool. "CCAT" and "Criteria Cognitive Aptitude Test" are products of Criteria Corp; this project is not affiliated with or endorsed by them. Percentile estimates are for self-study only.
