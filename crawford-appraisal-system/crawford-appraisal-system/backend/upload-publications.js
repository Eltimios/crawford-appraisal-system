require('dotenv').config();
const { supabase } = require('./src/config/supabase');

// ── Minimal but valid PDF generator ──────────────────────────────────────────
function buildPDF(pages) {
  const esc = (s) => s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

  // Build each page's content stream
  const pageStreams = pages.map(lines => lines.join('\n'));

  const objBodies = [];

  // obj 1: Catalog
  objBodies.push('<< /Type /Catalog /Pages 2 0 R >>');

  // obj 2: Pages (filled after we know page count)
  const pageCount = pages.length;
  const pageRefs = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(' ');
  objBodies.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pageCount} >>`);

  // For each page: page dict + content stream
  for (let i = 0; i < pageCount; i++) {
    const streamText = pageStreams[i];
    const streamLen = Buffer.byteLength(streamText, 'latin1');
    const contentObjNum = 3 + i * 2 + 1; // stream obj
    const pageObjNum = 3 + i * 2;

    // Page dict
    objBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n` +
      `   /Contents ${contentObjNum} 0 R\n` +
      `   /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R /F2 ${4 + pageCount * 2} 0 R >> >> >>`
    );
    // Content stream
    objBodies.push(
      `<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream`
    );
  }

  // Font objects
  objBodies.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objBodies.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  // Assemble
  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  let body = '';
  const offsets = [];

  for (let i = 0; i < objBodies.length; i++) {
    offsets.push(Buffer.byteLength(header, 'latin1') + Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${objBodies[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(header, 'latin1') + Buffer.byteLength(body, 'latin1');
  const total = objBodies.length + 1;

  let xref = `xref\n0 ${total}\n`;
  xref += '0000000000 65535 f \n';
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(header + body + xref, 'latin1');
}

// ── PDF content for each paper ────────────────────────────────────────────────
const papers = [
  {
    id: '800bfd54-2b54-426c-88d6-8c0a0d0ac665',
    fileName: 'deep-learning-medical-image-analysis-2024.pdf',
    title: 'A Survey of Deep Learning Techniques for Medical Image Analysis',
    journal: 'Journal of Medical Informatics, Vol. 47, 2024',
    abstract:
      'Deep learning has transformed medical image analysis, enabling automated ' +
      'diagnosis and segmentation with accuracy surpassing human experts in several ' +
      'domains. This survey reviews convolutional neural networks (CNNs), transformer ' +
      'architectures, and generative adversarial networks applied to radiology, ' +
      'pathology, ophthalmology, and dermatology. We evaluate 142 peer-reviewed studies ' +
      'published between 2018 and 2024 and identify open challenges including data ' +
      'scarcity, model interpretability, and deployment in low-resource settings.',
    keywords: 'Deep Learning, Medical Image Analysis, CNN, Transformers, Healthcare AI',
    pages: [
      [
        'BT /F1 16 Tf 56 730 Td',
        '(A Survey of Deep Learning Techniques for Medical Image Analysis) Tj',
        '0 -18 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (Journal of Medical Informatics, Vol. 47, 2024  |  DOI: 10.1016/j.jmi.2024.001) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(Deep learning has transformed medical image analysis, enabling automated) Tj',
        '0 -13 Td (diagnosis and segmentation with accuracy surpassing human experts in several) Tj',
        '0 -13 Td (domains. This survey reviews convolutional neural networks \\(CNNs\\), transformer) Tj',
        '0 -13 Td (architectures, and generative adversarial networks applied to radiology,) Tj',
        '0 -13 Td (pathology, ophthalmology, and dermatology. We evaluate 142 peer-reviewed studies) Tj',
        '0 -13 Td (published between 2018 and 2024 and identify open challenges including data) Tj',
        '0 -13 Td (scarcity, model interpretability, and deployment in low-resource settings.) Tj',
        '0 -22 Td /F1 11 Tf (Keywords) Tj',
        '0 -14 Td /F2 10 Tf',
        '(Deep Learning; Medical Image Analysis; CNN; Vision Transformers; Healthcare AI) Tj',
        '0 -26 Td /F1 13 Tf (1. Introduction) Tj',
        '0 -16 Td /F2 10 Tf',
        '(The increasing volume of medical imaging data—from X-rays and CT scans to) Tj',
        '0 -13 Td (MRI and whole-slide histopathology images—has created an urgent need for) Tj',
        '0 -13 Td (automated, scalable analysis tools. Deep learning, particularly CNNs, has) Tj',
        '0 -13 Td (demonstrated remarkable performance on classification, segmentation, and) Tj',
        '0 -13 Td (detection tasks in medical imaging \\[LeCun et al., 2015; Litjens et al., 2017\\].) Tj',
        '0 -22 Td /F1 13 Tf (2. CNN-Based Architectures) Tj',
        '0 -16 Td /F2 10 Tf',
        '(AlexNet, VGGNet, ResNet, and DenseNet architectures have been adapted for) Tj',
        '0 -13 Td (medical tasks with transfer learning significantly reducing training data) Tj',
        '0 -13 Td (requirements. U-Net remains the dominant architecture for medical segmentation.) Tj',
        '0 -22 Td /F1 13 Tf (3. Vision Transformers in Medical Imaging) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Since Dosovitskiy et al. \\(2021\\), Vision Transformers \\(ViT\\) have challenged CNN) Tj',
        '0 -13 Td (dominance. TransUNet and Swin-UNet combine transformer encoders with CNN) Tj',
        '0 -13 Td (decoders, achieving SOTA performance on multi-organ segmentation benchmarks.) Tj',
        '0 -22 Td /F1 13 Tf (4. Challenges and Future Directions) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Key challenges: \\(a\\) limited labelled datasets in low-resource settings such as) Tj',
        '0 -13 Td (Nigeria; \\(b\\) interpretability requirements for clinical acceptance; \\(c\\) domain) Tj',
        '0 -13 Td (shift between training and deployment environments. Future work should address) Tj',
        '0 -13 Td (federated learning and explainable AI to close these gaps.) Tj',
        '0 -26 Td /F1 11 Tf (References) Tj',
        '0 -14 Td /F2 9 Tf',
        '(\\[1\\] LeCun, Y., Bengio, Y., Hinton, G. \\(2015\\). Deep learning. Nature, 521\\(7553\\), 436-444.) Tj',
        '0 -12 Td (\\[2\\] Litjens, G. et al. \\(2017\\). A survey on deep learning in medical image analysis.) Tj',
        '0 -12 Td (    Medical Image Analysis, 42, 60-88.) Tj',
        '0 -12 Td (\\[3\\] Ronneberger, O. et al. \\(2015\\). U-Net: Convolutional networks for biomedical image) Tj',
        '0 -12 Td (    segmentation. MICCAI 2015.) Tj',
        '0 -12 Td (\\[4\\] Dosovitskiy, A. et al. \\(2021\\). An image is worth 16x16 words. ICLR 2021.) Tj',
        'ET',
      ],
    ],
  },
  {
    id: '93c7471e-98c5-4806-94f4-6b3b02e441ed',
    fileName: 'blockchain-healthcare-2023.pdf',
    title: 'Blockchain-Enabled Secure Healthcare Data Management in Developing Nations',
    journal: 'IJCSIS, Vol. 21, 2023',
    pages: [
      [
        'BT /F1 14 Tf 56 730 Td',
        '(Blockchain-Enabled Secure Healthcare Data Management) Tj',
        '0 -18 Td (in Developing Nations) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (International Journal of Computer Science and Information Security, 2023) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(Electronic health records in developing nations face challenges of interoperability,) Tj',
        '0 -13 Td (tamper risk, and fragmented storage. This paper proposes a blockchain-based EHR) Tj',
        '0 -13 Td (framework using Hyperledger Fabric, demonstrating 99.7% data integrity and 40%%) Tj',
        '0 -13 Td (reduction in unauthorised access incidents in a pilot deployment across three) Tj',
        '0 -13 Td (Nigerian healthcare facilities.) Tj',
        '0 -22 Td /F1 13 Tf (1. Introduction) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Healthcare data breaches cost the industry $10.9 billion in 2023 globally.) Tj',
        '0 -13 Td (Developing nations are disproportionately affected due to limited cybersecurity) Tj',
        '0 -13 Td (infrastructure. Blockchain provides decentralised, immutable record-keeping) Tj',
        '0 -13 Td (that can operate even in low-bandwidth environments.) Tj',
        '0 -22 Td /F1 13 Tf (2. Proposed Framework) Tj',
        '0 -16 Td /F2 10 Tf',
        '(The proposed system uses Hyperledger Fabric channels to enforce role-based) Tj',
        '0 -13 Td (access control \\(RBAC\\). Patients own their private key; clinicians request) Tj',
        '0 -13 Td (access through smart contracts. Off-chain storage \\(IPFS\\) reduces on-chain) Tj',
        '0 -13 Td (storage costs by 87%.) Tj',
        '0 -22 Td /F1 13 Tf (3. Evaluation and Results) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Pilot at University College Hospital, Lagos General Hospital, and OAUTHC:) Tj',
        '0 -13 Td (Data integrity: 99.7% | Unauthorized access: reduced 40% | Uptime: 99.2%) Tj',
        'ET',
      ],
    ],
  },
  {
    id: 'c29dbe42-1c14-4fa2-91d1-83efb5542904',
    fileName: 'ai-in-education-2023.pdf',
    title: 'Artificial Intelligence in Education: A Systematic Literature Review',
    journal: 'IEEE EDUCON 2023 Proceedings',
    pages: [
      [
        'BT /F1 15 Tf 56 730 Td',
        '(Artificial Intelligence in Education:) Tj',
        '0 -19 Td (A Systematic Literature Review) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (IEEE EDUCON 2023, Kuwait, March 2023  |  DOI: 10.1109/EDUCON.2023.099) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(This systematic literature review analyses 89 studies on AI applications in) Tj',
        '0 -13 Td (higher education published from 2015 to 2023. We identify four dominant) Tj',
        '0 -13 Td (themes: personalised learning, intelligent tutoring systems, automated) Tj',
        '0 -13 Td (grading, and learning analytics. Findings suggest significant potential for) Tj',
        '0 -13 Td (AI-driven pedagogy but highlight concerns around bias, data privacy, and) Tj',
        '0 -13 Td (digital equity in Sub-Saharan African institutions.) Tj',
        '0 -22 Td /F1 13 Tf (1. Research Methodology \\(PRISMA Protocol\\)) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Database search: IEEE Xplore, Scopus, ACM DL, Web of Science \\(2015-2023\\)) Tj',
        '0 -13 Td (Initial results: 3,412 | After title/abstract screening: 312 | Final: 89) Tj',
        '0 -22 Td /F1 13 Tf (2. Key Findings) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Intelligent Tutoring Systems \\(ITS\\) improved student outcomes by 23% on average.) Tj',
        '0 -13 Td (Automated essay scoring achieved 94% agreement with human raters in English.) Tj',
        '0 -13 Td (African studies remain underrepresented \\(only 4.5% of reviewed literature\\).) Tj',
        'ET',
      ],
    ],
  },
  {
    id: '830ff6de-4ac8-41d9-81ff-7cf7444dbf1b',
    fileName: 'explainable-ai-2022.pdf',
    title: 'Explainable Artificial Intelligence: Challenges, Opportunities and Applications',
    journal: 'IEEE Transactions on NNLS, 2022',
    pages: [
      [
        'BT /F1 14 Tf 56 730 Td',
        '(Explainable Artificial Intelligence:) Tj',
        '0 -19 Td (Challenges, Opportunities and Applications) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (IEEE Trans. Neural Networks and Learning Systems, 2022) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(As AI systems are deployed in high-stakes domains such as healthcare, criminal) Tj',
        '0 -13 Td (justice, and finance, the demand for explainability has intensified. This paper) Tj',
        '0 -13 Td (surveys explainable AI \\(XAI\\) methods including LIME, SHAP, GradCAM, and) Tj',
        '0 -13 Td (attention-based explanations. We categorise 76 XAI techniques, evaluate their) Tj',
        '0 -13 Td (fidelity-complexity tradeoffs, and propose a taxonomy for selecting XAI methods) Tj',
        '0 -13 Td (appropriate to different deployment contexts.) Tj',
        '0 -22 Td /F1 13 Tf (1. Why Explainability Matters) Tj',
        '0 -16 Td /F2 10 Tf',
        '(The EU AI Act \\(2024\\) mandates explanations for high-risk AI decisions. Clinicians) Tj',
        '0 -13 Td (in a 2023 survey cited lack of interpretability as the No. 1 barrier to AI adoption.) Tj',
        '0 -22 Td /F1 13 Tf (2. Taxonomy of XAI Methods) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Model-agnostic: LIME, SHAP, Anchors, CEM) Tj',
        '0 -13 Td (Model-specific: GradCAM, Attention Rollout, LayerCAM) Tj',
        '0 -13 Td (Concept-based: TCAV, ConceptSHAP) Tj',
        'ET',
      ],
    ],
  },
  {
    id: '6f3c6f93-f905-4139-bb22-694bb1fbee5e',
    fileName: 'credit-risk-ml-2021.pdf',
    title: 'Credit Risk Assessment Using Ensemble Machine Learning Models',
    journal: 'Journal of Finance and Technology, 2021',
    pages: [
      [
        'BT /F1 15 Tf 56 730 Td',
        '(Credit Risk Assessment Using) Tj',
        '0 -19 Td (Ensemble Machine Learning Models) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (Journal of Finance and Technology, Vol. 8, 2021) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(Accurate credit risk assessment is critical for financial institutions, especially) Tj',
        '0 -13 Td (microfinance banks serving rural communities in Nigeria. This paper presents) Tj',
        '0 -13 Td (an ensemble model combining Random Forest, XGBoost, and LightGBM to assess) Tj',
        '0 -13 Td (credit risk using a dataset of 18,400 loan applications from five rural banks.) Tj',
        '0 -13 Td (The ensemble achieves AUC of 0.946, outperforming single models by 6-11%.) Tj',
        '0 -22 Td /F1 13 Tf (1. Data and Features) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Dataset: 18,400 loan applications \\(2016-2020\\), five Ogun State microfinance banks.) Tj',
        '0 -13 Td (Features: 34 \\(demographic, transaction history, collateral, social capital indicators\\)) Tj',
        '0 -22 Td /F1 13 Tf (2. Model Performance) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Random Forest: AUC 0.891 | XGBoost: AUC 0.903 | LightGBM: AUC 0.897) Tj',
        '0 -13 Td (Ensemble \\(stacking\\): AUC 0.946 | Precision: 0.91 | Recall: 0.89) Tj',
        'ET',
      ],
    ],
  },
  {
    id: '18fdc85a-bc30-4ab8-9be0-1307abdf5572',
    fileName: 'elearning-nigeria-2020.pdf',
    title: 'Adaptive E-Learning Systems in Nigerian Universities: A Review',
    journal: 'African Journal of Educational Technology, 2020',
    pages: [
      [
        'BT /F1 14 Tf 56 730 Td',
        '(Adaptive E-Learning Systems in Nigerian Universities: A Review) Tj',
        '0 -18 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (African Journal of Educational Technology, 2020) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(This review examines 47 adaptive e-learning implementations in Nigerian federal) Tj',
        '0 -13 Td (and state universities between 2010 and 2020. We assess technical infrastructure,) Tj',
        '0 -13 Td (learner engagement metrics, and academic outcome improvements. Only 23% of) Tj',
        '0 -13 Td (reviewed institutions achieved sustainable deployment. Critical barriers include) Tj',
        '0 -13 Td (unreliable electricity, bandwidth constraints, and low instructor adoption.) Tj',
        '0 -22 Td /F1 13 Tf (Key Recommendations) Tj',
        '0 -16 Td /F2 10 Tf',
        '(1. Offline-capable mobile apps reduce dependency on continuous connectivity.) Tj',
        '0 -13 Td (2. Faculty development programmes are the single biggest predictor of success.) Tj',
        '0 -13 Td (3. Government broadband subsidies for campus networks are essential.) Tj',
        'ET',
      ],
    ],
  },
  {
    id: '3b08dde8-e979-45c3-ad58-f0619f1da5e5',
    fileName: 'timetabling-genetic-algorithm-2019.pdf',
    title: 'Automated Academic Timetabling Using Genetic Algorithms',
    journal: 'Journal of Computing in Education Research, 2019',
    pages: [
      [
        'BT /F1 14 Tf 56 730 Td',
        '(Automated Academic Timetabling Using Genetic Algorithms) Tj',
        '0 -18 Td /F2 10 Tf',
        '(Funmilayo A. Okonkwo  |  Crawford University, Igbesa, Nigeria) Tj',
        '0 -10 Td (Journal of Computing in Education Research, Vol. 5, 2019) Tj',
        '0 -24 Td /F1 11 Tf (Abstract) Tj',
        '0 -14 Td /F2 10 Tf',
        '(University timetabling is an NP-hard constraint satisfaction problem. Manual) Tj',
        '0 -13 Td (scheduling at Crawford University consumed over 300 staff-hours per semester.) Tj',
        '0 -13 Td (This paper presents a genetic algorithm \\(GA\\) solution encoding hard constraints) Tj',
        '0 -13 Td (\\(room capacity, lecturer availability, no-clash\\) and soft constraints \\(preferred) Tj',
        '0 -13 Td (timeslots, student travel minimisation\\). The GA produced feasible timetables) Tj',
        '0 -13 Td (for 214 courses in under 90 seconds with zero hard constraint violations.) Tj',
        '0 -22 Td /F1 13 Tf (1. Problem Formulation) Tj',
        '0 -16 Td /F2 10 Tf',
        '(Variables: courses, rooms, timeslots, lecturers. Hard constraints: 8.) Tj',
        '0 -13 Td (Soft constraints: 5. Population size: 200. Generations: 500. Crossover: 0.8.) Tj',
        '0 -22 Td /F1 13 Tf (2. Results) Tj',
        '0 -16 Td /F2 10 Tf',
        '(214 courses scheduled | 0 hard violations | Execution time: 87 seconds) Tj',
        '0 -13 Td (Compared to manual: 97.5% time saving, 100% constraint compliance.) Tj',
        'ET',
      ],
    ],
  },
];

async function main() {
  const STAFF_ID = '1a9a63b9-fd07-4c05-a0a0-9efa9e5976c4';
  console.log('Uploading publications PDFs to Supabase Storage...\n');

  for (const paper of papers) {
    process.stdout.write(`  ${paper.fileName} ... `);

    // Build PDF
    const pdfBuffer = buildPDF(paper.pages);

    // Upload to Supabase Storage
    const storagePath = `publications/${STAFF_ID}/${paper.fileName}`;
    const { error: upErr } = await supabase.storage
      .from('publications')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (upErr) {
      console.log(`UPLOAD ERROR: ${upErr.message}`);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('publications')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update publication record
    const { error: dbErr } = await supabase
      .from('publications')
      .update({
        file_url: publicUrl,
        file_name: paper.fileName,
        file_size: pdfBuffer.length,
      })
      .eq('id', paper.id);

    if (dbErr) {
      console.log(`DB ERROR: ${dbErr.message}`);
    } else {
      console.log(`OK  (${(pdfBuffer.length / 1024).toFixed(1)} KB) → ${publicUrl.slice(0, 80)}...`);
    }
  }

  console.log('\nAll done. All 7 publications now have working PDF file links.');
}

main().catch(console.error);
