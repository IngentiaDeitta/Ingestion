
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProjectsStatus() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, status')
    .limit(10);

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log('Sample projects and their status:');
  console.table(data);
}

checkProjectsStatus();
