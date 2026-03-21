
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testUpdateInProgress() {
  const taskId = 'a2aebe18-6094-4e24-9234-006ce85b8cc5'; // One of the IDs from previous output
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'in-progress' })
    .eq('id', taskId);

  if (error) {
    console.error('Update failed for in-progress:', error);
  } else {
    console.log('Update successful:', data);
  }
}

testUpdateInProgress();
