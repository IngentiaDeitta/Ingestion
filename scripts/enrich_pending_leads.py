import os
import sys
import json
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("[-] Error: Faltan variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY).")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("VITE_OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

import time

def call_openrouter_fallback(prompt: str) -> dict:
    print("[OpenRouter Fallback] Redirigiendo petición a OpenRouter (modelo free)...")
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
                    "X-Title": "IngentIA Ingestion App"
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

    raise Exception("No se pudo obtener respuesta ni de Gemini ni de OpenRouter.")

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

def investigar_empresa(lead: dict) -> tuple:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio")
    prompt = f'Investigá en la web la empresa argentina "{empresa}"{f" (sitio {dominio})" if dominio else ""}.\n\nNecesito saber:\n- A qué se dedica exactamente: qué fabrica o qué servicio presta.\n- Cuántos empleados tiene y dónde están sus plantas u oficinas.\n- Desde cuándo opera y quiénes la dirigen.\n- En qué cámaras industriales o parques participa (ADIMRA, CADIEEL, UIPBA, etc.).\n- Novedades recientes: crecimiento, nuevas plantas, inversiones, premios.\n- Si tiene búsquedas laborales publicadas, sobre todo de perfiles administrativos, de costos o de calidad.\n\nRespondé en prosa breve. Si algo no lo encontrás, decí explícitamente "no hay dato" en vez de suponerlo.'

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.3, "topP": 0.95, "maxOutputTokens": 3072}
    }
    res = call_gemini(body)
    grounding = res["candidate"].get("groundingMetadata", {}).get("groundingChunks", [])
    fuentes = []
    for g in grounding:
        web = g.get("web", {})
        title_or_uri = web.get("title") or web.get("uri")
        if title_or_uri:
            fuentes.append(title_or_uri)
    return res["text"], list(set(fuentes))

def investigar_presencia_digital(lead: dict) -> tuple:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio")
    prompt = f'Buscá la presencia pública y las reseñas de la empresa argentina "{empresa}"{f" ({dominio})" if dominio else ""}.\n\n1. GOOGLE MAPS / RESEÑAS: buscá "opiniones {empresa}", "{empresa} google reviews". Necesito el rating (ej. 4,5), la cantidad de reseñas, y qué dicen: temas que se repiten a favor y en contra.\n2. REDES: encontrá las URLs de LinkedIn, Instagram y Facebook de la empresa, y su cantidad de seguidores.\n3. SITIO WEB: la URL oficial.\n4. NOVEDADES: menciones en medios, premios, aperturas o inversiones del último año.\n\nRespondé en prosa breve. Poné "no hay dato" en todo lo que no encuentres — es preferible a estimarlo.'

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.2, "topP": 0.95, "maxOutputTokens": 2048}
    }
    res = call_gemini(body)
    grounding = res["candidate"].get("groundingMetadata", {}).get("groundingChunks", [])
    fuentes = []
    for g in grounding:
        web = g.get("web", {})
        title_or_uri = web.get("title") or web.get("uri")
        if title_or_uri:
            fuentes.append(title_or_uri)
    return res["text"], list(set(fuentes))

def estructurar_brief(lead: dict, investigacion_texto: str, social_texto: str) -> dict:
    empresa = lead.get("empresa")
    dominio = lead.get("dominio") or "no provisto"
    sector = lead.get("sector") or "no provisto"
    localidad = lead.get("localidad") or "no provista"
    contacto_nombre = lead.get("contacto_nombre") or "no provisto"
    contacto_cargo = f"({lead.get('contacto_cargo')})" if lead.get("contacto_cargo") else ""
    empleados_estimado = lead.get("empleados_estimado") or "sin dato"
    notas = lead.get("notas") or "(no dejó mensaje)"

    prompt = f'''Sos el Agente A5 de IngentIA, consultora argentina de automatización e IA para PyMEs industriales del AMBA. Preparás a Pedro (CCO) para una "Radiografía Operativa": una videollamada de 30 minutos de descubrimiento puro.

REGLAS DE LA REUNIÓN (condicionan todo lo que generes):
- NO es una demo ni una presentación. Pedro habla como máximo 6 minutos en total.
- El objetivo único es salir con un número de pérdida anual y vender el Diagnóstico Operativo (USD 1.200).
- Las preguntas deben apuntar a obtener HORAS por semana, PERSONAS afectadas y COSTO por hora. Sin esos tres datos no se puede cotizar.
- Nunca hablar de tecnología, stack ni arquitectura: el dueño no compra tecnología.

----------------------------------------
INVESTIGACIÓN WEB YA REALIZADA (única fuente de datos duros que podés usar)
----------------------------------------
{investigacion_texto or "(la búsqueda no devolvió información)"}

----------------------------------------
RESEÑAS Y PRESENCIA EN REDES (segunda búsqueda)
----------------------------------------
{social_texto or "(la búsqueda no devolvió información)"}

----------------------------------------
DATOS DEL PROSPECTO EN NUESTRA BASE
----------------------------------------
Empresa: {empresa}
Dominio web: {dominio}
Rubro declarado: {sector}
Localidad: {localidad}
Contacto: {contacto_nombre} {contacto_cargo}
Empleados (estimación previa): {empleados_estimado}

LO QUE EL PROSPECTO ESCRIBIÓ AL CONTACTARNOS (sus propias palabras — es el dato más valioso):
{notas}

----------------------------------------
TAREA
----------------------------------------
1. Usá SOLO la investigación de arriba para los datos duros. Si un dato no aparece ahí, escribí "sin dato". PROHIBIDO completarlo de memoria.
2. Detectá señales de dolor operativo y clasificalas: ALTA, MEDIA, BAJA.
3. Si el prospecto dejó un mensaje, resumí en "dolor_declarado" lo que él mismo dijo que le duele. Si no dejó mensaje, poné null.
4. Formulá preguntas ESPECÍFICAS para esta empresa (bloques A, B, C).
5. Escribí un "encuadre_sugerido": el texto EXACTO que Pedro va a decir en voz alta al abrir la reunión.

Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta:
{{
  "empresa_una_frase": "string",
  "perfil": {{ "empleados_estimado": "string", "plantas_ubicaciones": "string", "antiguedad": "string", "rubro": "string" }},
  "senales": [{{ "nivel": "ALTA|MEDIA|BAJA", "descripcion": "string" }}],
  "camaras_redes": ["string"],
  "interlocutor": {{ "nombre": "string", "cargo_estimado": "string", "es_decisor": "SI|PROBABLE|NO|DESCONOCIDO" }},
  "dolor_declarado": "string o null",
  "hipotesis_dolor": "string",
  "stack_probable": ["string"],
  "preguntas": {{ "bloque_a_mapa": ["string"], "bloque_b_dolor": ["string"], "bloque_c_urgencia": ["string"] }},
  "encuadre_sugerido": "string",
  "redes": {{ "web": "URL o null", "linkedin": "URL o null", "instagram": "URL o null", "facebook": "URL o null" }},
  "presencia_digital": {{
    "google_rating": 4.5, "google_reviews": 10, "linkedin_followers": 100, "instagram_followers": 50,
    "sentimiento": "POSITIVO|NEUTRO|NEGATIVO|SIN_DATOS",
    "temas_positivos": ["string"], "temas_negativos": ["string"], "novedades": ["string"]
  }},
  "scores": {{
    "reputacion": 80, "presencia_digital": 70, "madurez_mercado": 75, "fit_ingentia": 85, "global": 80
  }}
}}'''

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.6, "topP": 0.95, "maxOutputTokens": 8192}
    }
    res = call_gemini(body)
    raw_text = res["text"]
    if not raw_text:
        raise Exception("Gemini devolvió respuesta vacía")
    
    clean_json = extract_json(raw_text)
    return json.loads(clean_json)

def process_pending_leads():
    print("=== BUSCANDO LEADS PENDIENTES DE ENRIQUECIMIENTO ===")
    res = supabase.table("leads_cuentas").select("*").is_("pre_call_brief", "null").execute()
    leads = res.data or []

    if not leads:
        print("[+] No hay leads pendientes sin pre_call_brief.")
        return

    print(f"[+] Se encontraron {len(leads)} lead(s) pendientes de enriquecimiento.")

    for lead in leads:
        lead_id = lead["id"]
        empresa = lead.get("empresa")
        print(f"\n[*] Procesando lead ID {lead_id}: '{empresa}'...")

        try:
            inv_text, fuentes1 = investigar_empresa(lead)
            soc_text, fuentes2 = investigar_presencia_digital(lead)
            brief = estructurar_brief(lead, inv_text, soc_text)

            todas_fuentes = list(set(fuentes1 + fuentes2))
            brief["fuentes"] = todas_fuentes
            brief["investigacion_verificada"] = len(todas_fuentes) > 0

            # Preparar campos de actualización de redes sociales sin pisar existentes
            redes = brief.get("redes", {})
            campos_redes = {}
            if redes.get("web") and not lead.get("web"):
                campos_redes["web"] = redes["web"]
            if redes.get("linkedin") and not lead.get("linkedin_empresa"):
                campos_redes["linkedin_empresa"] = redes["linkedin"]
            if redes.get("instagram") and not lead.get("instagram"):
                campos_redes["instagram"] = redes["instagram"]
            if redes.get("facebook") and not lead.get("facebook"):
                campos_redes["facebook"] = redes["facebook"]

            nuevo_estado = "ENRIQUECIDO" if lead.get("estado") == "NUEVO" else lead.get("estado")

            update_payload = {
                "pre_call_brief": brief,
                "estado": nuevo_estado,
                **campos_redes
            }

            up_res = supabase.table("leads_cuentas").update(update_payload).eq("id", lead_id).execute()
            print(f"[OK] Lead '{empresa}' enriquecido exitosamente. Estado actualizado a '{nuevo_estado}'. Fuentes: {len(todas_fuentes)}.")

        except Exception as e:
            print(f"[-] Error enriqueciendo lead ID {lead_id} ('{empresa}'): {e}")

if __name__ == "__main__":
    process_pending_leads()
