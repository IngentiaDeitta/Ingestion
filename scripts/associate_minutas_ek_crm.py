import os
import json
import uuid
import datetime
import urllib.request
import urllib.parse

SUPABASE_URL = "https://gaawloviqgyzmqbtjsmd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdsb3ZpcWd5em1xYnRqc21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMDQwMiwiZXhwIjoyMDg4Nzc2NDAyfQ.bFDCYGlwGLfy50pxS1f0G4uyNOrZS3qBXcsG1wJSKqs"

EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec"
EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"
LEANDRO_EMAIL = "leandro.gino@gmail.com"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def supabase_request(endpoint, method="GET", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_data = resp.read().decode('utf-8')
            return json.loads(resp_data) if resp_data else {}
    except Exception as e:
        print(f"[-] Error en {method} {endpoint}: {e}")
        return None

def run():
    print("[*] 1. Obteniendo proyecto EK CRM...")
    projects = supabase_request(f"projects?id=eq.{EK_PROJECT_ID}")
    if not projects:
        print("[-] Proyecto EK CRM no encontrado.")
        return

    project = projects[0]
    print(f"[+] Proyecto encontrado: {project.get('name')}")
    
    current_analysis = project.get("project_analysis") or {}
    
    # 3 Minutas con Resumen Detallado de Tactiq y Action Items
    minutas_leandro = [
        {
            "id": "tactiq-ek-001",
            "project_id": EK_PROJECT_ID,
            "created_at": "2026-07-09T17:00:00Z",
            "summary": "Validación de Entregables Fase 0 y II · Prototipo Interactivo CRM",
            "detailed_summary": (
                "🎯 OBJETIVO DE LA SESIÓN:\n"
                "Revisión y validación del prototipo interactivo de alta fidelidad para el ecosistema comercial To-Be de Elektro Korrosión con Leandro Gino.\n\n"
                "📌 PUNTOS TRATADOS Y DEMOSTRACIÓN:\n"
                "• Demostración integral del flujo comercial: Bandeja de entrada omnicanal, módulo de Clientes 360, pipeline de presupuestos y gestión de obras de tratamiento de agua.\n"
                "• Verificación de la navegación To-Be y eliminación de la fricción entre las sedes de CABA y El Talar.\n"
                "• Presentación de la matriz de requerimientos aprobada para el arranque de integraciones técnicas con n8n.\n\n"
                "💡 CONCLUSIÓN Y ACUERDOS:\n"
                "La dirección operativa aprueba formalmente el prototipo interactivo. Se da por concluido el Módulo 1 (Relevamiento As-Is/To-Be, Auditoría BBDD de 20k presupuestos y Prototipo) y se autoriza la emisión del acta de entrega para facturación del hito (USD 1.500)."
            ),
            "action_items": [
                "Emitir acta de entrega de prototipo interactivo y factura correspondiente (USD 1.500).",
                "Comenzar la configuración de flujos n8n para sincronización de WhatsApp y Outlook con el backend del CRM.",
                "Coordinar sesión técnica para definir permisos de usuarios comerciales y técnicos de campo."
            ],
            "attendees": ["Leandro Gino (Responsable de Validación - Elektro Korrosión)", "Fernando Miceli (IngentIA)", "Pedro Sequeira (IngentIA)"],
            "transcript_text": (
                "Reunión de avance y validación con Leandro Gino (leandrogino@gmail.com).\n"
                "Asistentes: Leandro Gino (Responsable de Validación - Elektro Korrosión), Equipo IngentIA.\n"
                "Objetivo: Revisión del prototipo interactivo (Home, Clientes360, Gestión Comercial, Obras) y matriz de requerimientos To-Be.\n\n"
                "Acuerdos clave:\n"
                "1. Se aprueba la navegación del prototipo de alta fidelidad para el flujo comercial y pipeline de presupuestos.\n"
                "2. Confirmación del alcance del Módulo 1 (Relevamiento As-Is/To-Be, Auditoría BBDD de 20k presupuestos y Prototipo).\n"
                "3. Preparación de acta de entrega para facturación del hito contra entrega (USD 1.500) y planificación de arranque del Módulo 2 con automatizaciones n8n."
            )
        },
        {
            "id": "tactiq-ek-002",
            "project_id": EK_PROJECT_ID,
            "created_at": "2026-07-02T15:30:00Z",
            "summary": "Auditoría de Calidad y Limpieza de BBDD Histórica",
            "detailed_summary": (
                "🎯 OBJETIVO DE LA SESIÓN:\n"
                "Presentación de resultados de la auditoría técnica de datos históricos de Elektro Korrosión (155.666 registros brutos).\n\n"
                "📌 PUNTOS TRATADOS Y HALLAZGOS TÉCNICOS:\n"
                "• Auditoría de 155.666 registros con depuración de duplicados, correos inválidos y registros incompletos.\n"
                "• Consolidación en tablas silver: 101.420 leads y clientes corporativos limpios y listos para migración.\n"
                "• Estructuración y tipificación de 2.284 presupuestos históricos y 1.212 obras ejecutadas de protección catódica y tratamientos electrolíticos.\n"
                "• Definición de reglas de deduplicación unificadas por CUIT, Razón Social y Dominio web.\n\n"
                "💡 CONCLUSIÓN Y ACUERDOS:\n"
                "Esquema de datos maestro validado por Leandro Gino. Hito 1 (USD 1.000) completado exitosamente."
            ),
            "action_items": [
                "Exportar base silver normalizada al entorno de desarrollo del CRM.",
                "Implementar reglas de validación de CUIT en los formularios de alta de nuevos clientes.",
                "Registrar confirmación de facturación de Hito 1 en módulo de Finanzas IngentIA."
            ],
            "attendees": ["Leandro Gino", "Equipo de Ingeniería de Datos IngentIA"],
            "transcript_text": (
                "Sesión técnica de depuración de datos con Leandro Gino (leandrogino@gmail.com).\n"
                "Asistentes: Leandro Gino, Equipo de Ingeniería IngentIA.\n"
                "Objetivo: Presentación de resultados de la auditoría de 155.666 registros y consolidación en tablas silver.\n\n"
                "Puntos tratados:\n"
                "- Clasificación de leads en silver_leads (101k válidos) y descarte justificado de duplicados/inválidos.\n"
                "- Normalización del histórico de 2.284 presupuestos y 1.212 obras de protección catódica y tratamiento de agua.\n"
                "- Validación del esquema maestro y reglas de deduplicación por CUIT/Razón Social."
            )
        },
        {
            "id": "tactiq-ek-003",
            "project_id": EK_PROJECT_ID,
            "created_at": "2026-05-28T16:00:00Z",
            "summary": "Definición Funcional y Mapeo de Procesos As-Is / To-Be",
            "detailed_summary": (
                "🎯 OBJETIVO DE LA SESIÓN:\n"
                "Relevamiento profundo de los 16 pasos del ciclo comercial y operativo de Elektro Korrosión.\n\n"
                "📌 PUNTOS TRATADOS Y DIAGNÓSTICO:\n"
                "• Mapeo del proceso As-Is: La información comercial se encuentra fragmentada entre HubSpot desactualizado, archivos Excel locales y casillas de correo privadas en Outlook.\n"
                "• Detección de cuellos de botella: Los presupuestos de ingeniería tardan entre 3 y 5 días hábiles en confeccionarse y se pierde el seguimiento de oportunidades activas.\n"
                "• Arquitectura To-Be deseada: Sistema centralizado web con generación ágil de cotizaciones, seguimiento de obras e integraciones automáticas vía WhatsApp.\n\n"
                "💡 CONCLUSIÓN Y ACUERDOS:\n"
                "Se acuerda el Roadmap del proyecto en 4 fases, priorizando la limpieza de la base y el prototipado rápido."
            ),
            "action_items": [
                "Finalizar documento de Arquitectura Funcional To-Be.",
                "Iniciar la fase de auditoría de datos sobre el histórico provisto por el cliente.",
                "Programar siguiente sesión de revisión técnica de esquema de base de datos."
            ],
            "attendees": ["Leandro Gino", "IngentIA Tech Solutions"],
            "transcript_text": (
                "Reunión de relevamiento de arquitectura funcional con Leandro Gino (leandrogino@gmail.com).\n"
                "Asistentes: Leandro Gino, IngentIA Tech.\n\n"
                "Puntos clave:\n"
                "- Relevamiento de 16 pasos del ciclo de cotización y ventas de Elektro Korrosión.\n"
                "- Identificación de dolor: dispersión entre HubSpot, Excel y correos personales de Outlook sin visibilidad de pipeline.\n"
                "- Definición del objetivo To-Be: CRM centralizado con automatizaciones n8n, cotizador inteligente y soporte omnicanal."
            )
        }
    ]

    # Síntesis inteligente consolidada generada a partir de los 3 resúmenes detallados
    meeting_intelligence = {
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
        "executive_summary": (
            "A partir de los resúmenes detallados de las sesiones de relevamiento y auditoría con Leandro Gino (Elektro Korrosión), "
            "se consolidó el diagnóstico operativo y la arquitectura del nuevo CRM a medida. Se completó "
            "con éxito la normalización de la base de datos histórica (155k registros y 20k presupuestos) "
            "y se aprobó la navegación del prototipo interactivo To-Be. El proyecto avanza hacia la integración "
            "del motor de IA y flujos omnicanal n8n."
        ),
        "key_decisions": [
            "Aprobación de la arquitectura de navegación To-Be (Clientes360, Gestión Comercial, Obras).",
            "Consolidación de esquema maestro de datos con deduplicación por CUIT y Razón Social.",
            "Descarte de HubSpot y planillas aisladas a favor de una plataforma web integrada con automatizaciones n8n."
        ],
        "agreed_commitments": [
            "Hito 1 (Auditoría y normalización de BBDD) completado y facturado por USD 1.000.",
            "Hito 2 (Arquitectura & Prototipo CRM) aprobado para emisión de acta de entrega por USD 1.500.",
            "Inicio programado de Fase III: Motor de IA y conectores WhatsApp/Outlook (USD 5.000)."
        ],
        "identified_pain_points": [
            "Dispersión operativa crítica entre Outlook personal, planillas Excel y HubSpot desactualizado.",
            "Demora de hasta 4 días hábiles en confección y seguimiento de cotizaciones complejas de tratamiento de agua.",
            "Falta de trazabilidad sobre inspecciones técnicas en campo entre las sedes de CABA y El Talar."
        ],
        "next_steps": [
            "Emisión formal de acta de entrega de prototipo e inicio de desarrollo de conectores n8n.",
            "Configuración del motor de cotización automática para agentes comerciales.",
            "Pruebas de ingesta en vivo con equipo de ventas de Elektro Korrosión."
        ]
    }

    current_analysis["transcripts"] = minutas_leandro
    current_analysis["meeting_intelligence"] = meeting_intelligence

    print(f"[*] Actualizando proyecto EK CRM con {len(minutas_leandro)} minutas detalladas y síntesis...")
    supabase_request(
        f"projects?id=eq.{EK_PROJECT_ID}",
        method="PATCH",
        data={"project_analysis": current_analysis}
    )
    print("[+] Proyecto EK CRM actualizado.")

    # 2. Actualizar cliente Elektro Korrosión
    print("[*] 2. Obteniendo cliente Elektro Korrosión...")
    clients = supabase_request(f"clients?id=eq.{EK_CLIENT_ID}")
    if clients:
        client = clients[0]
        client_analysis = client.get("client_analysis") or {}
        client_analysis["transcripts"] = minutas_leandro
        client_analysis["meeting_intelligence"] = meeting_intelligence
        client_analysis["social_presence"] = {
            "web": "https://www.elektrokorrosion.com.ar",
            "facebook": "https://www.facebook.com/elektrokorrosion.ar",
            "linkedin": "https://www.linkedin.com/company/elektro-korrosion",
            "instagram": "https://www.instagram.com/elektrokorrosion",
            "sentiment": "POSITIVO",
            "google_rating": None,
            "google_reviews_count": None,
            "linkedin_followers": None,
            "instagram_followers": None
        }

        print("[*] Actualizando cliente Elektro Korrosión con minutas detalladas y síntesis...")
        supabase_request(
            f"clients?id=eq.{EK_CLIENT_ID}",
            method="PATCH",
            data={"client_analysis": client_analysis}
        )
        print("[+] Cliente Elektro Korrosión actualizado con éxito.")

    print("=== PROCESO DE ACTUALIZACIÓN DE DETALLES TACTIQ COMPLETADO ===")

if __name__ == "__main__":
    run()
