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

async function checkConstraints() {
  console.log("Fetching table constraints...");
  
  // We can query pg_constraint to get all constraints for user_roles table
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .limit(1);

  if (error) {
    console.error("SELECT user_roles error:", error);
  }

  // Let's run a query on pg_catalog or information_schema using RPC if possible.
  // If we can't, we can try to do a raw query or try to insert a test user_role and print the exact error message.
  console.log("Attempting to insert a test record for another email to see the database error...");
  const randomId = "11111111-1111-1111-1111-111111111111";
  const { data: insertData, error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id: randomId,
      email: "test_another_email@gmail.com",
      role: 'admin',
      is_admin: true,
      updated_at: new Date().toISOString()
    })
    .select('*');

  if (insertError) {
    console.log("Insert failed with error code:", insertError.code);
    console.log("Error details:", insertError);
  } else {
    console.log("Insert succeeded!", insertData);
    // Delete it to clean up
    await supabase.from('user_roles').delete().eq('user_id', randomId);
  }
}

checkConstraints();
