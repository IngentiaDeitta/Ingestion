
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProjectOutcomes() {
  const { data, error } = await supabase
    .from('projects')
    .select('outcome');

  if (error) {
    console.error('Error fetching outcomes:', error);
    return;
  }

  const outcomes = [...new Set(data.map(t => t.outcome))];
  console.log('Unique project outcomes in DB:', outcomes);
}

checkProjectOutcomes();
