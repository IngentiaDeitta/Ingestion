import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def supabase_get(endpoint):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {endpoint}: {e}")
        return None

print("=== PROJECTS ===")
projects = supabase_get("projects?select=*")
if projects:
    for p in projects:
        print(f"- ID: {p.get('id')} | Name: {p.get('name')} | Client: {p.get('client')}")
        # print first transcript if any
        transcripts = p.get("project_analysis", {}).get("transcripts", []) if p.get("project_analysis") else []
        print(f"  Transcripts count: {len(transcripts)}")
        for t in transcripts:
            print(f"    * {t.get('created_at')} - {t.get('summary')}")

print("\n=== CLIENTS ===")
clients = supabase_get("clients?select=*")
if clients:
    for c in clients:
        print(f"- ID: {c.get('id')} | Name: {c.get('name')} | Email: {c.get('email')}")
        transcripts = c.get("client_analysis", {}).get("transcripts", []) if c.get("client_analysis") else []
        print(f"  Transcripts count: {len(transcripts)}")
        for t in transcripts:
            print(f"    * {t.get('created_at')} - {t.get('summary')}")

print("\n=== LEADS ===")
leads = supabase_get("leads_cuentas?select=*")
if leads:
    for l in leads:
        print(f"- ID: {l.get('id')} | Empresa: {l.get('empresa')} | Nombre: {l.get('contacto_nombre')} | Email: {l.get('email')}")
        if l.get("transcript_text"):
            print(f"  Transcript: {l.get('transcript_text')[:150]}...")
