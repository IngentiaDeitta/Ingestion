import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

s = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("VITE_SUPABASE_ANON_KEY"))

for t in ["clients", "leads_cuentas", "projects", "tasks", "quotes"]:
    try:
        res = s.table(t).select("*").limit(1).execute()
        if res.data:
            print(f"\n=== TABLE {t} ===")
            print(f"Columns: {list(res.data[0].keys())}")
            print(f"Sample row:\n{json.dumps(res.data[0], indent=2)}")
    except Exception as e:
        print(f"Error {t}: {e}")
