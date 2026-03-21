
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching columns:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in tasks:', JSON.stringify(Object.keys(data[0]), null, 2));
  } else {
    console.log('No data found.');
  }
}

checkColumns();
