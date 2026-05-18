require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPending() {
  const { data, error, count } = await supabase
    .from('pending_scrapes')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching pending_scrapes:', error);
    return;
  }

  console.log(`Total pending_scrapes rows: ${count}`);
  
  const pending = data.filter(d => d.status === 'pending');
  const failed = data.filter(d => d.status === 'failed');
  const processing = data.filter(d => d.status === 'processing');
  const completed = data.filter(d => d.status === 'completed');

  console.log(`Pending: ${pending.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Processing: ${processing.length}`);
  console.log(`Completed: ${completed.length}`);
}

checkPending();
