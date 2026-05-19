const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env.local');
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

async function checkImages() {
  console.log("Querying image URLs from different platforms...");
  
  const platforms = ['trendyol', 'hepsiburada', 'amazon', 'n11'];
  for (const plat of platforms) {
    const { data, error } = await supabase
      .from('products')
      .select('title, images, source_url, source_platform')
      .eq('source_platform', plat)
      .limit(3);
      
    if (error) {
      console.error(`Error querying ${plat}:`, error);
      continue;
    }
    
    console.log(`\nPlatform: ${plat} (Found: ${data.length})`);
    data.forEach((p, idx) => {
      console.log(`  Product ${idx+1}: ${p.title}`);
      console.log(`    Images:`, p.images);
    });
  }
}

checkImages();
