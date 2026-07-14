/**
 * Converts SYSTEM_DOCUMENTATION.md → SYSTEM_DOCUMENTATION.pdf
 * Uses puppeteer-core with the system's Microsoft Edge (no download required).
 * Run: node generate-pdf.js
 */

const puppeteer = require('puppeteer-core');
const { marked }  = require('marked');
const fs          = require('fs');
const path        = require('path');

const EDGE_PATH   = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const INPUT_FILE  = path.join(__dirname, 'SYSTEM_DOCUMENTATION.md');
const OUTPUT_FILE = path.join(__dirname, 'SYSTEM_DOCUMENTATION.pdf');

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a1a2e;
    background: #fff;
    padding: 0;
  }

  /* ── Cover page ── */
  .cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    page-break-after: always;
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
    color: white;
    padding: 3rem;
  }
  .cover-logo {
    width: 90px; height: 90px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    border: 3px solid rgba(255,255,255,0.3);
  }
  .cover h1 {
    font-size: 28pt; font-weight: 800;
    margin-bottom: 0.5rem; color: #fff;
    border: none; padding: 0;
  }
  .cover-sub  { font-size: 14pt; opacity: 0.85; margin-bottom: 2.5rem; }
  .cover-divider { width: 60px; height: 3px; background: rgba(255,255,255,0.5); margin: 1.5rem auto; border-radius: 2px; }
  .cover-meta { font-size: 10pt; opacity: 0.75; line-height: 2; }
  .cover-badge {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.4rem 1.25rem;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-radius: 20px;
    font-size: 9pt; font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── Content wrapper ── */
  .content { padding: 2.5cm 2.8cm; }

  /* ── Headings ── */
  h1 {
    font-size: 20pt; font-weight: 800; color: #1e3a5f;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 0.5rem;
    margin: 2.5rem 0 1.2rem;
    page-break-after: avoid;
  }
  h1:first-of-type { margin-top: 0; }

  h2 {
    font-size: 14pt; font-weight: 700; color: #1e3a5f;
    margin: 2rem 0 0.75rem;
    padding-left: 0.75rem;
    border-left: 4px solid #2563eb;
    page-break-after: avoid;
  }

  h3 {
    font-size: 11pt; font-weight: 700; color: #374151;
    margin: 1.5rem 0 0.5rem;
    page-break-after: avoid;
  }

  h4 {
    font-size: 10.5pt; font-weight: 600; color: #6b7280;
    margin: 1rem 0 0.4rem;
    text-transform: uppercase; letter-spacing: 0.06em;
    page-break-after: avoid;
  }

  /* ── Paragraphs ── */
  p { margin-bottom: 0.75rem; }

  /* ── Links ── */
  a { color: #2563eb; text-decoration: none; }

  /* ── Code / pre ── */
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }

  pre {
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.6;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    margin: 0.75rem 0 1rem;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    page-break-inside: avoid;
  }
  pre code { background: none; color: inherit; padding: 0; font-size: inherit; }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.25rem;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  thead tr { background: #1e3a5f; color: #fff; }
  thead th {
    padding: 0.55rem 0.75rem;
    text-align: left;
    font-weight: 600;
    font-size: 9pt;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:nth-child(odd)  { background: #fff; }
  td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    color: #374151;
    vertical-align: top;
  }

  /* ── Lists ── */
  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  li { margin-bottom: 0.3rem; }
  li > ul, li > ol { margin-top: 0.2rem; margin-bottom: 0.2rem; }

  /* ── Horizontal rule ── */
  hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2rem 0;
  }

  /* ── Blockquote (used for info boxes) ── */
  blockquote {
    border-left: 4px solid #2563eb;
    background: #eff6ff;
    padding: 0.75rem 1rem;
    margin: 0.75rem 0;
    border-radius: 0 6px 6px 0;
    color: #1e40af;
    font-size: 10pt;
  }

  /* ── Strong / em ── */
  strong { font-weight: 700; color: #111827; }

  /* ── Page numbers ── */
  @page {
    margin: 0;
    size: A4;
  }

  @media print {
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    pre { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

async function generate() {
  console.log('Reading SYSTEM_DOCUMENTATION.md…');
  const markdown = fs.readFileSync(INPUT_FILE, 'utf8');

  console.log('Converting markdown to HTML…');
  const bodyHtml = marked(markdown);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Crawford University Staff Appraisal Management System — Documentation</title>
  <style>${CSS}</style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover">
    <div class="cover-logo">🎓</div>
    <h1>Crawford University</h1>
    <div class="cover-sub">Staff Appraisal Management System</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      Full System Documentation<br/>
      Final Year Project — Department of Computer Science<br/>
      Academic Session 2025/2026
    </div>
    <div class="cover-badge">System Documentation</div>
  </div>

  <!-- Document Content -->
  <div class="content">
    ${bodyHtml}
  </div>

</body>
</html>`;

  console.log('Launching Microsoft Edge…');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Generating PDF…');
  await page.pdf({
    path: OUTPUT_FILE,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8pt; font-family:'Segoe UI',sans-serif; color:#9ca3af; width:100%; padding:0.4cm 2.8cm; display:flex; justify-content:space-between; align-items:center;">
      <span>Crawford University Staff Appraisal Management System</span>
    </div>`,
    footerTemplate: `<div style="font-size:8pt; font-family:'Segoe UI',sans-serif; color:#9ca3af; width:100%; padding:0.3cm 2.8cm; display:flex; justify-content:space-between; align-items:center;">
      <span>Final Year Project — 2025/2026</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
  });

  await browser.close();

  const size = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`\n✓ PDF generated successfully!`);
  console.log(`  File : ${OUTPUT_FILE}`);
  console.log(`  Size : ${size} KB`);
}

generate().catch(err => {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
});
