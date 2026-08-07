import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"

# Buscar el contacto 0b2df0f2-0160-4df2-844a-031d3fafec11 o el 3er contacto de EK
res = supabase.table("client_contacts").update({
    "first_name": "Claudia",
    "last_name": "Mattei",
    "role": "Responsable Comercial y Operativa",
    "email": "cmattei@elektrokorrosion.com.ar"
}).eq("id", "0b2df0f2-0160-4df2-844a-031d3fafec11").execute()

print("Contacto actualizado:", res.data)

print("\n--- CONTACTOS ACTUALES ELEKTROKORROSION ---")
contacts = supabase.table("client_contacts").select("id, first_name, last_name, role, email").eq("client_id", EK_CLIENT_ID).execute().data
print(json.dumps(contacts, indent=2))
