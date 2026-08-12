import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

def main():
    json_path = os.path.join("src", "data", "eventos_industria.json")
    if not os.path.exists(json_path):
        print(f"[-] Error: No se encontró el archivo {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        events = json.load(f)

    print(f"[+] Se cargaron {len(events)} eventos del catálogo local de industria y PyMEs:")
    for evt in events:
        print(f"  - [{evt['category']}] {evt['title']} ({evt['date_start']}) en {evt['location']}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[!] Advertencia: Faltan credenciales de Supabase. La app usará la fuente local JSON.")
        return

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Try to upsert into 'eventos_industria' if table exists
        res = supabase.table("eventos_industria").upsert(events).execute()
        print(f"[+] Supabase Sincronizado Exitosamente: {len(res.data or [])} registros insertados/actualizados.")
    except Exception as e:
        print(f"[i] Supabase Notificación: La tabla 'eventos_industria' aún no existe en Supabase ({e}). La app consumirá los datos desde 'src/data/eventos_industria.json' de forma segura y sin interrupciones.")

if __name__ == "__main__":
    main()
