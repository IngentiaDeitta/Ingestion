import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("--- CLIENTS ---")
clients = supabase.table("clients").select("*").execute()
print(json.dumps(clients.data, indent=2))

print("\n--- LEADS ---")
leads = supabase.table("leads_cuentas").select("*").execute()
print(json.dumps(leads.data, indent=2))

print("\n--- PROJECTS ---")
projects = supabase.table("projects").select("*").execute()
print(json.dumps(projects.data, indent=2))

print("\n--- QUOTES ---")
try:
    quotes = supabase.table("quotes").select("*").execute()
    print(json.dumps(quotes.data, indent=2))
except Exception as e:
    print("Error quotes:", e)

print("\n--- CLIENT CONTACTS ---")
try:
    contacts = supabase.table("client_contacts").select("*").execute()
    print(json.dumps(contacts.data, indent=2))
except Exception as e:
    print("Error contacts:", e)
