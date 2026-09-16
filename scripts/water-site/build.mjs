#!/usr/bin/env node
/* ===========================================================================
   East Valley Soft Water — static site generator.

   Run:  node scripts/water-site/build.mjs
   Out:  water/**   (committed to the repo; GitHub Pages serves it directly)

   Why a generator rather than 35 hand-written HTML files: the header, footer,
   schema.org blocks, breadcrumbs and price tables have to stay identical
   everywhere or the SEO work quietly rots. One template, one price list, one
   phone number — change it once and every page follows.
   =========================================================================== */

import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, pricing, contractorTerms } from './site.config.mjs';
import { services, cities, guides, siteFaqs, steps, differentiators } from './content.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(ROOT, 'water');

/* --- Little helpers -------------------------------------------------------- */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Site-relative URL. Everything routes through here so moving the site to a
 *  bare domain is a two-line change in site.config.mjs. */
const u = (p) => (config.base + (p.startsWith('/') ? p : '/' + p)).replace(/\/{2,}/g, '/') || '/';
/** Absolute URL, for canonicals, og:url, sitemap and schema @id. */
const abs = (p) => config.origin + u(p);

const money = (n) => '$' + n.toLocaleString('en-US');
const range = (j) => (j.quoteOnly ? 'From ' + money(j.low) : j.low === j.high ? money(j.low) : money(j.low) + '–' + money(j.high));

const write = (path, contents) => {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
  return path;
};

const PAGES = [];   /* collected for sitemap.xml + llms.txt */

/* --- Structured data ------------------------------------------------------- */
const BUSINESS_ID = abs('/#business');

function localBusinessSchema(areaCity) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Plumber', 'HomeAndConstructionBusiness'],
    '@id': BUSINESS_ID,
    name: config.brand,
    legalName: config.legalName,
    description: config.boilerplate,
    url: abs('/'),
    telephone: config.phone,
    email: config.email,
    priceRange: '$$',
    image: abs('/assets/og-image.png'),
    logo: abs('/assets/icon-512.png'),
    ...(config.sameAs.length ? { sameAs: config.sameAs } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Gilbert', addressRegion: 'AZ', addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: config.geo.lat, longitude: config.geo.lng },
    areaServed: (areaCity ? [areaCity] : cities).map((c) => ({
      '@type': 'City', name: c.name, address: { '@type': 'PostalAddress', addressRegion: 'AZ', addressCountry: 'US' },
    })),
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: config.geo.lat, longitude: config.geo.lng },
      geoRadius: config.geo.radiusMeters,
    },
    openingHoursSpecification: config.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.open, closes: h.close,
    })),
    knowsAbout: ['water softener installation', 'reverse osmosis systems', 'whole house water filtration', 'hard water', 'well water treatment'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Water treatment installation services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: abs('/services/' + s.slug + '/') },
      })),
    },
  };
}

const faqSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({
    '@type': 'Question', name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

const breadcrumbSchema = (crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({
    '@type': 'ListItem', position: i + 1, name: c.name, item: config.origin + c.href,
  })),
});

function serviceSchema(svc) {
  const jobs = pricing.jobs.filter((j) => svc.jobs.includes(j.id));
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: svc.name,
    description: svc.answer,
    url: abs('/services/' + svc.slug + '/'),
    serviceType: svc.name,
    provider: { '@id': BUSINESS_ID },
    areaServed: cities.map((c) => ({ '@type': 'City', name: c.name })),
    offers: jobs.map((j) => ({
      '@type': 'Offer',
      name: j.name,
      priceCurrency: pricing.currency,
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: pricing.currency,
        minPrice: j.low,
        maxPrice: j.high,
        valueAddedTaxIncluded: false,
      },
      availableAtOrFrom: { '@id': BUSINESS_ID },
    })),
  };
}

const articleSchema = (g) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: g.title,
  description: g.description,
  url: abs('/guides/' + g.slug + '/'),
  author: { '@id': BUSINESS_ID },
  publisher: { '@id': BUSINESS_ID },
  datePublished: '2026-01-15',
  dateModified: new Date().toISOString().slice(0, 10),
  about: 'Water softener and water filtration installation in the East Valley, Arizona',
});

/* --- Shared chrome ---------------------------------------------------------- */
const LOGO_SVG = `<svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true">
  <path d="M15 1.5C15 1.5 3 14.2 3 21.2 3 27.7 8.4 32.5 15 32.5s12-4.8 12-11.3C27 14.2 15 1.5 15 1.5Z" fill="currentColor" opacity=".13"/>
  <path d="M15 1.5C15 1.5 3 14.2 3 21.2 3 27.7 8.4 32.5 15 32.5s12-4.8 12-11.3C27 14.2 15 1.5 15 1.5Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M9.5 20.5c1.8 0 1.8 2 3.7 2s1.8-2 3.7-2 1.8 2 3.6 2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;

const CHECK = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 8.5 6 12l7.5-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NAV = [
  ['Pricing', '/pricing/'],
  ['Services', '/services/'],
  ['Service area', '/areas/'],
  ['Guides', '/guides/'],
  ['For plumbers', '/for-plumbers/'],
];

const callButton = (cls = 'btn btn-secondary') =>
  `<a class="${cls}" href="tel:${esc(config.phoneHref)}">Call ${esc(config.phone)}</a>`;

const quoteButton = (label = 'Get a fixed price', cls = 'btn btn-primary') =>
  `<a class="${cls}" href="${u('/quote/')}">${esc(label)}</a>`;

function header() {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="logo" href="${u('/')}">${LOGO_SVG}<span>${esc(config.brand)}<small>East Valley, Arizona</small></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu">☰</button>
    <nav class="nav" id="nav">
      ${NAV.map(([l, h]) => `<a href="${u(h)}">${esc(l)}</a>`).join('\n      ')}
      <a href="tel:${esc(config.phoneHref)}">${esc(config.phone)}</a>
      <a class="cta" href="${u('/quote/')}">Get a price</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="logo" href="${u('/')}" style="margin-bottom:12px">${LOGO_SVG}<span>${esc(config.brand)}<small>East Valley, Arizona</small></span></a>
        <p class="small muted">${esc(config.tagline)}.</p>
        <p class="small"><a href="tel:${esc(config.phoneHref)}"><strong>${esc(config.phone)}</strong></a><br>
        <a href="mailto:${esc(config.email)}">${esc(config.email)}</a><br>
        <span class="muted">${esc(config.hoursHuman)}</span></p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>${services.map((s) => `<li><a href="${u('/services/' + s.slug + '/')}">${esc(s.nav)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Service area</h4>
        <ul>${cities.map((c) => `<li><a href="${u('/areas/' + c.slug + '/')}">${esc(c.name)}, AZ</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="${u('/pricing/')}">Pricing</a></li>
          <li><a href="${u('/guides/')}">Guides</a></li>
          <li><a href="${u('/faq/')}">FAQ</a></li>
          <li><a href="${u('/about/')}">About us</a></li>
          <li><a href="${u('/for-plumbers/')}">Plumbing contractors</a></li>
          <li><a href="${u('/quote/')}">Get a price</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} ${esc(config.legalName)}</span>
      ${config.showLicense ? `<span>Installations by licensed, insured Arizona plumbing contractors · ${esc(config.rocLicense)}</span>` : ''}
      <span>Serving ${cities.map((c) => esc(c.name)).join(' · ')}</span>
    </div>
  </div>
</footer>
<div class="callbar">
  <a class="btn btn-primary" href="tel:${esc(config.phoneHref)}">Call now</a>
  <a class="btn btn-secondary" href="${u('/quote/')}">Get a price</a>
</div>`;
}

const ctaBand = (heading, sub) => `<section class="tight"><div class="wrap"><div class="cta-band">
  <h2>${esc(heading)}</h2>
  <p>${esc(sub)}</p>
  <div class="btn-row">
    ${quoteButton('Get a fixed price', 'btn btn-primary')}
    ${callButton('btn btn-secondary')}
  </div>
</div></div></section>`;

const faqBlock = (faqs) => `<div class="faq">
  ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('\n  ')}
</div>`;

const answerBlock = (text) => `<div class="answer"><span class="label">The short answer</span><p>${esc(text)}</p></div>`;

const crumbTrail = (crumbs) => `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">
  ${crumbs.map((c, i) => (i === crumbs.length - 1
    ? `<span aria-current="page">${esc(c.name)}</span>`
    : `<a href="${c.href}">${esc(c.name)}</a><span>›</span>`)).join('')}
</nav></div>`;

/* --- The page shell --------------------------------------------------------- */
function layout({ path, title, description, body, schema = [], crumbs = null, noindex = false }) {
  const canonical = abs(path);
  const all = crumbs ? [...schema, breadcrumbSchema(crumbs)] : schema;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<meta name="geo.region" content="US-AZ">
<meta name="geo.placename" content="Mesa, Gilbert, Chandler, Queen Creek, Arizona">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(config.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${abs('/assets/og-image.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs('/assets/og-image.png')}">
<meta name="theme-color" content="#0b5d75" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b1620" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${u('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${u('/assets/icon-512.png')}">
<link rel="stylesheet" href="${u('/assets/site.css')}">
${all.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
${config.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${config.ga4}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${config.ga4}');</script>` : ''}
</head>
<body>
${config.setupMode ? `<div class="setup-banner"><strong>Site in setup:</strong> the phone number, licence number and contact email on this site are placeholders until the business details are filled in.</div>` : ''}
${header()}
<main>
${crumbs && crumbs.length > 1 ? crumbTrail(crumbs) : ''}
${body}
</main>
${footer()}
<script src="${u('/assets/site.js')}" defer></script>
</body>
</html>
`;
  PAGES.push({ path, title, description, noindex });
  return write(path === '/' ? 'index.html' : path.replace(/^\//, '') + 'index.html', html);
}


/* ===========================================================================
   Reusable page fragments
   =========================================================================== */
const job = (id) => pricing.jobs.find((j) => j.id === id);

function priceCard(j, { withList = true } = {}) {
  return `<article class="card price-card${j.popular ? ' popular' : ''}">
  ${j.popular ? '<span class="tag">Most common</span>' : ''}
  <h3>${esc(j.name)}</h3>
  <p class="price">${range(j)} <span class="unit">${j.flat ? 'flat' : 'installed'}</span></p>
  <p class="small muted">${esc(j.hours)} on site${j.quoteOnly ? ' · quoted from your water test' : ''}</p>
  <p class="small">${esc(j.blurb)}</p>
  ${withList ? `<ul>${j.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
  <div class="foot"><a class="btn btn-secondary" href="${u('/quote/')}?job=${j.id}">Get this price confirmed</a></div>
</article>`;
}

const trustBar = () => `<div class="trust">
  <span>${CHECK} Licensed &amp; insured AZ contractors</span>
  <span>${CHECK} Flat prices published up front</span>
  <span>${CHECK} We install equipment you bought</span>
  <span>${CHECK} No travel surcharge, anywhere we serve</span>
</div>`;

const cityLinks = () => `<ul class="linkgrid">
  ${cities.map((c) => `<li><a href="${u('/areas/' + c.slug + '/')}">${esc(c.name)}, AZ<small>${esc(c.hardness.split(';')[0])}</small></a></li>`).join('\n  ')}
</ul>`;

const serviceLinks = () => `<div class="grid grid-3">
  ${services.map((s) => `<article class="card"><h3><a href="${u('/services/' + s.slug + '/')}" style="text-decoration:none">${esc(s.name)}</a></h3><p class="small">${esc(s.answer.split('. ')[0])}.</p><p class="small"><a href="${u('/services/' + s.slug + '/')}">Prices and detail →</a></p></article>`).join('\n  ')}
</div>`;

const guideLinks = () => `<ul class="linkgrid">
  ${guides.map((g) => `<li><a href="${u('/guides/' + g.slug + '/')}">${esc(g.nav)}<small>${esc(g.title)}</small></a></li>`).join('\n  ')}
</ul>`;

/* ===========================================================================
   HOME
   =========================================================================== */
function buildHome() {
  const main = job('softener-loop');
  const body = `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="eyebrow">Mesa · Gilbert · Chandler · Queen Creek · San Tan Valley</span>
      <h1>Water softener installation at a price you can see before you call.</h1>
      <p class="lede">We are an installation-only water treatment company for the East Valley. We install any softener, reverse osmosis system or whole-home filter — <strong>including the one you already bought</strong> — at a flat, published rate, using licensed Arizona plumbing contractors who are paid fairly for the work.</p>
      <div class="btn-row">
        ${quoteButton('Get a fixed price in writing')}
        ${callButton()}
      </div>
      <p class="btn-note">Text a photo of your garage wall and we will price it without a sales visit.</p>
      ${trustBar()}
    </div>
    <div>
      ${priceCard(main)}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    ${answerBlock(config.boilerplate)}
    <div class="section-head">
      <h2>The jobs everyone else is too big to take</h2>
      <p>The water treatment industry here runs on in-home sales appointments and $4,000–$8,000 system packages. That model cannot profitably send someone out to swap your softener, install a unit you bought at Costco, or drive to San Tan Valley for a filter change. So nobody does — and that is the entire business we built.</p>
    </div>
    <div class="grid grid-3">
      ${differentiators.map(([h, p]) => `<article class="card"><h3>${esc(h)}</h3><p class="small">${esc(p)}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="section-head"><h2>How it works</h2><p>Three steps, no presentation, no financing pitch, no manager phone call.</p></div>
    <div class="steps">
      ${steps.map(([h, p]) => `<div class="step"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head"><h2>What it costs</h2><p>These are the real prices, not a starting-from figure. The full list — including add-ons and equipment, if you would rather we supplied that too — is on the pricing page.</p></div>
    <div class="grid grid-3">
      ${['softener-loop', 'ro-undersink', 'softener-swap'].map((id) => priceCard(job(id))).join('\n      ')}
    </div>
    <p style="margin-top:22px"><a class="btn btn-secondary" href="${u('/pricing/')}">See every price →</a></p>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="section-head"><h2>Where we work</h2><p>Ten East Valley communities, one price list. There is no travel surcharge to any of them — the distance comes out of our margin, not your quote.</p></div>
    ${cityLinks()}
  </div>
</section>

<section>
  <div class="wrap">
    <div class="section-head"><h2>What we install</h2></div>
    ${serviceLinks()}
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="grid grid-2" style="align-items:center; gap:36px">
      <div>
        <h2>Are you a licensed plumbing contractor?</h2>
        <p>We do not employ installers — we send work to licensed East Valley plumbers and pay a posted rate for it, in seven days, with the scope fixed before you drive out. Our rates to contractors are published on this site, right next to our prices to customers, because a plumber who is paid properly does not rush the job.</p>
        <p><a class="btn btn-secondary" href="${u('/for-plumbers/')}">See contractor rates →</a></p>
      </div>
      <div class="card">
        <h3>Posted contractor rates</h3>
        <div class="table-wrap" style="box-shadow:none; border:0">
          <table><tbody>
            ${contractorTerms.rates.slice(0, 5).map(([n, p, h]) => `<tr><td>${esc(n)}</td><td class="num"><strong>${esc(p)}</strong></td><td class="num muted small">${esc(h)}</td></tr>`).join('')}
          </tbody></table>
        </div>
        <p class="small muted" style="margin-top:12px; margin-bottom:0">Paid by ACH within ${contractorTerms.payWindowDays} days of completion.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <div class="section-head"><h2>Questions we get every day</h2></div>
    ${faqBlock(siteFaqs.slice(0, 6))}
    <p style="margin-top:18px"><a href="${u('/faq/')}">All frequently asked questions →</a></p>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="section-head"><h2>Read before you buy anything</h2><p>Plain guides to what this equipment costs and what your house actually needs. No email address required to read them.</p></div>
    ${guideLinks()}
  </div>
</section>

${ctaBand('Get a real price today', 'Send one photo. We reply with a fixed, written price the same business day — and we will tell you if you do not need what you were about to buy.')}
`;

  layout({
    path: '/',
    title: 'Water Softener Installation — East Valley Phoenix AZ',
    description: 'Flat-rate water softener, reverse osmosis and whole-home filter installation across the East Valley. We install equipment you bought yourself. Prices published.',
    body,
    schema: [localBusinessSchema(), faqSchema(siteFaqs)],
  });
}

/* ===========================================================================
   PRICING
   =========================================================================== */
function buildPricing() {
  const estJobs = {};
  pricing.jobs.forEach((j) => { estJobs[j.id] = { name: j.name, low: j.low, high: j.high, hours: j.hours }; });
  estJobs.__equipment = {};
  pricing.equipment.forEach((e, i) => { estJobs['eq' + i] = undefined; estJobs.__equipment['eq' + i] = e; });

  const body = `
<section class="tight">
  <div class="wrap narrow">
    <h1>Pricing</h1>
    ${answerBlock('Water softener installation is $495–$645 at an existing loop and $950–$1,650 if a loop has to be built. Swap-outs are $375–$495. Under-sink reverse osmosis is $245–$395. Service calls are a flat $129. Every price below is the price you pay, in any city we serve, whether you supply the equipment or we do.')}
    <p>We publish these because the alternative — "it depends, let us send someone out for two hours" — is how this industry keeps prices at four to eight thousand dollars. It does not depend that much. A softener install at an existing loop is a two-hour job for a licensed plumber, and it should be priced like one.</p>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head"><h2>Installation labour</h2><p>Flat rate, quoted in writing before we schedule, fixed unless you change the scope. Nothing is due up front.</p></div>
    <div class="grid grid-3">
      ${pricing.jobs.map((j) => priceCard(j)).join('\n      ')}
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <div class="grid grid-2" style="gap:36px; align-items:start">
      <div>
        <h2>Add-ons</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Add-on</th><th class="num">Price</th></tr></thead>
            <tbody>${pricing.addOns.map((a) => `<tr><td>${esc(a.name)}</td><td class="num">${money(a.price)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
      <div>
        <h2>Equipment, if you want us to supply it</h2>
        <p class="small">You do not have to buy hardware from us and we would rather you shopped around — but if you would like one invoice, these are our prices. They are close to what you would pay at retail, because we make our money on installation, not on a 300% equipment markup.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Equipment</th><th class="num">Price</th></tr></thead>
            <tbody>${pricing.equipment.map((e) => `<tr><td>${esc(e.name)}</td><td class="num">${money(e.price)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <div class="section-head"><h2>Estimate your job</h2><p>Published rates, applied to your situation. This is an estimate, not a quote — the quote comes in writing after you send a photo, and it does not move afterwards.</p></div>
    <div class="card estimator" id="estimator" data-jobs='${JSON.stringify(estJobs).replace(/'/g, '&#39;')}' data-quote-url="${u('/quote/')}">
      <div class="field">
        <label for="est-job">What do you need installed?</label>
        <select id="est-job" name="est-job">
          ${pricing.jobs.filter((j) => !j.quoteOnly && !j.flat).map((j) => `<option value="${j.id}">${esc(j.name.replace(/ — .*/, ''))}</option>`).join('')}
        </select>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="est-loop">Is there an existing softener loop?</label>
          <select id="est-loop" name="est-loop">
            <option value="yes">Yes — or I already have a unit connected</option>
            <option value="no">No / not sure (home built before ~1995)</option>
          </select>
          <span class="hint">Only affects new softener installs.</span>
        </div>
        <div class="field">
          <label for="est-equip">Equipment</label>
          <select id="est-equip" name="est-equip">
            <option value="own">I already have it (or will buy it myself)</option>
            ${pricing.equipment.map((e, i) => `<option value="eq${i}">${esc(e.name)} — ${money(e.price)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="result" id="est-result"></div>
    </div>
  </div>
</section>

<section class="alt">
  <div class="wrap narrow">
    <div class="section-head"><h2>What is never on your invoice</h2></div>
    <div class="grid grid-2">
      <div class="card"><h3>No trip charge</h3><p class="small">Not to San Tan Valley, not to Gold Canyon, not to Apache Junction. If the drive is long, our contractor gets a distance premium and it comes out of our margin.</p></div>
      <div class="card"><h3>No financing</h3><p class="small">Financing exists in this trade to make $6,000 sound like $89 a month. Our prices do not need it.</p></div>
      <div class="card"><h3>No "today only" discount</h3><p class="small">The price is the same on Tuesday. It is on a public web page — we could not change it for you if we wanted to.</p></div>
      <div class="card"><h3>No equipment lock-in</h3><p class="small">Bring your own from anywhere. Same rate. We will tell you if it is the wrong size before we install it.</p></div>
    </div>
    <p class="small muted" style="margin-top:20px">Prices are for standard residential work in our published service area and exclude sales tax and city permit fees where required. Work requiring re-routing of the main service line, attic or second-storey installs, well systems and commercial work are quoted individually. A written quote always precedes scheduling.</p>
  </div>
</section>

${ctaBand('Have the exact price in writing before anyone drives out', 'Send a photo of the space. We reply the same business day with a fixed price and a two-hour arrival window.')}
`;

  layout({
    path: '/pricing/',
    title: 'Water Softener Installation Cost — East Valley AZ Prices',
    description: 'Published flat rates: softener install $495–$645, swap-out $375–$495, under-sink RO $245–$395, service call $129. Equipment and add-on prices listed too.',
    body,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'Pricing', href: u('/pricing/') }],
    schema: [localBusinessSchema()],
  });
}

/* ===========================================================================
   SERVICES
   =========================================================================== */
function buildServices() {
  layout({
    path: '/services/',
    title: 'Water Treatment Installation Services — East Valley AZ',
    description: 'Water softener installation, reverse osmosis, whole-home filtration, replacement, well treatment and repairs across Mesa, Gilbert, Chandler and the East Valley.',
    body: `
<section class="tight"><div class="wrap narrow">
  <h1>What we install</h1>
  ${answerBlock('We install water softeners, under-sink reverse osmosis systems, whole-home carbon filters, salt-free conditioners and well water treatment trains across the East Valley — at flat published rates, on any brand, including equipment you bought yourself. We also repair and replace systems other companies installed.')}
</div></section>
<section class="tight"><div class="wrap">${serviceLinks()}</div></section>
<section class="alt"><div class="wrap">
  <div class="section-head"><h2>All installation prices</h2></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Job</th><th class="num">Price</th><th class="num">On site</th></tr></thead>
    <tbody>${pricing.jobs.map((j) => `<tr><td>${esc(j.name)}</td><td class="num"><strong>${range(j)}</strong></td><td class="num muted">${esc(j.hours)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p style="margin-top:18px"><a href="${u('/pricing/')}">Full pricing, add-ons and equipment →</a></p>
</div></section>
${ctaBand('Not sure which one you need?', 'Tell us what your water is doing — the spots, the smell, the dead water heater — and we will tell you what actually fixes it. Often it is cheaper than what you were quoted.')}`,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'Services', href: u('/services/') }],
    schema: [localBusinessSchema()],
  });

  services.forEach((s) => {
    const jobs = pricing.jobs.filter((j) => s.jobs.includes(j.id));
    const body = `
<section class="tight"><div class="wrap narrow">
  <h1>${esc(s.name)} <span class="muted" style="font-weight:600; font-size:.5em; display:block; margin-top:.4em">Mesa · Gilbert · Chandler · Queen Creek · San Tan Valley · Tempe · Apache Junction · Gold Canyon · Ahwatukee · Sun Lakes</span></h1>
  ${answerBlock(s.answer)}
  <div class="btn-row">${quoteButton('Get a fixed price')}${callButton()}</div>
</div></section>

${jobs.length ? `<section class="tight"><div class="wrap">
  <div class="grid grid-${Math.min(jobs.length, 3)}">${jobs.map((j) => priceCard(j)).join('')}</div>
</div></section>` : ''}

<section><div class="wrap prose">
  ${s.sections.map((sec) => `<h2>${esc(sec.h)}</h2>${sec.p.map((p) => `<p>${esc(p)}</p>`).join('')}`).join('\n  ')}
</div></section>

<section class="alt"><div class="wrap narrow">
  <div class="section-head"><h2>${esc(s.name)} — questions</h2></div>
  ${faqBlock(s.faqs)}
</div></section>

<section class="tight"><div class="wrap">
  <div class="section-head"><h2>${esc(s.name)} near you</h2><p>Same flat rate in every community we serve.</p></div>
  ${cityLinks()}
</div></section>

${ctaBand('Get this quoted properly', 'One photo, one written price, one licensed plumber. No sales appointment.')}`;

    layout({
      path: '/services/' + s.slug + '/',
      title: s.title,
      description: s.description,
      body,
      crumbs: [{ name: 'Home', href: u('/') }, { name: 'Services', href: u('/services/') }, { name: s.nav, href: u('/services/' + s.slug + '/') }],
      schema: [serviceSchema(s), faqSchema(s.faqs), localBusinessSchema()],
    });
  });
}

/* ===========================================================================
   SERVICE AREA
   =========================================================================== */
function buildAreas() {
  layout({
    path: '/areas/',
    title: 'Service Area — Water Treatment Install, East Valley AZ',
    description: 'We install water softeners and filtration in Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Tempe, Apache Junction, Gold Canyon and Ahwatukee.',
    body: `
<section class="tight"><div class="wrap narrow">
  <h1>Where we work</h1>
  ${answerBlock('We serve ten East Valley communities: Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Tempe, Apache Junction, Gold Canyon, Ahwatukee and Sun Lakes. Prices are identical in all of them and there is no travel surcharge — including to San Tan Valley, Gold Canyon and Apache Junction, where most companies quote one or simply decline.')}
  <p>We deliberately kept the map small. A company that claims the whole Phoenix metro either has trucks sitting in traffic on the 202 all afternoon or is subcontracting to whoever answers. We would rather know ten cities well, keep our contractors inside a short drive, and get to you this week.</p>
</div></section>
<section class="tight"><div class="wrap">${cityLinks()}</div></section>
<section class="alt"><div class="wrap narrow">
  <h2>Just outside the area?</h2>
  <p>If you are in Scottsdale, south Phoenix, Maricopa, Florence or Fountain Hills, call anyway. We will either stretch for it or tell you honestly that you are better off with someone closer — and we will usually know who.</p>
</div></section>
${ctaBand('Get a price for your address', 'Same flat rates everywhere on this list.')}`,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'Service area', href: u('/areas/') }],
    schema: [localBusinessSchema()],
  });

  cities.forEach((c, idx) => {
    const nearby = [cities[(idx + 1) % cities.length], cities[(idx + 2) % cities.length], cities[(idx + 3) % cities.length]];
    const cityFaqs = [
      [`How much does water softener installation cost in ${c.name}, AZ?`,
       `$495–$645 at an existing softener loop, which covers most ${c.name} homes built after the mid-1990s, and $950–$1,650 where a loop has to be built. Swapping an existing unit for a new one is $375–$495. There is no ${c.name} travel surcharge.`],
      [`How hard is the water in ${c.name}?`,
       `${c.name} water typically tests around ${c.hardness}, which is classified very hard. The exact figure moves with the seasonal blend of CAP, river and groundwater supply — ${c.utility} publishes an annual water quality report for your address, and we test your tap before we program any softener.`],
      [`Will you install a water softener I bought myself in ${c.name}?`,
       `Yes. Any brand, any retailer — Costco, Home Depot, Lowe's, Amazon or direct. The flat rate is the same as if we supplied the hardware. It is most of what we do.`],
      [`How soon can you get to ${c.name}?`,
       `Usually within two to four business days, and we schedule a two-hour arrival window rather than an all-day one. Send a photo and we can often confirm the price the same hour.`],
    ];

    const body = `
<section class="tight"><div class="wrap narrow">
  <h1>Water Softener Installation in ${esc(c.name)}, AZ</h1>
  ${answerBlock(`Water softener installation in ${c.name} costs $495–$645 at an existing loop and $950–$1,650 where a loop must be built; a swap-out is $375–$495 and under-sink reverse osmosis is $245–$395. ${c.name} water typically tests ${c.hardness}. We install any brand, including equipment you bought yourself, with no travel surcharge.`)}
  <div class="btn-row">${quoteButton('Get a fixed price')}${callButton()}</div>
</div></section>

<section class="tight"><div class="wrap prose">
  <p>${esc(c.intro)}</p>
  ${c.local.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}

  <h2>${esc(c.name)} water, in numbers</h2>
  <div class="table-wrap"><table><tbody>
    <tr><th>Typical hardness</th><td>${esc(c.hardness)}</td></tr>
    <tr><th>Water provider</th><td><a href="${esc(c.utilityUrl)}" rel="noopener">${esc(c.utility)}</a> — see their annual water quality report</td></tr>
    <tr><th>County</th><td>${esc(c.county)}</td></tr>
    <tr><th>ZIP codes served</th><td class="mono">${c.zips.map(esc).join(', ')}</td></tr>
    <tr><th>Neighbourhoods we work in</th><td>${c.neighborhoods.map(esc).join(' · ')}</td></tr>
    <tr><th>Travel surcharge</th><td>None</td></tr>
  </tbody></table></div>
  <p class="small muted">Hardness is given as a range on purpose: East Valley supply is a seasonal blend of Colorado River (CAP), Salt and Verde river and groundwater, so it moves through the year and by treatment plant. We measure your tap on install day and program the valve to what we actually find.</p>
</div></section>

<section class="alt"><div class="wrap">
  <div class="section-head"><h2>${esc(c.name)} prices</h2><p>The same published rates we charge everywhere.</p></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Job</th><th class="num">Price in ${esc(c.name)}</th><th class="num">On site</th></tr></thead>
    <tbody>${pricing.jobs.map((j) => `<tr><td>${esc(j.name)}</td><td class="num"><strong>${range(j)}</strong></td><td class="num muted">${esc(j.hours)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p style="margin-top:18px"><a href="${u('/pricing/')}">Add-ons, equipment prices and the estimator →</a></p>
</div></section>

<section class="tight"><div class="wrap">
  <div class="section-head"><h2>Services we provide in ${esc(c.name)}</h2></div>
  ${serviceLinks()}
</div></section>

<section class="alt"><div class="wrap narrow">
  <div class="section-head"><h2>${esc(c.name)} questions</h2></div>
  ${faqBlock(cityFaqs)}
</div></section>

<section class="tight"><div class="wrap narrow">
  <h2>Nearby</h2>
  <ul class="linkgrid">${nearby.map((n) => `<li><a href="${u('/areas/' + n.slug + '/')}">${esc(n.name)}, AZ<small>${esc(n.hardness.split(';')[0])}</small></a></li>`).join('')}</ul>
</div></section>

${ctaBand(`Get a fixed price for your ${c.name} home`, 'Send one photo of the garage wall or the space under your sink. Written price the same business day.')}`;

    layout({
      path: '/areas/' + c.slug + '/',
      title: `Water Softener Installation — ${c.name}, AZ | Flat Rate`,
      description: `Flat-rate water softener, RO and filtration installation in ${c.name}, AZ. Any brand — including equipment you bought yourself. No travel surcharge.`,
      body,
      crumbs: [{ name: 'Home', href: u('/') }, { name: 'Service area', href: u('/areas/') }, { name: c.name, href: u('/areas/' + c.slug + '/') }],
      schema: [localBusinessSchema(c), faqSchema(cityFaqs)],
    });
  });
}

/* ===========================================================================
   GUIDES
   =========================================================================== */
function buildGuides() {
  layout({
    path: '/guides/',
    title: 'Water Treatment Guides for Arizona Homeowners',
    description: 'Straight answers on water softener costs, hardness by East Valley city, softener loops, and getting a unit you bought yourself installed. No email required.',
    body: `
<section class="tight"><div class="wrap narrow">
  <h1>Guides</h1>
  ${answerBlock('Plain-English guides to buying and installing water treatment in the East Valley: what installation actually costs, how hard the water is in each city, how to tell whether your home has a softener loop, and who will install equipment you bought yourself.')}
</div></section>
<section class="tight"><div class="wrap"><div class="grid grid-2">
  ${guides.map((g) => `<article class="card"><h3><a href="${u('/guides/' + g.slug + '/')}" style="text-decoration:none">${esc(g.title)}</a></h3><p class="small">${esc(g.description)}</p><p class="small"><a href="${u('/guides/' + g.slug + '/')}">Read →</a></p></article>`).join('\n  ')}
</div></div></section>
${ctaBand('Still want a human?', 'We answer the phone and we will talk you out of buying things you do not need.')}`,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'Guides', href: u('/guides/') }],
    schema: [localBusinessSchema()],
  });

  guides.forEach((g) => {
    const secHtml = g.sections.map((sec) => {
      let h = `<h2>${esc(sec.h)}</h2>`;
      if (sec.rows) {
        const [head, ...rest] = sec.rows;
        h += `<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rest.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      }
      h += (sec.p || []).map((p) => `<p>${esc(p)}</p>`).join('');
      return h;
    }).join('\n  ');

    layout({
      path: '/guides/' + g.slug + '/',
      title: g.metaTitle || g.title,
      description: g.description,
      body: `
<section class="tight"><div class="wrap prose">
  <h1>${esc(g.title)}</h1>
  ${answerBlock(g.answer)}
  ${secHtml}
</div></section>
<section class="alt"><div class="wrap narrow">
  <div class="section-head"><h2>Questions</h2></div>
  ${faqBlock(g.faqs)}
</div></section>
<section class="tight"><div class="wrap narrow">
  <h2>Keep reading</h2>
  <ul class="linkgrid">${guides.filter((o) => o.slug !== g.slug).map((o) => `<li><a href="${u('/guides/' + o.slug + '/')}">${esc(o.nav)}<small>${esc(o.title)}</small></a></li>`).join('')}</ul>
</div></section>
${ctaBand('Want this priced for your house?', 'Send a photo. Written price the same business day, from the rates published on this site.')}`,
      crumbs: [{ name: 'Home', href: u('/') }, { name: 'Guides', href: u('/guides/') }, { name: g.nav, href: u('/guides/' + g.slug + '/') }],
      schema: [articleSchema(g), faqSchema(g.faqs), localBusinessSchema()],
    });
  });
}

/* ===========================================================================
   FOR PLUMBING CONTRACTORS
   =========================================================================== */
function buildForPlumbers() {
  const t = contractorTerms;
  const body = `
<section class="hero"><div class="wrap">
  <span class="eyebrow">For licensed Arizona plumbing contractors</span>
  <h1>${esc(t.headline)}</h1>
  <p class="lede">We book water treatment work across the East Valley and send it to licensed local plumbers at a posted rate. No quotas, no uniforms, no selling. You install, we handle everything else, and you are paid by ACH within ${t.payWindowDays} days.</p>
  <div class="btn-row">
    <a class="btn btn-primary" href="${u('/quote/')}?job=contractor">Apply to take work</a>
    ${callButton()}
  </div>
</div></section>

<section><div class="wrap narrow">
  ${answerBlock(`We subcontract water softener, reverse osmosis and filtration installations to licensed, insured Arizona plumbing contractors across the East Valley. Rates are posted publicly — $300 for a standard softener install, $225 for a swap-out, $150 for an under-sink RO — and paid by ACH within ${t.payWindowDays} days of completion.`)}
  <p>Publishing what we pay is unusual. We do it because it is the same argument we make to homeowners: a price you can see is a price you can trust. A homeowner who knows the plumber is paid $300 out of a $595 invoice understands exactly what they are buying, and a contractor who can read the rate before calling does not waste an afternoon finding out it was $120 and a promise.</p>
</div></section>

<section class="alt"><div class="wrap">
  <div class="section-head"><h2>What we pay</h2><p>Per completed job, not per hour, not per sale.</p></div>
  <div class="table-wrap"><table>
    <thead><tr><th>Job</th><th class="num">You are paid</th><th class="num">Typical time</th></tr></thead>
    <tbody>${t.rates.map(([n, p, h]) => `<tr><td>${esc(n)}</td><td class="num"><strong>${esc(p)}</strong></td><td class="num muted">${esc(h)}</td></tr>`).join('')}</tbody>
  </table></div>
  <ul style="margin-top:20px">${t.extras.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
</div></section>

<section><div class="wrap">
  <div class="section-head"><h2>What you get that a lead service does not give you</h2></div>
  <div class="grid grid-3">
    ${t.perks.map(([h, p]) => `<article class="card"><h3>${esc(h.replace('%d', t.payWindowDays))}</h3><p class="small">${esc(p.replace('%d', t.payWindowDays))}</p></article>`).join('\n    ')}
  </div>
</div></section>

<section class="alt"><div class="wrap prose">
  <h2>How a job reaches you</h2>
  <p>A homeowner sends photos of the space. We confirm the scope, fix the price in writing and collect the address, the equipment details, the access notes and a two-hour window. You get all of it in one message, and you accept or pass — there is no penalty for passing and no minimum.</p>
  <p>On completion you send a photo of the finished install and the water test reading. We invoice the homeowner, and your payment goes out by ACH within ${t.payWindowDays} days. If the job on site is not the job we described, you get the $75 trip fee and we re-quote it — you are never asked to absorb a scope we got wrong.</p>
  <h2>What we ask</h2>
  <ul>
    <li>A current Arizona ROC licence in a plumbing or water treatment classification, and general liability insurance. We verify both once and keep them on file.</li>
    <li>Your own truck, tools and materials for standard installs. Fittings and connectors are on you and are priced into the rate.</li>
    <li>Arrive inside the window, or tell us early enough that we can tell the homeowner.</li>
    <li>Do not sell on our jobs. If the customer needs something more, tell us and we will quote it — and you will get that work too.</li>
  </ul>
  <h2>Why we are not hiring employees</h2>
  <p>Because the work is seasonal and lumpy, and because a plumber who already has a business does this better than someone we trained last month. Our margin is the booking, the scope and the customer relationship. The trade is yours.</p>
</div></section>

${ctaBand('Take a look at the next job', `Send your ROC number and the cities you cover. We will add you to the rotation and you will see work within the week.`)}`;

  layout({
    path: '/for-plumbers/',
    title: 'Subcontract Water Softener Installs — AZ Plumbers',
    description: `We pay licensed East Valley plumbing contractors posted rates for water softener, RO and filtration installs — $300 per standard install, paid within ${contractorTerms.payWindowDays} days.`,
    body,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'For plumbers', href: u('/for-plumbers/') }],
    schema: [localBusinessSchema()],
  });
}

/* ===========================================================================
   FAQ
   =========================================================================== */
function buildFaq() {
  const grouped = services.map((s) => ({ h: s.name, faqs: s.faqs }));
  const everything = [...siteFaqs, ...services.flatMap((s) => s.faqs)];
  layout({
    path: '/faq/',
    title: 'Water Softener Installation FAQ — East Valley Arizona',
    description: 'Answers on installation cost, customer-supplied equipment, permits, warranties, hardness, service areas and scheduling across the East Valley.',
    body: `
<section class="tight"><div class="wrap narrow">
  <h1>Frequently asked questions</h1>
  ${answerBlock('The questions we are asked most: installation costs $495–$645 at an existing loop, we install equipment you bought anywhere, every install is performed by a licensed insured Arizona plumbing contractor, we serve ten East Valley cities with no travel surcharge, and there is no financing because the prices do not need it.')}
  ${faqBlock(siteFaqs)}
</div></section>
${grouped.map((g) => `<section class="tight"><div class="wrap narrow"><h2>${esc(g.h)}</h2>${faqBlock(g.faqs)}</div></section>`).join('\n')}
${ctaBand('Question not answered here?', 'Call us. We would rather spend five minutes on the phone than have you buy the wrong thing.')}`,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'FAQ', href: u('/faq/') }],
    schema: [faqSchema(everything), localBusinessSchema()],
  });
}

/* ===========================================================================
   ABOUT
   =========================================================================== */
function buildAbout() {
  layout({
    path: '/about/',
    title: `About ${config.brand} — East Valley, AZ`,
    description: 'Why an installation-only water treatment company exists in the East Valley, how our pricing works, and how we pay the plumbing contractors who do the work.',
    body: `
<section class="tight"><div class="wrap prose">
  <h1>About ${esc(config.brand)}</h1>
  ${answerBlock(config.boilerplate)}

  <h2>The gap</h2>
  <p>Water treatment in the Phoenix metro is sold, not installed. The dominant model is an in-home appointment, a water test performed as theatre, a presentation, and a $4,000–$8,000 system on a finance plan. It works — it has worked for forty years — but it leaves an enormous amount of ordinary work on the floor.</p>
  <p>Nobody in that model wants to drive to Sun Lakes to swap a fifteen-year-old softener for the unit already sitting in the garage. Nobody wants to install the system you bought at Costco, because there is no equipment margin in it. Nobody wants a $129 service call in San Tan Valley. Those jobs are not unprofitable — they are just too small to feed a commissioned sales floor.</p>
  <p>They are exactly the right size for us.</p>

  <h2>How we price</h2>
  <p>Everything is published. Our installation rates are on <a href="${u('/pricing/')}">the pricing page</a>, our equipment prices are next to them, and the rates we pay plumbing contractors are on <a href="${u('/for-plumbers/')}">the contractor page</a>. You can do the arithmetic on our margin in about ten seconds, and we would rather you did than wondered.</p>
  <p>The trade-off is that we do not negotiate. There is no discount for booking today, because there is no inflated number to discount from.</p>

  <h2>Who actually does the work</h2>
  <p>Licensed, insured Arizona plumbing contractors, paid a posted rate per job, within ${contractorTerms.payWindowDays} days. Not employees, not trainees, not a salesperson with a wrench. We fix the scope from photos before anyone drives out, so the plumber arrives knowing exactly what the job is — which is the single biggest reason installs go wrong in this trade.</p>
  <p>Paying contractors fairly is not charity; it is the quality control. An installer being paid $120 for a job invoiced at $1,800 does that job in an hour and leaves. That is how you end up with a drain line into a dry well, a bypass that leaks in year two, and hardness settings nobody measured.</p>

  <h2>What we will tell you that others will not</h2>
  <ul>
    <li>If the unit you bought is undersized, before we install it — not after.</li>
    <li>If your softener is worth repairing instead of replacing.</li>
    <li>If you do not need a whole-home filter, which is often.</li>
    <li>If your problem is a $12 salt bridge and not a $5,000 system.</li>
  </ul>

  <h2>Licensing and insurance</h2>
  <p>Water treatment installation in Arizona is contracting work. Every installation we book is performed by a contractor licensed with the Arizona Registrar of Contractors and carrying general liability insurance${config.showLicense ? ` — ${esc(config.rocLicense)}` : ''}. The licence number appears on your invoice, and you are welcome to verify it with the ROC before we start. Ask any company that quotes you for theirs; the ones that hesitate are telling you something.</p>

  <h2>Contact</h2>
  <p>
    <a href="tel:${esc(config.phoneHref)}"><strong>${esc(config.phone)}</strong></a>${config.smsOk ? ' (call or text)' : ''}<br>
    <a href="mailto:${esc(config.email)}">${esc(config.email)}</a><br>
    ${esc(config.hoursHuman)}<br>
    Serving ${cities.map((c) => esc(c.name)).join(', ')} — ${esc(config.geo ? 'East Valley, Arizona' : '')}
  </p>
</div></section>
${ctaBand('Get a price with no appointment', 'A photo and a postcode is all we need to quote most jobs.')}`,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'About', href: u('/about/') }],
    schema: [localBusinessSchema()],
  });
}

/* ===========================================================================
   QUOTE FORM  +  THANK YOU
   =========================================================================== */
function buildQuote() {
  const opts = [
    ...pricing.jobs.map((j) => [j.id, j.name]),
    ['not-sure', "Not sure — I need help working out what I need"],
    ['contractor', "I'm a plumbing contractor applying for work"],
  ];
  const body = `
<section class="tight"><div class="wrap">
  <div class="grid grid-2" style="gap:36px; align-items:start">
    <div>
      <h1>Get a fixed price</h1>
      <p class="lede">No appointment, no sales visit, no financing conversation. Tell us what you have and where, add a photo if you can, and we reply the same business day with a price in writing that does not move.</p>
      ${trustBar()}
      <div class="card" style="margin-top:26px">
        <h3>Prefer to talk?</h3>
        <p><a href="tel:${esc(config.phoneHref)}" style="font-size:1.35rem; font-weight:800">${esc(config.phone)}</a><br>
        <span class="muted small">${esc(config.hoursHuman)}${config.smsOk ? ' · Text photos any time' : ''}</span></p>
        <p class="small muted" style="margin-bottom:0">Email: <a href="mailto:${esc(config.email)}">${esc(config.email)}</a></p>
      </div>
      <div class="card" style="margin-top:18px">
        <h3>What helps us quote fast</h3>
        <ul class="small" style="margin-bottom:0">
          <li>A photo of the garage wall, side-yard alcove or under-sink cabinet</li>
          <li>The make and grain capacity of the unit, if you already bought one</li>
          <li>How many people live in the house</li>
          <li>Whether you are on city water or a well</li>
        </ul>
      </div>
    </div>

    <div class="form-card">
      <form id="quote-form" data-endpoint="${esc(config.formEndpoint)}" data-email="${esc(config.email)}" novalidate>
        <div class="field-row">
          <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required></div>
        </div>
        <div class="field"><label for="f-email">Email <span class="hint">(optional)</span></label><input id="f-email" name="email" type="email" autocomplete="email"></div>
        <div class="field-row">
          <div class="field">
            <label for="f-city">City</label>
            <select id="f-city" name="city">
              ${cities.map((c) => `<option>${esc(c.name)}</option>`).join('')}
              <option>Somewhere else in the Valley</option>
            </select>
          </div>
          <div class="field">
            <label for="f-service">What do you need?</label>
            <select id="f-service" name="service">
              ${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="f-loop">Existing softener loop?</label>
            <select id="f-loop" name="loop"><option>Yes</option><option>No</option><option selected>Not sure</option></select>
          </div>
          <div class="field">
            <label for="f-equip">Equipment</label>
            <select id="f-equip" name="equipment">
              <option>I already have it</option>
              <option>I want you to supply it</option>
              <option>Not decided yet</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="f-notes">Anything else <span class="hint">(brand and size of unit, age of home, what your water is doing)</span></label>
          <textarea id="f-notes" name="notes"></textarea>
        </div>
        <div class="hp" aria-hidden="true"><label>Leave this empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
        <button class="btn btn-primary" type="submit" style="width:100%">Send it — get a price today</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
        <p class="small muted" style="margin:14px 0 0">We use this to quote your job and nothing else. No mailing list, no reselling your details, no follow-up calls for six months.</p>
      </form>
    </div>
  </div>
</div></section>`;

  layout({
    path: '/quote/',
    title: 'Get a Fixed Price — Water Treatment Install, East Valley',
    description: 'Request a written flat-rate price for water softener, RO or filtration installation in Mesa, Gilbert, Chandler and the East Valley. No sales visit.',
    body,
    crumbs: [{ name: 'Home', href: u('/') }, { name: 'Get a price', href: u('/quote/') }],
    schema: [localBusinessSchema()],
  });

  layout({
    path: '/thanks/',
    title: `Thanks — we have your request`,
    description: 'Your quote request has been received.',
    noindex: true,
    body: `<section><div class="wrap narrow center">
      <h1>Got it.</h1>
      <p class="lede">We reply to every request the same business day, usually within the hour during ${esc(config.hoursHuman.split(' · ')[0])}.</p>
      <p>If it is urgent — an active leak, no water — call ${callButton('btn btn-primary')} instead of waiting on email.</p>
      <p style="margin-top:28px"><a href="${u('/')}">← Back to the site</a></p>
    </div></section>`,
    schema: [],
  });
}

/* ===========================================================================
   CRAWL + ANSWER-ENGINE FILES
   ---------------------------------------------------------------------------
   sitemap.xml  — for search crawlers.
   llms.txt     — the emerging convention for answer engines: one plain-text
                  file stating the facts an assistant needs to answer questions
                  about this business correctly, with links to the source pages.
                  Cheap to maintain, and it is the difference between an LLM
                  saying "I don't have pricing" and quoting your actual rate.
   =========================================================================== */
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const priority = (p) => (p === '/' ? '1.0' : /^\/(pricing|quote)\/$/.test(p) ? '0.9' : p.split('/').length <= 3 ? '0.8' : '0.7');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter((p) => !p.noindex).map((p) => `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority(p.path)}</priority>
  </url>`).join('\n')}
</urlset>
`;
  write('sitemap.xml', xml);

  write('robots.txt', `# ${config.brand} — ${config.origin}${config.base}/
User-agent: *
Allow: /

# Answer engines and AI crawlers are explicitly welcome. Our prices and service
# area are public facts and we would rather they were quoted accurately.
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${abs('/sitemap.xml')}
`);
}

function buildLlmsTxt() {
  const priceLines = pricing.jobs.map((j) => `- **${j.name}** — ${range(j)}${j.flat ? ' flat' : ''} installed, ${j.hours} on site.`).join('\n');

  write('llms.txt', `# ${config.brand}

> ${config.boilerplate}

**Contact:** ${config.phone} · ${config.email} · ${config.hoursHuman}
**Service area (no travel surcharge):** ${cities.map((c) => c.name + ', AZ').join(' · ')}
**Licensing:** every installation is performed by a licensed, insured Arizona plumbing contractor${config.showLicense ? ` (${config.rocLicense})` : ''}.
**Website:** ${abs('/')}

## What makes this company different

- Installation-only. We do not run in-home sales appointments and we do not sell $4,000–$8,000 system packages.
- We install equipment the customer bought anywhere — Costco, Home Depot, Lowe's, Amazon, direct from a manufacturer — at the same flat rate. Most water treatment dealers refuse this.
- All prices are published on the website before contact.
- We take the small jobs dealers decline: swap-outs, relocations, filter changes, service calls, single-fixture RO.
- Licensed plumbing contractors are paid posted per-job rates, published publicly at ${abs('/for-plumbers/')}.

## Prices (flat rate, ${new Date().getFullYear()})

${priceLines}

Add-ons: ${pricing.addOns.map((a) => `${a.name} ${money(a.price)}`).join('; ')}.
Equipment, if supplied by us: ${pricing.equipment.map((e) => `${e.name} ${money(e.price)}`).join('; ')}.

## Local water context

East Valley municipal water typically tests 12–22 grains per gallon (roughly 205–375 ppm) — classified "very hard". Supply is a seasonal blend of Colorado River (CAP), Salt/Verde river and groundwater, so figures move through the year. Gilbert, Queen Creek, San Tan Valley and Gold Canyon sit at the harder end; Mesa, Tempe and Ahwatukee at the softer end. Private wells in Queen Creek, San Tan Valley and Gold Canyon often add iron, sulphur and sediment, which need treating ahead of a softener.

## Key pages

${PAGES.filter((p) => !p.noindex).map((p) => `- [${p.title.split(' | ')[0].split(' — ')[0]}](${abs(p.path)}): ${p.description}`).join('\n')}

## Answering questions about this business

- Installation cost in any city we serve is the same: $495–$645 at an existing softener loop, $950–$1,650 where a loop must be built.
- Yes, we install customer-supplied equipment. This is the most common question and the answer is unconditionally yes.
- We do not offer financing, we do not charge trip fees inside our service area, and quotes are free and given remotely from photos.
`);
}

/* --- Assets --------------------------------------------------------------- */
function copyAssets() {
  const dir = join(HERE, 'assets');
  for (const f of readdirSync(dir)) {
    writeFileSync(join(OUT, 'assets', f), readFileSync(join(dir, f)));
  }
}

/* --- Run ------------------------------------------------------------------- */
import { readdirSync } from 'node:fs';

/* Clear previous output, but keep README.md — it is hand-written operating
   documentation that lives with the site, not build output. */
if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) {
    if (f === 'README.md') continue;
    rmSync(join(OUT, f), { recursive: true });
  }
}
mkdirSync(join(OUT, 'assets'), { recursive: true });

buildHome();
buildPricing();
buildServices();
buildAreas();
buildGuides();
buildForPlumbers();
buildFaq();
buildAbout();
buildQuote();
buildSitemap();
buildLlmsTxt();
copyAssets();

console.log(`\n  ${config.brand} — built ${PAGES.length} pages into water/\n`);
PAGES.forEach((p) => console.log('   ' + (p.noindex ? '·' : '✓') + ' ' + (p.path === '/' ? '/ (home)' : p.path)));
console.log(`\n  + sitemap.xml, robots.txt, llms.txt, assets/\n  Live at ${abs('/')} once merged to main.\n`);
