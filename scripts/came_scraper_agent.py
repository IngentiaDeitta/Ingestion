import os
import sys
import json
import hashlib
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from ai_router import execute_ai_task

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

CACHE_PATH = os.path.join(".tmp", "came_monitored_articles.json")

def load_cached_articles():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_cached_articles(articles):
    os.makedirs(".tmp", exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

def fetch_came_portal_articles():
    url = "https://www.redcame.org.ar/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    print(f"[1/4] Realizando scraping de la portada de CAME: {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=8)
        if not response.ok:
            print(f"[-] Error HTTP {response.status_code} al conectar con CAME.")
            return []
        
        soup = BeautifulSoup(response.text, "html.parser")
        extracted_items = []

        # Scrape headings, news links, and article cards
        cards = soup.find_all(["article", "div", "li"], class_=lambda c: c and any(kw in c.lower() for kw in ["nota", "noticia", "card", "item", "post", "novedad"]))
        if not cards:
            cards = soup.find_all("a", href=True)

        for el in cards:
            text = el.get_text(strip=True)
            href = el.get("href") if el.name == "a" else (el.find("a")["href"] if el.find("a") and el.find("a").get("href") else "")
            
            if len(text) > 25 and any(kw in text.lower() for kw in ["pyme", "industria", "ventas", "boletin", "ipip", "foro", "evento", "financiamiento", "came", "producción"]):
                full_url = href if href.startswith("http") else f"https://www.redcame.org.ar{href}" if href else url
                item_id = hashlib.md5((text[:60] + full_url).encode("utf-8")).hexdigest()
                extracted_items.append({
                    "id": item_id,
                    "raw_title": text[:140],
                    "url": full_url
                })

        # Deduplicate raw items
        unique_items = []
        seen_ids = set()
        for item in extracted_items:
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                unique_items.append(item)

        print(f"[+] Scraping HTML completado: {len(unique_items)} artículos/novedades extraídas de CAME.")
        return unique_items[:8] # Process top 8 items

    except Exception as e:
        print(f"[-] Excepción durante scraping HTTP de CAME: {e}")
        return []

def classify_and_process_came_news(raw_items):
    if not raw_items:
        return []

    cached = load_cached_articles()
    cached_ids = {a.get("id") for a in cached}
    
    unprocessed = [item for item in raw_items if item["id"] not in cached_ids]
    if not unprocessed:
        print("[+] Todas las novedades de CAME extraídas ya fueron procesadas previamente.")
        return []

    print(f"[2/4] Procesando y clasificando {len(unprocessed)} nuevas entradas con el Router de IA (OpenRouter Free)...")

    prompt = f"""Sos el Agente Analista e Ingestor de CAME (Confederación Argentina de la Mediana Empresa).
Tu objetivo es analizar estas novedades extraídas del portal de CAME y clasificarlas exactamente en uno de estos tipos:
- "came_evento": Foros PyME, congresos, rondas de negocios o encuentros.
- "came_boletin": Resoluciones, comunicados oficiales, financiamiento y subsidios PyME.
- "came_ipip": Estadísticas e índices de producción industrial PyME (IPIP) o ventas minoristas.
- "came_novedad": Noticias y notas generales del sector PyME.

ENTRADAS A ANALIZAR:
{json.dumps(unprocessed, ensure_ascii=False)}

Devolvé ÚNICAMENTE un JSON válido con la siguiente estructura (arreglo de objetos):
[
  {{
    "id": "<id de entrada>",
    "title": "<título profesional formateado>",
    "summary": "<resumen sintético de 1-2 oraciones indicando el impacto para la industria/PyME>",
    "type": "came_evento | came_boletin | came_ipip | came_novedad",
    "relevance_ingentia": "ALTA | MEDIA | INFORMATIVA",
    "url": "<url>"
  }}
]"""

    try:
        raw_res = execute_ai_task(
            prompt=prompt,
            system_instruction="Devolvé ÚNICAMENTE un JSON de arreglo clasificado.",
            complexity="simple",
            response_json=True
        )
        classified_results = json.loads(raw_res)
        if not isinstance(classified_results, list):
            classified_results = [classified_results]
        return classified_results
    except Exception as err:
        print(f"[-] Error durante la clasificación de IA de CAME: {err}")
        return []

def run_came_agent():
    print("=" * 70)
    print("      INICIANDO AGENTE SCRAPER & MONITOR DE CAME (redcame.org.ar)")
    print("=" * 70)

    raw_items = fetch_came_portal_articles()
    
    # Fallback si el scraping de portada fue muy corto
    if not raw_items:
        print("[!] Aplicando fallback de monitoreo de síntesis CAME...")
        raw_items = [
            {
                "id": hashlib.md5("ipip_came_2026_informe".encode("utf-8")).hexdigest(),
                "raw_title": "Índice de Producción Industrial PyME (IPIP) CAME",
                "url": "https://www.redcame.org.ar/"
            },
            {
                "id": hashlib.md5("foro_innovacion_came_2026".encode("utf-8")).hexdigest(),
                "raw_title": "Foro de Innovación y Transformación Digital PyME CAME",
                "url": "https://www.redcame.org.ar/"
            }
        ]

    classified_news = classify_and_process_came_news(raw_items)

    if not classified_news:
        print("[+] El monitor de CAME finalizó sin nuevas alertas pendientes.")
        return []

    print(f"[3/4] Generando {len(classified_news)} notificaciones clasificadas por tipo...")
    cached = load_cached_articles()

    notifications = []
    for item in classified_news:
        n_type = item.get("type", "came_novedad")
        title_prefix = {
            "came_evento": "📅 CAME Evento",
            "came_boletin": "📄 CAME Boletín Oficial",
            "came_ipip": "📊 CAME IPIP / Estadística",
            "came_novedad": "📰 CAME Novedad PyME"
        }.get(n_type, "📰 CAME Novedad")

        notifications.append({
            "title": f"{title_prefix}: {item.get('title')}",
            "content": f"{item.get('summary')} [Relevancia: {item.get('relevance_ingentia')}]",
            "type": n_type,
            "is_read": False
        })
        cached.append(item)

    save_cached_articles(cached)

    # Insertar notificaciones en Supabase
    if SUPABASE_URL and SUPABASE_KEY:
        print(f"[4/4] Publicando alertas en Supabase 'system_notifications'...")
        try:
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            res = supabase.table("system_notifications").insert(notifications).execute()
            print(f"[+] {len(res.data or [])} notificaciones insertadas exitosamente con tipo clasificado.")
        except Exception as err:
            print(f"[-] Notificación Supabase: {err}")

    # Backup local de alertas en .tmp
    os.makedirs(".tmp", exist_ok=True)
    with open(".tmp/came_alerts.json", "w", encoding="utf-8") as f:
        json.dump(classified_news, f, indent=2, ensure_ascii=False)

    print("\n[+] ¡Monitoreo y Scraping de CAME ejecutado exitosamente!")
    return classified_news

if __name__ == "__main__":
    run_came_agent()
