import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_PROJECT_NAME = "EK CRM - Ecosistema de Gestión Comercial e Inteligencia Operativa"

# Actualizar el nombre de proyecto en la tabla tasks para todas las tareas de EK
tasks = supabase.table("tasks").select("id, title, project").execute().data

ek_task_ids = []
for t in tasks:
    p_name = (t.get("project") or "").lower()
    if "ek" in p_name or "automatización ek" in p_name or "automatizacion ek" in p_name:
        ek_task_ids.append(t["id"])

print(f"Encontradas {len(ek_task_ids)} tareas pertenecientes a EK CRM.")

for tid in ek_task_ids:
    supabase.table("tasks").update({"project": EK_PROJECT_NAME}).eq("id", tid).execute()

print("[+] Tareas actualizadas con el nombre exacto del proyecto EK CRM.")

# Verificar en proyectos y tareas
proj = supabase.table("projects").select("id, name, client, progress, budget").execute().data
print("\nPROYECTOS ACTIVOS:", json.dumps(proj, indent=2))

linked_tasks = supabase.table("tasks").select("id, title, status, phase, priority, project").eq("project", EK_PROJECT_NAME).execute().data
print(f"\nTAREAS VINCULADAS A EK CRM ({len(linked_tasks)}):")
for lt in linked_tasks:
    print(f"- [{lt['status']}] {lt['title']} (Fase: {lt.get('phase')}, Prioridad: {lt.get('priority')})")
