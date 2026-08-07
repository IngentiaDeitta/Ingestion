import os
import sys
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidos en .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

UNIFIED_PROJECT_NAME = "DripColor"
UNIFIED_CLIENT_NAME = "DripColor SRL"

NAMES_TO_MERGE = [
    "DripColor",
    "Sistema de Producción y Costeo - DripColor",
    "Diagnóstico Operativo - DripColor"
]

def run():
    print("=== Iniciando Unificación de Proyectos DripColor ===")

    # 1. Obtener los proyectos existentes de DripColor
    proj_res = supabase.table("projects").select("*").in_("name", NAMES_TO_MERGE).execute()
    existing_projects = proj_res.data or []

    print(f"Se encontraron {len(existing_projects)} proyectos de DripColor:")
    for p in existing_projects:
        print(f"  - [{p['id']}] {p['name']} (Cliente: {p.get('client')}, Presupuesto: ${p.get('budget', 0)})")

    if not existing_projects:
        print("No se encontraron proyectos para unificar.")
        return

    # Buscar el proyecto principal 'DripColor' o elegir el primero
    main_proj = next((p for p in existing_projects if p["name"] == UNIFIED_PROJECT_NAME), existing_projects[0])
    main_proj_id = main_proj["id"]
    other_proj_ids = [p["id"] for p in existing_projects if p["id"] != main_proj_id]

    print(f"\nProyecto Destino Principal: '{main_proj['name']}' (ID: {main_proj_id})")

    # 2. Estandarizar Cliente en tabla 'clients'
    client_res = supabase.table("clients").select("*").ilike("name", "%DripColor%").execute()
    clients = client_res.data or []
    print(f"\nClientes DripColor encontrados: {len(clients)}")

    if clients:
        # Asegurar cliente principal 'DripColor SRL'
        main_client = next((c for c in clients if c["name"] == UNIFIED_CLIENT_NAME), clients[0])
        supabase.table("clients").update({"name": UNIFIED_CLIENT_NAME, "status": "Activo"}).eq("id", main_client["id"]).execute()
        # Eliminar o renombrar duplicados
        for c in clients:
            if c["id"] != main_client["id"]:
                try:
                    supabase.table("clients").delete().eq("id", c["id"]).execute()
                except Exception as e:
                    print(f"Nota al limpiar cliente {c['name']}: {e}")
    else:
        new_c = supabase.table("clients").insert([{"name": UNIFIED_CLIENT_NAME, "status": "Activo"}]).execute()

    # 3. Consolidar Hitos del Cronograma Unificado
    unified_milestones = [
        {
            "id": "dc-milestone-01",
            "title": "Diagnóstico Operativo e Insumos Iniciales",
            "description": "Relevamiento de flujos de trabajo, auditoría de procesos y entrega de insumos iniciales.",
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
            "description": "Diseño de interfaz para sistema de producción, costeo y cotizador inteligente DripColor.",
            "type": "both",
            "estimated_date": "2026-06-30",
            "real_date": "2026-07-02",
            "completed": True,
            "amount": 3500.0,
            "billing_confirmed": True
        },
        {
            "id": "dc-milestone-03",
            "title": "Sistema de Producción, Costeo & Conexión BBDD Real",
            "description": "Integración con motor de costeo de tintas, base de datos real y agentes IA.",
            "type": "both",
            "estimated_date": "2026-08-25",
            "real_date": None,
            "completed": False,
            "amount": 4000.0,
            "billing_confirmed": False
        },
        {
            "id": "dc-milestone-04",
            "title": "Lanzamiento Final, Integración Omnicanal & Capacitación",
            "description": "Despliegue a producción, taller operativo para el equipo comercial y acta de cierre.",
            "type": "both",
            "estimated_date": "2026-09-30",
            "real_date": None,
            "completed": False,
            "amount": 3000.0,
            "billing_confirmed": False
        }
    ]

    total_budget = sum(m["amount"] for m in unified_milestones) # 13,000 USD
    completed_milestones = sum(1 for m in unified_milestones if m["completed"])
    calculated_progress = int((completed_milestones / len(unified_milestones)) * 100) # 50%

    project_analysis_payload = {
        "milestones": unified_milestones,
        "summary": "Proyecto unificado e integral DripColor: Diagnóstico Operativo, Sistema de Producción & Costeo y Agentes IA de Cotización."
    }

    # 4. Actualizar Proyecto Principal 'DripColor'
    supabase.table("projects").update({
        "name": UNIFIED_PROJECT_NAME,
        "client": UNIFIED_CLIENT_NAME,
        "budget": total_budget,
        "progress": calculated_progress,
        "status": "En Progreso",
        "due_date": "2026-09-30",
        "description": "Solución unificada e integral para DripColor: Diagnóstico Operativo, Sistema de Producción y Costeo, Cotizador Inteligente y Agentes IA.",
        "project_analysis": project_analysis_payload,
        "delegated_to": "In-house",
        "outcome": "Aceptado"
    }).eq("id", main_proj_id).execute()

    print(f"\n[ACTUALIZADO] Proyecto unificado '{UNIFIED_PROJECT_NAME}' configurado con presupuesto total de ${total_budget:,.2f} USD.")

    # 5. Reasignar Tareas de los proyectos secundarios al proyecto unificado
    for name in NAMES_TO_MERGE:
        t_res = supabase.table("tasks").update({"project": UNIFIED_PROJECT_NAME}).eq("project", name).execute()
        if t_res.data:
            print(f"Reasignadas {len(t_res.data)} tareas de '{name}' -> '{UNIFIED_PROJECT_NAME}'")

    # 6. Reasignar Finanzas de los proyectos secundarios al proyecto principal ID
    for other_id in other_proj_ids:
        fin_res = supabase.table("finances").update({"project_id": main_proj_id}).eq("project_id", other_id).execute()
        if fin_res.data:
            print(f"Reasignadas {len(fin_res.data)} transacciones de finanzas del proyecto ID {other_id} al principal {main_proj_id}")

        # Limpiar registros de equipo en el proyecto secundario
        try:
            supabase.table("project_team").delete().eq("project_id", other_id).execute()
        except Exception as e:
            print(f"Nota en equipo: {e}")

    # 7. Eliminar los proyectos secundarios fragmentados
    for other_id in other_proj_ids:
        # Limpiar referencias residuales en project_team si hubiera duplicados
        supabase.table("project_team").delete().eq("project_id", other_id).execute()
        del_proj = supabase.table("projects").delete().eq("id", other_id).execute()
        print(f"[ELIMINADO] Proyecto fragmentado secundario ID: {other_id}")

    # 8. Asegurar Tareas Unificadas Completas en el Kanban
    # Borramos tareas para garantizar una lista de tareas completa y sin duplicados en el Kanban
    supabase.table("tasks").delete().eq("project", UNIFIED_PROJECT_NAME).execute()

    unified_tasks = [
        # --- FASE 1: Auditoría (Diagnóstico Operativo - Completadas) ---
        {
            "title": "Diagnóstico Operativo y levantamiento de flujos de trabajo DripColor",
            "project": UNIFIED_PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Auditoría",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 12,
            "actual_hours": 12,
            "due_date": "2026-05-10",
            "tags": ["milestone:dc-milestone-01"],
            "description": "Análisis exhaustivo del proceso operativo actual y mapa de dolor de DripColor."
        },
        {
            "title": "Auditoría de catálogo de productos, materias primas y márgenes de costeo",
            "project": UNIFIED_PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Auditoría",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 14,
            "actual_hours": 14,
            "due_date": "2026-05-14",
            "tags": ["milestone:dc-milestone-01"],
            "description": "Mapeo de insumos de producción, fórmulas de costeo de tintas y coeficientes de margen."
        },

        # --- FASE 2: Arquitectura & Prototipo (Completadas) ---
        {
            "title": "Diseño de arquitectura unificada para Producción, Costeo y Cotizaciones",
            "project": UNIFIED_PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 16,
            "actual_hours": 16,
            "due_date": "2026-06-10",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Modelo de datos integrado para el módulo de producción, cálculo de costos y cotizador."
        },
        {
            "title": "Prototipo interactivo UI/UX del sistema de producción y cotizador DripColor",
            "project": UNIFIED_PROJECT_NAME,
            "status": "done",
            "priority": "Media",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 18,
            "actual_hours": 18,
            "due_date": "2026-06-25",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Maquetación navegable de las pantallas de producción, costeo y emisión de presupuestos."
        },
        {
            "title": "Validación y ajustes del modelo de BBDD con Clau/Leo",
            "project": UNIFIED_PROJECT_NAME,
            "status": "done",
            "priority": "Alta",
            "phase": "Arquitectura & Prototipo",
            "assignee": "Pedro",
            "assignees": ["Pedro", "Fer"],
            "hours": 10,
            "actual_hours": 10,
            "due_date": "2026-07-02",
            "tags": ["milestone:dc-milestone-02"],
            "description": "Aprobación conjunta de la estructura de base de datos de producción y clientes."
        },

        # --- FASE 3: Construcción & IA (Fase Actual Activa en Kanban) ---
        {
            "title": "Desarrollo de conectores e integración con BBDD real de Producción y Stock",
            "project": UNIFIED_PROJECT_NAME,
            "status": "in-progress",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 24,
            "actual_hours": 8,
            "due_date": "2026-08-10",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Conexión a base de datos real de insumos de producción y stock en tiempo real."
        },
        {
            "title": "Entrenamiento del Agente Cotizador y Motor de Costeo Automatizado",
            "project": UNIFIED_PROJECT_NAME,
            "status": "in-progress",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 20,
            "actual_hours": 6,
            "due_date": "2026-08-15",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Calibración del motor de costeo automático según especificaciones técnicas de DripColor."
        },
        {
            "title": "Diseño de plantillas de orden de producción y presupuestos PDF",
            "project": UNIFIED_PROJECT_NAME,
            "status": "in-progress",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Tercero (Freelance)",
            "assignees": ["Tercero (Freelance)"],
            "hours": 14,
            "actual_hours": 4,
            "due_date": "2026-08-18",
            "delegable": True,
            "tags": ["milestone:dc-milestone-03"],
            "description": "Plantillas exportables de órdenes de trabajo para planta y cotizaciones al cliente."
        },
        {
            "title": "Implementación del panel unificado de control financiero e hitos",
            "project": UNIFIED_PROJECT_NAME,
            "status": "review",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 16,
            "due_date": "2026-08-20",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Control de cobros por avance, costos operativos y margen de rentabilidad."
        },
        {
            "title": "Pruebas integrales del flujo de producción, costeo y venta",
            "project": UNIFIED_PROJECT_NAME,
            "status": "todo",
            "priority": "Alta",
            "phase": "Construcción & IA",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 18,
            "due_date": "2026-08-24",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Testeo E2E simulando solicitudes de cotización y órdenes de producción reales."
        },
        {
            "title": "Creación de la documentación de Proyecto y manual operativo unificado",
            "project": UNIFIED_PROJECT_NAME,
            "status": "todo",
            "priority": "Media",
            "phase": "Construcción & IA",
            "assignee": "Fer",
            "assignees": ["Fer", "Pedro"],
            "hours": 10,
            "due_date": "2026-08-25",
            "tags": ["milestone:dc-milestone-03"],
            "description": "Manual completo de operaciones para el personal comercial y de planta."
        },

        # --- FASE 4: Lanzamiento (Próxima Fase) ---
        {
            "title": "Despliegue a producción de la plataforma unificada DripColor",
            "project": UNIFIED_PROJECT_NAME,
            "status": "todo",
            "priority": "Alta",
            "phase": "Lanzamiento",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 12,
            "due_date": "2026-09-15",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Despliegue en producción, verificación de dominio y monitoreo inicial."
        },
        {
            "title": "Capacitación operativa al equipo comercial y de planta DripColor",
            "project": UNIFIED_PROJECT_NAME,
            "status": "todo",
            "priority": "Media",
            "phase": "Lanzamiento",
            "assignee": "Pedro",
            "assignees": ["Pedro"],
            "hours": 8,
            "due_date": "2026-09-22",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Taller práctico de uso del cotizador y panel de producción."
        },
        {
            "title": "Cierre de proyecto y firma de acta de conformidad final",
            "project": UNIFIED_PROJECT_NAME,
            "status": "todo",
            "priority": "Baja",
            "phase": "Lanzamiento",
            "assignee": "Fer",
            "assignees": ["Fer"],
            "hours": 4,
            "due_date": "2026-09-30",
            "tags": ["milestone:dc-milestone-04"],
            "description": "Entrega final de documentación y firma de acta de conformidad."
        }
    ]

    ins_res = supabase.table("tasks").insert(unified_tasks).execute()
    print(f"\n[OK] Insertadas {len(ins_res.data)} tareas unificadas para '{UNIFIED_PROJECT_NAME}'")

    print("\n=== Unificación completada exitosamente ===")

if __name__ == "__main__":
    run()
