#!/usr/bin/env node
// Build Joshua's professional references sheet as PDF + Word.
//
//   node build_references.js <references.json> <out-dir>
//
// references.json: { "links": [{label, url}], "references": [{name, title, relationship, phone, email?}] }
// Styled to match the resume header so the two read as a set. The references
// file holds other people's phone numbers: keep it out of any public repository.

const fs = require('fs');
const path = require('path');
const D = require('docx');
const { chromium } = require('playwright-core');

const [inFile, outDir] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(inFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const BASE = path.join(outDir, 'Joshua_Chappell_References');
const BLUE = '1A4D8F';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function chromeBin() {
  for (const p of [process.env.CHROME_BIN, '/opt/pw-browsers/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'])
    if (p && fs.existsSync(p)) return p;
  throw new Error('no Chrome/Chromium found; set CHROME_BIN');
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Joshua Chappell References</title><style>
  @page { size: letter; margin: 0.75in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: 13.5px; line-height: 1.5; color: #1a1a1a; }
  header { text-align: center; margin-bottom: 26px; }
  h1 { font-size: 20px; letter-spacing: 1px; margin-bottom: 4px; }
  .contact { font-size: 13px; color: #333; line-height: 1.6; }
  a { color: #1a4d8f; text-decoration: none; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.8px; color: #1a4d8f;
       border-bottom: 1.5px solid #1a4d8f; padding-bottom: 3px; margin-bottom: 18px; }
  .ref { margin-bottom: 22px; }
  .name { font-weight: bold; font-size: 15px; }
  .title { color: #333; }
  .rel { color: #555; }
</style></head><body>
<header><h1>JOSHUA CHAPPELL</h1>
<div class="contact">Mesa, AZ &bull; 480-586-7959 &bull; <a href="mailto:jchappellmedia@gmail.com">jchappellmedia@gmail.com</a><br>
${(data.links || []).map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' &bull; ')}</div></header>
<h2>Professional References</h2>
${data.references.map(r => `<div class="ref"><div class="name">${esc(r.name)}</div>
<div class="title">${esc(r.title)}</div>
<div class="rel">${esc(r.relationship)}</div>
<div>Phone: ${esc(r.phone)}${r.email ? ` &bull; <a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : ''}</div></div>`).join('\n')}
</body></html>`;

function docx() {
  const body = { font: 'Calibri', size: 23, color: '1A1A1A' };
  const link = (label, url) => new D.ExternalHyperlink({ link: url, children: [new D.TextRun({ text: label, ...body, size: 21, color: BLUE })] });
  const linkRuns = [];
  (data.links || []).forEach((l, i) => { if (i) linkRuns.push(new D.TextRun({ text: ' • ', ...body, size: 21, color: '333333' })); linkRuns.push(link(l.label, l.url)); });
  const kids = [
    new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 40 }, children: [new D.TextRun({ text: 'JOSHUA CHAPPELL', bold: true, font: 'Calibri', size: 32, characterSpacing: 20 })] }),
    new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.TextRun({ text: 'Mesa, AZ • 480-586-7959 • ', ...body, size: 21, color: '333333' }), link('jchappellmedia@gmail.com', 'mailto:jchappellmedia@gmail.com')] }),
    new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { after: 360 }, children: linkRuns }),
    new D.Paragraph({ spacing: { after: 280 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: BLUE, space: 1 } },
      children: [new D.TextRun({ text: 'PROFESSIONAL REFERENCES', bold: true, color: BLUE, font: 'Calibri', size: 26, characterSpacing: 12 })] }),
  ];
  data.references.forEach(r => {
    kids.push(new D.Paragraph({ children: [new D.TextRun({ text: r.name, bold: true, ...body, size: 26 })] }));
    kids.push(new D.Paragraph({ children: [new D.TextRun({ text: r.title, ...body, color: '333333' })] }));
    kids.push(new D.Paragraph({ children: [new D.TextRun({ text: r.relationship, ...body, color: '555555' })] }));
    const phone = [new D.TextRun({ text: `Phone: ${r.phone}`, ...body })];
    if (r.email) { phone.push(new D.TextRun({ text: ' • ', ...body })); phone.push(link(r.email, `mailto:${r.email}`)); }
    kids.push(new D.Paragraph({ spacing: { after: 320 }, children: phone }));
  });
  return new D.Document({ creator: 'Joshua Chappell', lastModifiedBy: 'Joshua Chappell', title: 'Joshua Chappell References',
    styles: { default: { document: { run: { font: 'Calibri', size: 23 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: kids }] });
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromeBin(), args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: BASE + '.pdf', format: 'Letter', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  fs.writeFileSync(BASE + '.docx', await D.Packer.toBuffer(docx()));
  console.log(JSON.stringify({ pdf: BASE + '.pdf', docx: BASE + '.docx' }));
})().catch(e => { console.error(e); process.exit(1); });
