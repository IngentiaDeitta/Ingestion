import os
import sys
import json
import argparse
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

import subprocess

# Import Apollo integration (legacy domain-based fallback)
try:
    from apollo_api_integration import get_apollo_data
except ImportError:
    get_apollo_data = None

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("[-] Error: Variables de entorno insuficientes (Supabase o Gemini). Verifica .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini = genai.Client(api_key=GEMINI_API_KEY)

MCP_EXE = "C:\\Users\\Fer\\.local\\bin\\notebooklm-mcp.exe"


async def _notebooklm_sync(client_name: str, project_name: str, research_text: str, social_text: str, minutes_text: str) -> str:
    """
    Conecta con NotebookLM vía MCP, crea/actualiza el cuaderno del cliente
    con nomenclatura oficial y extrae la síntesis combinada.
    Nunca llama sys.exit() — lanza excepciones para que el caller las maneje.

    Nomenclatura de documentos (obligatoria):
      [CTX] → Contexto general del cliente
      [DOC] → Documentos internos
      [MEET] → Minutas y reuniones
      [PROJ-NombreProyecto] → Documentos de proyecto específico
    """
    server_params = StdioServerParameters(
        command=MCP_EXE,
        args=[],
        env=os.environ.copy()
    )

    notebook_id = None
    notebook_context = ""
    today = datetime.now().strftime("%Y-%m-%d")

    # Usar un timeout para evitar que el MCP quede colgado indefinidamente
    async with asyncio.timeout(90):
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                # Buscar cuaderno existente por nombre del cliente
                print("[*] Buscando cuaderno existente en NotebookLM...")
                list_result = await session.call_tool("notebook_list", {"max_results": 50})
                list_json = json.loads(list_result.content[0].text)

                if list_json.get("status") == "error":
                    err_msg = list_json.get("error", "")
                    if "expire" in err_msg.lower() or "auth" in err_msg.lower():
                        raise RuntimeError("Auth de NotebookLM expirada. Ejecutá `notebooklm-mcp-auth` en la terminal.")
                    raise RuntimeError(f"Error de NotebookLM: {err_msg}")

                for nb in list_json.get("notebooks", []):
                    if nb["title"].lower() == client_name.lower():
                        notebook_id = nb["id"]
                        print(f"[+] Cuaderno encontrado: {client_name}")
                        break

                # Crear nuevo cuaderno si no existe
                if not notebook_id:
                    print("[*] Creando nuevo cuaderno en NotebookLM...")
                    create_result = await session.call_tool("notebook_create", {"title": client_name})
                    create_json = json.loads(create_result.content[0].text)
                    notebook_id = create_json.get("notebook_id")
                    print(f"[+] Cuaderno creado: {client_name}")

                if notebook_id:
                    # [CTX] Investigación web general — siempre actualizar
                    print("[*] Insertando contexto web [CTX] en NotebookLM...")
                    await session.call_tool("notebook_add_text", {
                        "notebook_id": notebook_id,
                        "title": f"[CTX] Investigación Web - {today}",
                        "text": research_text
                    })
                    print("[+] [CTX] Investigación web insertada.")

                    # [CTX] Redes sociales y reseñas si hay datos
                    if social_text:
                        print("[*] Insertando datos de redes sociales y reseñas [CTX]...")
                        await session.call_tool("notebook_add_text", {
                            "notebook_id": notebook_id,
                            "title": f"[CTX] Redes Sociales y Reseñas - {today}",
                            "text": social_text
                        })
                        print("[+] [CTX] Redes sociales insertadas.")

                    # [MEET] Minutas del proyecto si existen
                    if minutes_text:
                        print("[*] Insertando minutas [MEET] del proyecto...")
                        await session.call_tool("notebook_add_text", {
                            "notebook_id": notebook_id,
                            "title": f"[MEET] Reunión {today} - {project_name}",
                            "text": minutes_text
                        })
                        print("[+] [MEET] Minutas insertadas.")

                    # Extraer síntesis consolidada
                    print("[*] Extrayendo síntesis de NotebookLM...")
                    query_result = await session.call_tool("notebook_query", {
                        "notebook_id": notebook_id,
                        "query": "Resume la historia de la empresa, su reputación en medios y redes sociales, competidores, problemas operativos mencionados y los principales desafíos de tecnología."
                    })
                    query_json = json.loads(query_result.content[0].text)
                    notebook_context = query_json.get("answer", "")
                    if notebook_context:
                        print("[+] Síntesis extraída con éxito.")
                    else:
                        print("[-] No se pudo extraer respuesta de NotebookLM.")
                        notebook_context = research_text + "\n" + social_text

    return notebook_context


async def run_research_agent(client_name: str, project_name: str, minutes_text: str):
    print(f"[*] Iniciando investigación para el cliente: {client_name}")

    # ──────────────────────────────────────────────────────────────────────
    # PASO 1A: Investigación Web general con Gemini Grounding
    # ──────────────────────────────────────────────────────────────────────
    print("[*] Ejecutando búsqueda web con Gemini Grounding...")
    search_prompt = f"""Investiga a fondo la empresa "{client_name}".
Proporciona un reporte estructurado con:
1. Historia de la empresa, tamaño, fundación y sector.
2. Página web oficial, LinkedIn y otras redes sociales principales.
3. Principales productos o servicios que ofrecen.
4. Clientes o sectores a los que sirve.
5. Modelo de negocio y propuesta de valor diferencial.
6. Competidores principales en el mercado.
7. Noticias recientes (últimos 12 meses) sobre la empresa.
Reporte para consultoría de IA estratégica."""

    try:
        response = gemini.models.generate_content(
            model='gemini-2.5-flash',
            contents=search_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                temperature=0.3
            )
        )
        research_text = response.text
        print("[+] Investigación web completada con éxito.")
    except Exception as e:
        print(f"[-] Error en Gemini Grounding (web): {e}")
        research_text = f"Sin datos web disponibles para: {client_name}."

    # ──────────────────────────────────────────────────────────────────────
    # PASO 1.5: Enriquecimiento con Apollo.io (por nombre)
    # ──────────────────────────────────────────────────────────────────────
    apollo_text = ""
    print(f"[*] Buscando empresa '{client_name}' en Apollo.io...")
    try:
        # Intento primario: Búsqueda por nombre (varias versiones)
        names_to_try = [client_name]
        # Si tiene espacios, probar versión sin espacios
        if " " in client_name:
            names_to_try.append(client_name.replace(" ", ""))
        # Si tiene acentos o eñes, probar versión normalizada
        import unicodedata
        normalized_name = "".join(c for c in unicodedata.normalize('NFD', client_name) if unicodedata.category(c) != 'Mn')
        if normalized_name != client_name:
            names_to_try.append(normalized_name)

        apollo_data = None
        for name in names_to_try:
            print(f"[*] Probando Apollo con nombre: '{name}'")
            apollo_data = search_apollo_by_name(name)
            if apollo_data:
                break
        
        if not apollo_data and get_apollo_data:
            # Intento secundario: Fallback por dominio inferido
            print("[-] No se encontró por nombre. Intentando fallback por dominio...")
            domain_prompt = f"Basado en esta investigación:\n{research_text}\n¿Cuál es el dominio principal de la empresa (ej: apple.com)? Responde ÚNICAMENTE con el dominio. Si no lo encuentras, responde 'NO_ENCONTRADO'."
            domain_response = gemini.models.generate_content(
                model='gemini-2.5-flash', contents=domain_prompt,
                config=types.GenerateContentConfig(temperature=0.0)
            )
            domain = domain_response.text.strip().lower()
            if domain and domain != "no_encontrado" and "." in domain:
                print(f"[*] Fallback Apollo por dominio: {domain}")
                apollo_data = get_apollo_data(domain)
        
        if apollo_data:
            apollo_text = f"DATOS APOLLO.IO:\n{json.dumps(apollo_data, indent=2, ensure_ascii=False)}\n"
            print(f"[+] Apollo.io: Datos obtenidos para {apollo_data.get('name', client_name)}")
        else:
            print("[-] Apollo.io: No se encontraron datos.")
            
    except Exception as e:
        print(f"[-] Error en integración Apollo: {e}")

    # ──────────────────────────────────────────────────────────────────────
    # PASO 1B: Búsqueda de reseñas, redes sociales y reputación online
    # ──────────────────────────────────────────────────────────────────────
    print("[*] Buscando reseñas y presencia en redes sociales...")
    social_prompt = f"""Busca información oficial, perfiles sociales y REPUTACIÓN REAL de la empresa "{client_name}" en Argentina.
REQUISITOS CRÍTICOS:
1. GOOGLE MAPS / GMB: Buscá "opiniones {client_name}", "{client_name} google reviews", "{client_name} maps". Necesito el Rating (ej: 4.5), el número de reseñas y los temas clave.
2. REDES SOCIALES: Buscá perfiles oficiales en LinkedIn, Instagram, Facebook y Twitter/X. Si encontrás el enlace, ponelo. No inventes.
3. WEBSITE: Confirmá el sitio web oficial. Probá variaciones (con y sin guiones).
4. NOTICIAS: Menciones en diarios locales o portales de industria.
Sé MUY específico con los números. Priorizá la veracidad sobre la cantidad."""

    try:
        social_response = gemini.models.generate_content(
            model='gemini-2.5-flash',
            contents=social_prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
                temperature=0.3
            )
        )
        social_text = social_response.text
        print("[+] Investigación de redes sociales y reseñas completada.")
    except Exception as e:
        print(f"[-] Error buscando reseñas/redes: {e}")
        social_text = ""

    # ──────────────────────────────────────────────────────────────────────
    # PASO 2: Integración con NotebookLM vía MCP (opcional, con fallback)
    # ──────────────────────────────────────────────────────────────────────
    notebook_context = ""
    print("[*] Conectando con NotebookLM MCP Server...")
    try:
        notebook_context = await _notebooklm_sync(client_name, project_name, research_text, social_text, minutes_text)
    except asyncio.TimeoutError:
        print("[-] NotebookLM: Timeout — el servidor MCP tardó demasiado.")
        print("[*] Continuando sin NotebookLM — usando solo investigación web como contexto.")
        notebook_context = research_text + "\n" + social_text
    except RuntimeError as e:
        print(f"[-] NotebookLM: {e}")
        print("[*] Continuando sin NotebookLM — usando solo investigación web como contexto.")
        notebook_context = research_text + "\n" + social_text
    except BaseException as e:
        print(f"[-] Error en comunicación con MCP: {type(e).__name__}: {e}")
        print("[*] Continuando sin NotebookLM — usando solo investigación web como contexto.")
        notebook_context = research_text + "\n" + social_text

    # ──────────────────────────────────────────────────────────────────────
    # PASO 3: Análisis Final y Generación del JSON de Perfil del Cliente
    # ──────────────────────────────────────────────────────────────────────
    print("[*] Generando AI Solution Analysis JSON...")

    # Recuperar análisis previo si existe (para re-enriquecimiento)
    client_res = supabase.table('clients').select('id', 'client_analysis').eq('name', client_name).execute()
    client_id = client_res.data[0]['id'] if client_res.data else None
    existing_analysis = client_res.data[0].get('client_analysis') if client_res.data else None

    previous_analysis_text = ""
    if existing_analysis:
        previous_analysis_text = f"\nANÁLISIS PREVIO (úsalo como base, actualiza y enriquece con nueva información):\n{json.dumps(existing_analysis, indent=2, ensure_ascii=False)}\n"

    full_context = f"INVESTIGACIÓN WEB:\n{research_text}\n\nREDES SOCIALES Y RESEÑAS:\n{social_text}\n\nDATOS ESTRUCTURADOS DE APOLLO.IO:\n{apollo_text}\n\nSÍNTESIS NOTEBOOKLM:\n{notebook_context}"

    analysis_prompt = f"""Sos un AI Strategic Analyst especializado en el mercado argentino. Analiza el siguiente contexto y genera un JSON estricto.

CLIENTE: {client_name}
PROYECTO: {project_name}
FECHA DE ANÁLISIS: {datetime.now().strftime("%Y-%m-%d")}

CONTEXTO COMPLETO:
{full_context}

CONSIGNA PARA REDES SOCIALES:
- Usa prioritariamente los enlaces de APOLLO.IO si están disponibles y parecen correctos.
- Si Apollo no los tiene, usa los de la INVESTIGACIÓN WEB/REDES.
- El sitio web DEBE ser el oficial de la empresa.

MINUTAS EXTRAS:
{minutes_text}
{previous_analysis_text}

Tu output DEBE ser ÚNICAMENTE JSON válido, sin bloques de código markdown, con esta estructura EXACTA:
{{
  "website": "URL del sitio web oficial o cadena vacía si no se encontró",
  "phone": "Teléfono de contacto o cadena vacía si no se encontró",
  "social_links": {{
    "linkedin": "URL de LinkedIn o cadena vacía",
    "instagram": "URL de Instagram o cadena vacía",
    "twitter": "URL de Twitter/X o cadena vacía",
    "facebook": "URL de Facebook o cadena vacía"
  }},
  "company_size": "Número de empleados estimado o cadena vacía",
  "particularities": ["Particularidad 1", "Particularidad 2"],
  "summary": "Resumen ejecutivo del negocio (3-4 oraciones): historia, posición en el mercado, noticias recientes relevantes.",
  "business_model": "Cómo genera ingresos y su modelo de negocio central.",
  "target_audience": "Descripción del público objetivo y segmentos de clientes principales.",
  "key_value_proposition": "Diferencial clave frente al mercado.",
  "competitors": ["Competidor 1", "Competidor 2", "Competidor 3"],
  "social_presence": {{
    "google_rating": 0.0,
    "google_reviews_count": 0,
    "linkedin_followers": 0,
    "instagram_followers": 0,
    "sentiment": "POSITIVO|NEUTRO|NEGATIVO|SIN_DATOS",
    "top_positive_themes": ["tema 1", "tema 2"],
    "top_negative_themes": ["tema 1", "tema 2"],
    "recent_news": ["Noticia reciente 1", "Noticia reciente 2"]
  }},
  "metrics": {{
    "reputation_score": 0,
    "digital_presence_score": 0,
    "market_maturity_score": 0,
    "ingentia_fit_score": 0,
    "overall_score": 0
  }},
  "analysis_date": "{datetime.now().strftime("%Y-%m-%d")}"
}}

INSTRUCCIONES PARA MÉTRICAS (escala 0-100):
- reputation_score: basado en reseñas de Google, menciones en medios y redes sociales.
- digital_presence_score: basado en presencia web, seguidores, actividad en redes.
- market_maturity_score: antigüedad en el mercado, tamaño, solidez del modelo de negocio.
- ingentia_fit_score: qué tan buena oportunidad representa para servicios de consultoría/automatización IA de Ingentia.
- overall_score: promedio ponderado de los 4 anteriores.
Si no hay suficiente información para un campo numérico, usa 0 y pon "SIN_DATOS" en el campo de texto equivalente.
"""

    try:
        final_response = gemini.models.generate_content(
            model='gemini-2.5-flash',
            contents=analysis_prompt,
            config=types.GenerateContentConfig(temperature=0.3)
        )
        clean_json = final_response.text.strip()
        # Limpiar posibles bloques de código markdown
        if clean_json.startswith('```json'):
            clean_json = clean_json[7:]
        if clean_json.startswith('```'):
            clean_json = clean_json[3:]
        if clean_json.endswith('```'):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        analysis_data = json.loads(clean_json)
        print("[+] Análisis estructurado generado.")
    except Exception as e:
        print(f"[-] Error generando o parseando JSON de análisis: {e}")
        raise

    # ──────────────────────────────────────────────────────────────────────
    # PASO 4: Guardar en Supabase — UPDATE en tabla clients
    # ──────────────────────────────────────────────────────────────────────
    print("[*] Guardando resultados en Supabase...")
    try:
        if not client_id:
            print(f"[-] Cliente '{client_name}' no encontrado en Supabase. No se puede guardar en el perfil del cliente.")
        else:
            supabase.table('clients').update({"client_analysis": analysis_data}).eq('id', client_id).execute()
            print("[+] ¡Análisis guardado exitosamente en el perfil del cliente!")
    except Exception as e:
        print(f"[-] Error guardando en Supabase: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Research Agent — IngentIA")
    parser.add_argument("--client", required=True, help="Nombre del Cliente")
    parser.add_argument("--project", required=True, help="Nombre del Proyecto")
    parser.add_argument("--minutes", required=False, default="", help="Texto de las minutas")

    args = parser.parse_args()
    asyncio.run(run_research_agent(args.client, args.project, args.minutes))
