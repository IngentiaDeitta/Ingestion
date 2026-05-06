
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

OLD_NAME = "Automatización CRM EK - Módulo 1"
NEW_NAME = "Automatización EK - CRM"
NEW_ID = "c7a2dad9-4ced-4d7d-a357-6c10153baa4a"

def migrate():
    print(f"Iniciando migración de '{OLD_NAME}' a '{NEW_NAME}'...")
    
    # 1. Actualizar Tareas
    tasks_res = supabase.table("tasks").update({"project": NEW_NAME}).eq("project", OLD_NAME).execute()
    print(f"Tareas actualizadas: {len(tasks_res.data)}")
    
    # 2. Actualizar Finanzas (project_id)
    # Buscamos finanzas que tengan el nombre viejo en la descripción y no tengan project_id
    fin_res = supabase.table("finances").select("id, description").ilike("description", f"%{OLD_NAME}%").execute()
    
    updated_fin = 0
    for fin in fin_res.data:
        new_desc = fin['description'].replace(OLD_NAME, NEW_NAME)
        supabase.table("finances").update({
            "description": new_desc,
            "project_id": NEW_ID
        }).eq("id", fin['id']).execute()
        updated_fin += 1
    
    print(f"Registros de finanzas actualizados: {updated_fin}")
    
    # Extra: Si hay registros con el ID correcto pero nombre viejo, los corregimos también
    fin_res_2 = supabase.table("finances").select("id, description").eq("project_id", NEW_ID).execute()
    for fin in fin_res_2.data:
        if OLD_NAME in fin['description']:
            new_desc = fin['description'].replace(OLD_NAME, NEW_NAME)
            supabase.table("finances").update({"description": new_desc}).eq("id", fin['id']).execute()

    print("Migración completada con éxito.")

if __name__ == "__main__":
    migrate()
