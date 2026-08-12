import os
import sys
import json
import re
import time
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("[-] Error: Faltan variables de entorno requeridas (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY).")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OPENROUTER_API_KEY = os.getenv("OPENROUTER") or os.getenv("OPENROUTER_API_KEY") or os.getenv("VITE_OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

SECTORES_ESTANDAR = [
    "Agroindustria y Maquinaria",
    "Alimentos y Bebidas",
    "Automotriz y Autopartes",
    "Construcción y Materiales",
    "Electromecánica y Metalurgia",
    "Farmacéutica y Cosmética",
    "Logística y Transporte",
    "Metalmecánica e Industria Pesada",
    "Plásticos y Química",
    "Textil y Calzado",
    "Tecnología y Servicios B2B",
    "Comercio y Distribución",
    "Servicios Industriales",
    "Otros Industriales"
]

LEADS_INICIALES = [
    {
        "empresa": "DripColor SRL",
        "dominio": "dripcolor.com",
        "sector": "Alimentos y Bebidas",
        "contacto_nombre": "Edith Sanchez",
        "email": "esanchez@dripcolor.com",
        "telefono": "+54 9 11 4567-8901",
        "localidad": "Pilar, Buenos Aires",
        "empleados_estimado": "25-50",
        "fuente": "Inbound",
        "estado": "NUEVO",
        "notas": "Fabricante de insumos para repostería y pastelería creativa en Parque Industrial Pilar. Proceso empírico de producción y costeo manual en planillas de Excel."
    },
    {
        "empresa": "Elektro Korrosión SRL",
        "dominio": "elektrokorrosion.com.ar",
        "sector": "Electromecánica y Metalurgia",
        "contacto_nombre": "Federico Gino",
        "email": "ingfedericogino@gmail.com",
        "telefono": "+54 9 11 4539-0034",
        "localidad": "El Talar, Tigre, Buenos Aires",
        "empleados_estimado": "15-30",
        "fuente": "Outbound (Apollo)",
        "estado": "CONVERTIDO",
        "notas": "Ingeniería en sistemas de protección catódica y mitigación de corrosión. Unificación de 20.000 presupuestos históricos e integración CRM."
    },
    {
        "empresa": "Laboratorios Andrómaco SA",
        "dominio": "andromaco.com.ar",
        "sector": "Farmacéutica y Cosmética",
        "contacto_nombre": "Diego Sturla",
        "email": "dsturla@andromaco.com.ar",
        "telefono": "+54 9 11 4837-7000",
        "localidad": "CABA",
        "empleados_estimado": "200-500",
        "fuente": "Manual",
        "estado": "REUNION_AGENDADA",
        "notas": "Laboratorio farmacéutico líder en dermocosmética. Evaluación de soluciones de IA para automatización de procesamiento documental y calidad."
    },
    {
        "empresa": "Chisap SCA",
        "dominio": "chisap.com.ar",
        "sector": "Alimentos y Bebidas",
        "contacto_nombre": "Distribución / Operaciones",
        "email": "contacto@chisap.com.ar",
        "telefono": "+54 9 11 4750-1234",
        "localidad": "AMBA",
        "empleados_estimado": "30-60",
        "fuente": "Apollo Outbound",
        "estado": "NUEVO",
        "notas": "Frigorífico y distribuidor de chacinados y embutidos. Necesidad de control logístico y digitalización de partes de envasado."
    },
    {
        "empresa": "Brogas SCA",
        "dominio": "brogas.com.ar",
        "sector": "Electromecánica y Metalurgia",
        "contacto_nombre": "Vicepresidencia Operativa",
        "email": "info@brogas.com.ar",
        "telefono": "+54 9 11 4760-5678",
        "localidad": "AMBA",
        "empleados_estimado": "40-80",
        "fuente": "Apollo Outbound",
        "estado": "NUEVO",
        "notas": "Fabricante de artefactos de calefacción, generadores de aire caliente y productos a gas. Trazabilidad de ensamble e insumos."
    },
    {
        "empresa": "Ferrosider SA",
        "dominio": "ferrosider.com.ar",
        "sector": "Metalmecánica e Industria Pesada",
        "contacto_nombre": "Gerencia de RRHH / Operaciones",
        "email": "contacto@ferrosider.com.ar",
        "telefono": "+54 9 11 4300-9988",
        "localidad": "CABA",
        "empleados_estimado": "50-100",
        "fuente": "Apollo Outbound",
        "estado": "NUEVO",
        "notas": "Centro de corte y distribución de chapas de hierro y perfiles siderúrgicos. Automatización de cotizaciones de corte a medida."
    }
]

def call_openrouter_fallback(prompt: str) -> dict:
    print("[OpenRouter Fallback] Redirigiendo petición a OpenRouter...")
    models = [
        "google/gemini-2.0-flash-lite-001:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "openrouter/auto"
    ]
    for model in models:
        try:
            res = requests.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ingentia.com.ar",
                    "X-Title": "IngentIA Lead Enrichment"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=60
            )
            if res.ok:
                data = res.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(f"[OpenRouter Success] Respuesta obtenida de {model}.")
                return {"candidate": None, "text": text}
        except Exception as e:
            print(f"[OpenRouter Model {model} Fallback Error]:", e)

    raise Exception("No se pudo obtener respuesta de la IA.")

def call_gemini(body: dict, max_retries: int = 2) -> dict:
    prompt_text = body.get("contents", [{}])[0].get("parts", [{}])[0].get("text", "")
    attempt = 0
    while attempt <= max_retries:
        try:
            res = requests.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                headers={"Content-Type": "application/json"},
                json=body,
                timeout=60
            )
            if res.status_code == 429:
                attempt += 1
                if attempt <= max_retries:
                    wait_seconds = (2 ** attempt) * 2
                    print(f"[Rate Limit 429] Reintentando llamada ({attempt}/{max_retries}) en {wait_seconds}s...")
                    time.sleep(wait_seconds)
                    continue
                print("[Rate Limit 429 Excedido] Conmutando a OpenRouter...")
                return call_openrouter_fallback(prompt_text)
            if not res.ok:
                print(f"[Gemini API Error {res.status_code}] Conmutando a OpenRouter...")
                return call_openrouter_fallback(prompt_text)
            data = res.json()
            candidate = data.get("candidates", [{}])[0]
            parts = candidate.get("content", {}).get("parts", [])
            text = "".join([p.get("text", "") for p in parts if p.get("text")])
            return {"candidate": candidate, "text": text}
        except Exception as e:
            if attempt >= max_retries:
                print("[Gemini Exception] Conmutando a OpenRouter...", e)
                return call_openrouter_fallback(prompt_text)
            attempt += 1
            time.sleep((2 ** attempt) * 2)

    return call_openrouter_fallback(prompt_text)

def extract_json(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()
    a = s.find("{")
    b = s.rfind("}")
    if a != -1 and b > a:
        return s[a:b+1]
    return s

def clean_url(url_val):
    if not url_val or not isinstance(url_val, str):
        return None
    v = url_val.strip()
    if v.lower() in ["null", "none", "n/a", "no provisto", "sin dato", "url o null", ""]:
        return None
    if not v.startswith("http://") and not v.startswith("https://"):
        v = f"https://{v}"
    return v

def investigar_empresa(lead: dict) -> tuple:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio") or lead.get("web")
    prompt = f'Investigá en la web la empresa argentina "{empresa}"{f" (sitio {dominio})" if dominio else ""}.\n\nNecesito saber:\n- A qué se dedica exactamente: qué fabrica o qué servicio presta.\n- Cuántos empleados tiene y dónde están sus plantas u oficinas.\n- Desde cuándo opera y quiénes la dirigen.\n- En qué cámaras industriales o parques participa (ADIMRA, CADIEEL, UIPBA, etc.).\n- Novedades recientes: crecimiento, nuevas plantas, inversiones, premios.\n- Si tiene búsquedas laborales publicadas, sobre todo de perfiles administrativos, de costos o de calidad.\n\nRespondé en prosa breve. Si algo no lo encontrás, decí explícitamente "no hay dato" en vez de suponerlo.'

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.3, "topP": 0.95, "maxOutputTokens": 3072}
    }
    res = call_gemini(body)
    candidate = res.get("candidate") or {}
    grounding = candidate.get("groundingMetadata", {}).get("groundingChunks", [])
    fuentes = []
    for g in grounding:
        web = g.get("web", {})
        title_or_uri = web.get("title") or web.get("uri")
        if title_or_uri:
            fuentes.append(title_or_uri)
    return res["text"], list(set(fuentes))

def investigar_presencia_digital(lead: dict) -> tuple:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio") or lead.get("web")
    prompt = f'Buscá la presencia pública y las reseñas de la empresa argentina "{empresa}"{f" ({dominio})" if dominio else ""}.\n\n1. GOOGLE MAPS / RESEÑAS: buscá "opiniones {empresa}", "{empresa} google reviews". Necesito el rating (ej. 4,5), la cantidad de reseñas, y qué dicen: temas que se repiten a favor y en contra.\n2. REDES: encontrá las URLs de LinkedIn, Instagram y Facebook de la empresa, y su cantidad de seguidores.\n3. SITIO WEB: la URL oficial.\n4. NOVEDADES: menciones en medios, premios, aperturas o inversiones del último año.\n\nRespondé en prosa breve. Poné "no hay dato" en todo lo que no encuentres — es preferible a estimarlo.'

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.2, "topP": 0.95, "maxOutputTokens": 2048}
    }
    res = call_gemini(body)
    candidate = res.get("candidate") or {}
    grounding = candidate.get("groundingMetadata", {}).get("groundingChunks", [])
    fuentes = []
    for g in grounding:
        web = g.get("web", {})
        title_or_uri = web.get("title") or web.get("uri")
        if title_or_uri:
            fuentes.append(title_or_uri)
    return res["text"], list(set(fuentes))

def estructurar_brief_catalogacion_y_clasificacion(lead: dict, investigacion_texto: str, social_texto: str) -> dict:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio") or lead.get("web") or "no provisto"
    sector_previo = lead.get("sector") or "no provisto"
    localidad = lead.get("localidad") or "no provista"
    contacto_nombre = lead.get("contacto_nombre") or "no provisto"
    contacto_cargo = f"({lead.get('contacto_cargo')})" if lead.get("contacto_cargo") else ""
    empleados_estimado = lead.get("empleados_estimado") or "sin dato"
    notas = lead.get("notas") or "(no dejó mensaje)"

    sectores_str = ", ".join([f'"{s}"' for s in SECTORES_ESTANDAR])

    prompt = f'''Sos el Agente A5 de IngentIA, consultora argentina de automatización e IA para PyMEs industriales del AMBA.
Tu tarea es enriquecer exhaustivamente la ficha del lead, CATALOGAR su sector industrial exacto y CLASIFICAR su potencialidad comercial.

----------------------------------------
SECTORES INDUSTRIALES PERMITIDOS PARA CATALOGACIÓN:
{sectores_str}
----------------------------------------

----------------------------------------
REGLAS DE CLASIFICACIÓN DE POTENCIALIDAD (qualification_status):
- "CALIFICADO": Fit IngentIA >= 75. PyME industrial/B2B con >15 empleados o alta complejidad de procesos operativos.
- "POTENCIAL": Fit IngentIA 50-74. Empresa con escala moderada (5-15 emp) o potencial oportunidad de automatización.
- "NO_CALIFICADO": Fit IngentIA 30-49. Microempresa o B2C con baja escala de procesos operativos.
- "DESCARTADO": Fit IngentIA < 30. Empresa sin actividad, datos totalmente ficticios o fuera de target absoluto.
----------------------------------------

----------------------------------------
INVESTIGACIÓN WEB REALIZADA
----------------------------------------
{investigacion_texto or "(sin información devuelta por búsqueda)"}

----------------------------------------
RESEÑAS Y PRESENCIA DIGITAL
----------------------------------------
{social_texto or "(sin información devuelta por búsqueda)"}

----------------------------------------
DATOS DEL PROSPECTO EN NUESTRA BASE
----------------------------------------
Empresa: {empresa}
Dominio: {dominio}
Rubro Declarado: {sector_previo}
Localidad: {localidad}
Contacto: {contacto_nombre} {contacto_cargo}
Empleados Estimados: {empleados_estimado}
Mensaje/Notas: {notas}

----------------------------------------
TAREA
----------------------------------------
1. Catalogar el SECTOR escogiendo EXACTAMENTE uno de los sectores permitidos arriba.
2. Calcular el score fit_ingentia (0 a 100) y determinar el qualification_status (CALIFICADO, POTENCIAL, NO_CALIFICADO, DESCARTADO).
3. Elaborar un PreCallBrief completo para Pedro (CCO), incluyendo hipótesis de dolor, preguntas clave (bloques A, B, C), encuadre sugerido y resumen digital.

Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
  "sector_estandar": "Seleccionar uno de la lista de SECTORES PERMITIDOS",
  "qualification_status": "CALIFICADO|POTENCIAL|NO_CALIFICADO|DESCARTADO",
  "empresa_una_frase": "string",
  "perfil": {{
    "empleados_estimado": "string",
    "plantas_ubicaciones": "string",
    "antiguedad": "string",
    "rubro": "string"
  }},
  "senales": [{{ "nivel": "ALTA|MEDIA|BAJA", "descripcion": "string" }}],
  "camaras_redes": ["string"],
  "interlocutor": {{ "nombre": "string", "cargo_estimado": "string", "es_decisor": "SI|PROBABLE|NO|DESCONOCIDO" }},
  "dolor_declarado": "string o null",
  "hipotesis_dolor": "string",
  "stack_probable": ["string"],
  "preguntas": {{
    "bloque_a_mapa": ["string"],
    "bloque_b_dolor": ["string"],
    "bloque_c_urgencia": ["string"]
  }},
  "encuadre_sugerido": "string",
  "redes": {{
    "web": "URL o null",
    "linkedin": "URL o null",
    "instagram": "URL o null",
    "facebook": "URL o null"
  }},
  "presencia_digital": {{
    "google_rating": 4.5,
    "google_reviews": 10,
    "linkedin_followers": 100,
    "instagram_followers": 50,
    "sentimiento": "POSITIVO|NEUTRO|NEGATIVO|SIN_DATOS",
    "temas_positivos": ["string"],
    "temas_negativos": ["string"],
    "novedades": ["string"]
  }},
  "scores": {{
    "reputacion": 80,
    "presencia_digital": 70,
    "madurez_mercado": 75,
    "fit_ingentia": 85,
    "global": 80
  }}
}}'''

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "topP": 0.95, "maxOutputTokens": 8192}
    }
    res = call_gemini(body)
    raw_text = res["text"]
    if not raw_text:
        raise Exception("Respuesta vacía al estructurar brief")

    clean_json = extract_json(raw_text)
    return json.loads(clean_json)

def scrape_with_playwright(dominio_or_url: str) -> dict:
    if not dominio_or_url:
        return {}

    url = dominio_or_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    print(f"[*] Playwright Scraper: Navegando a {url}...")
    result = {
        "url_scraped": url,
        "header_text": "",
        "footer_text": "",
        "emails": [],
        "telefonos": [],
        "social_links": {}
    }

    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(1000)

                header_text = page.locator("header").inner_text() if page.locator("header").count() > 0 else ""
                footer_text = page.locator("footer").inner_text() if page.locator("footer").count() > 0 else ""
                if not footer_text:
                    for sel in [".footer", "#footer", ".site-footer", "#contacto", ".contacto"]:
                        if page.locator(sel).count() > 0:
                            footer_text += "\n" + page.locator(sel).inner_text()

                full_text = page.evaluate("document.body.innerText") or ""

                anchors = page.locator("a[href]").all()
                socials = {}
                for a in anchors:
                    try:
                        href = a.get_attribute("href") or ""
                        h_lower = href.lower()
                        if "facebook.com" in h_lower and "facebook" not in socials:
                            socials["facebook"] = href
                        elif "linkedin.com" in h_lower and "linkedin" not in socials:
                            socials["linkedin"] = href
                        elif "instagram.com" in h_lower and "instagram" not in socials:
                            socials["instagram"] = href
                        elif "youtube.com" in h_lower and "youtube" not in socials:
                            socials["youtube"] = href
                        elif ("twitter.com" in h_lower or "x.com" in h_lower) and "twitter" not in socials:
                            socials["twitter"] = href
                    except:
                        pass

                emails = list(set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', full_text)))
                phones = list(set(re.findall(r'(?:\+?54|\b0800|\b11|\b\(?\d{2,4}\)?)\s?\d{3,4}[-\s]?\d{4}', full_text)))

                result["header_text"] = header_text.strip()[:1000]
                result["footer_text"] = footer_text.strip()[:2000]
                result["emails"] = emails[:5]
                result["telefonos"] = phones[:5]
                result["social_links"] = socials
                print(f"[+] Playwright OK: Emails={emails}, Redes={list(socials.keys())}")
            except Exception as ex:
                print(f"[-] Advertencia Playwright en {url}: {ex}")
            finally:
                browser.close()
    except Exception as err:
        print(f"[-] Fallo al ejecutar Playwright: {err}")

    return result

def enriquecer_y_catalogar_todos_los_leads():
    print("=== INICIANDO ENRIQUECIMIENTO TOTAL, CATALOGACIÓN Y CLASIFICACIÓN DE LEADS ===")
    
    # Consultar leads existentes
    res = supabase.table("leads_cuentas").select("*").execute()
    leads = res.data or []

    if not leads:
        print("[!] No se encontraron leads en `leads_cuentas`. Procediendo a poblar los leads objetivo iniciales...")
        for l in LEADS_INICIALES:
            try:
                # Verificar si ya existe
                chk = supabase.table("leads_cuentas").select("id").ilike("empresa", l["empresa"]).execute()
                if not chk.data:
                    up = supabase.table("leads_cuentas").insert([l]).execute()
                    print(f"[+] Lead '{l['empresa']}' insertado exitosamente.")
                else:
                    print(f"[*] Lead '{l['empresa']}' ya existe.")
            except Exception as ex:
                print(f"[-] No se pudo insertar lead '{l['empresa']}': {ex}")

        # Volver a consultar
        res = supabase.table("leads_cuentas").select("*").execute()
        leads = res.data or []

    print(f"[+] Se procesarán {len(leads)} lead(s) en total en la base de datos.\n")

    exitosos = 0
    fallidos = 0

    for lead in leads:
        lead_id = lead["id"]
        empresa = lead.get("empresa")
        dominio = lead.get("dominio") or lead.get("web")
        print(f"==================================================")
        print(f"[*] Procesando Lead ID {lead_id}: '{empresa}'")

        try:
            scraped_info = {}
            if dominio:
                scraped_info = scrape_with_playwright(dominio)

            inv_text, fuentes1 = investigar_empresa(lead)
            soc_text, fuentes2 = investigar_presencia_digital(lead)

            if scraped_info.get("footer_text") or scraped_info.get("header_text"):
                scraped_summary = f"\n\nDATOS EXTRAÍDOS DE SU WEB OFICIAL ({scraped_info.get('url_scraped')}):\nHEADER:\n{scraped_info.get('header_text')}\nFOOTER / CONTACTO:\n{scraped_info.get('footer_text')}\nEMAILS: {', '.join(scraped_info.get('emails', []))}\nTELÉFONOS: {', '.join(scraped_info.get('telefonos', []))}"
                inv_text += scraped_summary

            brief = estructurar_brief_catalogacion_y_clasificacion(lead, inv_text, soc_text)

            todas_fuentes = list(set(fuentes1 + fuentes2 + ([scraped_info.get("url_scraped")] if scraped_info.get("url_scraped") else [])))
            brief["fuentes"] = todas_fuentes
            brief["investigacion_verificada"] = len(todas_fuentes) > 0
            if scraped_info:
                brief["scraping_playwright"] = scraped_info

            # Extraer catalogación y clasificación
            sector_catalogado = brief.get("sector_estandar") or lead.get("sector") or "Servicios Industriales"
            qualification_status = brief.get("qualification_status") or "POTENCIAL"
            
            # Garantizar que el sector pertenezca a la lista de sectores permitidos
            if sector_catalogado not in SECTORES_ESTANDAR:
                sector_catalogado = lead.get("sector") if lead.get("sector") in SECTORES_ESTANDAR else "Otros Industriales"

            # Integrar qualification_status e industry en el brief para consistencia con frontend
            brief["qualification_status"] = qualification_status
            brief["industry"] = sector_catalogado

            # Preparar payload de actualización
            redes = brief.get("redes", {})
            socials_scraped = scraped_info.get("social_links", {})
            campos_redes = {}

            web_url = clean_url(scraped_info.get("url_scraped") or redes.get("web"))
            if web_url and not lead.get("web"):
                campos_redes["web"] = web_url

            lk = clean_url(socials_scraped.get("linkedin") or redes.get("linkedin"))
            if lk and not lead.get("linkedin_empresa"):
                campos_redes["linkedin_empresa"] = lk

            ig = clean_url(socials_scraped.get("instagram") or redes.get("instagram"))
            if ig and not lead.get("instagram"):
                campos_redes["instagram"] = ig

            fb = clean_url(socials_scraped.get("facebook") or redes.get("facebook"))
            if fb and not lead.get("facebook"):
                campos_redes["facebook"] = fb

            if scraped_info.get("emails") and not lead.get("email"):
                campos_redes["email"] = scraped_info["emails"][0]
            if scraped_info.get("telefonos") and not lead.get("telefono"):
                campos_redes["telefono"] = scraped_info["telefonos"][0]

            campos_perfil = {}
            if brief.get("perfil", {}).get("empleados_estimado") and brief["perfil"]["empleados_estimado"] != "sin dato" and not lead.get("empleados_estimado"):
                campos_perfil["empleados_estimado"] = brief["perfil"]["empleados_estimado"]
            if brief.get("perfil", {}).get("plantas_ubicaciones") and brief["perfil"]["plantas_ubicaciones"] != "sin dato" and not lead.get("localidad"):
                campos_perfil["localidad"] = brief["perfil"]["plantas_ubicaciones"]

            nuevo_estado = "ENRIQUECIDO" if lead.get("estado") == "NUEVO" else lead.get("estado")

            update_payload = {
                "pre_call_brief": brief,
                "sector": sector_catalogado,
                "estado": nuevo_estado,
                **campos_redes,
                **campos_perfil
            }

            up_res = supabase.table("leads_cuentas").update(update_payload).eq("id", lead_id).execute()
            
            exitosos += 1
            print(f"[OK] Lead '{empresa}' enriquecido exitosamente!")
            print(f"     - Sector Catalogado: '{sector_catalogado}'")
            print(f"     - Calificación/Potencialidad: '{qualification_status}' (Fit Score: {brief.get('scores', {}).get('fit_ingentia', 'N/A')})")
            print(f"     - Estado: '{nuevo_estado}' | Fuentes investigadas: {len(todas_fuentes)}")

        except Exception as e:
            fallidos += 1
            print(f"[-] ERROR procesando lead ID {lead_id} ('{empresa}'): {e}")

        # Retardo para evitar Rate Limit 429
        time.sleep(3)

    print("\n==================================================")
    print(f"=== RESUMEN FINAL DEL PROCESAMIENTO BATCH ===")
    print(f"Total Leads Procesados: {len(leads)} | Éxitos: {exitosos} | Fallos: {fallidos}")
    print("==================================================")

if __name__ == "__main__":
    enriquecer_y_catalogar_todos_los_leads()
