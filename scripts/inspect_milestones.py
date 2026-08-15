import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

p = supabase.table("projects").select("*").eq("id", "8f0cf89e-5bec-4422-8721-ca39542cd5ec").single().execute()
print(json.dumps(p.data.get("project_analysis", {}).get("milestones", []), indent=2))
