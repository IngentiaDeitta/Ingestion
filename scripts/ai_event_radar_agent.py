import os
import sys
import json
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from ai_router import execute_ai_task

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

JSON_PATH = os.path.join("src", "data", "eventos_industria.json")

def load_local_events():
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_local_events(events):
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

def run_event_radar():
    print("=" * 70)
    print("      INICIANDO AGENTE RADAR DE EVENTOS INDUSTRIALES & PYMES")
    print("=" * 70)

    existing_events = load_local_events()
    known_titles = {e.get("title", "").strip().lower() for e in existing_events}
    known_ids = {e.get("id", "").strip().lower() for e in existing_events}

    prompt = f"""Sos el Agente Radar de Inteligencia Comercial de IngentIA en Argentina.
Tu objetivo es identificar eventos clave de la industria, congresos PyME, exposiciones sectoriales y foros de innovación/tecnología en Argentina para el año 2026/2027.

EVENTOS YA CATALOGADOS (NO DUPLICAR):
{json.dumps([e.get('title') for e in existing_events], ensure_ascii=False)}

Buscá y generá 2 NUEVOS eventos industriales o de PyMEs altamente relevantes en Argentina que NO estén en la lista anterior (ej. Expo EFI - Economía Finanzas e Inversiones, Foro PyME UIA, Metalexpo, Expo Agro, BIAF, etc.).

Devolvé ÚNICAMENTE un JSON válido que sea un arreglo `[ ... ]` con objetos con la siguiente estructura exacta:
[
  {{
    "id": "evt_nombre_corto_2026",
    "title": "Nombre Oficial del Evento 2026",
    "category": "EXPOSICION | CONGRESO | FORO | NETWORKING",
    "organizer": "Institución u Organizador",
    "date_start": "YYYY-MM-DD",
    "date_end": "YYYY-MM-DD",
    "location": "Lugar, Ciudad, Provincia",
    "sectors": ["Sector 1", "Sector 2"],
    "description": "Resumen claro del evento en 2 oraciones.",
    "relevance_ingentia": "ALTA - Justificación de oportunidad comercial para IngentIA",
    "website": "https://..."
  }}
]"""

    print("[1/3] Consultando al Agente de IA para rastreo de nuevos eventos...")
    try:
        raw_response = execute_ai_task(
            prompt=prompt,
            system_instruction="Devolvé ÚNICAMENTE un JSON de arreglo con nuevos eventos industriales reales en Argentina.",
            complexity="simple",
            response_json=True
        )
        new_candidates = json.loads(raw_response)
        if not isinstance(new_candidates, list):
            new_candidates = [new_candidates]
    except Exception as err:
        print(f"[-] Error durante el rastreo del Agente Radar: {err}")
        return []

    print(f"[2/3] Evaluando {len(new_candidates)} candidatos descubiertos...")
    added_events = []

    for candidate in new_candidates:
        title = candidate.get("title", "").strip()
        evt_id = candidate.get("id", "").strip()
        
        if not title:
            continue
            
        if title.lower() in known_titles or evt_id.lower() in known_ids:
            print(f"  - Evento ya conocido, omitiendo: {title}")
            continue

        print(f"  + ¡NUEVO EVENTO DETECTADO! [{candidate.get('category')}] {title} ({candidate.get('date_start')})")
        existing_events.append(candidate)
        added_events.append(candidate)
        known_titles.add(title.lower())
        known_ids.add(evt_id.lower())

    if not added_events:
        print("[+] No se detectaron eventos nuevos sin catalogar en esta corrida.")
        return []

    print(f"[3/3] Guardando {len(added_events)} nuevos eventos y generando alertas...")
    save_local_events(existing_events)

    # Intentar enviar notificación a Supabase
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
            # Sincronizar catálogo en Supabase si existe la tabla
            try:
                supabase.table("eventos_industria").upsert(added_events).execute()
            except Exception:
                pass

            # Crear notificaciones de sistema
            notifications = []
            for evt in added_events:
                notifications.append({
                    "title": f"🔔 Nuevo Evento Industrial: {evt.get('title')}",
                    "content": f"El Agente Radar detectó {evt.get('title')} ({evt.get('date_start')}) en {evt.get('location')}. Relevancia: {evt.get('relevance_ingentia')}.",
                    "type": "info",
                    "is_read": False
                })
            
            supabase.table("system_notifications").insert(notifications).execute()
            print(f"[+] {len(notifications)} alertas insertadas exitosamente en 'system_notifications'.")
        except Exception as e:
            print(f"[!] Notificación en Supabase: {e}. Alertas locales listas en el cliente.")

    # Guardar copia de alertas en .tmp
    os.makedirs(".tmp", exist_ok=True)
    with open(".tmp/event_alerts.json", "w", encoding="utf-8") as f:
        json.dump(added_events, f, indent=2, ensure_ascii=False)

    print("\n[+] ¡Ejecución del Agente Radar de Eventos completada exitosamente!")
    return added_events

if __name__ == "__main__":
    run_event_radar()
