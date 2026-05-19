const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRoles() {
  console.log("Querying user_roles table...");
  const { data, error } = await supabase.from('user_roles').select('*').limit(5);
  if (error) {
    console.error("SELECT user_roles Error:", error);
  } else {
    console.log("SELECT user_roles Success (might be empty due to RLS):", data);
  }
}

checkUserRoles();
