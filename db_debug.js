const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
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

async function checkDb() {
  console.log("Connecting to Supabase:", supabaseUrl);
  
  // 1. Group by platform and status
  const { data: allScrapes, error: err } = await supabase
    .from('pending_scrapes')
    .select('platform, status, attempts');
    
  if (err) {
    console.error("Error reading pending_scrapes:", err);
    return;
  }
  
  console.log("Total entries in pending_scrapes:", allScrapes.length);
  const stats = {};
  allScrapes.forEach(s => {
    const key = `${s.platform} - ${s.status}`;
    stats[key] = (stats[key] || 0) + 1;
  });
  console.log("Grouped stats:", stats);

  // 2. Fetch Hepsiburada tasks in pending_scrapes
  const { data: hbTasks, error: hbErr } = await supabase
    .from('pending_scrapes')
    .select('*')
    .eq('platform', 'hepsiburada')
    .limit(10);
    
  if (hbErr) {
    console.error("Error reading Hepsiburada tasks:", hbErr);
  } else {
    console.log("\nSample Hepsiburada tasks in queue:");
    hbTasks.forEach(t => {
      console.log(`- URL: ${t.url}`);
      console.log(`  Status: ${t.status}`);
      console.log(`  Attempts: ${t.attempts}`);
      console.log(`  Error: ${t.last_error}`);
    });
  }
}

checkDb();
