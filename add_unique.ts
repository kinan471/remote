import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function addUniqueConstraint() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: 'ALTER TABLE products ADD CONSTRAINT products_source_url_key UNIQUE (source_url);'
  });

  if (error) {
    console.error('Error with RPC execute_sql:', error.message);
    console.log('Attempting alternative method...');
    
    // We cannot execute raw SQL directly without RPC.
    console.log('Please execute this in the Supabase SQL editor: ALTER TABLE products ADD CONSTRAINT products_source_url_key UNIQUE (source_url);');
  } else {
    console.log('Success:', data);
  }
}

addUniqueConstraint();
