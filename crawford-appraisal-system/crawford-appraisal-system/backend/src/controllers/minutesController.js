const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const { db } = require('../config/db');
const { savePrivateFile, getPrivateFilePath } = require('../config/storage');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, HeadingLevel, ShadingType,
} = require('docx');

const VALID_MEETING_TYPES = ['college_board', 'apc', 'council'];

const VALID_DECISIONS = {
  college_board: ['RECOMMENDED FOR APPROVAL', 'NOT RECOMMENDED', 'DEFERRED'],
  apc: [
    'RECOMMENDED FOR PROMOTION + INCREMENT',
    'RECOMMENDED FOR PROMOTION',
    'RECOMMENDED FOR INCREMENT',
    'NOT ELIGIBLE',
    'DEFERRED',
  ],
  council: ['APPROVED', 'REJECTED', 'DEFERRED'],
};

// Map minutes decision text → DB value for A&PC
const APC_DECISION_MAP = {
  'RECOMMENDED FOR PROMOTION': 'promoted',
  'RECOMMENDED FOR INCREMENT': 'increment',
  'RECOMMENDED FOR PROMOTION + INCREMENT': 'both',
  'DEFERRED': 'deferred',
  'NOT ELIGIBLE': 'not_eligible',
};

// Map minutes decision text → DB value for Council
const COUNCIL_DECISION_MAP = {
  'APPROVED': 'approved',
  'REJECTED': 'rejected',
  'DEFERRED': 'deferred',
};

// College Board: decisions that mean "positive recommendation" in DB
const CB_POSITIVE_DB = ['promote', 'increment', 'both', 'commend'];

const ROLE_MEETING_MAP = {
  dean: 'college_board',
  'a&pc': 'apc',
  apc_academic: 'apc',
  apc_junior: 'apc',
  apc_senior: 'apc',
  council: 'council',
};

// Parse pipe-separated rows from extracted PDF text
function parseMinutesText(text, meetingType) {
  const entries = [];
  const validDecisions = VALID_DECISIONS[meetingType];

  for (const line of text.split('\n')) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) continue;

    const staffId = parts[0];
    if (!staffId || /^s\/?n$/i.test(staffId) || /^staff.?id$/i.test(staffId)) continue;
    if (!/\w/.test(staffId)) continue;

    const fullName = parts[1];
    if (!fullName || /^full.?name$/i.test(fullName)) continue;

    if (meetingType === 'council') {
      const decision = parts[2].toUpperCase();
      if (validDecisions.includes(decision)) {
        entries.push({ staff_id: staffId, full_name: fullName, decision });
      }
    } else {
      if (parts.length < 4) continue;
      const scoreStr = parts[2].replace('%', '').trim();
      const score = parseFloat(scoreStr);
      const decision = parts[3].toUpperCase();
      if (validDecisions.includes(decision)) {
        entries.push({
          staff_id: staffId,
          full_name: fullName,
          score: isNaN(score) ? null : score,
          decision,
        });
      }
    }
  }

  return entries;
}

async function correlateWithDB(entries, meetingType, appraisalYear) {
  const discrepancies = [];
  if (!entries.length) return discrepancies;

  const rows = await db('appraisals')
    .select(
      'appraisals.id', 'appraisals.appraisal_year',
      'appraisals.hod_grades', 'appraisals.college_board_recommendation',
      'appraisals.apc_decision', 'appraisals.council_decision',
      'u.full_name as u_full_name', 'u.staff_id as u_staff_id'
    )
    .leftJoin('users as u', 'appraisals.staff_id', 'u.id')
    .where('appraisals.appraisal_year', appraisalYear);

  const byStaffId = {};
  for (const a of rows) {
    if (a.u_staff_id) {
      byStaffId[a.u_staff_id.toUpperCase()] = a;
    }
  }

  for (const entry of entries) {
    const appraisal = byStaffId[entry.staff_id.toUpperCase()];

    if (!appraisal) {
      discrepancies.push({
        staff_id: entry.staff_id,
        full_name: entry.full_name,
        type: 'not_found',
        message: `Staff "${entry.staff_id}" not found in the system for appraisal year ${appraisalYear}.`,
      });
      continue;
    }

    if (meetingType === 'college_board') {
      // Score check
      const dbScore = appraisal.hod_grades?.totalScore ?? null;
      if (entry.score !== null && dbScore !== null) {
        const diff = Math.abs(entry.score - Number(dbScore));
        if (diff > 1) {
          discrepancies.push({
            staff_id: entry.staff_id,
            full_name: entry.full_name,
            type: 'score_mismatch',
            message: `Score mismatch for "${entry.full_name}": minutes record ${entry.score}% but system has ${dbScore}%.`,
            minutes_value: String(entry.score),
            db_value: String(dbScore),
          });
        }
      }
      // Decision check
      const cbRec = appraisal.college_board_recommendation;
      if (cbRec) {
        const minutesPositive = entry.decision === 'RECOMMENDED FOR APPROVAL';
        const dbPositive = CB_POSITIVE_DB.includes(cbRec);
        if (minutesPositive !== dbPositive) {
          discrepancies.push({
            staff_id: entry.staff_id,
            full_name: entry.full_name,
            type: 'decision_mismatch',
            message: `Decision mismatch for "${entry.full_name}": minutes say "${entry.decision}" but system has "${cbRec}".`,
            minutes_value: entry.decision,
            db_value: cbRec,
          });
        }
      }
    } else if (meetingType === 'apc') {
      const dbDecision = appraisal.apc_decision?.decision;
      const mapped = APC_DECISION_MAP[entry.decision];
      if (!dbDecision) {
        discrepancies.push({
          staff_id: entry.staff_id,
          full_name: entry.full_name,
          type: 'no_db_record',
          message: `No A&PC decision found in system for "${entry.full_name}".`,
        });
      } else if (mapped && dbDecision !== mapped) {
        discrepancies.push({
          staff_id: entry.staff_id,
          full_name: entry.full_name,
          type: 'decision_mismatch',
          message: `A&PC mismatch for "${entry.full_name}": minutes say "${entry.decision}" but system records "${dbDecision}".`,
          minutes_value: entry.decision,
          db_value: dbDecision,
        });
      }
      // Score check vs hod_grades
      const dbScore = appraisal.hod_grades?.totalScore ?? null;
      if (entry.score !== null && dbScore !== null) {
        const diff = Math.abs(entry.score - Number(dbScore));
        if (diff > 1) {
          discrepancies.push({
            staff_id: entry.staff_id,
            full_name: entry.full_name,
            type: 'score_mismatch',
            message: `Score mismatch for "${entry.full_name}": minutes show ${entry.score}% but system has ${dbScore}%.`,
            minutes_value: String(entry.score),
            db_value: String(dbScore),
          });
        }
      }
    } else if (meetingType === 'council') {
      const dbDecision = appraisal.council_decision?.decision;
      const mapped = COUNCIL_DECISION_MAP[entry.decision];
      if (!dbDecision) {
        discrepancies.push({
          staff_id: entry.staff_id,
          full_name: entry.full_name,
          type: 'no_db_record',
          message: `No Council decision found in system for "${entry.full_name}".`,
        });
      } else if (mapped && dbDecision !== mapped) {
        discrepancies.push({
          staff_id: entry.staff_id,
          full_name: entry.full_name,
          type: 'decision_mismatch',
          message: `Council mismatch for "${entry.full_name}": minutes say "${entry.decision}" but system records "${dbDecision}".`,
          minutes_value: entry.decision,
          db_value: dbDecision,
        });
      }
    }
  }

  return discrepancies;
}

// POST /api/minutes
const uploadMinutes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    const { meeting_type, appraisal_year, meeting_date, meeting_number, notes } = req.body;

    if (!VALID_MEETING_TYPES.includes(meeting_type)) {
      return res.status(400).json({ error: 'Invalid meeting type.' });
    }
    if (!appraisal_year || !meeting_date || !meeting_number) {
      return res.status(400).json({ error: 'appraisal_year, meeting_date, and meeting_number are required.' });
    }

    const userRole = req.user.role;
    if (ROLE_MEETING_MAP[userRole] !== meeting_type) {
      return res.status(403).json({ error: 'Your role cannot upload this meeting type.' });
    }

    const year = parseInt(appraisal_year, 10);
    const buffer = req.file.buffer;

    let extractedEntries = [];
    let discrepancies = [];
    let parseWarning = null;

    try {
      const pdfData = await pdfParse(buffer);
      extractedEntries = parseMinutesText(pdfData.text, meeting_type);
      discrepancies = await correlateWithDB(extractedEntries, meeting_type, year);
    } catch (err) {
      parseWarning = 'PDF text extraction encountered an issue. The file was saved but automatic entry extraction may be incomplete.';
      console.warn('pdf-parse warning:', err.message);
    }

    // Save to local disk (private — served only via the token-gated download route)
    const ts = Date.now();
    const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${meeting_type}/${year}/${ts}_${safeFilename}`;

    try {
      savePrivateFile('meeting-minutes', storagePath, buffer);
    } catch (err) {
      return res.status(500).json({ error: 'Storage upload failed: ' + err.message });
    }

    const [record] = await db('meeting_minutes')
      .insert({
        id: uuidv4(),
        meeting_type,
        appraisal_year: year,
        meeting_date,
        meeting_number: parseInt(meeting_number, 10),
        uploaded_by: req.user.id,
        pdf_url: storagePath,
        pdf_filename: req.file.originalname,
        pdf_size: req.file.size,
        extracted_entries: extractedEntries,
        discrepancies,
        notes: notes || null,
      })
      .returning('*');

    res.status(201).json({
      message: 'Minutes uploaded successfully.',
      id: record.id,
      entries_found: extractedEntries.length,
      discrepancies_found: discrepancies.length,
      discrepancies,
      parse_warning: parseWarning,
    });
  } catch (err) {
    console.error('uploadMinutes error:', err);
    res.status(500).json({ error: 'Failed to upload minutes.' });
  }
};

// GET /api/minutes
const getMinutes = async (req, res) => {
  try {
    const { meeting_type, appraisal_year } = req.query;
    const userRole = req.user.role;

    let allowedTypes;
    if (['council', 'hr_personnel', 'admin'].includes(userRole)) {
      allowedTypes = VALID_MEETING_TYPES;
    } else {
      const t = ROLE_MEETING_MAP[userRole];
      allowedTypes = t ? [t] : [];
    }

    if (!allowedTypes.length) return res.json({ minutes: [] });

    let query = db('meeting_minutes')
      .select(
        'meeting_minutes.id', 'meeting_minutes.meeting_type', 'meeting_minutes.appraisal_year',
        'meeting_minutes.meeting_date', 'meeting_minutes.meeting_number',
        'meeting_minutes.pdf_filename', 'meeting_minutes.pdf_size', 'meeting_minutes.status',
        'meeting_minutes.notes', 'meeting_minutes.created_at',
        'meeting_minutes.extracted_entries', 'meeting_minutes.discrepancies',
        'u.full_name as u_full_name', 'u.role as u_role'
      )
      .leftJoin('users as u', 'meeting_minutes.uploaded_by', 'u.id')
      .whereIn('meeting_minutes.meeting_type', allowedTypes)
      .orderBy('meeting_minutes.meeting_date', 'desc');

    if (meeting_type && allowedTypes.includes(meeting_type)) {
      query = query.andWhere('meeting_minutes.meeting_type', meeting_type);
    }
    if (appraisal_year) {
      query = query.andWhere('meeting_minutes.appraisal_year', parseInt(appraisal_year, 10));
    }

    const rows = await query;
    const data = rows.map(({ u_full_name, u_role, ...m }) => ({ ...m, users: { full_name: u_full_name, role: u_role } }));

    res.json({ minutes: data || [] });
  } catch (err) {
    console.error('getMinutes error:', err);
    res.status(500).json({ error: 'Failed to fetch minutes.' });
  }
};

// GET /api/minutes/:id
const getMinutesById = async (req, res) => {
  try {
    const row = await db('meeting_minutes')
      .select('meeting_minutes.*', 'u.full_name as u_full_name', 'u.role as u_role', 'u.email as u_email')
      .leftJoin('users as u', 'meeting_minutes.uploaded_by', 'u.id')
      .where('meeting_minutes.id', req.params.id).first();

    if (!row) return res.status(404).json({ error: 'Minutes not found.' });
    const { u_full_name, u_role, u_email, ...minutes } = row;
    res.json({ minutes: { ...minutes, users: { full_name: u_full_name, role: u_role, email: u_email } } });
  } catch (err) {
    console.error('getMinutesById error:', err);
    res.status(500).json({ error: 'Failed to fetch minutes.' });
  }
};

// GET /api/minutes/:id/download-url — issues a short-lived signed download link
// (replicates Supabase Storage's createSignedUrl, since files now live on local disk)
const getMinutesPdfUrl = async (req, res) => {
  try {
    const record = await db('meeting_minutes').select('id').where({ id: req.params.id }).first();
    if (!record) return res.status(404).json({ error: 'Minutes not found.' });

    const token = jwt.sign(
      { minutesId: req.params.id, purpose: 'minutes_download' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const url = `${req.protocol}://${req.get('host')}/api/minutes-download/${req.params.id}?token=${token}`;
    res.json({ url });
  } catch (err) {
    console.error('getMinutesPdfUrl error:', err);
    res.status(500).json({ error: 'Failed to get PDF URL.' });
  }
};

// GET /api/minutes-download/:id?token=... — unauthenticated (token IS the credential,
// same trust model as a Supabase signed URL), so this must not sit behind `authenticate`.
const downloadMinutesPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    if (!token) return res.status(401).json({ error: 'Missing download token.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired download link.' });
    }
    if (payload.purpose !== 'minutes_download' || payload.minutesId !== id) {
      return res.status(401).json({ error: 'Invalid download token.' });
    }

    const record = await db('meeting_minutes').select('pdf_url', 'pdf_filename').where({ id }).first();
    if (!record) return res.status(404).json({ error: 'Minutes not found.' });

    res.download(getPrivateFilePath('meeting-minutes', record.pdf_url), record.pdf_filename);
  } catch (err) {
    console.error('downloadMinutesPdf error:', err);
    res.status(500).json({ error: 'Failed to download minutes.' });
  }
};

// ── Word document template generator ──────────────────────────────────────
const TEMPLATE_CONFIG = {
  college_board: {
    title: 'COLLEGE BOARD MEETING — OFFICIAL MINUTES',
    bodyLabel: 'College',
    decisions: ['RECOMMENDED FOR APPROVAL', 'NOT RECOMMENDED', 'DEFERRED'],
    hasScore: true,
    filename: 'Crawford_CollegeBoard_Minutes_Template.docx',
  },
  apc: {
    title: 'A&PC COMMITTEE MEETING — OFFICIAL MINUTES',
    bodyLabel: 'Committee',
    decisions: [
      'RECOMMENDED FOR PROMOTION + INCREMENT',
      'RECOMMENDED FOR PROMOTION',
      'RECOMMENDED FOR INCREMENT',
      'NOT ELIGIBLE',
      'DEFERRED',
    ],
    hasScore: true,
    filename: 'Crawford_APC_Minutes_Template.docx',
  },
  council: {
    title: 'UNIVERSITY COUNCIL MEETING — OFFICIAL MINUTES',
    bodyLabel: 'Council',
    decisions: ['APPROVED', 'REJECTED', 'DEFERRED'],
    hasScore: false,
    filename: 'Crawford_Council_Minutes_Template.docx',
  },
};

// helper: standard cell border
const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'AAAAAA' },
};

const HEADER_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '1E3A5F' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '1E3A5F' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '1E3A5F' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '1E3A5F' },
};

function makeCell(text, opts = {}) {
  return new TableCell({
    borders: opts.header ? HEADER_BORDER : CELL_BORDER,
    shading: opts.header ? { type: ShadingType.SOLID, color: '1E3A5F' } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: !!opts.bold || !!opts.header,
            color: opts.header ? 'FFFFFF' : (opts.color || '000000'),
            size: opts.size || (opts.header ? 20 : 18),
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function infoRow(label, value = '') {
  return new TableRow({
    children: [
      makeCell(label, { bold: true, width: 28, size: 18 }),
      makeCell(value, { width: 72, size: 18 }),
    ],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before || 0, after: opts.after || 80 },
    children: [
      new TextRun({
        text,
        bold: !!opts.bold,
        italics: !!opts.italic,
        size: opts.size || 22,
        font: 'Calibri',
        color: opts.color || '000000',
      }),
    ],
  });
}

// GET /api/minutes/template/:type
const generateTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const config = TEMPLATE_CONFIG[type];
    if (!config) {
      return res.status(400).json({ error: 'Invalid template type. Use college_board, apc, or council.' });
    }

    const { title, bodyLabel, decisions, hasScore, filename } = config;

    // Staff table columns
    const colHeaders = hasScore
      ? ['S/N', 'Staff ID', 'Full Name', 'Total Score (%)', 'Decision']
      : ['S/N', 'Staff ID', 'Full Name', 'Decision'];
    const colWidths = hasScore
      ? [6, 15, 33, 14, 32]
      : [6, 18, 42, 34];

    const headerRow = new TableRow({
      children: colHeaders.map((h, i) =>
        makeCell(h, { header: true, width: colWidths[i], align: AlignmentType.CENTER })
      ),
      tableHeader: true,
    });

    const emptyRows = Array.from({ length: 25 }, (_, idx) =>
      new TableRow({
        children: colHeaders.map((_, i) => {
          const isFirst = i === 0;
          return makeCell(isFirst ? String(idx + 1) : '', {
            width: colWidths[i],
            align: isFirst ? AlignmentType.CENTER : AlignmentType.LEFT,
          });
        }),
      })
    );

    const staffTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...emptyRows],
    });

    // Meeting info fields table
    const infoFields = [
      [`${bodyLabel}:`, ''],
      ['Meeting Number:', ''],
      ['Meeting Date:', ''],
      ['Appraisal Year:', ''],
      ['Presiding Officer:', ''],
      ['Recording Secretary:', ''],
      ['Venue:', ''],
      ['Members Present:', ''],
    ];
    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: infoFields.map(([l, v]) => infoRow(l, v)),
    });

    // Signature table
    const sigLabels = type === 'council'
      ? ['Presiding Officer (Signature / Date)', 'Recording Secretary (Signature / Date)', 'Registrar (Signature / Date)']
      : ['Presiding Officer (Signature / Date)', 'Recording Secretary (Signature / Date)'];
    const sigWidths = type === 'council' ? [33, 34, 33] : [50, 50];
    const sigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: sigLabels.map((l, i) =>
            new TableCell({
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              width: { size: sigWidths[i], type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: l, size: 18, font: 'Calibri', color: '555555' })],
                }),
              ],
            })
          ),
        }),
      ],
    });

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: 'Calibri', size: 22 } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
            },
          },
          children: [
            // University heading
            para('CRAWFORD UNIVERSITY', { bold: true, align: AlignmentType.CENTER, size: 32, before: 0, after: 40 }),
            para(title, { bold: true, align: AlignmentType.CENTER, size: 24, after: 40 }),
            para('APPRAISAL MINUTES — CONFIDENTIAL', { italic: true, align: AlignmentType.CENTER, size: 18, color: '555555', after: 160 }),

            // Info table
            para('MEETING DETAILS', { bold: true, size: 20, before: 80, after: 80 }),
            infoTable,
            para('', { after: 160 }),

            // Format instruction
            para('IMPORTANT — FORMAT REQUIREMENT FOR SYSTEM UPLOAD:', { bold: true, size: 20, color: '1E3A5F', before: 80, after: 60 }),
            para(
              hasScore
                ? 'Each row in the table below MUST use this exact pipe-separated format when typed: Staff ID | Full Name | Total Score (%) | Decision'
                : 'Each row in the table below MUST use this exact pipe-separated format when typed: Staff ID | Full Name | Decision',
              { italic: true, size: 18, color: '92400E', after: 60 }
            ),
            para(
              'This format is required for the system to automatically extract and cross-check all decisions against appraisal records when you upload the PDF.',
              { size: 18, color: '555555', after: 120 }
            ),

            // Staff decisions heading
            para('AGENDA ITEM: STAFF APPRAISAL DECISIONS', { bold: true, size: 22, before: 80, after: 100 }),
            staffTable,
            para('', { after: 120 }),

            // Valid decisions reference
            para('VALID DECISION TERMS — Use exactly as written below (no abbreviations or variations):', { bold: true, size: 20, color: '92400E', before: 80, after: 60 }),
            ...decisions.map((d, i) =>
              para(`  ${i + 1}.  ${d}`, { bold: true, size: 20, color: '1E3A5F', after: 40 })
            ),
            para('', { after: 160 }),

            // Comments / Writeup section
            para('COMMENTS / ADDITIONAL OBSERVATIONS', { bold: true, size: 20, before: 80, after: 80 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: CELL_BORDER,
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          spacing: { after: 80 },
                          children: [new TextRun({
                            text: '(Use this space for any additional comments, observations, or remarks about the meeting or individual staff cases. You may expand this section as needed.)',
                            size: 16, font: 'Calibri', color: '888888', italics: true,
                          })],
                        }),
                        ...Array.from({ length: 12 }, () =>
                          new Paragraph({ children: [new TextRun({ text: '', font: 'Calibri', size: 22 })], spacing: { after: 200 } })
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            para('', { after: 160 }),

            // Signatures
            para('SIGNATURES', { bold: true, size: 20, before: 80, after: 120 }),
            sigTable,

            // Footer note
            para('', { after: 200 }),
            para(
              'Crawford University Web-Based Staff Appraisal Management System — Official Template. Handle with confidentiality.',
              { italic: true, size: 16, color: '888888', align: AlignmentType.CENTER, after: 0 }
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    console.error('generateTemplate error:', err);
    res.status(500).json({ error: 'Failed to generate template.' });
  }
};

module.exports = { uploadMinutes, getMinutes, getMinutesById, getMinutesPdfUrl, downloadMinutesPdf, generateTemplate };
