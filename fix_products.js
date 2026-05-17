const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vvxuahkmbzucccztbvod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHVhaGttYnp1Y2NjenRidm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzIxMjcsImV4cCI6MjA5NDAwODEyN30.aFEWx9xAuapLwGYUWhRbVhjrnrg281BFHbSk_dsboIM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Keywords to block (baby/diaper/unrelated products)
const BLOCKED_KEYWORDS = [
  'sleepy', 'bez', 'bebek', 'külot', 'kulot', 'çocuk', 'cocuk',
  'pampers', 'molfix', 'huggies', 'bebiko', 'emzik', 'mama ',
  'islak mendil', 'gida', 'gıda', 'atıştırmalık'
];

async function fixProducts() {
  console.log('🔍 Fetching all products...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, source_platform');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`📦 Total products: ${products.length}`);

  // 1. Find products with blocked keywords
  const toDelete = products.filter(p => {
    const titleLower = (p.title || '').toLowerCase();
    return BLOCKED_KEYWORDS.some(kw => titleLower.includes(kw));
  });

  console.log(`🗑️  Found ${toDelete.length} unrelated products (diapers/baby) to delete:`);
  toDelete.forEach(p => console.log(`  - [${p.source_platform}] ${p.title}`));

  if (toDelete.length > 0) {
    const ids = toDelete.map(p => p.id);
    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .in('id', ids);
    
    if (delErr) console.error('Error deleting blocked products:', delErr);
    else console.log(`✅ Deleted ${toDelete.length} blocked products!`);
  }

  // 2. Find and remove duplicates (same title, keep the one with more data)
  console.log('\n🔍 Checking for duplicates...');
  
  const remaining = products.filter(p => !toDelete.find(d => d.id === p.id));
  const seen = new Map();
  const duplicateIds = [];

  for (const p of remaining) {
    // Normalize title for comparison
    const normalized = (p.title || '')
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');

    if (seen.has(normalized)) {
      // Keep the first one, mark this as duplicate
      duplicateIds.push(p.id);
      console.log(`  🔁 Duplicate: "${p.title}" (${p.source_platform})`);
    } else {
      seen.set(normalized, p.id);
    }
  }

  if (duplicateIds.length > 0) {
    const { error: dupErr } = await supabase
      .from('products')
      .delete()
      .in('id', duplicateIds);

    if (dupErr) console.error('Error deleting duplicates:', dupErr);
    else console.log(`✅ Deleted ${duplicateIds.length} duplicate products!`);
  } else {
    console.log('✅ No duplicates found!');
  }

  console.log('\n🎉 Database cleanup complete!');
}

fixProducts();
