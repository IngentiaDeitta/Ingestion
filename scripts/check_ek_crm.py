import os
import json
import urllib.request
import urllib.parse

SUPABASE_URL = "https://gaawloviqgyzmqbtjsmd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdsb3ZpcWd5em1xYnRqc21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMDQwMiwiZXhwIjoyMDg4Nzc2NDAyfQ.bFDCYGlwGLfy50pxS1f0G4uyNOrZS3qBXcsG1wJSKqs"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

output_lines = []

def log(msg):
    output_lines.append(str(msg))
    print(msg, flush=True)

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        log(f"Error fetching {endpoint}: {e}")
        return []

log("=== BUSCANDO PROYECTO 'EK CRM' ===")
projects = supabase_get("projects?select=id,name,client_id,status,project_analysis")
matching_projects = [p for p in projects if "ek" in p.get("name", "").lower() or "crm" in p.get("name", "").lower()]
log(f"Proyectos encontrados ({len(matching_projects)}):")
for p in matching_projects:
    log(f"  - ID: {p['id']} | Nombre: {p['name']} | Status: {p.get('status')}")

log("\n=== BUSCANDO CLIENTES CON 'leandrogino@gmail.com' O 'EK' ===")
clients = supabase_get("clients?select=id,name,email,company")
matching_clients = [c for c in clients if "leandro" in (c.get("email") or "").lower() or "ek" in (c.get("name") or "").lower() or "ek" in (c.get("company") or "").lower()]
log(f"Clientes encontrados ({len(matching_clients)}):")
for c in matching_clients:
    log(f"  - ID: {c['id']} | Nombre: {c.get('name')} | Email: {c.get('email')} | Empresa: {c.get('company')}")

log("\n=== BUSCANDO LEADS CON 'leandrogino@gmail.com' ===")
leads = supabase_get("leads_cuentas?select=id,empresa,contacto_nombre,email,transcript_text")
matching_leads = [l for l in leads if "leandro" in (l.get("email") or "").lower() or "leandrogino" in (l.get("email") or "").lower()]
log(f"Leads encontrados ({len(matching_leads)}):")
for l in matching_leads:
    log(f"  - ID: {l['id']} | Empresa: {l.get('empresa')} | Nombre: {l.get('contacto_nombre')} | Email: {l.get('email')}")
    if l.get("transcript_text"):
        log(f"    Transcript presente: {len(l['transcript_text'])} caracteres")
    else:
        log(f"    Transcript: Vacio")

os.makedirs(".tmp", exist_ok=True)
with open(".tmp/check_ek_crm.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))
