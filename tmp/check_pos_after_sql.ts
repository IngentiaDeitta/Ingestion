
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTasksWithPosition() {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, position')
    .limit(10);

  if (error) {
    console.error('Error fetching tasks with position:', error);
    return;
  }

  console.log('Sample tasks and their position:');
  console.table(data);
}

checkTasksWithPosition();
