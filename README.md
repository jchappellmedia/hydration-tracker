# CCAT Prep — Cognitive Aptitude Trainer

A free, comprehensive web app for practicing and preparing for the **Criteria Cognitive Aptitude Test (CCAT)** — a 50-question, 15-minute test of problem-solving, critical thinking, and learning ability.

**Live site:** https://jchappellmedia.github.io/hydration-tracker/

## Features

- **Full Simulation** — 50 mixed questions on a real 15-minute countdown, no feedback until the end, just like the real exam. Auto-grades and estimates your percentile.
- **Practice by Topic** — drill Verbal, Math & Logic, or Spatial & Abstract reasoning with instant explanations after every question.
- **Endless Drill** — unlimited, procedurally generated number-series, arithmetic, and percentage problems.
- **Quick 10** — a fast 3-minute mixed warm-up.
- **Study Guide** — strategies, formulas, question-type breakdowns, and a score→percentile chart.
- **Progress Tracking** — score history and per-area accuracy, stored privately in your browser (localStorage). Nothing is sent anywhere.
- Light/dark theme, fully responsive, works offline once loaded.

## Question areas

| Area | Examples |
|------|----------|
| **Verbal** | analogies, synonyms/antonyms, sentence completion, odd-one-out, word relationships |
| **Math & Logic** | number series, percentages, ratios, word problems, averages, logical ordering & syllogisms |
| **Spatial & Abstract** | shape/figure series, rotation & mirrors, attention to detail, matrices |

## Tech

Pure static HTML/CSS/JavaScript — no build step, no backend, no dependencies. Hosted on GitHub Pages.

```
index.html        # app shell + nav
css/styles.css    # styling (light/dark)
js/questions.js   # question bank + procedural generators
js/app.js         # quiz engine, scoring, views, router
```

## Disclaimer

This is an independent study tool. "CCAT" and "Criteria Cognitive Aptitude Test" are products of Criteria Corp; this project is not affiliated with or endorsed by them. Percentile estimates are for self-study only.
