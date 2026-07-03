require('dotenv').config();
const { supabase } = require('./src/config/supabase');

const FUNMI_APPRAISAL  = '1428908e-49f6-4aec-bd81-12e90ae0769d';
const FUNMI_USER       = '1a9a63b9-fd07-4c05-a0a0-9efa9e5976c4';
const BOLA_USER        = '320ca977-c739-4a56-bf5e-d4ae134d80b1';
const APC_ID           = '08af8af0-8464-4dbc-8a6f-235fa06ce168';
const DEAN_ID          = 'c9e20558-f504-491d-855a-46d8bb442ebd';

async function main() {

  // ── 1. Fix Dr. Funmilayo's department ────────────────────────────────────
  console.log('1. Fixing Funmilayo department...');
  const { error: deptErr } = await supabase.from('users')
    .update({ department: 'Computer Science, ICT & Cybersecurity' })
    .eq('id', FUNMI_USER);
  console.log('   users table:', deptErr ? deptErr.message : 'OK');

  // Also fix it inside part1_data JSONB
  const { data: appraisal } = await supabase.from('appraisals')
    .select('part1_data').eq('id', FUNMI_APPRAISAL).single();
  const updatedPart1 = { ...appraisal.part1_data, department: 'Computer Science, ICT & Cybersecurity' };
  const { error: p1Err } = await supabase.from('appraisals')
    .update({ part1_data: updatedPart1 }).eq('id', FUNMI_APPRAISAL);
  console.log('   part1_data:', p1Err ? p1Err.message : 'OK');

  // ── 2. Seed Initial Stage External Assessors (3: 2 internal + 1 external) ─
  console.log('\n2. Seeding initial stage assessors for Funmilayo...');
  const initialAssessors = [
    {
      appraisal_id: FUNMI_APPRAISAL,
      stage: 'initial',
      name: 'Prof. Adewale Adeyemi',
      email: 'a.adeyemi@crawford.edu.ng',
      institution: 'Crawford University, Igbesa',
      assessor_type: 'internal',
      scope: null,
      assigned_by: DEAN_ID,
      outcome: 'positive',
      report_date: '2026-04-20',
      report_notes: 'Dr. Okonkwo demonstrates an exceptional publication record for an Associate Professor. Her seven peer-reviewed publications in reputable international journals, combined with active TETFund-funded research and strong postgraduate supervision, make a compelling case for promotion to Full Professor. Strongly recommend.',
    },
    {
      appraisal_id: FUNMI_APPRAISAL,
      stage: 'initial',
      name: 'Dr. Chinyere Eze',
      email: 'c.eze@crawford.edu.ng',
      institution: 'Crawford University, Igbesa',
      assessor_type: 'internal',
      scope: null,
      assigned_by: DEAN_ID,
      outcome: 'positive',
      report_date: '2026-04-22',
      report_notes: 'A thorough review of Dr. Okonkwo\'s academic dossier confirms her suitability for promotion. Her contributions to AI research in the African context, community service, and administrative responsibilities demonstrate well-rounded academic citizenship. I support promotion without reservation.',
    },
    {
      appraisal_id: FUNMI_APPRAISAL,
      stage: 'initial',
      name: 'Prof. Emeka Chukwu',
      email: 'e.chukwu@unilag.edu.ng',
      institution: 'University of Lagos',
      assessor_type: 'external',
      scope: null,
      assigned_by: DEAN_ID,
      outcome: 'positive',
      report_date: '2026-04-28',
      report_notes: 'As an external reviewer, I have examined Dr. Funmilayo Okonkwo\'s publications and research profile. Her work on explainable AI and deep learning for medical image analysis reflects originality and methodological rigour. The publication in IEEE Transactions on Neural Networks is particularly noteworthy. I commend her for promotion.',
    },
  ];
  const { error: iaErr } = await supabase.from('external_assessors').insert(initialAssessors);
  console.log('   Initial assessors:', iaErr ? iaErr.message : '3 inserted (all positive)');

  // ── 3. Establish PFQ ───────────────────────────────────────────────────────
  console.log('\n3. Establishing PFQ...');
  const { error: pfqErr } = await supabase.from('appraisals').update({
    pfq_established: true,
    pfq_established_at: '2026-05-05T10:00:00Z',
    pfq_established_by: APC_ID,
  }).eq('id', FUNMI_APPRAISAL);
  console.log('   PFQ:', pfqErr ? pfqErr.message : 'Established OK');

  // ── 4. Seed Final Stage External Assessors (6: 2 international + 4 national)
  console.log('\n4. Seeding final stage assessors (6 names submitted by Dean)...');
  const finalAssessors = [
    // International (2)
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. James Mitchell', email: 'j.mitchell@manchester.ac.uk',
      institution: 'University of Manchester, UK',
      assessor_type: 'external', scope: 'international',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. Sarah Williams', email: 's.williams@mit.edu',
      institution: 'Massachusetts Institute of Technology, USA',
      assessor_type: 'external', scope: 'international',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
    // National (4)
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. Bello Usman', email: 'b.usman@abu.edu.ng',
      institution: 'Ahmadu Bello University, Zaria',
      assessor_type: 'external', scope: 'national',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. Yemi Ogundele', email: 'y.ogundele@ui.edu.ng',
      institution: 'University of Ibadan',
      assessor_type: 'external', scope: 'national',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. Tunde Fadipe', email: 't.fadipe@unilag.edu.ng',
      institution: 'University of Lagos',
      assessor_type: 'external', scope: 'national',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
    {
      appraisal_id: FUNMI_APPRAISAL, stage: 'final',
      name: 'Prof. Ngozi Eze-Okafor', email: 'n.eze@unn.edu.ng',
      institution: 'University of Nigeria, Nsukka',
      assessor_type: 'external', scope: 'national',
      assigned_by: DEAN_ID, outcome: 'pending', selected_by_vc: false,
    },
  ];
  const { error: faErr } = await supabase.from('external_assessors').insert(finalAssessors);
  console.log('   Final assessors:', faErr ? faErr.message : '6 inserted (2 intl + 4 national)');

  // ── 5. Push Bola Fashola to apc_recommended (Council has something pending) ─
  console.log('\n5. Pushing Bola Fashola appraisal to apc_recommended...');
  const { data: bolaApp } = await supabase.from('appraisals')
    .select('id').eq('staff_id', BOLA_USER).single();

  const { error: bolaErr } = await supabase.from('appraisals').update({
    status: 'apc_recommended',
    apc_decision: {
      decision: 'increment',
      notes: 'Mr. Bola Fashola has demonstrated consistent performance and dedication in the Administration Department. The A&PC recommends a salary increment effective from the 2025/2026 appraisal cycle.',
      apc_id: APC_ID,
      recommended_by: 'Prof. Rotimi Adegoke',
      decided_at: '2026-05-15T09:00:00Z',
    },
  }).eq('id', bolaApp.id);
  console.log('   Bola appraisal:', bolaErr ? bolaErr.message : 'Moved to apc_recommended OK');

  // ── 6. Final verification ─────────────────────────────────────────────────
  console.log('\n=== VERIFICATION ===');
  const { data: ea } = await supabase.from('external_assessors')
    .select('stage, assessor_type, scope, name, outcome, selected_by_vc')
    .eq('appraisal_id', FUNMI_APPRAISAL)
    .order('stage').order('scope');
  ea.forEach(a => console.log(
    (a.stage||'').padEnd(8), '|',
    (a.assessor_type||'').padEnd(8), '|',
    (a.scope||'n/a').padEnd(14), '|',
    (a.outcome||'').padEnd(8), '|',
    'VC selected:', a.selected_by_vc, '|', a.name
  ));

  const { data: pfqCheck } = await supabase.from('appraisals')
    .select('pfq_established, status').eq('id', FUNMI_APPRAISAL).single();
  console.log('\nFunmilayo appraisal:', pfqCheck.status, '| PFQ:', pfqCheck.pfq_established);

  const { data: bolaCheck } = await supabase.from('appraisals')
    .select('status, apc_decision').eq('staff_id', BOLA_USER).single();
  console.log('Bola appraisal     :', bolaCheck.status, '| APC decision:', bolaCheck.apc_decision?.decision);

  const { data: funmiUser } = await supabase.from('users').select('department').eq('id', FUNMI_USER).single();
  console.log('Funmilayo dept     :', funmiUser.department);
}

main().catch(console.error);
