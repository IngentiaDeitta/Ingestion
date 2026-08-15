import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("--- 1. Actualizando finances (income EK CRM) ---")
res1 = supabase.table("finances").update({
    "project_id": "8f0cf89e-5bec-4422-8721-ca39542cd5ec"
}).eq("id", "77b2281a-44f5-4a76-89f9-d6a7b9992d25").execute()
print("Finances actualizadas:", res1.data)

print("\n--- 2. Actualizando hitos del proyecto EK CRM en projects ---")
proj = supabase.table("projects").select("*").eq("id", "8f0cf89e-5bec-4422-8721-ca39542cd5ec").single().execute()
current_analysis = proj.data.get("project_analysis") or {}
milestones = current_analysis.get("milestones") or []

for m in milestones:
    if m.get("id") == "m-ek-2":
        m["billing_confirmed"] = False
        print("Hito m-ek-2 corregido: billing_confirmed = False (pendiente)")

current_analysis["milestones"] = milestones
res2 = supabase.table("projects").update({
    "project_analysis": current_analysis
}).eq("id", "8f0cf89e-5bec-4422-8721-ca39542cd5ec").execute()

print("Proyecto actualizado exitosamente.")
