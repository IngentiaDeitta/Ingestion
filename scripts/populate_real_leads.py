import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"

leads_data = [
    {
        "empresa": "DripColor SRL",
        "dominio": "dripcolor.com",
        "sector": "Alimenticia / Repostería",
        "contacto_nombre": "Edith Sanchez",
        "email": "esanchez@dripcolor.com",
        "estado": "PERDIDA",
        "fuente": "Inbound",
        "notas": "Propuesta enviada el 11/03/2026 no aceptada. Migrada desde Cliente a Lead con estado PERDIDA."
    },
    {
        "empresa": "Elektro Korrosión SRL",
        "dominio": "elektrokorrosion.com.ar",
        "sector": "Electromecánica / Protección Catódica",
        "contacto_nombre": "Federico Gino",
        "email": "ingfedericogino@gmail.com",
        "telefono": "+54 9 11 4539-0034",
        "estado": "CONVERTIDO",
        "fuente": "Outbound (Apollo)",
        "converted_client_id": EK_CLIENT_ID
    },
    {
        "empresa": "Laboratorios Andrómaco SA",
        "dominio": "andromaco.com.ar",
        "sector": "Farmacéutico / Cosmética",
        "contacto_nombre": "Diego Sturla",
        "email": "dsturla@andromaco.com.ar",
        "estado": "REUNION_AGENDADA",
        "fuente": "Manual",
        "notas": "Contacto de prospección con Diego Sturla para evaluación de soluciones de Inteligencia Artificial."
    }
]

for l in leads_data:
    try:
        res = supabase.table("leads_cuentas").insert([l]).execute()
        print(f"Lead {l['empresa']} insertado:", res.data)
    except Exception as e:
        print(f"Error insertando {l['empresa']}:", e)

print("\n--- LEADS ACTUALES ---")
print(supabase.table("leads_cuentas").select("id, empresa, estado, fuente").execute().data)

print("\n--- CLIENTES ACTUALES ---")
print(supabase.table("clients").select("id, name").execute().data)

print("\n--- PROYECTOS ACTUALES ---")
print(supabase.table("projects").select("id, name, client, status").execute().data)

print("\n--- CONTACTOS ACTUALES ---")
print(supabase.table("client_contacts").select("id, first_name, last_name, email, client_id, lead_id").execute().data)
