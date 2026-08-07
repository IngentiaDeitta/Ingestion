import os
import sys
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidos en .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

PROJECT_NAME = "DripColor"

def run():
    print(f"--- Configurando Ejercicio de Simulación para el Proyecto: {PROJECT_NAME} ---")

    # 1. Verificar / Crear Cliente DripColor
    client_res = supabase.table("clients").select("id, name").eq("name", PROJECT_NAME).execute()
    if client_res.data and len(client_res.data) > 0:
        client_id = client_res.data[0]["id"]
        print(f"[OK] Cliente '{PROJECT_NAME}' encontrado (ID: {client_id})")
    else:
        new_client = supabase.table("clients").insert([{
            "name": PROJECT_NAME,
            "status": "Activo"
        }]).execute()
        client_id = new_client.data[0]["id"]
        print(f"[CREADO] Cliente '{PROJECT_NAME}' creado (ID: {client_id})")

    # 2. Definición de Hitos Comprometidos
    milestones = [
        {
            "id": "dc-milestone-01",
            "title": "Firma de Contrato y Entrega de Insumos",
            "description": "Acuerdo comercial, acceso a sistemas e insumos iniciales de DripColor.",
            "type": "both",
            "estimated_date": "2026-05-15",
            "real_date": "2026-05-15",
            "completed": True,
            "amount": 2500.0,
            "billing_confirmed": True
        },
        {
            "id": "dc-milestone-02",
            "title": "Auditoría & Prototipo Interactivo UI/UX",
            "description": "Relevamiento de catálogo, reglas de margen y maquetación visual del cotizador.",
            "type": "both",
            "estimated_date": "2026-06-30",
            "real_date": "2026-07-02",
            "completed": True,
            "amount": 2500.0,
            "billing_confirmed": True
        },
        {
            "id": "dc-milestone-03",
            "title": "Arquitectura & Conexión BBDD Real + Agente Cotizador",
            "description": "Integración con base de datos real y motor de cotización automatizado con IA.",
            "type": "both",
            "estimated_date": "2026-08-25",
            "real_date": None,
            "completed": False,
            "amount": 3000.0,
            "billing_confirmed": False
        },
        {
            "id": "dc-milestone-04",
            "title": "Lanzamiento Final & Capacitación Commercial",
            "description": "Despliegue a producción en Vercel/Supabase y taller interactivo para el equipo.",
            "type": "both",
            "estimated_date": "2026-09-30",
            "real_date": None,
            "completed": False,
            "amount": 2000.0,
            "billing_confirmed": False
        }
    ]

    project_analysis_payload = {
        "milestones": milestones,
        "summary": "Simulación completa del proyecto DripColor: cotizador inteligente y automatización comercial."
    }

    # 3. Crear o Actualizar el Proyecto DripColor
    project_res = supabase.table("projects").select("*").eq("name", PROJECT_NAME).execute()
    
    if project_res.data and len(project_res.data) > 0:
        project_id = project_res.data[0]["id"]
        supabase.table("projects").update({
            "client": PROJECT_NAME,
            "budget": 10000.0,
            "progress": 50,
            "status": "En Progreso",
            "due_date": "2026-09-30",
            "description": "Implementación de plataforma omnicanal, automatización de cotizaciones y agentes IA de ventas para DripColor.",
            "project_analysis": project_analysis_payload,
            "delegated_to": "In-house"
        }).eq("id", project_id).execute()
        print(f"[ACTUALIZADO] Proyecto '{PROJECT_NAME}' (ID: {project_id})")
    else:
        new_project = supabase.table("projects").insert([{
            "name": PROJECT_NAME,
            "client": PROJECT_NAME,
            "budget": 10000.0,
            "progress": 50,
            "status": "En Progreso",
            "due_date": "2026-09-30",
            "description": "Implementación de plataforma omnicanal, automatización de cotizaciones y agentes IA de ventas para DripColor.",
            "project_analysis": project_analysis_payload,
            "delegated_to": "In-house",
            "outcome": "Aceptado"
        }]).execute()
        project_id = new_project.data[0]["id"]
        print(f"[CREADO] Proyecto '{PROJECT_NAME}' (ID: {project_id})")

    # 4. Limpiar tareas anteriores de DripColor
    del_res = supabase.table("tasks").delete().eq("project", PROJECT_NAME).execute()
    print(f"[LIMPIEZA] Se eliminaron {len(del_res.data or [])} tareas anteriores de {PROJECT_NAME}")

    # 5. Generar Tareas Estructuradas por Fase del Engineering Path
    tasks_data = [
        # --- FASE 1: Auditoría (Completadas) ---
        {
            "title": "Relevamiento inicial de procesos comerciales DripColor",
            "project": PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Auditoría",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 8,
            "actual_hours": 8,
            "due_date": "2026-05-10",
            "tags": ["milestone:dc-milestone-01"],
            "description": "Reunión de alineación y levantamiento de requerimientos iniciales."
        },
        {
            "title": "Auditoría de catálogo de productos y reglas de margen",
            "project": PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Auditoría",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 10,
            "actual_hours": 9,
            "due_date": "2026-05-14",
            "tags": ["milestone:dc-milestone-01"],
            "description": "Mapeo de listas de precios de tintas, diluyentes y coeficientes de margen."
        },

        # --- FASE 2: Arquitectura & Prototipo (Completadas / Finalizando) ---
        {
            "title": "Diseño de diagramas de arquitectura de datos y flujo de agentes",
            "project": PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 12,
            "actual_hours": 12,
            "due_date": "2026-06-10",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Diseño de esquema entidad-relación y tubería de procesamiento de cotizaciones."
        },
        {
            "title": "Prototipo interactivo UI/UX del cotizador DripColor",
            "project": PROJECT_NAME,
            "status": "done",
            "priority": "Media",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 16,
            "actual_hours": 18,
            "due_date": "2026-06-25",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Maquetación visual del flujo de cotización rápida en frontend."
        },
        {
            "title": "Validación y ajustes del modelo de BBDD con Clau/Leo",
            "project": PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Pedro",
            "assignees": ["Pedro", "Fer"],
            "hours": 10,
            "actual_hours": 10,
            "due_date": "2026-07-02",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Revisión conjunta del esquema de base de datos con los referentes de DripColor."
        },

        # --- FASE 3: Construcción & IA (Fase Actual en Curso - Kanban Activo) ---
        {
            "title": "Desarrollo de conectores e integración a BBDD real",
            "project": PROJECT_NAME,
            "status": "in-progress",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 20,
            "actual_hours": 6,
            "due_date": "2026-08-10",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Rediseño y conexión a base de datos real de stock y precios de DripColor."
        },
        {
            "title": "Entrenamiento y tuning del Agente Cotizador Inteligente",
            "project": PROJECT_NAME,
            "status": "in-progress",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 18,
            "actual_hours": 4,
            "due_date": "2026-08-15",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Ajuste de prompts y calibración del agente de IA para cotización automatizada."
        },
        {
            "title": "Configuración de plantillas PDF y reportes exportables",
            "project": PROJECT_NAME,
            "status": "in-progress",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Tercero (Freelance)",
            "assignees": ["Tercero (Freelance)"],
            "hours": 12,
            "actual_hours": 2,
            "due_date": "2026-08-18",
            "delegable": True,
            "tags": ["milestone:dc-milestone-03"],
            "description": "Diseño de la exportación a PDF para propuestas formales de DripColor."
        },
        {
            "title": "Implementación de panel de control de cobros e hitos",
            "project": PROJECT_NAME,
            "status": "review",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 14,
            "due_date": "2026-08-20",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Integración del seguimiento de facturación por avance con Finanzas."
        },
        {
            "title": "Pruebas integrales de flujo de cotización a orden de venta",
            "project": PROJECT_NAME,
            "status": "todo",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 16,
            "due_date": "2026-08-24",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Testeo E2E simulando solicitudes reales de clientes de DripColor."
        },
        {
            "title": "Creación de documentación de Proyecto y manual operativo",
            "project": PROJECT_NAME,
            "status": "todo",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer", "Pedro"],
            "hours": 8,
            "due_date": "2026-08-25",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Redacción del SOP y guías de uso del motor de cotizaciones."
        },

        # --- FASE 4: Lanzamiento (Próxima Fase) ---
        {
            "title": "Despliegue a entorno de producción DripColor",
            "project": PROJECT_NAME,
            "status": "todo",
            "priority": "Alta",
            "phase": "Lanzamiento",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 10,
            "due_date": "2026-09-15",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Despliegue final en producción y verificación de conectividad."
        },
        {
            "title": "Capacitación y transferencia al equipo comercial",
            "project": PROJECT_NAME,
            "status": "todo",
            "priority": "Media",
            "phase": "Lanzamiento",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 6,
            "due_date": "2026-09-22",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Capacitación práctica para el uso diario de las herramientas."
        },
        {
            "title": "Cierre de proyecto y acta de conformidad final",
            "project": PROJECT_NAME,
            "status": "todo",
            "priority": "Baja",
            "phase": "Lanzamiento",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 4,
            "due_date": "2026-09-30",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Revisión final de entregables y firma del acta de recepción."
        }
    ]

    ins_res = supabase.table("tasks").insert(tasks_data).execute()
    print(f"[CREADAS] Se insertaron {len(ins_res.data)} tareas estructuradas para {PROJECT_NAME}")

    # Resumen de tareas por estado
    resumen = {}
    for t in ins_res.data:
        st = t.get("status", "todo")
        resumen[st] = resumen.get(st, 0) + 1

    print("\n--- Resumen del Tablero Kanban para DripColor ---")
    print(f"  • Por Hacer (todo):      {resumen.get('todo', 0)} tareas")
    print(f"  • En Progreso (in-progress): {resumen.get('in-progress', 0)} tareas")
    print(f"  • En Revisión (review):  {resumen.get('review', 0)} tareas")
    print(f"  • Completadas (done):    {resumen.get('done', 0)} tareas")
    print("--------------------------------------------------")
    print("¡Ejercicio simulado completado con éxito!")

if __name__ == "__main__":
    run()
