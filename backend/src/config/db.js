// Database Configuration - Supabase Client
// Connects to PostgreSQL hosted on Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer the new-style secret key (bypasses RLS, like the legacy
// service_role key); fall back to SUPABASE_SERVICE_KEY for older setups.
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_KEY) in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
