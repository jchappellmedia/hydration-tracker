#!/usr/bin/env node
// Build one job's application documents as PDF + Word from a single content file.
//
//   node build_docs.js <job.json> <out-dir> [--only resume|cover|reference]
//
// job.json carries the words; this script owns the layout. Every document is
// produced twice from the same content, so the PDF and the .docx never disagree:
//
//   Joshua_Chappell_Resume_<Co>.pdf / .docx          (fitted to exactly one page)
//   Joshua_Chappell_CoverLetter_<Co>.pdf / .docx     (one page)
//   Job Description & Company Research - <Co>.pdf / .docx
//   Apply Here - <Co>.webloc                          (macOS link file)
//
// Resume fit: spacing is searched until the page is full but still one page.
// If the content cannot fit even at the tightest spacing, the run fails with
// "OVERFLOW" (cut a bullet); if it leaves a large gap at the loosest spacing it
// reports "UNDERFILL" (add a bullet). Both are reported in the JSON summary.
//
// Needs: node modules `docx` and `playwright-core` (NODE_PATH), a Chromium or
// Chrome binary (CHROME_BIN, else common paths), and optionally LibreOffice
// (`soffice`) to verify the Word files' page counts.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const D = require('docx');
const { chromium } = require('playwright-core');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('usage: build_docs.js <job.json> <out-dir> [--only resume|cover|reference]');
  process.exit(1);
}
const job = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const OUT = path.resolve(args[1]);
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
fs.mkdirSync(OUT, { recursive: true });

const CO = job.company_file || job.company.replace(/[^A-Za-z0-9]+/g, '');
const NAMES = {
  resume: `Joshua_Chappell_Resume_${CO}`,
  cover: `Joshua_Chappell_CoverLetter_${CO}`,
  reference: `Job Description & Company Research - ${job.company.replace(/[\/:]/g, '-')}`,
  webloc: `Apply Here - ${job.company.replace(/[\/:]/g, '-')}.webloc`,
};

function chromeBin() {
  const c = [process.env.CHROME_BIN, '/opt/pw-browsers/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
  for (const p of c) if (p && fs.existsSync(p)) return p;
  throw new Error('no Chrome/Chromium found; set CHROME_BIN');
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Inline markup allowed in content strings: **bold**, [label](url). Nothing else.
function inlineHtml(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, l, u) => `<a href="${u.replace(/&amp;/g, '&amp;')}">${l}</a>`)
    .replace(/\n/g, '<br>');
}
function inlineRuns(s, base = {}) {
  if (String(s).includes('\n')) {
    return String(s).split('\n').flatMap((part, i) => {
      const runs = inlineRuns(part, base);
      if (i) runs.unshift(new D.TextRun({ text: '', break: 1, ...base }));
      return runs;
    });
  }
  const out = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push(new D.TextRun({ text: s.slice(i, m.index), ...base }));
    if (m[1]) out.push(new D.TextRun({ text: m[1], bold: true, ...base }));
    else out.push(new D.ExternalHyperlink({ link: m[3], children: [new D.TextRun({ text: m[2], style: 'Hyperlink', ...base })] }));
    i = re.lastIndex;
  }
  if (i < s.length) out.push(new D.TextRun({ text: s.slice(i), ...base }));
  return out;
}

// ---------------------------------------------------------------- RESUME ---

const R = job.resume;
const lerp = (a, b, t) => +(a + (b - a) * t).toFixed(2);
// t = 0 is the tightest layout, t = 1 the loosest.
function resumeVars(t) {
  return {
    font: lerp(12.2, 13.4, t), lh: lerp(1.42, 1.6, t), job: lerp(7, 15, t), li: lerp(2, 5.4, t),
    h2t: lerp(9, 16, t), h2b: lerp(5, 10, t), sum: lerp(6, 12, t), hdr: lerp(8, 14, t), edu: lerp(3, 7, t),
  };
}

function resumeHtml(v) {
  const contact2 = (R.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' &nbsp;&bull;&nbsp; ');
  const jobs = R.jobs.map(j => `
  <div class="job">
    <div class="job-head"><span><span class="job-company">${esc(j.company)}</span>, ${esc(j.title)}</span>
      <span class="job-meta">${esc(j.location)} &nbsp;|&nbsp; ${esc(j.dates)}</span></div>
    <ul>${j.bullets.map(b => `<li>${inlineHtml(b)}</li>`).join('')}</ul>
  </div>`).join('');
  const edu = (R.education || []).map(e =>
    `<div class="edu-line"><strong>${esc(e.school)}</strong>, ${esc(e.degree)} <span>| ${esc(e.date)}</span></div>`).join('');
  const certs = (R.certifications || []).length
    ? `<div class="edu-line"><span>${R.certifications.map(esc).join(' &bull; ')}</span></div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Resume</title><style>
  @page { size: letter; margin: 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: ${v.font}px; line-height: ${v.lh};
         color: #1a1a1a; width: 7.5in; margin: 0 auto; }
  header { text-align: center; margin-bottom: ${v.hdr}px; }
  h1 { font-size: ${lerp(16, 18, (v.font - 12.2) / 1.2)}px; letter-spacing: 1px; margin-bottom: 3px; }
  .contact { font-size: ${(v.font - 0.4).toFixed(2)}px; color: #333; line-height: 1.6; }
  .contact a { color: #1a4d8f; text-decoration: none; }
  .summary { margin: ${v.sum}px 0 ${v.sum}px; text-align: justify; }
  h2 { font-size: ${(v.font + 0.8).toFixed(2)}px; text-transform: uppercase; letter-spacing: 0.8px;
       border-bottom: 1.5px solid #1a4d8f; color: #1a4d8f; padding-bottom: 2px; margin: ${v.h2t}px 0 ${v.h2b}px; }
  section:first-of-type h2 { margin-top: 0; }
  .job { margin-bottom: ${v.job}px; }
  .job:last-child { margin-bottom: 0; }
  .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .job-company { font-weight: bold; }
  .job-meta { font-size: ${(v.font - 1).toFixed(2)}px; color: #555; white-space: nowrap; }
  ul { list-style: none; margin: 3px 0 0; }
  li { position: relative; padding-left: 14px; margin-bottom: ${v.li}px; }
  li:last-child { margin-bottom: 0; }
  li::before { content: "\\25AA"; position: absolute; left: 0; color: #1a4d8f; font-size: 9px; top: 2px; }
  .skills p { line-height: ${(v.lh + 0.06).toFixed(2)}; }
  .edu-line { margin-bottom: ${v.edu}px; }
  .edu-line span { color: #555; }
  a { color: #1a4d8f; }
</style></head><body>
<header>
  <h1>JOSHUA CHAPPELL</h1>
  <div class="contact">Mesa, AZ &nbsp;&bull;&nbsp; 480-586-7959 &nbsp;&bull;&nbsp;
    <a href="mailto:${esc(R.email || 'jchappellmedia@gmail.com')}">${esc(R.email || 'jchappellmedia@gmail.com')}</a>${contact2 ? '<br>' + contact2 : ''}</div>
</header>
<p class="summary">${inlineHtml(R.summary)}</p>
<section><h2>Experience</h2>${jobs}</section>
${(R.extra_sections || []).map(x => `<section><h2>${esc(x.heading)}</h2>${(x.lines || []).map(l => `<div class="edu-line">${inlineHtml(l)}</div>`).join('')}</section>`).join('')}
<section class="skills"><h2>Skills</h2><p>${(Array.isArray(R.skills) ? R.skills : [R.skills]).map(esc).join(' &bull; ')}</p></section>
<section><h2>${esc(R.education_heading || 'Education & Certifications')}</h2>${edu}${certs}</section>
</body></html>`;
}

const PAGE_H = 10 * 96; // letter, 0.5in top/bottom margins, CSS px

async function fitResume(page) {
  const measure = async t => {
    await page.setContent(resumeHtml(resumeVars(t)), { waitUntil: 'load' });
    return page.evaluate(() => document.body.getBoundingClientRect().height);
  };
  const SAFE = PAGE_H - 6;
  if (await measure(0) > SAFE) return { status: 'OVERFLOW', t: 0 };
  const TMAX = 1.4; // past 1.0 the type grows a little, which keeps short resumes from looking thin
  let lo = 0, hi = TMAX;
  if (await measure(TMAX) <= SAFE) {
    const h = await measure(TMAX);
    return { status: h < PAGE_H * 0.9 ? 'UNDERFILL' : 'OK', t: TMAX, fill: +(h / PAGE_H).toFixed(3) };
  }
  for (let k = 0; k < 14; k++) {
    const mid = (lo + hi) / 2;
    if (await measure(mid) <= SAFE) lo = mid; else hi = mid;
  }
  return { status: 'OK', t: lo, fill: +((await measure(lo)) / PAGE_H).toFixed(3) };
}

// Word version of the resume. The same t drives point sizes and spacing.
function resumeDocx(t) {
  const sz = lerp(9.8, 11, t);                   // body pt
  const half = n => Math.round(n * 2);           // docx sizes are half-points
  const tw = n => Math.round(n * 20);            // twips from pt
  const BLUE = '1A4D8F';
  const body = { font: 'Calibri', size: half(sz), color: '1A1A1A' };
  const line = Math.round(240 * lerp(1.0, 1.16, t));
  const H = text => new D.Paragraph({
    spacing: { before: tw(lerp(6, 11, t)), after: tw(lerp(3, 6, t)) },
    border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: BLUE, space: 1 } },
    children: [new D.TextRun({ text: text.toUpperCase(), bold: true, color: BLUE, font: 'Calibri', size: half(sz + 0.7), characterSpacing: 12 })],
  });
  const kids = [];
  kids.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 20 },
    children: [new D.TextRun({ text: 'JOSHUA CHAPPELL', bold: true, font: 'Calibri', size: half(sz + 3), characterSpacing: 20 })] }));
  const email = R.email || 'jchappellmedia@gmail.com';
  kids.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 0 }, children: [
    new D.TextRun({ text: 'Mesa, AZ  •  480-586-7959  •  ', ...body, color: '333333' }),
    new D.ExternalHyperlink({ link: `mailto:${email}`, children: [new D.TextRun({ text: email, ...body, color: BLUE })] }),
  ] }));
  if ((R.links || []).length) {
    const runs = [];
    R.links.forEach((l, i) => {
      if (i) runs.push(new D.TextRun({ text: '  •  ', ...body, color: '333333' }));
      runs.push(new D.ExternalHyperlink({ link: l.url, children: [new D.TextRun({ text: l.label, ...body, color: BLUE })] }));
    });
    kids.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: runs }));
  }
  kids.push(new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { before: tw(lerp(5, 9, t)), after: tw(lerp(2, 5, t)), line },
    children: inlineRuns(R.summary, body) }));
  kids.push(H('Experience'));
  R.jobs.forEach((j, ji) => {
    kids.push(new D.Paragraph({
      spacing: { before: ji ? tw(lerp(4, 9, t)) : 0, after: tw(1) },
      tabStops: [{ type: D.TabStopType.RIGHT, position: 10800 }],
      children: [
        new D.TextRun({ text: j.company, bold: true, ...body }),
        new D.TextRun({ text: `, ${j.title}`, ...body }),
        new D.TextRun({ text: `\t${j.location}  |  ${j.dates}`, ...body, size: half(sz - 0.7), color: '555555' }),
      ] }));
    j.bullets.forEach(b => kids.push(new D.Paragraph({
      numbering: { reference: 'sq', level: 0 }, spacing: { after: tw(lerp(0.5, 3, t)), line },
      indent: { left: 280, hanging: 280 }, tabStops: [{ type: D.TabStopType.LEFT, position: 280 }],
      children: inlineRuns(b, body) })));
  });
  (R.extra_sections || []).forEach(x => {
    kids.push(H(x.heading));
    (x.lines || []).forEach(l => kids.push(new D.Paragraph({ spacing: { after: tw(lerp(1, 3, t)) }, children: inlineRuns(l, body) })));
  });
  kids.push(H('Skills'));
  kids.push(new D.Paragraph({ spacing: { line: Math.round(line * 1.05) },
    children: [new D.TextRun({ text: (Array.isArray(R.skills) ? R.skills : [R.skills]).join('  •  '), ...body })] }));
  kids.push(H(R.education_heading || 'Education & Certifications'));
  (R.education || []).forEach(e => kids.push(new D.Paragraph({ spacing: { after: tw(lerp(1, 3, t)) }, children: [
    new D.TextRun({ text: e.school, bold: true, ...body }),
    new D.TextRun({ text: `, ${e.degree} `, ...body }),
    new D.TextRun({ text: `| ${e.date}`, ...body, color: '555555' }),
  ] })));
  if ((R.certifications || []).length) kids.push(new D.Paragraph({ children: [
    new D.TextRun({ text: R.certifications.join('  •  '), ...body, color: '555555' })] }));

  return new D.Document({
    creator: 'Joshua Chappell', title: `Resume - ${job.company}`,
    styles: { default: { document: { run: { font: 'Calibri', size: half(sz) } } } },
    numbering: { config: [{ reference: 'sq', levels: [{ level: 0, format: D.LevelFormat.BULLET, text: '▪',
      alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 280, hanging: 280 } }, run: { color: BLUE, size: 16 } } }] }] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: kids }],
  });
}

// ----------------------------------------------------------- COVER LETTER ---

const C = job.cover_letter;
function coverHtml() {
  const links = (C.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' &nbsp;&bull;&nbsp; ');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Cover Letter</title><style>
  @page { size: letter; margin: 0.75in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: 13px; line-height: 1.58; color: #1a1a1a; width: 7in; margin: 0 auto; }
  .head { margin-bottom: 22px; }
  .name { font-size: 17px; font-weight: bold; letter-spacing: 0.5px; }
  .contact { font-size: 11.5px; color: #444; margin-top: 2px; }
  .contact a { color: #1a4d8f; text-decoration: none; }
  p { margin-bottom: 13px; }
  a { color: #1a4d8f; }
  .sign { margin-top: 8px; }
</style></head><body>
<div class="head"><div class="name">Joshua Chappell</div>
<div class="contact">Mesa, AZ &nbsp;&bull;&nbsp; 480-586-7959 &nbsp;&bull;&nbsp;
<a href="mailto:${esc(C.email || 'jchappellmedia@gmail.com')}">${esc(C.email || 'jchappellmedia@gmail.com')}</a>${links ? ' &nbsp;&bull;&nbsp; ' + links : ''}</div></div>
<p>${esc(C.greeting)}</p>
${C.paragraphs.map(p => `<p>${inlineHtml(p)}</p>`).join('\n')}
<p class="sign">${C.closing === '' ? '' : esc(C.closing || 'Sincerely,') + '<br>'}Joshua Chappell</p>
</body></html>`;
}
function coverDocx() {
  const body = { font: 'Calibri', size: 22, color: '1A1A1A' };
  const BLUE = '1A4D8F';
  const email = C.email || 'jchappellmedia@gmail.com';
  const contact = [new D.TextRun({ text: 'Mesa, AZ  •  480-586-7959  •  ', font: 'Calibri', size: 19, color: '444444' }),
    new D.ExternalHyperlink({ link: `mailto:${email}`, children: [new D.TextRun({ text: email, font: 'Calibri', size: 19, color: BLUE })] })];
  (C.links || []).forEach(l => {
    contact.push(new D.TextRun({ text: '  •  ', font: 'Calibri', size: 19, color: '444444' }));
    contact.push(new D.ExternalHyperlink({ link: l.url, children: [new D.TextRun({ text: l.label, font: 'Calibri', size: 19, color: BLUE })] }));
  });
  const P = (children, after = 220) => new D.Paragraph({ spacing: { after, line: 276 }, children });
  const kids = [
    new D.Paragraph({ children: [new D.TextRun({ text: 'Joshua Chappell', bold: true, font: 'Calibri', size: 30 })] }),
    new D.Paragraph({ spacing: { after: 400 }, children: contact }),
    P([new D.TextRun({ text: C.greeting, ...body })]),
    ...C.paragraphs.map(p => P(inlineRuns(p, body))),
    P(C.closing === '' ? [new D.TextRun({ text: 'Joshua Chappell', ...body })]
      : [new D.TextRun({ text: C.closing || 'Sincerely,', ...body }), new D.TextRun({ text: 'Joshua Chappell', ...body, break: 1 })]),
  ];
  return new D.Document({ creator: 'Joshua Chappell', title: `Cover Letter - ${job.company}`,
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: kids }] });
}

// --------------------------------------------------------- REFERENCE SHEET ---
// job.reference = { apply_url, facts: [[label, value]...], why: [..], gaps: [..],
//   jd_text: "<verbatim posting text, markdown allowed>", jd_source: "...",
//   research: { overview, glassdoor:{found,rating,review_count,url,summary}, indeed:{...},
//               reddit:{found,threads:[{title,url,subreddit,gist}]}, pros:[{point,sources:[url]}],
//               cons:[...], red_flags:[..], bottom_line, sources:[{label,url}] } }

const F = job.reference;
// Minimal markdown for the verbatim posting: headings, bullets, bold, links, paragraphs.
function mdBlocks(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const blocks = []; let para = [];
  const flush = () => { if (para.length) { blocks.push({ k: 'p', t: para.join(' ') }); para = []; } };
  for (const raw of lines) {
    const l = raw.trimEnd().replace(/^\s*>\s?/, '');
    if (!l.trim()) { flush(); continue; }
    let m;
    if ((m = l.match(/^\s*#{1,6}\s+(.*)$/))) { flush(); blocks.push({ k: 'h', t: m[1] }); }
    else if ((m = l.match(/^\s*(?:[-*•▪●]|\d+[.)])\s+(.*)$/))) { flush(); blocks.push({ k: 'li', t: m[1] }); }
    else para.push(l.trim());
  }
  flush();
  return blocks;
}
const src = arr => (arr || []).map((u, i) => `<a href="${esc(u)}">[${i + 1}]</a>`).join(' ');

function referenceHtml() {
  const r = F.research || {};
  const facts = (F.facts || []).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${inlineHtml(v)}</td></tr>`).join('');
  const jd = mdBlocks(F.jd_text).map(b => b.k === 'h' ? `<h4>${inlineHtml(b.t)}</h4>` :
    b.k === 'li' ? `<li>${inlineHtml(b.t)}</li>` : `<p>${inlineHtml(b.t)}</p>`).join('\n')
    .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '$1</ul>').replace(/(?<!<\/li>\s*)<li>/g, '<ul><li>');
  const g = r.glassdoor || {}, ind = r.indeed || {}, rd = r.reddit || {};
  const pc = (items, cls) => (items || []).map(x => `<li>${inlineHtml(x.point)} <span class="src">${src(x.sources)}</span></li>`).join('') || '<li>Nothing reliable found.</li>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Reference</title><style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: 12.5px; line-height: 1.5; color: #1a1a1a; margin: 0; }
  h1 { font-size: 21px; margin: 0 0 2px; } .sub { color: #555; margin: 0 0 12px; font-size: 13px; }
  .apply { display: block; background: #1a4d8f; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 6px;
           font-weight: bold; font-size: 14px; margin: 8px 0 4px; } .apply span { font-weight: normal; font-size: 11px; word-break: break-all; display:block; opacity:.9 }
  h2 { font-size: 15px; color: #1a4d8f; border-bottom: 1.5px solid #1a4d8f; padding-bottom: 2px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: .6px; }
  h3 { font-size: 13.5px; margin: 12px 0 4px; } h4 { font-size: 13px; margin: 10px 0 3px; }
  table { border-collapse: collapse; width: 100%; } th, td { text-align: left; vertical-align: top; padding: 3px 8px 3px 0; border-bottom: 1px solid #e3e3e3; }
  th { width: 26%; color: #555; font-weight: 600; }
  ul { margin: 3px 0 6px; padding-left: 20px; } li { margin-bottom: 3px; } p { margin: 0 0 7px; }
  .jd { border-left: 3px solid #c9d6e8; padding-left: 12px; }
  .note { color: #555; font-size: 11.5px; } .src { font-size: 10.5px; } a { color: #1a4d8f; }
  .cols > div { margin-bottom: 4px; } .cols li { break-inside: avoid; }
  .pros h3 { color: #1d6b35; } .cons h3 { color: #9a2a1d; }
</style></head><body>
<h1>${esc(job.company)}</h1><p class="sub">${esc(job.role)}</p>
${F.apply_url ? `<a class="apply" href="${esc(F.apply_url)}">Apply for this job &rarr;<span>${esc(F.apply_url)}</span></a>`
  : `<div class="apply" style="background:#777">No apply link was saved for this job<span>${esc(F.apply_missing_note || 'See "How to apply" below.')}</span></div>`}
<h2>At a glance</h2><table>${facts}</table>
${(F.why || []).length ? `<h3>${esc(F.why_heading || "Why it made today's top five")}</h3><ul>${F.why.map(x => `<li>${inlineHtml(x)}</li>`).join('')}</ul>` : ''}
${(F.gaps || []).length ? `<h3>Gaps to be ready for</h3>${F.gaps_note ? `<p class="note">${inlineHtml(F.gaps_note)}</p>` : ''}<ul>${F.gaps.map(x => `<li>${inlineHtml(x)}</li>`).join('')}</ul>` : ''}
<h2>Job description (word for word)</h2>
<p class="note">${inlineHtml(F.jd_source || '')}</p>
<div class="jd">${jd}</div>
<h2>Company research</h2>
${r.overview ? `<p>${inlineHtml(r.overview)}</p>` : ''}
<h3>Glassdoor</h3><p>${g.found ? `${g.rating ? `<strong>${esc(g.rating)}</strong>` : ''}${g.review_count ? ` (${esc(g.review_count)})` : ''} ${inlineHtml(g.summary || '')} ${g.url ? `<a href="${esc(g.url)}">Source</a>` : ''}` : inlineHtml(g.summary || 'No Glassdoor page found for this employer.')}</p>
<h3>Indeed reviews</h3><p>${ind.found ? `${ind.rating ? `<strong>${esc(ind.rating)}</strong> ` : ''}${inlineHtml(ind.summary || '')} ${ind.url ? `<a href="${esc(ind.url)}">Source</a>` : ''}` : inlineHtml(ind.summary || 'No Indeed company reviews found.')}</p>
<h3>Reddit</h3>${rd.found && (rd.threads || []).length ? `<ul>${rd.threads.map(x => `<li><a href="${esc(x.url)}">${esc(x.title)}</a>${x.subreddit ? ` (${esc(x.subreddit)})` : ''}: ${inlineHtml(x.gist)}</li>`).join('')}</ul>` : `<p>${inlineHtml(rd.summary || 'No relevant Reddit discussion found.')}</p>`}
<h2>What employees say: pros and cons</h2>
<div class="cols"><div class="pros"><h3>Pros</h3><ul>${pc(r.pros)}</ul></div><div class="cons"><h3>Cons</h3><ul>${pc(r.cons)}</ul></div></div>
${(r.red_flags || []).length ? `<h3>Watch for</h3><ul>${r.red_flags.map(x => `<li>${inlineHtml(x)}</li>`).join('')}</ul>` : ''}
${r.bottom_line ? `<h3>Bottom line</h3><p>${inlineHtml(r.bottom_line)}</p>` : ''}
<h2>Sources</h2><ol>${(r.sources || []).map(s => `<li><a href="${esc(s.url)}">${esc(s.label)}</a><br><span class="note">${esc(s.url)}</span></li>`).join('')}</ol>
</body></html>`;
}

function referenceDocx() {
  const r = F.research || {};
  const BLUE = '1A4D8F';
  const body = { font: 'Calibri', size: 21, color: '1A1A1A' };
  const H2 = t => new D.Paragraph({ spacing: { before: 300, after: 120 },
    border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: BLUE, space: 1 } },
    children: [new D.TextRun({ text: t.toUpperCase(), bold: true, color: BLUE, font: 'Calibri', size: 26 })] });
  const H3 = (t, color) => new D.Paragraph({ spacing: { before: 180, after: 60 },
    children: [new D.TextRun({ text: t, bold: true, font: 'Calibri', size: 23, color: color || '1A1A1A' })] });
  const P = (s, extra = {}) => new D.Paragraph({ spacing: { after: 100, line: 264 }, children: inlineRuns(s, { ...body, ...extra }) });
  const LI = (children, ref = 'dot') => new D.Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 50, line: 259 }, children });
  const cite = urls => (urls || []).flatMap((u, i) => [new D.TextRun({ text: ' ', ...body }),
    new D.ExternalHyperlink({ link: u, children: [new D.TextRun({ text: `[${i + 1}]`, ...body, size: 17, color: BLUE })] })]);
  const link = (label, url, extra = {}) => new D.ExternalHyperlink({ link: url, children: [new D.TextRun({ text: label, ...body, color: BLUE, underline: {}, ...extra })] });
  const k = [];
  k.push(new D.Paragraph({ children: [new D.TextRun({ text: job.company, bold: true, font: 'Calibri', size: 38 })] }));
  k.push(new D.Paragraph({ spacing: { after: 200 }, children: [new D.TextRun({ text: job.role, font: 'Calibri', size: 25, color: '555555' })] }));
  if (F.apply_url) {
    k.push(new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, color: 'auto', fill: 'E8EFF8' }, spacing: { after: 60 },
      children: [new D.TextRun({ text: 'APPLY:  ', bold: true, ...body, color: BLUE }), link('Apply for this job', F.apply_url, { bold: true })] }));
    k.push(new D.Paragraph({ spacing: { after: 120 }, children: [new D.TextRun({ text: F.apply_url, ...body, size: 17, color: '555555' })] }));
  } else {
    k.push(new D.Paragraph({ shading: { type: D.ShadingType.CLEAR, color: 'auto', fill: 'EEEEEE' }, spacing: { after: 120 },
      children: [new D.TextRun({ text: 'No apply link was saved for this job. ', bold: true, ...body }), new D.TextRun({ text: F.apply_missing_note || 'See "How to apply" below.', ...body })] }));
  }
  k.push(H2('At a glance'));
  const W1 = 2700, W2 = 7380;
  k.push(new D.Table({ width: { size: W1 + W2, type: D.WidthType.DXA }, columnWidths: [W1, W2],
    rows: (F.facts || []).map(([a, b]) => new D.TableRow({ children: [
      new D.TableCell({ width: { size: W1, type: D.WidthType.DXA }, borders: { top: { style: D.BorderStyle.NONE }, left: { style: D.BorderStyle.NONE }, right: { style: D.BorderStyle.NONE }, bottom: { style: D.BorderStyle.SINGLE, size: 2, color: 'E3E3E3' } },
        children: [new D.Paragraph({ children: [new D.TextRun({ text: a, ...body, bold: true, color: '555555' })] })] }),
      new D.TableCell({ width: { size: W2, type: D.WidthType.DXA }, borders: { top: { style: D.BorderStyle.NONE }, left: { style: D.BorderStyle.NONE }, right: { style: D.BorderStyle.NONE }, bottom: { style: D.BorderStyle.SINGLE, size: 2, color: 'E3E3E3' } },
        children: [new D.Paragraph({ children: inlineRuns(String(b), body) })] }),
    ] })) }));
  if ((F.why || []).length) { k.push(H3(F.why_heading || "Why it made today's top five")); F.why.forEach(x => k.push(LI(inlineRuns(x, body)))); }
  if ((F.gaps || []).length) { k.push(H3('Gaps to be ready for')); if (F.gaps_note) k.push(P(F.gaps_note, { size: 18, color: '555555', italics: true })); F.gaps.forEach(x => k.push(LI(inlineRuns(x, body)))); }
  k.push(H2('Job description (word for word)'));
  if (F.jd_source) k.push(P(F.jd_source, { size: 18, color: '555555' }));
  mdBlocks(F.jd_text).forEach(b => {
    if (b.k === 'h') k.push(H3(b.t.replace(/\*\*/g, '')));
    else if (b.k === 'li') k.push(LI(inlineRuns(b.t, body)));
    else k.push(P(b.t));
  });
  k.push(H2('Company research'));
  if (r.overview) k.push(P(r.overview));
  const g = r.glassdoor || {}, ind = r.indeed || {}, rd = r.reddit || {};
  k.push(H3('Glassdoor'));
  k.push(new D.Paragraph({ spacing: { after: 100 }, children: [
    ...(g.found && g.rating ? [new D.TextRun({ text: `${g.rating}${g.review_count ? ` (${g.review_count})` : ''}  `, ...body, bold: true })] : []),
    ...inlineRuns(g.summary || (g.found ? '' : 'No Glassdoor page found for this employer.'), body),
    ...(g.url ? [new D.TextRun({ text: ' ', ...body }), link('Source', g.url)] : [])] }));
  k.push(H3('Indeed reviews'));
  k.push(new D.Paragraph({ spacing: { after: 100 }, children: [
    ...(ind.found && ind.rating ? [new D.TextRun({ text: `${ind.rating}  `, ...body, bold: true })] : []),
    ...inlineRuns(ind.summary || (ind.found ? '' : 'No Indeed company reviews found.'), body),
    ...(ind.url ? [new D.TextRun({ text: ' ', ...body }), link('Source', ind.url)] : [])] }));
  k.push(H3('Reddit'));
  if (rd.found && (rd.threads || []).length) rd.threads.forEach(x => k.push(LI([link(x.title, x.url),
    new D.TextRun({ text: `${x.subreddit ? ` (${x.subreddit})` : ''}: `, ...body }), ...inlineRuns(x.gist || '', body)])));
  else k.push(P(rd.summary || 'No relevant Reddit discussion found.'));
  k.push(H2('What employees say: pros and cons'));
  k.push(H3('Pros', '1D6B35'));
  ((r.pros || []).length ? r.pros : [{ point: 'Nothing reliable found.' }]).forEach(x => k.push(LI([...inlineRuns(x.point, body), ...cite(x.sources)])));
  k.push(H3('Cons', '9A2A1D'));
  ((r.cons || []).length ? r.cons : [{ point: 'Nothing reliable found.' }]).forEach(x => k.push(LI([...inlineRuns(x.point, body), ...cite(x.sources)])));
  if ((r.red_flags || []).length) { k.push(H3('Watch for')); r.red_flags.forEach(x => k.push(LI(inlineRuns(x, body)))); }
  if (r.bottom_line) { k.push(H3('Bottom line')); k.push(P(r.bottom_line)); }
  k.push(H2('Sources'));
  (r.sources || []).forEach(s => k.push(LI([link(s.label, s.url), new D.TextRun({ text: '  ' + s.url, ...body, size: 17, color: '777777' })], 'num')));
  return new D.Document({ creator: 'Joshua Chappell', title: `${job.company} - reference sheet`,
    styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
    numbering: { config: [
      { reference: 'dot', levels: [{ level: 0, format: D.LevelFormat.BULLET, text: '•', alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: '%1.', alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] },
    ] },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 },
      margin: { top: 864, bottom: 864, left: 864, right: 864 } } }, children: k }] });
}

// ------------------------------------------------------------------ OUTPUT ---

function pdfPages(file) {
  const d = fs.readFileSync(file);
  return (d.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
}
function sofficePages(docxFile) {
  const bin = ['soffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'].find(b => {
    try { execFileSync(b === 'soffice' ? 'which' : 'test', b === 'soffice' ? ['soffice'] : ['-x', b], { stdio: 'ignore' }); return true; } catch { return false; }
  });
  if (!bin) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jh-'));
  try {
    execFileSync(bin, [`-env:UserInstallation=file://${tmp}/profile`, '--headless', '--convert-to', 'pdf', '--outdir', tmp, docxFile], { stdio: 'ignore', timeout: 120000 });
    const pdf = fs.readdirSync(tmp).find(f => f.endsWith('.pdf'));
    return pdf ? pdfPages(path.join(tmp, pdf)) : null;
  } catch { return null; } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

(async () => {
  const report = { company: job.company, out: OUT, files: [] };
  const browser = await chromium.launch({ executablePath: chromeBin(), args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
  const pdf = async (html, file, margin) => {
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: file, format: 'Letter', printBackground: true, preferCSSPageSize: true });
    report.files.push({ file: path.basename(file), pages: pdfPages(file) });
    return pdfPages(file);
  };
  const save = async (doc, file) => {
    fs.writeFileSync(file, await D.Packer.toBuffer(doc));
    const pages = sofficePages(file);
    report.files.push({ file: path.basename(file), pages });
    return pages;
  };
  try {
    if ((!ONLY || ONLY === 'resume') && job.resume) {
      const fit = await fitResume(page);
      report.resume_fit = fit;
      fs.writeFileSync(path.join(OUT, 'resume.html'), resumeHtml(resumeVars(fit.t)));
      const p = await pdf(resumeHtml(resumeVars(fit.t)), path.join(OUT, NAMES.resume + '.pdf'));
      await page.setContent(resumeHtml(resumeVars(fit.t)));
      await page.screenshot({ path: path.join(OUT, 'resume_preview.png'), fullPage: false });
      if (p !== 1) report.resume_fit.status = 'OVERFLOW';
      // Word: binary-search the largest spacing that LibreOffice still lays out on one page.
      // Carlito (metric-compatible with Calibri) stands in for Calibri, so Word matches.
      const docxFile = path.join(OUT, NAMES.resume + '.docx');
      const tryT = async t => { fs.writeFileSync(docxFile, await D.Packer.toBuffer(resumeDocx(t))); return sofficePages(docxFile); };
      let tw = 0, wp = await tryT(1.8);
      if (wp === null) { tw = Math.max(0, fit.t - 0.1); wp = await tryT(tw); }
      else if (wp <= 1) tw = 1.8;
      else {
        let lo = 0, hi = 1.8;
        if ((await tryT(0)) > 1) { report.resume_fit.status = 'OVERFLOW'; hi = 0; }
        for (let k = 0; k < 6 && hi > 0; k++) { const mid = (lo + hi) / 2; if ((await tryT(mid)) <= 1) lo = mid; else hi = mid; }
        tw = Math.max(0, lo - 0.03); wp = await tryT(tw);
      }
      report.files.push({ file: path.basename(docxFile), pages: wp });
      report.resume_docx_t = tw; report.resume_docx_pages = wp;
    }
    if ((!ONLY || ONLY === 'cover') && job.cover_letter) {
      fs.writeFileSync(path.join(OUT, 'cover-letter.html'), coverHtml());
      report.cover_pages = await pdf(coverHtml(), path.join(OUT, NAMES.cover + '.pdf'));
      report.cover_docx_pages = await save(coverDocx(), path.join(OUT, NAMES.cover + '.docx'));
    }
    if ((!ONLY || ONLY === 'reference') && job.reference) {
      fs.writeFileSync(path.join(OUT, 'reference.html'), referenceHtml());
      report.reference_pages = await pdf(referenceHtml(), path.join(OUT, NAMES.reference + '.pdf'));
      report.reference_docx_pages = await save(referenceDocx(), path.join(OUT, NAMES.reference + '.docx'));
      const u = esc(F.apply_url);
      if (F.apply_url) fs.writeFileSync(path.join(OUT, NAMES.webloc),
        `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${u}</string>\n</dict>\n</plist>\n`);
      if (F.apply_url) report.files.push({ file: NAMES.webloc });
    }
  } finally { await browser.close(); }
  console.log(JSON.stringify(report, null, 2));
  const bad = (report.resume_fit && report.resume_fit.status === 'OVERFLOW') || (report.cover_pages && report.cover_pages > 1);
  process.exit(bad ? 2 : 0);
})().catch(e => { console.error(e.stack || e); process.exit(1); });
