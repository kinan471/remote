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

async function testUpsert() {
  console.log("Simulating upsert into user_roles...");
  
  // Try inserting a dummy UUID (using a random valid UUID) to see what PostgreSQL says
  const dummyUserId = "00000000-0000-0000-0000-000000000000"; 
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: dummyUserId,
      email: "hallabkinan@gmail.com",
      role: 'admin',
      is_admin: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select('is_admin');

  if (error) {
    console.error("UPSERT Error:", error);
  } else {
    console.log("UPSERT Success:", data);
  }
}

testUpsert();
