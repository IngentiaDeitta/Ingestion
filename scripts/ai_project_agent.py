import os
import sys
import json
import argparse
import asyncio
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from google import genai
from google.genai import types

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("[-] Error: Variables de entorno insuficientes. Verifica .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini = genai.Client(api_key=GEMINI_API_KEY)

MCP_EXE = "C:\\Users\\Fer\\.local\\bin\\notebooklm-mcp.exe"


class NotebookLMClient:
    """
    Cliente JSON-RPC directo para notebooklm-mcp.exe via subprocess.
    Evita incompatibilidades de version con la librería `mcp`.
    """

    def __init__(self):
        self.proc = None
        self._id = 0

    def _next_id(self):
        self._id += 1
        return self._id

    def start(self):
        self.proc = subprocess.Popen(
            [MCP_EXE],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            env={**os.environ}
        )
        # Inicializar sesión MCP
        self._send({
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "ingentia-agent", "version": "1.0"}
            }
        })
        init_resp = self._read()
        if not init_resp or "error" in init_resp:
            raise RuntimeError(f"Error inicializando MCP: {init_resp}")

        # Enviar initialized notification
        self._send({
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {}
        })
        return self

    def _send(self, payload: dict):
        line = json.dumps(payload) + "\n"
        self.proc.stdin.write(line)
        self.proc.stdin.flush()

    def _read(self):
        """Lee la próxima línea JSON de stdout, ignorando líneas no-JSON."""
        while True:
            line = self.proc.stdout.readline()
            if not line:
                return None
            line = line.strip()
            if not line:
                continue
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue  # ignorar logs del servidor

    def call_tool(self, tool_name: str, arguments: dict) -> dict:
        req_id = self._next_id()
        self._send({
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments}
        })
        resp = self._read()
        if resp and "result" in resp:
            content = resp["result"].get("content", [])
            if content:
                try:
                    return json.loads(content[0].get("text", "{}"))
                except Exception:
                    return {"raw": content[0].get("text", "")}
        return {}

    def stop(self):
        if self.proc:
            try:
                self.proc.stdin.close()
                self.proc.wait(timeout=5)
            except Exception:
                self.proc.kill()


def extract_notebook_context(client_name: str, project_name: str) -> str:
    """
    Conecta con NotebookLM via JSON-RPC directo, busca el cuaderno del cliente
    y extrae el contexto de los documentos clasificados [CTX] [DOC] [MEET] [PROJ-XXX].
    """
    print("[*] Conectando con NotebookLM MCP Server (JSON-RPC directo)...")
    client = NotebookLMClient()

    try:
        client.start()
        print("[+] Conexion MCP establecida.")

        # Listar cuadernos
        print("[*] Buscando cuaderno del cliente en NotebookLM...")
        list_data = client.call_tool("notebook_list", {"max_results": 50})

        if list_data.get("status") == "error":
            err = list_data.get("error", "")
            if "expire" in err.lower() or "auth" in err.lower():
                raise RuntimeError("Auth expirada. Ejecuta `notebooklm-mcp-auth` en la terminal.")
            raise RuntimeError(f"Error NotebookLM: {err}")

        def normalize(s):
            import unicodedata
            s = s.lower().replace(" ", "")
            return "".join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

        notebooks = list_data.get("notebooks", [])
        notebook_id = None
        target_norm = normalize(client_name)
        
        for nb in notebooks:
            title = nb.get("title", "")
            if normalize(title) == target_norm:
                notebook_id = nb["id"]
                print(f"[+] Cuaderno encontrado: '{title}' (match con '{client_name}')")
                break

        if not notebook_id:
            print(f"[-] No existe cuaderno para '{client_name}' (Normalizado: {target_norm}).")
            print(f"[*] Cuadernos disponibles: {[nb.get('title') for nb in notebooks]}")
            return ""

        # Consulta priorizada: primero [PROJ-XXX], luego complementa con [MEET] y [CTX]
        print("[*] Leyendo documentos del cuaderno (PROJ, MEET, CTX, DOC)...")
        query = (
            f"Tomando como fuente principal los documentos [PROJ-{project_name}] o similares, "
            f"complementado con [MEET] (minutas), [CTX] (contexto general de la empresa) y [DOC] (procesos): "
            f"Resume el objetivo del proyecto '{project_name}', el problema de negocio que resuelve, "
            f"los requerimientos funcionales conocidos, el alcance, las integraciones previstas "
            f"y cualquier restriccion o decision tecnica documentada."
        )
        query_data = client.call_tool("notebook_query", {
            "notebook_id": notebook_id,
            "query": query
        })

        answer = query_data.get("answer", "")
        if answer:
            print("[+] Contexto extraido de NotebookLM exitosamente.")
            return answer
        else:
            print("[-] NotebookLM no retorno respuesta. Se usara Client Analysis como unico contexto.")
            return ""

    except RuntimeError as e:
        print(f"[-] {e}")
        return ""
    except Exception as e:
        print(f"[-] Error inesperado con NotebookLM: {type(e).__name__}: {e}")
        return ""
    finally:
        client.stop()


async def run_project_agent(project_id: str):
    print(f"[*] Iniciando AI Project Analyst para proyecto ID: {project_id}")

    # 1. Datos del proyecto desde Supabase
    res_proj = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not res_proj.data:
        print(f"[-] Proyecto {project_id} no encontrado en Supabase.")
        sys.exit(1)

    project = res_proj.data[0]
    client_name  = project.get("client", "Desconocido")
    project_name = project.get("name", "Sin Nombre")
    project_desc = project.get("description", "")

    print(f"[+] Proyecto: '{project_name}' | Cliente: '{client_name}'")

    # 2. Client Analysis
    client_analysis = {}
    if client_name != "Desconocido":
        res_client = supabase.table("clients").select("client_analysis").eq("name", client_name).execute()
        if res_client.data and res_client.data[0].get("client_analysis"):
            client_analysis = res_client.data[0]["client_analysis"]
            print("[+] Client Analysis recuperado.")
        else:
            print("[-] Sin Client Analysis previo para este cliente.")

    # 3. Contexto de NotebookLM (sincronico, no necesita asyncio)
    notebook_context = extract_notebook_context(client_name, project_name)

    # 4. Construir prompt con toda la informacion disponible
    notebook_section = (
        f"CONTEXTO DE NOTEBOOKLM (documentos [CTX] [DOC] [MEET] [PROJ-XXX]):\n{notebook_context}"
        if notebook_context
        else "CONTEXTO DE NOTEBOOKLM: No disponible. Infiere basandote en el nombre del proyecto, su descripcion y el Client Analysis."
    )

    print("[*] Generando AI Project Analysis con Gemini...")
    prompt = f"""Sos un AI Project Analyst de Ingentia, una consultora de IA estrategica.
Tu tarea es analizar el siguiente proyecto dentro del contexto de su cliente.

REGLAS CRITICAS:
- Analiza el problema de NEGOCIO real que el proyecto busca resolver, no la ausencia de documentacion.
- Si no hay descripcion textual, usa el nombre del proyecto + el contexto del cliente para inferir el problema de negocio.
- Nunca reportes "falta de descripcion" como problema principal: eso no aporta valor.
- Se concreto, especifico y accionable.

=== DATOS DEL PROYECTO ===
Nombre: {project_name}
Descripcion en sistema: {project_desc or '(no registrada)'}
Cliente: {client_name}

=== PERFIL ESTRATEGICO DEL CLIENTE (Client Analysis) ===
{json.dumps(client_analysis, indent=2, ensure_ascii=False)}

=== {notebook_section} ===

=== PROCESO DE ANALISIS ===
1. Identificar el problema de negocio principal que el proyecto resuelve para el cliente.
2. Determinar el impacto esperado en las operaciones del cliente.
3. Detectar las areas de la empresa afectadas.
4. Clasificar el tipo de solucion (deterministica, secuencial, basada en reglas, ambigua, exploratoria, iterativa).
5. Evaluar urgencia y complejidad segun el contexto.

Responde UNICAMENTE con JSON valido (sin markdown, sin ```json, sin texto extra):
{{
  "project_summary": "Resumen de 1-2 parrafos del proyecto y su objetivo de negocio",
  "problem": "El problema de negocio concreto que resuelve este proyecto",
  "impact": "Impacto esperado en las operaciones y resultados del cliente",
  "areas": ["area 1", "area 2"],
  "urgency": "ALTA | MEDIA | BAJA",
  "classification": "deterministico | secuencial | basado en reglas | ambiguo | exploratorio | iterativo",
  "complexity": "ALTA | MEDIA | BAJA"
}}"""

    try:
        response = gemini.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.4)
        )
        clean = response.text.strip()
        for prefix in ["```json", "```"]:
            if clean.startswith(prefix):
                clean = clean[len(prefix):]
        if clean.endswith("```"):
            clean = clean[:-3]
        analysis_data = json.loads(clean.strip())
        print("[+] Analisis estructurado generado.")
    except Exception as e:
        print(f"[-] Error generando JSON: {e}")
        sys.exit(1)

    # 5. Guardar en Supabase
    print("[*] Guardando en Supabase...")
    try:
        supabase.table("projects").update({"project_analysis": analysis_data}).eq("id", project_id).execute()
        print("[+] Analisis guardado exitosamente!")
    except Exception as e:
        print(f"[-] Error guardando en Supabase: {e}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Project Agent — IngentIA")
    parser.add_argument("--project_id", required=True, help="ID del Proyecto a analizar")
    args = parser.parse_args()
    asyncio.run(run_project_agent(args.project_id))
