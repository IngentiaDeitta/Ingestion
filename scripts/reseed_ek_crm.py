import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"

# 1. Insertar el proyecto EK CRM
ek_project = {
    "name": "EK CRM - Ecosistema de Gestión Comercial e Inteligencia Operativa",
    "client": "Elektro Korrosión",
    "description": "Implementación unificada de CRM omnicanal para Elektro Korrosión: unificación de 20.000 presupuestos históricos, integración de WhatsApp, Outlook y HubSpot mediante n8n, y motor de recomendación con IA.",
    "status": "En Progreso",
    "budget": 7500,
    "progress": 35,
    "due_date": "2026-09-30",
    "delegated_to": "Propio"
}

res_p = supabase.table("projects").insert([ek_project]).execute()
print("Proyecto EK CRM creado:", res_p.data)

# 2. Asegurar los leads en 'leads_cuentas':
existing_leads = supabase.table("leads_cuentas").select("*").execute().data
existing_names = [l.get("empresa", "").lower() for l in existing_leads]

print("Leads existentes:", [l.get("empresa") for l in existing_leads])

# DripColor (PERDIDA)
if not any("dripcolor" in n for n in existing_names):
    lead_drip = {
        "empresa": "DripColor SRL",
        "dominio": "dripcolor.com",
        "sector": "Alimenticia / Repostería",
        "contacto_nombre": "Edith Sanchez",
        "estado": "PERDIDA",
        "fuente": "Inbound",
        "notas": "Propuesta enviada no aceptada. Migrado desde cliente a Lead Perdido."
    }
    supabase.table("leads_cuentas").insert([lead_drip]).execute()
    print("Lead DripColor creado en estado PERDIDA.")
else:
    supabase.table("leads_cuentas").update({"estado": "PERDIDA"}).ilike("empresa", "%dripcolor%").execute()
    print("Estado DripColor actualizado a PERDIDA.")

# EK Elektrokorrosion
if not any("elektro" in n for n in existing_names):
    lead_ek = {
        "empresa": "Elektro Korrosión SRL",
        "dominio": "elektrokorrosion.com.ar",
        "sector": "Electromecánica / Protección Catódica",
        "contacto_nombre": "Federico Gino",
        "estado": "CONVERTIDO",
        "fuente": "Outbound (Apollo)",
        "converted_client_id": EK_CLIENT_ID
    }
    supabase.table("leads_cuentas").insert([lead_ek]).execute()
    print("Lead Elektro Korrosión creado en estado CONVERTIDO.")

# Laboratorios Andrómaco
if not any("andrómaco" in n or "andromaco" in n for n in existing_names):
    lead_andro = {
        "empresa": "Laboratorios Andrómaco SA",
        "dominio": "andromaco.com.ar",
        "sector": "Farmacéutico / Cosmética",
        "contacto_nombre": "Diego Sturla",
        "estado": "REUNION_AGENDADA",
        "fuente": "Manual",
        "notas": "Contacto inicial con Diego Sturla para evaluación de automatizaciones con IA."
    }
    supabase.table("leads_cuentas").insert([lead_andro]).execute()
    print("Lead Laboratorios Andrómaco creado.")

print("\n--- BASE DE DATOS FINALIZADA ---")
print("PROYECTOS:", supabase.table("projects").select("id, name, client, status").execute().data)
print("CLIENTES:", supabase.table("clients").select("id, name").execute().data)
print("LEADS:", supabase.table("leads_cuentas").select("id, empresa, estado").execute().data)
print("CONTACTOS:", supabase.table("client_contacts").select("id, first_name, last_name, client_id, lead_id").execute().data)
