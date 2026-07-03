require('dotenv').config();
const { supabase } = require('./src/config/supabase');

// ── Minimal but valid PDF generator ──────────────────────────────────────────
function buildPDF(pages) {
  const pageStreams = pages.map(lines => lines.join('\n'));
  const objBodies = [];

  objBodies.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageCount = pages.length;
  const pageRefs = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(' ');
  objBodies.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`);

  for (let i = 0; i < pageCount; i++) {
    const streamText = pageStreams[i];
    const streamLen = Buffer.byteLength(streamText, 'latin1');
    const contentObjNum = 3 + i * 2 + 1;
    objBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n` +
      `   /Contents ${contentObjNum} 0 R\n` +
      `   /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R /F2 ${4 + pageCount * 2} 0 R >> >> >>`
    );
    objBodies.push(`<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream`);
  }
  objBodies.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objBodies.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  let body = '';
  const offsets = [];
  for (let i = 0; i < objBodies.length; i++) {
    offsets.push(Buffer.byteLength(header, 'latin1') + Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${objBodies[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(header, 'latin1') + Buffer.byteLength(body, 'latin1');
  const total = objBodies.length + 1;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(header + body + xref, 'latin1');
}

async function main() {
  const STAFF_ID = '1a9a63b9-fd07-4c05-a0a0-9efa9e5976c4';

  // ── 1. Fix authorship_position + points_scored on all existing 7 ──────────
  console.log('Fixing authorship and points for existing 7 publications...');
  const { error: fixErr } = await supabase.from('publications')
    .update({
      authorship_position: 'sole',
      available_score: 3,
      points_scored: 3.0,
      status: 'active',
    })
    .eq('staff_id', STAFF_ID)
    .eq('publication_type', 'journal_article');
  console.log('Fix authorship/points:', fixErr ? fixErr.message : 'OK (all 7 journal articles → 3.0 pts each)');

  // ── 2. Add the 8th publication — a refereed book ──────────────────────────
  const bookPDF = buildPDF([
    [
      'BT /F1 16 Tf 56 730 Td',
      '(Performance Management in Nigerian Higher Education:) Tj',
      '0 -20 Td (Frameworks, Appraisal Systems, and Academic Excellence) Tj',
      '0 -16 Td /F2 10 Tf',
      '(Funmilayo A. Okonkwo, Ph.D) Tj',
      '0 -13 Td (Department of Computer Science, Crawford University, Igbesa, Ogun State, Nigeria) Tj',
      '0 -13 Td (Published by CrawfordPrint Academic Publishers, Igbesa  |  ISBN: 978-978-789-234-5) Tj',
      '0 -24 Td /F1 12 Tf (Foreword) Tj',
      '0 -15 Td /F2 10 Tf',
      '(This book addresses the growing need for structured, technology-driven academic) Tj',
      '0 -13 Td (performance appraisal systems in Nigerian universities. Grounded in 15 years) Tj',
      '0 -13 Td (of institutional experience at Crawford University and supported by a survey) Tj',
      '0 -13 Td (of 26 federal and state universities, it provides practical frameworks for) Tj',
      '0 -13 Td (HODs, Deans, and Registrars to implement fair, transparent, and digitally) Tj',
      '0 -13 Td (integrated appraisal processes.) Tj',
      '0 -22 Td /F1 12 Tf (Chapter 1: The State of Academic Appraisal in Nigeria) Tj',
      '0 -15 Td /F2 10 Tf',
      '(1.1 Historical Overview of Staff Evaluation in Nigerian Universities) Tj',
      '0 -13 Td (1.2 Challenges: Inconsistency, Bias, and Paper-Based Workflows) Tj',
      '0 -13 Td (1.3 Global Best Practices: UK, USA, South Africa Comparisons) Tj',
      '0 -22 Td /F1 12 Tf (Chapter 2: Designing an Academic Promotion Framework) Tj',
      '0 -15 Td /F2 10 Tf',
      '(2.1 Criteria for Promotion: Teaching, Research, and Service) Tj',
      '0 -13 Td (2.2 Publication Scoring Systems: Sole vs. Co-authorship Weightings) Tj',
      '0 -13 Td (2.3 Postgraduate Supervision and Research Grants as Promotion Indicators) Tj',
      '0 -22 Td /F1 12 Tf (Chapter 3: Digital Appraisal Systems) Tj',
      '0 -15 Td /F2 10 Tf',
      '(3.1 Case Study: Crawford University Integrated Appraisal System \\(CUIAS\\)) Tj',
      '0 -13 Td (3.2 Role-Based Access Control in Multi-Level Appraisal Workflows) Tj',
      '0 -13 Td (3.3 College Board and A&PC Integration in Promotion Pipelines) Tj',
      '0 -22 Td /F1 12 Tf (Chapter 4: Faculty Development and Continuous Improvement) Tj',
      '0 -15 Td /F2 10 Tf',
      '(4.1 Linking Appraisal Outcomes to CPD Programmes) Tj',
      '0 -13 Td (4.2 Feedback Loops and Staff Validation Rights) Tj',
      '0 -13 Td (4.3 Monitoring and Evaluation Dashboards for University Management) Tj',
      '0 -22 Td /F1 12 Tf (Chapter 5: A Model Framework for Nigerian Universities) Tj',
      '0 -15 Td /F2 10 Tf',
      '(5.1 The CRAFT Model: Criteria, Roles, Accountability, Fairness, Technology) Tj',
      '0 -13 Td (5.2 Implementation Roadmap: Short, Medium, and Long-Term Steps) Tj',
      '0 -13 Td (5.3 Policy Recommendations to the National Universities Commission \\(NUC\\)) Tj',
      '0 -26 Td /F2 9 Tf',
      '(CrawfordPrint Academic Publishers | ISBN 978-978-789-234-5 | 2018 | 247 pages) Tj',
      'ET',
    ],
  ]);

  const bookPath = `publications/${STAFF_ID}/performance-management-nigerian-universities-2018.pdf`;
  process.stdout.write('Uploading book PDF... ');
  const { error: upErr } = await supabase.storage.from('publications')
    .upload(bookPath, bookPDF, { contentType: 'application/pdf', upsert: true });
  if (upErr) { console.log('UPLOAD ERROR:', upErr.message); return; }
  const { data: urlData } = supabase.storage.from('publications').getPublicUrl(bookPath);
  console.log('OK');

  const { error: insErr } = await supabase.from('publications').insert({
    staff_id: STAFF_ID,
    title: 'Performance Management in Nigerian Higher Education: Frameworks, Appraisal Systems, and Academic Excellence',
    publication_type: 'refereed_book',
    journal_name: null,
    publisher: 'CrawfordPrint Academic Publishers',
    year_of_publication: 2018,
    authorship_position: 'sole',
    is_international: false,
    isbn_issn: '978-978-789-234-5',
    doi: null,
    file_url: urlData.publicUrl,
    file_name: 'performance-management-nigerian-universities-2018.pdf',
    file_size: bookPDF.length,
    available_score: 4,
    points_scored: 4.0,
    status: 'active',
  });
  console.log('Insert book record:', insErr ? insErr.message : 'OK (4.0 pts — Refereed Book)');

  // ── 3. Confirm final state ────────────────────────────────────────────────
  const { data: pubs } = await supabase.from('publications')
    .select('title, publication_type, year_of_publication, authorship_position, points_scored, file_url')
    .eq('staff_id', STAFF_ID)
    .order('year_of_publication', { ascending: false });

  console.log('\nFinal publications list:');
  pubs.forEach(p => {
    const score = (p.points_scored || 0).toFixed(1);
    const hasFile = p.file_url ? 'VIEW' : 'no file';
    console.log(`  ${p.year_of_publication}  ${p.publication_type.padEnd(22)}  ${score} pts  ${hasFile}  ${p.title.slice(0, 50)}`);
  });
  const total = pubs.reduce((s, p) => s + (p.points_scored || 0), 0);
  console.log(`\nTotal: ${pubs.length} publications | ${total.toFixed(1)} points`);
}

main().catch(console.error);
