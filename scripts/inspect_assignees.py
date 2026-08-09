import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

s = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("VITE_SUPABASE_ANON_KEY"))

res = s.table("tasks").select("assignee, assignees").execute()

all_assignees = set()
for r in res.data:
    if r.get("assignee"):
        all_assignees.add(r["assignee"])
    if r.get("assignees"):
        for a in r["assignees"]:
            all_assignees.add(a)

print("Unique assignees in tasks table:", list(all_assignees))
