import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function listTables() {
    // This is hacky for Supabase anon key, but we can try to guess or use RPC if defined
    // Alternatively, let's just try to select from 'finance_items' and see if it errors
    const { data, error } = await supabase.from('finance_items').select('*').limit(1);
    if (error) {
        console.log("finance_items does not exist or access denied:", error.message);
    } else {
        console.log("finance_items exists!");
    }
}

listTables();
