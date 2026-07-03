const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Missing Supabase environment variables. Check your .env file.');
}

const clientOpts = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { params: { eventsPerSecond: 0 } },
};

// Primary service role client — bypasses RLS. Used for all DB writes/reads.
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOpts)
  : null;

// Separate auth-only client — used exclusively to validate user JWTs in
// middleware. Kept isolated so auth.getUser() never contaminates supabase's
// internal auth state and accidentally makes DB requests run as the user role.
const supabaseAuth = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, clientOpts)
  : null;

module.exports = { supabase, supabaseAuth };
