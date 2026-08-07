import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec"

# Cambiar outcome a 'Ganado' y asegurar status='En Progreso'
res = supabase.table("projects").update({
    "outcome": "Ganado",
    "status": "En Progreso"
}).eq("id", EK_PROJECT_ID).execute()

print("[+] Proyecto EK CRM actualizado en Supabase:", res.data)

print("\n--- VERIFICACIÓN EN PROYECTOS ---")
projs = supabase.table("projects").select("*").execute().data
print(json.dumps(projs, indent=2))
