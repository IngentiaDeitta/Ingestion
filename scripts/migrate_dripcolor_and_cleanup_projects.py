import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

DRIPCOLOR_CLIENT_ID = "36f4934d-a403-4473-81b1-d74ed7cc3b78"
DRIPCOLOR_LEAD_ID = 20
EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"
EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec"

print("1. Migrando DripColor a Lead (estado PERDIDA)...")
# Actualizar estado de lead DripColor
res = supabase.table("leads_cuentas").update({"estado": "PERDIDA"}).eq("id", DRIPCOLOR_LEAD_ID).execute()
print("Lead DripColor actualizado:", res.data)

# Actualizar cotizaciones de DripColor
res_quotes = supabase.table("quotes").update({
    "status": "Perdida",
    "lead_id": DRIPCOLOR_LEAD_ID,
    "client_id": None
}).eq("client_id", DRIPCOLOR_CLIENT_ID).execute()
print("Cotizaciones DripColor actualizadas:", res_quotes.data)

# Actualizar contactos de DripColor
res_contacts = supabase.table("client_contacts").update({
    "lead_id": DRIPCOLOR_LEAD_ID,
    "client_id": None
}).eq("client_id", DRIPCOLOR_CLIENT_ID).execute()
print("Contactos DripColor desvinculados de cliente:", res_contacts.data)

print("\n2. Eliminando proyectos de prueba exceptuando 'EK CRM'...")
# Eliminar otros proyectos
res_projects = supabase.table("projects").delete().neq("id", EK_PROJECT_ID).execute()
print("Proyectos eliminados:", res_projects.data)

print("\n3. Eliminando DripColor de la tabla de clientes...")
# Eliminar cliente DripColor
res_del_client = supabase.table("clients").delete().eq("id", DRIPCOLOR_CLIENT_ID).execute()
print("Cliente DripColor eliminado:", res_del_client.data)

print("\n4. Asegurando 3 contactos para Elektrokorrosion...")
# Verificar contactos de EK
ek_contacts = supabase.table("client_contacts").select("*").eq("client_id", EK_CLIENT_ID).execute().data
print("Contactos actuales EK:", len(ek_contacts))

if len(ek_contacts) < 3:
    new_contact = {
        "client_id": EK_CLIENT_ID,
        "first_name": "Claudio",
        "last_name": "Gino",
        "email": "claudio.gino@elektrokorrosion.com.ar",
        "phone": "+54 9 11 4539-0035",
        "role": "Director / Socio"
    }
    res_add_contact = supabase.table("client_contacts").insert([new_contact]).execute()
    print("3er contacto agregado a Elektrokorrosion:", res_add_contact.data)
else:
    print("Elektrokorrosion ya cuenta con 3 o más contactos.")

print("\n--- RESUMEN FINAL ---")
print("Clientes actuales:")
print(supabase.table("clients").select("id, name").execute().data)

print("Proyectos actuales:")
print(supabase.table("projects").select("id, name").execute().data)

print("Leads actuales:")
print(supabase.table("leads_cuentas").select("id, empresa, estado").execute().data)
