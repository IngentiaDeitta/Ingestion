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

proposal_data = {
    "id": "e5b8d29a-1122-4433-8899-001122334455",
    "client_id": EK_CLIENT_ID,
    "project_id": EK_PROJECT_ID,
    "client_name": "Elektro Korrosión",
    "project_name": "EK CRM - Ecosistema de Gestión Comercial e Inteligencia Operativa",
    "title": "Propuesta EK CRM - Ecosistema de Gestión Comercial e IA",
    "status": "Aceptada",
    "total_amount": 7500,
    "selected_modules": ["module1", "module2", "module3"],
    "generation_date": "2026-04-10T02:51:47+00:00",
    "sent_date": "2026-04-09T00:00:00+00:00",
    "comments": "Propuesta Aceptada (Opción C: Desarrollo CRM + IA + Mantenimiento Evolutivo). Dio origen al proyecto EK CRM en ejecución.",
    "content": {
        "pricing": {
            "module1": {"price": 2500, "description": "Consultoría estratégica, relevamiento técnico y auditoría de 20.000 presupuestos históricos."},
            "module2": {"price": 5000, "description": "Desarrollo de plataforma CRM, integración n8n, motor de IA y automatizaciones."},
            "module3": {"monthlyPrice": 150, "description": "Soporte técnico, mantenimiento evolutivo y optimización continua de IA."},
            "totalInitialInvestment": 7500
        },
        "diagnosis": "Unificación de silos de datos dispersos en HubSpot, Excel y WhatsApp en un CRM omnicanal maestro.",
        "deliverables": [
            "Base de datos centralizada Master Data",
            "Flujos omnicanal n8n (WhatsApp/Outlook)",
            "Dashboard comercial interactivo",
            "Motor de IA para recomendaciones comerciales"
        ]
    }
}

try:
    res = supabase.table("quotes").upsert([proposal_data]).execute()
    print("[+] Propuesta Ganada de EK CRM insertada/actualizada:", res.data)
except Exception as e:
    print("[-] Error insertando propuesta:", e)

print("\n--- TODAS LAS PROPUESTAS EN SUPABASE ---")
quotes = supabase.table("quotes").select("id, title, client_name, status, total_amount, project_id").execute().data
print(json.dumps(quotes, indent=2))
