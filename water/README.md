# East Valley Soft Water — site operations

A static, dependency-free marketing site for an **installation-only** water
treatment company serving the East Valley of the Phoenix metro.

**Live URL (after merging to `main`):**
https://jchappellmedia.github.io/hydration-tracker/water/

30 pages: home, pricing, 6 service pages, 10 city pages, 4 guides, contractor
recruiting, FAQ, about, quote form, thank-you — plus `sitemap.xml`,
`robots.txt` and `llms.txt`.

---

## 1. Edit → rebuild → publish

Everything is generated from three files:

| File | What lives there |
|---|---|
| `scripts/water-site/site.config.mjs` | Name, phone, email, licence, domain, **all prices**, contractor pay rates |
| `scripts/water-site/content.mjs` | Every word of page copy — services, cities, guides, FAQs |
| `scripts/water-site/assets/` | CSS, JS, favicon, OG image |

```bash
node scripts/water-site/build.mjs      # regenerates water/ (no npm install, no dependencies)
git add water scripts/water-site && git commit -m "Update prices" && git push
```

Merging to `main` publishes it. Nothing else is required.

The `.html` files in `water/` are build output — **edit the source files above,
not the generated HTML**, or your changes are gone on the next build.

## 2. Before you take a single call

The site currently shows a yellow "Site in setup" banner because these are
placeholders. Fill them in, then set `setupMode: false` and rebuild.

- [ ] `phone` / `phoneHref` — a real number you will answer. A Google Voice
      number is fine and gives you call recording and texting.
- [ ] `email`
- [ ] `rocLicense` — see §6 before you publish any licence number.
- [ ] `brand` / `legalName` — if you pick a different name (ideas in §4).
- [ ] `formEndpoint` — sign up at [formspree.io](https://formspree.io) (free
      tier is 50 submissions/month), paste the endpoint. Until you do, the
      quote form falls back to opening the visitor's email app with everything
      pre-filled, so nothing is lost — but you will lose the ones who give up.
- [ ] `ga4` — optional Google Analytics 4 ID.
- [ ] Re-check every price in §5 against what a contractor will actually
      accept. The prices are researched estimates, not quotes you have tested.

## 3. Moving to your own domain

A custom domain is worth doing before you spend anything on ads —
`yourdomain.com` outranks and out-converts a `github.io/…/water/` path, and it
is the one thing here that is annoying to change later.

Because this repo's root is a different site, give the water business **its own
repo**:

1. Buy the domain (Cloudflare Registrar or Namecheap, ~$10–15/yr).
2. Create a new public repo, e.g. `eastvalleysoftwater`.
3. Copy `scripts/water-site/` and the generated `water/` into it. In
   `site.config.mjs` set:
   ```js
   origin: 'https://eastvalleysoftwater.com',
   base: '',            // site now lives at the domain root
   ```
4. Rebuild with an output path of the repo root (change `OUT` in `build.mjs`
   from `join(ROOT, 'water')` to `ROOT`), commit, push.
5. Add a file named `CNAME` at the repo root containing just
   `eastvalleysoftwater.com`.
6. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / root.
   Then Settings → Pages → Custom domain → enter the domain → tick *Enforce
   HTTPS*.
7. At your registrar, point the apex `A` records at GitHub's four IPs
   (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) and `www` at
   `<username>.github.io` as a `CNAME`.

Every canonical URL, sitemap entry, schema `@id` and internal link follows
`origin` + `base`, so nothing else needs touching.

## 4. Name and domain ideas

The config currently uses **East Valley Soft Water**. It is deliberately
keyword-shaped: "east valley" + "soft water" is close to what people type, and
it is instantly legible on a truck door.

| Domain | Why |
|---|---|
| `eastvalleysoftwater.com` | Geo + service in one. Best all-round pick. |
| `installmysoftener.com` | Matches the *intent* that makes you money — "I bought one, who installs it". Excellent for ads, and worth owning as a redirect even if it is not your brand. |
| `eastvalleywaterinstall.com` | Broader than softeners: covers RO and filtration. |
| `flatratesoftwater.com` | Leads with the differentiator rather than the geography. |
| `softenerinstallaz.com` | Statewide if you ever expand past the East Valley. |
| `azwaterinstallers.com` | Positions you as the trade, not a dealer. |

A couple of cautions: skip hyphens and skip anything containing "Culligan",
"Kinetico", "Pelican" or another manufacturer's name — that is a trademark
problem, not an SEO shortcut. And check the name is clear with the
[Arizona Corporation Commission](https://ecorp.azcc.gov) before printing it on
anything.

## 5. The unit economics

The published customer price and the published contractor pay come from the
same config file, so this table is always current. Margin is before ad spend,
insurance, software and tax.

| Job | You charge | Contractor gets | Your gross |
|---|---|---|---|
| Softener install, existing loop | $495–$645 | $300 | **$195–$345** |
| Softener install, loop built | $950–$1,650 | $650 | **$300–$1,000** |
| Softener swap-out | $375–$495 | $225 | **$150–$270** |
| Under-sink RO | $245–$395 | $150 | **$95–$245** |
| Whole-home filter add-on | $225–$395 | $150 | **$75–$245** |
| Salt-free conditioner | $345–$595 | $225 | **$120–$370** |
| Service call | $129 | $85 | **$44** |

Three things follow from this table:

1. **Bundle.** A softener + RO on one visit is $740–$1,040 of revenue for one
   drive. Always offer the RO when quoting a softener — it is the single
   highest-leverage sentence in your sales script.
2. **Equipment is a service, not a profit centre.** The prices in
   `pricing.equipment` are near cost on purpose. Marking hardware up 300% is
   the thing you are differentiating against; if you want more margin, raise
   the labour rate, not the box price.
3. **You need roughly 25 jobs a month** at an average $250 gross to clear
   $6k/month before costs. That is six a week — one contractor, comfortably.
   Model growth in contractors, not in price increases.

Raise prices by editing `pricing.jobs` and rebuilding. Everything — cards,
tables, city pages, the estimator, `llms.txt` and the schema.org `Offer`
markup — updates from that one edit.

## 6. Licensing — read this before publishing a licence number

This is a factual flag, not legal advice, and it is the part most likely to
cost you money if it is wrong.

In Arizona, installing water treatment equipment in someone's home is
**contracting work**, regulated by the
[Registrar of Contractors](https://roc.az.gov). Two things to get straight with
the ROC (or a construction attorney) before you advertise:

- **Whether your entity needs its own licence.** Contracting *with the
  homeowner* — quoting the job, taking payment, being the name on the invoice —
  can require a licence even when the physical work is done by a licensed
  subcontractor. The relevant classifications are generally the plumbing ones
  (C-37 / CR-37 and related). Do not assume that subcontracting alone is
  sufficient cover.
- **The handyman exemption is narrow.** It caps out at $1,000 *including labour
  and materials* per project, with no permit required. Several jobs on the
  pricing page exceed it.

Also worth ten minutes each: **general liability insurance** before the first
job; **1099 vs employee classification** for how you engage contractors (the
site is written around genuine independent contractors — they set their own
schedule, use their own tools, and can decline work, which supports that
treatment, but the facts have to match); and confirming that
`rocLicense` in the config is the licence actually standing behind the work.

Until you have the real number, leave `setupMode: true` — the banner tells
visitors the licence shown is a placeholder, which is far better than
displaying a made-up one.

## 7. Getting found — SEO and AI search

The site handles the on-page half. This is the half you have to do.

### Week one, in order

1. **Google Business Profile.** This is not optional; it is where the local
   map pack comes from and it will out-produce the website for the first
   several months. Service-area business (hide your address), primary category
   **Water softening equipment supplier**; secondaries: *Water filter supplier*,
   *Plumber*. List all ten cities as service areas. Add the same phone number
   the site shows.
2. **Bing Places** — same details. Bing's index feeds parts of ChatGPT search,
   so this is cheap AI-search distribution.
3. **Google Search Console** and **Bing Webmaster Tools** — verify the domain,
   submit `sitemap.xml` directly. Do this even though the site ships a
   `robots.txt`: on a `github.io` project path only the *domain root*
   `robots.txt` is authoritative, so ours is advisory until you move to your
   own domain (§3), where it becomes the real one.
4. **Reviews.** Ask every single customer, in person, before you leave. Ten
   real reviews mentioning "Gilbert" and "installed the softener I bought at
   Costco" will move the local pack more than anything on this page.
   Never fabricate one — and note that this site deliberately ships **no**
   `aggregateRating` schema, because fake review markup earns manual penalties.
5. **Citations with identical NAP** (name, address-less service area, phone):
   Yelp, Angi, Nextdoor, Thumbtack, BBB, Apple Business Connect.

### What is already built in

- Unique title, meta description and canonical on all 30 pages, all inside
  Google's display limits (verified at build).
- `LocalBusiness`/`Plumber` schema with `areaServed`, `geo`, hours and an offer
  catalogue; `Service` + `Offer` with real price ranges on service pages;
  `FAQPage` on 20 pages; `BreadcrumbList` and `Article` where they apply.
- **An "answer block" as the first content on every page** — a 40–70 word
  direct answer in plain prose. This is the span answer engines lift and cite.
  It is the highest-value pattern on the site; keep it when you edit copy.
- `llms.txt` — a plain-text fact sheet for AI assistants (prices, service area,
  licensing, what makes the business different). `robots.txt` explicitly allows
  GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended, because
  you *want* to be quoted.
- Ten city pages with genuinely distinct local content — neighbourhoods,
  housing eras, hardness ranges, utility links. Near-duplicate city pages with
  the name swapped are the standard way local sites get filtered out of the
  index; these are not that.
- No web fonts, no frameworks, no render-blocking JS. It loads fast on a phone
  in a garage on one bar, which is where it will actually be read.

### What to write next

The pages that will earn links and rankings, in priority order:

1. "Culligan vs buying your own softener in Arizona — what the $6,000 buys"
   (comparison searches convert hardest).
2. "Water softener sizing calculator for Arizona homes" (interactive, earns
   links).
3. One page per remaining nearby city once you expand: Scottsdale, Maricopa,
   Florence, Fountain Hills. Use the same structure — real local detail, not a
   find-and-replace.
4. A photo gallery of real installs. Nothing converts a "who do I trust"
   visitor like twenty pictures of tidy drain lines.

Add the first two as entries in the `guides` array in `content.mjs`; they will
be picked up by the guides index, sitemap and `llms.txt` automatically.

## 8. Recruiting the contractors

`/for-plumbers/` is a real recruiting page and publishing the rates is the
point: it is the same "prices you can see" argument you make to homeowners, and
it filters out anyone who was going to haggle. Post it to the
r/Plumbing job threads, AZ plumbing Facebook groups, and — most effective —
message licensed one-truck operators in your ZIP codes directly on the ROC
licence lookup.

Aim for three contractors before you spend a dollar on advertising. One
contractor is a single point of failure, and the fastest way to lose a customer
in this trade is a missed window.
