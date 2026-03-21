
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStatusValues() {
  const { data, error } = await supabase
    .from('tasks')
    .select('status');

  if (error) {
    console.error('Error fetching statuses:', error);
    return;
  }

  const statuses = [...new Set(data.map(t => t.status))];
  console.log('Unique status values in DB:', statuses);
}

checkStatusValues();
