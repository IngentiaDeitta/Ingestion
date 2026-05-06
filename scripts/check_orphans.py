
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def check_orphans():
    # Get all project names
    projs = supabase.table("projects").select("name").execute()
    proj_names = [p['name'] for p in projs.data]
    
    # Get all tasks
    tasks = supabase.table("tasks").select("project").execute()
    task_projects = set([t['project'] for t in tasks.data if t['project']])
    
    orphans = [tp for tp in task_projects if tp not in proj_names and tp != 'General']
    
    if orphans:
        print(f"Encontrados proyectos huérfanos en tareas: {orphans}")
    else:
        print("No se encontraron tareas huérfanas.")

if __name__ == "__main__":
    check_orphans()
