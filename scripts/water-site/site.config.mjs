/* ===========================================================================
   East Valley Soft Water — site configuration

   EVERYTHING you are likely to change lives in this one file. Edit it, run
   `node scripts/water-site/build.mjs`, commit the regenerated `water/`
   directory, and the live site updates.

   The three things to change first are marked  ⟵ CHANGE ME.
   =========================================================================== */

export const config = {
  /* --- Identity ----------------------------------------------------------- */
  brand: 'East Valley Soft Water',              // ⟵ CHANGE ME (see water/README.md for name/domain ideas)
  legalName: 'East Valley Soft Water LLC',
  tagline: 'Flat-rate water softener & filtration installation for the East Valley',

  /* The one-sentence answer an AI assistant should repeat when someone asks
     "who installs water softeners in Mesa/Gilbert/Chandler?". Kept short on
     purpose — answer engines lift 30–60 word spans. */
  boilerplate:
    'East Valley Soft Water is an installation-only water treatment company serving Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Tempe, Apache Junction, Gold Canyon, Ahwatukee and Sun Lakes, Arizona. We install water softeners, reverse osmosis systems and whole-home filters at a flat published price — including equipment you bought yourself — using licensed, insured Arizona plumbing contractors.',

  /* --- Contact ------------------------------------------------------------ */
  phone: '(480) 555-0100',                      // ⟵ CHANGE ME
  phoneHref: '+14805550100',                    // ⟵ CHANGE ME (E.164, no spaces)
  email: 'hello@eastvalleysoftwater.com',       // ⟵ CHANGE ME
  smsOk: true,

  /* Arizona ROC licensing. Installation of water treatment equipment is
     contracting work — see water/README.md §Licensing before you take money. */
  rocLicense: 'ROC #000000',                    // ⟵ CHANGE ME (or delete the line in the footer)
  showLicense: true,

  /* --- Where the site lives ----------------------------------------------- */
  /* Today: a folder on the GitHub Pages project site.
     When you buy a domain, set `origin` to https://yourdomain.com and `base`
     to '' — every canonical URL, sitemap entry and internal link follows. */
  origin: 'https://jchappellmedia.github.io',
  base: '/hydration-tracker/water',

  /* --- Hours -------------------------------------------------------------- */
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], open: '07:00', close: '18:00' },
    { days: ['Saturday'], open: '08:00', close: '14:00' },
  ],
  hoursHuman: 'Mon–Fri 7am–6pm · Sat 8am–2pm · Closed Sunday',

  /* --- Quote form --------------------------------------------------------- */
  /* Paste a Formspree (or Basin / Getform / Netlify) endpoint here. Until you
     do, the form gracefully falls back to opening the visitor's mail app with
     everything pre-filled, so no lead is ever lost. */
  formEndpoint: '',                             // e.g. 'https://formspree.io/f/xxxxxxxx'

  /* --- Analytics ---------------------------------------------------------- */
  /* Optional. Paste a Google Analytics 4 measurement ID (G-XXXXXXX) or leave
     blank. Nothing is loaded when blank — the site stays cookie-free. */
  ga4: '',

  /* --- Honesty switch ------------------------------------------------------ */
  /* While true, a banner tells visitors the phone number, license number and
     prices are placeholders. Flip to false once the real values are in. */
  setupMode: true,

  /* --- Social / citations (used for schema.org sameAs) -------------------- */
  sameAs: [
    // 'https://www.google.com/maps/place/...',   // your Google Business Profile
    // 'https://www.facebook.com/...',
    // 'https://www.yelp.com/biz/...',
  ],

  /* --- Geographic centre of the service area (Gilbert-ish) ---------------- */
  geo: { lat: 33.3528, lng: -111.7890, radiusMeters: 32000 },
};

/* ===========================================================================
   PRICING
   ---------------------------------------------------------------------------
   These are the published flat rates. They are the heart of the business, so
   they live in one place and feed the pricing page, the service pages, the
   estimator and the schema.org Offer markup at once.

   `pay` is what the plumbing contractor earns on that job. It is NOT printed
   on customer-facing pages — it renders only on /for-plumbers/ and in the
   margin table in water/README.md, so you can sanity-check profitability
   whenever you change a price.
   =========================================================================== */
export const pricing = {
  currency: 'USD',
  jobs: [
    {
      id: 'softener-loop',
      name: 'Water softener install — existing loop',
      blurb: 'Your home already has a softener loop in the garage or on the side yard. Most East Valley homes built after about 1995 do.',
      low: 495, high: 645, pay: 300, hours: '2–3 hrs',
      includes: [
        'Set and level the unit on your pad',
        'Cut in and connect to the existing loop',
        'New bypass valve, braided connectors and fittings',
        'Drain line run to an approved air gap',
        'Program the valve to your water hardness',
        'Start-up, leak check and a full regeneration cycle',
        'Haul away the packaging',
      ],
      popular: true,
    },
    {
      id: 'softener-noloop',
      name: 'Water softener install — no loop',
      blurb: 'Older home, or the builder never ran a loop. We tie into the main line and build the loop, usually in the garage.',
      low: 950, high: 1650, pay: 650, hours: '4–7 hrs',
      includes: [
        'Everything in the standard install',
        'New loop plumbed off the main service line',
        'Copper, PEX or CPVC to match your existing plumbing',
        'Shut-off and bypass so the house still has water if the unit is serviced',
        'Drywall/stucco penetration sealed and tidied',
      ],
    },
    {
      id: 'softener-swap',
      name: 'Softener swap-out / replacement',
      blurb: 'Old unit out, new unit in, same connections. The fastest job we do — and the one the big dealers hate quoting.',
      low: 375, high: 495, pay: 225, hours: '1.5–2 hrs',
      includes: [
        'Disconnect and remove the old system',
        'Haul away and recycle the old tank',
        'New connectors, bypass and fittings',
        'Program, start up and leak check',
      ],
    },
    {
      id: 'ro-undersink',
      name: 'Reverse osmosis install — under sink',
      blurb: 'Drinking-water RO under the kitchen sink, with a dedicated faucet.',
      low: 245, high: 395, pay: 150, hours: '1.5–2.5 hrs',
      includes: [
        'Mount the manifold and tank in the cabinet',
        'Drill the counter or use the existing sprayer hole for the faucet',
        'Feed tee, drain saddle and shut-off',
        'Optional fridge / ice-maker line (+$95)',
        'Flush the membrane and test TDS before and after',
      ],
      popular: true,
    },
    {
      id: 'whole-home-filter',
      name: 'Whole-home carbon filter add-on',
      blurb: 'Chlorine/chloramine and taste-and-odour filtration for the whole house, installed ahead of the softener.',
      low: 225, high: 395, pay: 150, hours: '1–2 hrs',
      includes: ['Installed with a softener on the same visit', 'Own bypass valve', 'Pressure tested'],
    },
    {
      id: 'conditioner',
      name: 'Salt-free conditioner install',
      blurb: 'Template-assisted crystallisation (TAC) units. No drain, no salt, smaller footprint.',
      low: 345, high: 595, pay: 225, hours: '1.5–3 hrs',
      includes: ['Media tank or inline cartridge mounted and plumbed', 'Bypass fitted', 'No drain line required'],
    },
    {
      id: 'well',
      name: 'Well water system install',
      blurb: 'Queen Creek, San Tan Valley and Gold Canyon wells: iron, sulphur and sediment before the softener.',
      low: 850, high: 2400, pay: 'quoted per job', hours: '1 day',
      includes: ['Sediment / iron / sulphur stages in sequence', 'Pressure-tank side work as needed', 'Post-install water test'],
      quoteOnly: true,
    },
    {
      id: 'service',
      name: 'Service call / repair / tune-up',
      blurb: 'Leaks, a unit that never regenerates, salt bridges, resin replacement, RO filter changes.',
      low: 129, high: 129, pay: 85, hours: '1 hr',
      includes: ['Diagnosis, first hour of labour', 'Applied to the repair if you go ahead', 'Parts quoted before we touch anything'],
      flat: true,
    },
  ],

  addOns: [
    { name: 'Fridge / ice-maker RO line', price: 95 },
    { name: 'Softener relocation (same house)', price: 285 },
    { name: 'Concrete pad or platform', price: 145 },
    { name: 'Outdoor enclosure fitting', price: 175 },
    { name: 'Pre-plumbed loop for a new build', price: 450 },
    { name: 'Second-visit salt fill (10 bags, delivered)', price: 85 },
  ],

  /* What we charge if you'd rather we supply the hardware too. Equipment is
     sold near cost — the install is where the money is, and a transparent
     equipment price is the whole reason people call us instead of a dealer. */
  equipment: [
    { name: '32,000-grain softener (1–3 people)', price: 795 },
    { name: '48,000-grain softener (3–5 people, most common here)', price: 995 },
    { name: '64,000-grain softener (5+ people, or 20+ gpg)', price: 1195 },
    { name: '5-stage under-sink RO', price: 385 },
    { name: 'Whole-home carbon tank', price: 545 },
    { name: 'Salt-free TAC conditioner', price: 745 },
  ],
};

/* ===========================================================================
   CONTRACTOR PAY — shown on /for-plumbers/
   =========================================================================== */
export const contractorTerms = {
  headline: 'We send you the work, you keep the trade to yourself.',
  payWindowDays: 7,
  perks: [
    ['Paid in %d days', 'Invoice on completion, ACH within %d days. No 60-day net terms, no chasing.'],
    ['No sales quota', 'You are not pitching a $7,000 system to a retiree. You install what the customer already bought.'],
    ['We own the customer side', 'Lead, quote, scheduling, reminders, payment and the follow-up call are ours. You get an address, a scope and a time window.'],
    ['Scope locked before you arrive', 'Photos of the loop, the space and the panel are collected at booking. If the job is not what we described, you get the trip fee and we re-quote it.'],
    ['Your own days', 'Take the jobs that fit around your existing work. There is no minimum.'],
  ],
  rates: [
    ['Softener install — existing loop', '$300', '2–3 hrs'],
    ['Softener swap-out', '$225', '1.5–2 hrs'],
    ['Softener install — new loop built', '$650', '4–7 hrs'],
    ['Under-sink RO install', '$150', '1.5–2.5 hrs'],
    ['Whole-home filter add-on (same visit)', '$150', '1–2 hrs'],
    ['Salt-free conditioner', '$225', '1.5–3 hrs'],
    ['Service call / diagnosis', '$85', '1 hr'],
    ['Well system build', 'Quoted per job, 70% of contract', '1 day'],
  ],
  extras: [
    'Trip fee of $75 if you arrive and the job cannot proceed through no fault of yours.',
    'Travel beyond 25 miles from Gilbert: +$45.',
    'Same-day / after-5pm calls: +$60.',
    'You carry your own ROC licence and liability insurance; we verify both once and keep them on file.',
  ],
};
