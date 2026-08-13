import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Credenciales de Supabase no encontradas en .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

def run_cleanup():
    print("=== INICIANDO LIMPIEZA DE TAREAS Y PROYECTO DRIPCOLOR ===")

    # 1. Eliminar tareas sintéticas de DripColor
    del_tasks_res = supabase.table("tasks").delete().ilike("project", "%DripColor%").execute()
    deleted_tasks_count = len(del_tasks_res.data or [])
    print(f"[OK] Se eliminaron {deleted_tasks_count} tareas sintéticas de DripColor.")

    # 2. Eliminar proyectos sintéticos de DripColor
    del_proj_res = supabase.table("projects").delete().ilike("name", "%DripColor%").execute()
    deleted_proj_count = len(del_proj_res.data or [])
    print(f"[OK] Se eliminaron {deleted_proj_count} registros sintéticos de proyectos DripColor.")

    # 3. Eliminar clientes sintéticos de DripColor (en tabla 'clients')
    del_client_res = supabase.table("clients").delete().ilike("name", "%DripColor%").execute()
    deleted_client_count = len(del_client_res.data or [])
    print(f"[OK] Se eliminaron {deleted_client_count} clientes sintéticos de DripColor.")

    # 4. Verificación de integridad de la base de datos remanente
    all_tasks = supabase.table("tasks").select("id, title, project, status").execute().data or []
    print(f"\n--- ESTADO DE LA BASE DE DATOS TRAS LA LIMPIEZA ---")
    print(f"Total de tareas reales remanentes: {len(all_tasks)}")

    projects_count = {}
    for t in all_tasks:
        p_name = t.get("project") or "General"
        projects_count[p_name] = projects_count.get(p_name, 0) + 1

    print("\nDesglose de tareas por proyecto:")
    for p_name, count in projects_count.items():
        print(f"  • {p_name}: {count} tareas")

    print("\n=== LIMPIEZA COMPLETADA CON ÉXITO ===")

if __name__ == "__main__":
    run_cleanup()
