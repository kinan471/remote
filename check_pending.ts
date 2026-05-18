import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkPending() {
  const { data, error, count } = await supabase
    .from('pending_scrapes')
    .select('id, status, attempts')
    .limit(10);

  console.log(data);
}

checkPending();
