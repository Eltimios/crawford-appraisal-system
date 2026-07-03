require('dotenv').config();
const { supabase } = require('./src/config/supabase');

async function main() {
  const { data, error } = await supabase.from('appraisals')
    .select(`
      id, appraisal_year, status, hod_recommendation,
      apc_decision, council_decision, registry_validated, college_board_approved,
      users!appraisals_staff_id_fkey(
        id, full_name, staff_id, email, department, college,
        current_rank, staff_category,
        date_of_first_appointment, date_of_last_promotion
      )
    `)
    .eq('appraisal_year', '2025/2026')
    .not('apc_decision', 'is', null);

  if (error) {
    console.error('ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS — rows returned:', data.length);
    if (data.length > 0) console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}

main().catch(console.error);
