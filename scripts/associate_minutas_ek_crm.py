"""
associate_minutas_ek_crm.py — Ingesta REAL de minutas Tactiq → Supabase
========================================================================
VERSIÓN 2.0 — Reescritura total. SIN datos hardcodeados.

Flujo principal (Modo A — via MCP):
  1. Lee TACTIQ_ACCESS_TOKEN del .env
  2. Inicializa sesión MCP con Tactiq
  3. Lista/busca reuniones con filtros: "EK", "Elektro", "Leandro Gino"
  4. Para cada reunión: obtiene transcript_text completo
  5. Persiste en Supabase: proyecto EK CRM + cliente Elektro Korrosión

Modo B (fallback sin token):
  - Lee transcripciones desde archivo .txt exportado de tactiq.io
  - Parsea: fecha, título, participantes, cuerpo
  - Persiste en Supabase

LECCIÓN APRENDIDA: Jamás hardcodear minutas. Si no hay conexión disponible,
usar el Modo B con archivo exportado.
"""

import os
import sys
import json
import ssl
import uuid
import re
import datetime
import urllib.request
import urllib.error
from pathlib import Path

# ─── Configuración ────────────────────────────────────────────────────────────
ENV_PATH = Path(__file__).parent.parent / ".env"
SUPABASE_URL = "https://gaawloviqgyzmqbtjsmd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdsb3ZpcWd5em1xYnRqc21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMDQwMiwiZXhwIjoyMDg4Nzc2NDAyfQ.bFDCYGlwGLfy50pxS1f0G4uyNOrZS3qBXcsG1wJSKqs"
TACTIQ_URL = "https://mcp.tactiq.io"

EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec"
EK_CLIENT_ID = "7044c378-dc65-4f24-a826-015438e4a7a2"

# Filtros para detectar reuniones de EK
EK_KEYWORDS = [
    "elektro", "korrosion", "korrosión", "leandro gino", "leandrogino",
    "ek crm", "elektrokorrosion"
]

ctx = ssl.create_default_context()

supabase_headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def load_env() -> dict:
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env

def supabase_request(endpoint: str, method: str = "GET", data: dict = None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=supabase_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            resp = r.read().decode("utf-8")
            return json.loads(resp) if resp else {}
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8", errors="ignore")
        print(f"[-] Supabase {method} {endpoint}: HTTP {e.code} — {body_err[:300]}")
        return None

def mcp_request(token: str, method: str, params: dict = None, req_id: int = 1) -> dict:
    payload = {"jsonrpc": "2.0", "id": req_id, "method": method}
    if params:
        payload["params"] = params

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TACTIQ_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {token}",
            "User-Agent": "IngentIA-MCP-Client/1.0",
        }
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            ct = r.headers.get("Content-Type", "")
            raw = r.read().decode("utf-8")
            if "text/event-stream" in ct:
                for line in raw.splitlines():
                    if line.startswith("data:"):
                        chunk = line[5:].strip()
                        if chunk and chunk != "[DONE]":
                            try:
                                parsed = json.loads(chunk)
                                if "result" in parsed or "error" in parsed:
                                    return parsed
                            except json.JSONDecodeError:
                                pass
                return {"raw_sse": raw[:500]}
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        body_err = e.read().decode("utf-8", errors="ignore")
        return {"error": {"code": e.code, "message": e.reason, "body": body_err[:500]}}
    except Exception as ex:
        return {"error": {"code": -1, "message": str(ex)}}

def is_ek_meeting(title: str, attendees: list) -> bool:
    """Determina si una reunión es de Elektro Korrosión."""
    text = (title + " " + " ".join(attendees)).lower()
    return any(kw in text for kw in EK_KEYWORDS)

def extract_meetings_from_result(result) -> list:
    """Extrae lista de reuniones de cualquier formato de respuesta Tactiq."""
    meetings = []
    if isinstance(result, list):
        meetings = result
    elif isinstance(result, dict):
        # Buscar en campos comunes
        for key in ["meetings", "transcripts", "items", "data", "content"]:
            if key in result and isinstance(result[key], list):
                meetings = result[key]
                break
        if not meetings and "content" in result:
            # Tactiq a veces devuelve content como lista de text blocks
            content = result["content"]
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        # Intentar parsear el texto como JSON
                        try:
                            parsed = json.loads(item.get("text", ""))
                            if isinstance(parsed, list):
                                meetings = parsed
                                break
                            elif isinstance(parsed, dict):
                                meetings = [parsed]
                                break
                        except Exception:
                            pass
    return meetings

def normalize_meeting(m: dict, source_tool: str) -> dict:
    """Normaliza una reunión de cualquier formato Tactiq al esquema interno."""
    # Intentar extraer campos comunes con múltiples nombres posibles
    meeting_id = (
        m.get("id") or m.get("meetingId") or m.get("meeting_id") or
        str(uuid.uuid4())
    )
    title = (
        m.get("title") or m.get("name") or m.get("summary") or
        m.get("meeting_title") or "Sin título"
    )
    created_at = (
        m.get("created_at") or m.get("createdAt") or m.get("date") or
        m.get("startTime") or m.get("start_time") or
        datetime.datetime.utcnow().isoformat() + "Z"
    )
    transcript = (
        m.get("transcript") or m.get("transcript_text") or m.get("text") or
        m.get("content") or m.get("body") or ""
    )
    summary = (
        m.get("summary") or m.get("executive_summary") or m.get("description") or ""
    )
    attendees_raw = (
        m.get("attendees") or m.get("participants") or m.get("guests") or []
    )
    if isinstance(attendees_raw, str):
        attendees_raw = [a.strip() for a in attendees_raw.split(",")]
    attendees = [str(a) for a in attendees_raw]

    return {
        "id": f"tactiq-real-{meeting_id}",
        "project_id": EK_PROJECT_ID,
        "created_at": created_at,
        "summary": title,
        "detailed_summary": summary,
        "attendees": attendees,
        "transcript_text": transcript,
        "action_items": m.get("action_items") or m.get("actionItems") or [],
        "_source": "tactiq_mcp_real",
        "_raw_id": meeting_id,
    }


# ─── MODO A: Via Tactiq MCP ───────────────────────────────────────────────────
def ingest_via_mcp(token: str) -> list:
    """Conecta con Tactiq MCP y trae las reuniones reales de EK."""
    print("\n[*] MODO A: Ingesta via Tactiq MCP")

    # Initialize
    resp = mcp_request(token, "initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "IngentIA", "version": "2.0"}
    }, req_id=1)

    if "error" in resp and resp["error"].get("code") in (401, 403):
        print(f"[-] Token inválido o expirado: {resp['error']}")
        print("[!] Re-autenticá con: python scripts/tactiq_auth.py")
        return []

    # Notificar initialized
    mcp_request(token, "notifications/initialized", req_id=2)

    # List tools
    tools_resp = mcp_request(token, "tools/list", req_id=3)
    tools = (tools_resp.get("result") or {}).get("tools", [])
    tool_names = [t.get("name", "") for t in tools]
    print(f"[+] Tools disponibles: {', '.join(tool_names) or 'ninguna'}")

    if not tools:
        print("[-] No se encontraron herramientas en Tactiq MCP.")
        return []

    ek_meetings = []

    # Buscar con cada estrategia disponible
    search_strategies = []

    # Herramienta de búsqueda
    search_tool = next((t["name"] for t in tools if "search" in t["name"].lower()), None)
    # Herramienta de listado
    list_tool = next(
        (t["name"] for t in tools if "list" in t["name"].lower() or "all" in t["name"].lower()),
        None
    )
    # Herramienta de detalle
    detail_tool = next(
        (t["name"] for t in tools if "detail" in t["name"].lower() or "get" in t["name"].lower()),
        None
    )

    req_counter = [4]

    def call_tool(name, arguments):
        rid = req_counter[0]
        req_counter[0] += 1
        resp = mcp_request(token, "tools/call", {"name": name, "arguments": arguments}, req_id=rid)
        return (resp.get("result") or resp)

    all_meetings_raw = []

    # Estrategia 1: buscar por keywords
    if search_tool:
        for query in ["Elektro Korrosion", "EK CRM", "Leandro Gino", "leandrogino"]:
            print(f"[*] Buscando: '{query}' con {search_tool}...")
            result = call_tool(search_tool, {"query": query})
            batch = extract_meetings_from_result(result)
            print(f"  → {len(batch)} resultados")
            all_meetings_raw.extend(batch)

    # Estrategia 2: listar todas las reuniones
    if list_tool and not all_meetings_raw:
        print(f"[*] Listando todas las reuniones con {list_tool}...")
        result = call_tool(list_tool, {})
        batch = extract_meetings_from_result(result)
        print(f"  → {len(batch)} reuniones encontradas")
        all_meetings_raw.extend(batch)

    # Estrategia 3: primera herramienta disponible sin argumentos
    if not all_meetings_raw and tools:
        first = tools[0]["name"]
        print(f"[*] Intentando con primera herramienta: {first}...")
        result = call_tool(first, {})
        batch = extract_meetings_from_result(result)
        all_meetings_raw.extend(batch)

    print(f"\n[+] Total reuniones obtenidas de Tactiq: {len(all_meetings_raw)}")

    # Filtrar solo las de EK
    seen_ids = set()
    for m in all_meetings_raw:
        title = str(m.get("title") or m.get("name") or m.get("summary") or "")
        attendees = m.get("attendees") or m.get("participants") or []
        if isinstance(attendees, list):
            attendees = [str(a) for a in attendees]

        if is_ek_meeting(title, attendees):
            raw_id = str(m.get("id") or m.get("meetingId") or "")
            if raw_id not in seen_ids:
                seen_ids.add(raw_id)
                normalized = normalize_meeting(m, search_tool or list_tool or "unknown")

                # Si hay herramienta de detalle, enriquecer con transcript completo
                if detail_tool and raw_id:
                    detail_result = call_tool(detail_tool, {"id": raw_id})
                    detail_meetings = extract_meetings_from_result(detail_result)
                    if detail_meetings:
                        full = normalize_meeting(detail_meetings[0], detail_tool)
                        # Usar transcript del detalle si es más completo
                        if len(full.get("transcript_text", "")) > len(normalized.get("transcript_text", "")):
                            normalized["transcript_text"] = full["transcript_text"]
                        if len(full.get("detailed_summary", "")) > len(normalized.get("detailed_summary", "")):
                            normalized["detailed_summary"] = full["detailed_summary"]

                ek_meetings.append(normalized)
                print(f"  ✅ EK: {normalized['summary'][:60]} ({normalized['created_at'][:10]})")

    print(f"\n[+] Reuniones de EK encontradas: {len(ek_meetings)}")
    return ek_meetings


# ─── MODO B: Via archivo exportado ───────────────────────────────────────────
def ingest_via_file(file_path: str) -> list:
    """
    Parsea un archivo exportado desde tactiq.io (formato .txt o .json).
    Soporta:
    - JSON: array de objetos reunión
    - TXT: formato Tactiq export (bloques separados por líneas vacías)
    """
    print(f"\n[*] MODO B: Leyendo archivo {file_path}...")
    path = Path(file_path)
    if not path.exists():
        print(f"[-] Archivo no encontrado: {file_path}")
        return []

    content = path.read_text(encoding="utf-8", errors="ignore")

    # Intentar JSON primero
    try:
        data = json.loads(content)
        if isinstance(data, list):
            meetings_raw = data
        elif isinstance(data, dict):
            meetings_raw = data.get("meetings") or data.get("transcripts") or [data]
        print(f"[+] Archivo JSON parseado: {len(meetings_raw)} reuniones")
        meetings = []
        for m in meetings_raw:
            normalized = normalize_meeting(m, "file_import")
            title = normalized["summary"]
            attendees = normalized["attendees"]
            if is_ek_meeting(title, attendees):
                meetings.append(normalized)
                print(f"  ✅ EK: {title[:60]}")
            else:
                print(f"  ⏭  Omitida (no es EK): {title[:60]}")
        return meetings
    except json.JSONDecodeError:
        pass

    # Intentar parsear TXT (formato de export de Tactiq)
    # Detecta bloques separados por "---" o líneas en blanco múltiples
    print("[*] Parseando como texto plano (formato Tactiq export)...")
    meetings = []

    # Patrón: título en primera línea, fecha en segunda, cuerpo después
    blocks = re.split(r'\n{3,}|^---+$', content, flags=re.MULTILINE)
    for block in blocks:
        lines = [l.strip() for l in block.strip().splitlines() if l.strip()]
        if not lines:
            continue

        title = lines[0] if lines else "Sin título"
        date_str = ""
        attendees = []
        body_lines = []

        for i, line in enumerate(lines[1:], 1):
            # Detectar fecha
            date_match = re.search(r'\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}', line)
            if date_match and not date_str:
                date_str = date_match.group()
                continue
            # Detectar participantes
            if re.match(r'(Participants?|Attendees?|Asistentes?):', line, re.I):
                rest = line.split(":", 1)[1].strip()
                attendees = [a.strip() for a in re.split(r'[,;]', rest)]
                continue
            body_lines.append(line)

        meeting_raw = {
            "id": str(uuid.uuid4()),
            "title": title,
            "date": date_str or datetime.datetime.utcnow().isoformat() + "Z",
            "attendees": attendees,
            "transcript": "\n".join(body_lines),
        }
        normalized = normalize_meeting(meeting_raw, "file_txt")
        if is_ek_meeting(title, attendees):
            meetings.append(normalized)
            print(f"  ✅ EK: {title[:60]}")

    print(f"[+] Reuniones EK extraídas del archivo: {len(meetings)}")
    return meetings


# ─── Persistencia en Supabase ─────────────────────────────────────────────────
def build_meeting_intelligence(meetings: list) -> dict:
    """Genera síntesis ejecutiva basada en los datos REALES de las reuniones."""
    if not meetings:
        return {}

    # Ordenar por fecha
    meetings_sorted = sorted(meetings, key=lambda m: m.get("created_at", ""))
    total = len(meetings_sorted)
    first_date = meetings_sorted[0].get("created_at", "")[:10]
    last_date = meetings_sorted[-1].get("created_at", "")[:10]

    # Extraer participantes únicos
    all_attendees = set()
    for m in meetings_sorted:
        for a in m.get("attendees", []):
            if a:
                all_attendees.add(str(a))

    # Extraer action items reales
    all_action_items = []
    for m in meetings_sorted:
        for ai in m.get("action_items", []):
            if ai and ai not in all_action_items:
                all_action_items.append(str(ai))

    titles = [m.get("summary", "")[:80] for m in meetings_sorted]

    return {
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
        "source": "tactiq_mcp_real",
        "executive_summary": (
            f"Se registraron {total} reunión(es) de trabajo con Elektro Korrosión entre {first_date} y {last_date}. "
            f"Participantes: {', '.join(sorted(all_attendees)[:5])}. "
            f"Sesiones: {'; '.join(titles[:3])}{'...' if total > 3 else ''}."
        ),
        "key_decisions": [m.get("summary", "") for m in meetings_sorted[-3:]],
        "agreed_commitments": all_action_items[:6],
        "identified_pain_points": [],
        "next_steps": all_action_items[-3:] if len(all_action_items) > 3 else all_action_items,
    }

def persist_to_supabase(meetings: list):
    """Persiste las minutas reales en proyecto EK CRM y cliente Elektro Korrosión."""
    if not meetings:
        print("[-] No hay minutas para persistir.")
        return

    print(f"\n[*] Persistiendo {len(meetings)} minutas reales en Supabase...")

    # ── Proyecto EK CRM ───────────────────────────────────────────────────────
    projects = supabase_request(f"projects?id=eq.{EK_PROJECT_ID}")
    if not projects:
        print("[-] Proyecto EK CRM no encontrado.")
        return

    project = projects[0]
    current_analysis = project.get("project_analysis") or {}
    existing = current_analysis.get("transcripts") or []
    existing_ids = {t.get("id") for t in existing if t.get("id")}

    added = 0
    for m in meetings:
        mid = m["id"]
        if mid not in existing_ids:
            existing.append(m)
            existing_ids.add(mid)
            added += 1
        else:
            # Actualizar con datos más recientes
            existing = [m if t.get("id") == mid else t for t in existing]

    existing.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    meeting_intel = build_meeting_intelligence(existing)

    current_analysis["transcripts"] = existing
    current_analysis["meeting_intelligence"] = meeting_intel

    print(f"[+] {added} minutas nuevas | Total: {len(existing)}")
    supabase_request(
        f"projects?id=eq.{EK_PROJECT_ID}",
        method="PATCH",
        data={"project_analysis": current_analysis}
    )
    print("[+] Proyecto EK CRM actualizado ✅")

    # ── Cliente Elektro Korrosión ─────────────────────────────────────────────
    clients = supabase_request(f"clients?id=eq.{EK_CLIENT_ID}")
    if not clients:
        print("[-] Cliente Elektro Korrosión no encontrado.")
        return

    client = clients[0]
    client_analysis = client.get("client_analysis") or {}
    client_transcripts = client_analysis.get("transcripts") or []
    client_ids = {t.get("id") for t in client_transcripts if t.get("id")}

    for m in meetings:
        mid = m["id"]
        if mid not in client_ids:
            client_transcripts.append(m)
            client_ids.add(mid)
        else:
            client_transcripts = [m if t.get("id") == mid else t for t in client_transcripts]

    client_transcripts.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    client_analysis["transcripts"] = client_transcripts
    client_analysis["meeting_intelligence"] = meeting_intel

    supabase_request(
        f"clients?id=eq.{EK_CLIENT_ID}",
        method="PATCH",
        data={"client_analysis": client_analysis}
    )
    print("[+] Cliente Elektro Korrosión actualizado ✅")

    print(f"\n{'='*60}")
    print("  INGESTA COMPLETADA — DATOS REALES DE TACTIQ")
    print(f"{'='*60}")
    for m in existing[:5]:
        print(f"  • {m.get('created_at','')[:10]} | {m.get('summary','')[:55]}")
    if len(existing) > 5:
        print(f"  ... y {len(existing)-5} más")


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  INGESTA MINUTAS EK — TACTIQ MCP REAL v2.0")
    print("=" * 60)

    env = load_env()
    token = env.get("TACTIQ_ACCESS_TOKEN")

    # Modo A: MCP con token
    if token:
        print(f"[+] Token Tactiq encontrado. Modo A — Via MCP.")
        meetings = ingest_via_mcp(token)
        if meetings:
            persist_to_supabase(meetings)
            return

        print("\n[!] Modo A no obtuvo reuniones.")
        print("[?] ¿Querés intentar con un archivo exportado de Tactiq? (s/n): ", end="", flush=True)
        if input().strip().lower() != "s":
            print("[*] Fin. Para re-autenticarte: python scripts/tactiq_auth.py")
            return
    else:
        print("[-] No hay TACTIQ_ACCESS_TOKEN en .env")
        print("[!] Para autenticarte: python scripts/tactiq_auth.py")
        print()
        print("[?] ¿Tenés un archivo .txt o .json exportado de Tactiq? (s/n): ", end="", flush=True)
        if input().strip().lower() != "s":
            print("[*] Fin. Ejecutá tactiq_auth.py primero.")
            return

    # Modo B: Archivo
    print("[?] Ruta al archivo (ej: C:\\Users\\Fer\\Downloads\\tactiq_export.txt): ", end="", flush=True)
    file_path = input().strip().strip('"')
    if not file_path:
        print("[-] No se proporcionó ruta. Fin.")
        return

    meetings = ingest_via_file(file_path)
    if meetings:
        persist_to_supabase(meetings)
    else:
        print("[-] No se encontraron reuniones de EK en el archivo.")


if __name__ == "__main__":
    main()
