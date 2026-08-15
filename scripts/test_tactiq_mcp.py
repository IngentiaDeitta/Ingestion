"""
test_tactiq_mcp.py — Test completo de conexión MCP con Tactiq
=============================================================
Pasos:
1. Lee TACTIQ_ACCESS_TOKEN del .env
2. POST initialize → handshake MCP
3. POST tools/list → descubre herramientas disponibles
4. POST tools/call para buscar reuniones con EK / Elektro / Leandro
5. Muestra transcript real de cada reunión encontrada
"""

import os
import json
import ssl
import sys
import urllib.request
import urllib.error
from pathlib import Path

ENV_PATH = Path(__file__).parent.parent / ".env"
TACTIQ_URL = "https://mcp.tactiq.io"
ctx = ssl.create_default_context()

# ─── Helpers ──────────────────────────────────────────────────────────────────
def load_env() -> dict:
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env

def mcp_request(token: str, method: str, params: dict = None, req_id: int = 1) -> dict:
    """Envía una request JSON-RPC 2.0 al servidor MCP de Tactiq."""
    payload = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": method,
    }
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
        with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
            ct = r.headers.get("Content-Type", "")
            raw = r.read().decode("utf-8")

            # Tactiq puede responder con SSE (text/event-stream) o JSON directo
            if "text/event-stream" in ct:
                # Parsear SSE: buscar líneas "data: {json}"
                result_json = None
                for line in raw.splitlines():
                    if line.startswith("data:"):
                        chunk = line[5:].strip()
                        if chunk and chunk != "[DONE]":
                            try:
                                parsed = json.loads(chunk)
                                if "result" in parsed or "error" in parsed:
                                    result_json = parsed
                            except json.JSONDecodeError:
                                pass
                return result_json or {"raw_sse": raw[:2000]}
            else:
                return json.loads(raw)

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        return {"error": {"code": e.code, "message": e.reason, "body": body[:500]}}
    except Exception as ex:
        return {"error": {"code": -1, "message": str(ex)}}


def pp(label: str, data):
    """Pretty-print con separador."""
    print(f"\n{'─'*60}")
    print(f"  {label}")
    print(f"{'─'*60}")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(data)


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  TEST CONEXIÓN TACTIQ MCP — IngentIA")
    print("=" * 60)

    env = load_env()
    token = env.get("TACTIQ_ACCESS_TOKEN")

    if not token:
        print("[-] No se encontró TACTIQ_ACCESS_TOKEN en .env")
        print("[!] Ejecutá primero: python scripts/tactiq_auth.py")
        sys.exit(1)

    print(f"[+] Token encontrado: {token[:20]}...")

    # ── STEP 1: Initialize ────────────────────────────────────────────────────
    print("\n[*] STEP 1: Initialize MCP session...")
    resp = mcp_request(token, "initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "roots": {"listChanged": False},
            "sampling": {}
        },
        "clientInfo": {
            "name": "IngentIA",
            "version": "1.0.0"
        }
    }, req_id=1)

    if "error" in resp:
        pp("ERROR en initialize", resp["error"])
        sys.exit(1)

    pp("Initialize OK", resp.get("result", resp))
    server_info = (resp.get("result") or {}).get("serverInfo", {})
    print(f"\n[+] Servidor: {server_info.get('name', '?')} v{server_info.get('version', '?')}")

    # Notificar initialized
    mcp_request(token, "notifications/initialized", req_id=2)

    # ── STEP 2: List Tools ───────────────────────────────────────────────────
    print("\n[*] STEP 2: Listando herramientas disponibles...")
    resp = mcp_request(token, "tools/list", req_id=3)
    tools = (resp.get("result") or {}).get("tools", [])
    pp(f"Tools disponibles ({len(tools)})", tools)

    if not tools:
        print("[!] No se encontraron herramientas. Verificar token y permisos.")
        sys.exit(1)

    tool_names = [t.get("name") for t in tools]
    print(f"\n[+] Herramientas: {', '.join(tool_names)}")

    # ── STEP 3: Listar reuniones recientes ───────────────────────────────────
    print("\n[*] STEP 3: Listando reuniones recientes...")

    # Buscar la herramienta correcta (puede llamarse list_meetings, get_transcripts, etc.)
    list_tool = None
    search_tool = None
    get_tool = None

    for t in tools:
        name = t.get("name", "").lower()
        if "list" in name and "meeting" in name:
            list_tool = t["name"]
        if "search" in name:
            search_tool = t["name"]
        if "get" in name and ("transcript" in name or "meeting" in name or "detail" in name):
            get_tool = t["name"]

    # Intentar con la herramienta de listado
    if list_tool:
        print(f"[*] Usando tool: {list_tool}")
        resp = mcp_request(token, "tools/call", {
            "name": list_tool,
            "arguments": {}
        }, req_id=4)
        pp(f"Resultado {list_tool}", resp.get("result", resp))
    elif tools:
        # Usar la primera herramienta disponible con arguments vacíos
        first_tool = tools[0]["name"]
        print(f"[*] Usando primera tool disponible: {first_tool}")
        resp = mcp_request(token, "tools/call", {
            "name": first_tool,
            "arguments": {}
        }, req_id=4)
        pp(f"Resultado {first_tool}", resp.get("result", resp))

    # ── STEP 4: Buscar reuniones con EK ──────────────────────────────────────
    if search_tool:
        print(f"\n[*] STEP 4: Buscando reuniones 'Elektro' con tool: {search_tool}")
        resp = mcp_request(token, "tools/call", {
            "name": search_tool,
            "arguments": {"query": "Elektro Korrosion"}
        }, req_id=5)
        pp("Reuniones con 'Elektro'", resp.get("result", resp))

        print(f"\n[*] Buscando reuniones 'Leandro'...")
        resp2 = mcp_request(token, "tools/call", {
            "name": search_tool,
            "arguments": {"query": "Leandro"}
        }, req_id=6)
        pp("Reuniones con 'Leandro'", resp2.get("result", resp2))

    print("\n" + "=" * 60)
    print("  TEST COMPLETADO")
    print("=" * 60)
    print("\n[*] Revisá el output para identificar las herramientas y")
    print("    el formato de datos. Eso alimentará associate_minutas_ek_crm.py")


if __name__ == "__main__":
    main()
