import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

print("--- PROJECTS ---")
try:
    print(json.dumps(supabase.table("projects").select("*").execute().data, indent=2))
except Exception as e:
    print(e)

print("\n--- TASKS ---")
try:
    tasks = supabase.table("tasks").select("*").execute().data
    print(f"Total tasks: {len(tasks)}")
    for t in tasks:
        print(f"Task ID: {t.get('id')}, Title: {t.get('title')}, Project: {t.get('project')}, ProjectID: {t.get('project_id')}, Status: {t.get('status')}")
except Exception as e:
    print("Error tasks:", e)

print("\n--- MILESTONES / PROJECT_MILESTONES ---")
try:
    ms = supabase.table("project_milestones").select("*").execute().data
    print("Project milestones:", json.dumps(ms, indent=2))
except Exception as e:
    print("Error project_milestones:", e)

try:
    ms2 = supabase.table("milestones").select("*").execute().data
    print("Milestones:", json.dumps(ms2, indent=2))
except Exception as e:
    print("Error milestones:", e)

print("\n--- QUOTES ---")
try:
    quotes = supabase.table("quotes").select("*").execute().data
    print("Quotes:", json.dumps(quotes, indent=2))
except Exception as e:
    print("Error quotes:", e)
