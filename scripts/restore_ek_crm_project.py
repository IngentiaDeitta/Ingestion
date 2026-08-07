import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"
EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec"

# 1. Limpiar proyectos de prueba temporales en 'projects'
supabase.table("projects").delete().neq("id", EK_PROJECT_ID).execute()

# 2. Re-insertar o actualizar el proyecto EK CRM con su ID exacto 8f0cf89e-5bec-4422-8721-ca39542cd5ec
project_analysis = {
    "milestones": [
        {
            "id": "m-ek-1",
            "title": "Auditoría, Limpieza y Normalización de BBDD",
            "description": "Unificación y estructuración de 20.000 presupuestos históricos en base de datos Master Data.",
            "type": "both",
            "estimated_date": "2026-05-30",
            "real_date": "2026-05-30",
            "completed": True,
            "amount": 2500,
            "billing_confirmed": True
        },
        {
            "id": "m-ek-2",
            "title": "Arquitectura Unificada & Prototipo CRM",
            "description": "Diseño de la arquitectura comercial, flujos de n8n para WhatsApp/Outlook y prototipo interactivo.",
            "type": "both",
            "estimated_date": "2026-06-25",
            "real_date": "2026-06-25",
            "completed": True,
            "amount": 2500,
            "billing_confirmed": True
        },
        {
            "id": "m-ek-3",
            "title": "Motor de IA, Agente Cotizador & Integraciones",
            "description": "Construcción del motor de IA para recomendaciones comerciales, cotizador automático y conectores omnicanal.",
            "type": "both",
            "estimated_date": "2026-08-25",
            "real_date": None,
            "completed": False,
            "amount": 2500,
            "billing_confirmed": False
        },
        {
            "id": "m-ek-4",
            "title": "Despliegue a Producción & Capacitación Comercial",
            "description": "Lanzamiento final de la plataforma CRM en producción y entrenamiento al equipo comercial y operativo.",
            "type": "delivery",
            "estimated_date": "2026-09-30",
            "real_date": None,
            "completed": False,
            "amount": None,
            "billing_confirmed": False
        }
    ]
}

ek_project = {
    "id": EK_PROJECT_ID,
    "name": "EK CRM - Ecosistema de Gestión Comercial e Inteligencia Operativa",
    "client": "Elektro Korrosión",
    "description": "Implementación unificada de CRM omnicanal para Elektro Korrosión: unificación de 20.000 presupuestos históricos, integración de WhatsApp, Outlook y HubSpot mediante n8n, y motor de recomendación con IA.",
    "status": "En Progreso",
    "budget": 7500,
    "progress": 50,
    "due_date": "2026-09-30",
    "delegated_to": "Propio",
    "project_analysis": project_analysis
}

try:
    res = supabase.table("projects").upsert([ek_project]).execute()
    print("[+] Proyecto EK CRM restaurado exitosamente:", res.data)
except Exception as e:
    print("[-] Error upserting project:", e)

# 3. Vincular todas las tareas de Automatización EK - CRM al project_id exacto
try:
    res_tasks = supabase.table("tasks").update({
        "project_id": EK_PROJECT_ID,
        "project": "EK CRM"
    }).ilike("project", "%EK%").execute()
    print(f"[+] {len(res_tasks.data)} tareas de EK re-vinculadas correctamente.")
except Exception as e:
    print("[-] Error vinculando tareas:", e)

print("\n--- PROYECTOS ACTIVOS EN SUPABASE ---")
projects = supabase.table("projects").select("id, name, client, status, progress, budget").execute().data
print(json.dumps(projects, indent=2))

print("\n--- HISTORIAL DE TAREAS EK CRM ---")
ek_tasks = supabase.table("tasks").select("id, title, status, phase, priority").eq("project_id", EK_PROJECT_ID).execute().data
print(f"Total de tareas vinculadas a EK CRM: {len(ek_tasks)}")
print(json.dumps(ek_tasks, indent=2))
