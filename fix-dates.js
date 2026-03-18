import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan credenciales en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDates() {
  console.log("Iniciando corrección de fechas...");
  const { data: tasks, error } = await supabase.from('tasks').select('id, due_date');
  
  if (error) {
    console.error("Error al obtener tareas:", error);
    return;
  }

  let correctedCount = 0;

  for (const task of tasks) {
    if (task.due_date && task.due_date.includes('/')) {
      const parts = task.due_date.split('/');
      if (parts.length === 3) {
        let [d, m, y] = parts;
        // Normalizar a YYYY-MM-DD
        const newDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        console.log(`Corrigiendo tarea ${task.id}: ${task.due_date} -> ${newDate}`);
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ due_date: newDate })
          .eq('id', task.id);
          
        if (updateError) {
          console.error(`Error al actualizar tarea ${task.id}:`, updateError);
        } else {
          correctedCount++;
        }
      }
    }
  }

  console.log(`Proceso terminado. Se corrigieron ${correctedCount} tareas.`);
}

fixDates();
