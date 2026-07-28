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
$29**. Payment runs through Stripe Checkout — see
[docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md) to configure it.

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
supabase/functions/stripe-checkout/     # creates a Checkout Session for a signed-in user
supabase/functions/stripe-webhook/      # verifies Stripe's signature, grants access
docs/STRIPE_SETUP.md                    # what to configure before taking money
```

### How access is granted

The browser asks for a *plan key* (`sprint` / `lifetime`); the Edge Function
resolves it to a Stripe price ID held server-side, so the amount charged can't
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
