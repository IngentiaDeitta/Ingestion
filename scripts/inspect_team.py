import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

s = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("VITE_SUPABASE_ANON_KEY"))

print("--- TEAM TABLE ---")
team = s.table("team").select("*").execute()
print(json.dumps(team.data, indent=2))

print("\n--- PROJECT_TEAM TABLE ---")
project_team = s.table("project_team").select("*").execute()
print(json.dumps(project_team.data, indent=2))
