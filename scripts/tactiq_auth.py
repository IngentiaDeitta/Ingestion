"""
tactiq_auth.py — Autenticacion OAuth 2.1 + PKCE para Tactiq MCP
================================================================
v2.1 — Usa requests.Session con headers de browser real para pasar Cloudflare Bot Management.

Flujo:
1. Registra un OAuth client dinamico en Tactiq
2. Genera code_verifier + code_challenge (PKCE S256)
3. Abre la URL de autorizacion en el browser
4. Levanta un servidor local HTTP en localhost:8899 para recibir el callback
5. Canjea el code por access_token + refresh_token usando requests.Session
6. Guarda TACTIQ_ACCESS_TOKEN y TACTIQ_REFRESH_TOKEN en .env
"""

import os
import sys
import json
import hashlib
import base64
import secrets
import webbrowser
import threading
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

import requests

# ─── Configuracion ────────────────────────────────────────────────────────────
ENV_PATH = Path(__file__).parent.parent / ".env"
TACTIQ_BASE = "https://mcp.tactiq.io"
AUTH_ENDPOINT = f"{TACTIQ_BASE}/oauth/authorize"
TOKEN_ENDPOINT = f"{TACTIQ_BASE}/oauth/token"
REGISTER_ENDPOINT = f"{TACTIQ_BASE}/oauth/register"
REDIRECT_URI = "http://localhost:8899/callback"
SCOPES = "mcp:meetings:own mcp:meetings:shared mcp:meetings:spaces mcp:meetings:details"

BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/127.0.0.0 Safari/537.36"
)

# Sesion requests con headers de browser real
session = requests.Session()
session.headers.update({
    "User-Agent": BROWSER_UA,
    "Accept": "application/json",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "sec-ch-ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "Origin": TACTIQ_BASE,
    "Referer": f"{TACTIQ_BASE}/",
    "Connection": "keep-alive",
})

# ─── Helpers ──────────────────────────────────────────────────────────────────
def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def generate_pkce():
    code_verifier = b64url(secrets.token_bytes(32))
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = b64url(digest)
    return code_verifier, code_challenge

def load_env() -> dict:
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env

def save_env_var(key: str, value: str):
    lines = []
    found = False
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value}")
                found = True
            else:
                lines.append(line)
    if not found:
        lines.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[+] {key} guardado en .env")

# ─── Dynamic Client Registration ──────────────────────────────────────────────
def register_client() -> str:
    """Registra un cliente OAuth dinamico. Devuelve client_id."""
    print("[*] Registrando cliente OAuth dinamico...")
    try:
        resp = session.post(REGISTER_ENDPOINT, json={
            "client_name": "IngentIA MCP Client",
            "redirect_uris": [REDIRECT_URI],
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "token_endpoint_auth_method": "none",
            "scope": SCOPES,
        }, timeout=15)

        if resp.status_code in (200, 201):
            data = resp.json()
            cid = data.get("client_id", "mcp-client")
            print(f"[+] Cliente registrado: client_id={cid}")
            return cid
        else:
            print(f"[!] Registro retorno {resp.status_code}. Usando 'mcp-client'.")
            return "mcp-client"
    except Exception as ex:
        print(f"[!] Error en registro: {ex}. Usando 'mcp-client'.")
        return "mcp-client"

# ─── Callback Server ──────────────────────────────────────────────────────────
_auth_code = None
_server_ready = threading.Event()

class CallbackHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        global _auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if "code" in params:
            _auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("<html><body style='font-family:sans-serif;text-align:center;padding:60px'><h2 style='color:#22c55e'>OK - Autorizacion exitosa</h2><p>Tactiq autorizo a IngentIA. Podes cerrar esta ventana.</p></body></html>".encode("utf-8"))
        else:
            error = params.get("error", ["unknown"])[0]
            self.send_response(400)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(f"<html><body>Error: {error}</body></html>".encode())

def start_callback_server():
    server = HTTPServer(("localhost", 8899), CallbackHandler)
    _server_ready.set()
    server.handle_request()
    server.server_close()

# ─── Token Exchange ───────────────────────────────────────────────────────────
def exchange_code(code: str, client_id: str, code_verifier: str) -> dict:
    """Canjea el authorization code por access_token usando requests.Session."""
    print("[*] Canjeando codigo por access_token...")
    try:
        resp = session.post(TOKEN_ENDPOINT, json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": client_id,
            "code_verifier": code_verifier,
        }, timeout=15)

        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"[-] Token exchange HTTP {resp.status_code}: {resp.text[:500]}")
            # Intentar con form-encoded como fallback
            print("[*] Reintentando con application/x-www-form-urlencoded...")
            resp2 = session.post(TOKEN_ENDPOINT, data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "client_id": client_id,
                "code_verifier": code_verifier,
            }, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=15)
            if resp2.status_code == 200:
                return resp2.json()
            print(f"[-] Segundo intento HTTP {resp2.status_code}: {resp2.text[:500]}")
            return {}
    except Exception as ex:
        print(f"[-] Error en token exchange: {ex}")
        return {}

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  TACTIQ OAuth 2.1 + PKCE v2.1 — IngentIA")
    print("=" * 60)

    env = load_env()
    existing_token = env.get("TACTIQ_ACCESS_TOKEN")
    if existing_token:
        print(f"[i] Ya existe TACTIQ_ACCESS_TOKEN en .env")
        print("[?] Renovar token? (s/n): ", end="", flush=True)
        try:
            answer = input().strip().lower()
        except EOFError:
            answer = "s"
        if answer != "s":
            print("[+] Usando token existente.")
            return existing_token

    # 1. Registrar cliente
    client_id = env.get("TACTIQ_CLIENT_ID") or register_client()

    # 2. Generar PKCE
    code_verifier, code_challenge = generate_pkce()
    state = secrets.token_urlsafe(16)

    # 3. URL de autorizacion
    auth_params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    })
    auth_url = f"{AUTH_ENDPOINT}?{auth_params}"

    # 4. Iniciar servidor callback
    server_thread = threading.Thread(target=start_callback_server, daemon=True)
    server_thread.start()
    _server_ready.wait(timeout=2)

    # 5. Abrir browser
    print(f"\n[*] Abriendo browser para autorizacion Tactiq...")
    print(f"\n[!] Si el browser no se abre, abri manualmente esta URL:")
    print(f"    {auth_url}\n")
    webbrowser.open(auth_url)

    # 6. Esperar callback (120s)
    print("[*] Esperando autorizacion del browser", end="", flush=True)
    timeout = 120
    elapsed = 0
    while _auth_code is None and elapsed < timeout:
        time.sleep(1)
        elapsed += 1
        if elapsed % 5 == 0:
            print(".", end="", flush=True)

    print()

    if _auth_code is None:
        print("[-] Timeout. Pega el 'code' del redirect URL manualmente:")
        print("[?] code: ", end="", flush=True)
        try:
            manual = input().strip()
        except EOFError:
            manual = ""
        if not manual:
            print("[-] No se proveyó código. Abortando.")
            sys.exit(1)
        auth_code_val = manual
    else:
        auth_code_val = _auth_code
        print(f"[+] Codigo recibido via callback.")

    # 7. Canjear code por token
    token_data = exchange_code(auth_code_val, client_id, code_verifier)

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", "?")

    if not access_token:
        print(f"[-] No se obtuvo access_token. Respuesta: {token_data}")
        sys.exit(1)

    print(f"[+] Access Token obtenido (expira en {expires_in}s)")

    save_env_var("TACTIQ_CLIENT_ID", client_id)
    save_env_var("TACTIQ_ACCESS_TOKEN", access_token)
    if refresh_token:
        save_env_var("TACTIQ_REFRESH_TOKEN", refresh_token)

    print("\n[OK] Autenticacion completada. Token guardado en .env")
    print("[*] Ejecuta: python scripts/test_tactiq_mcp.py")
    return access_token


if __name__ == "__main__":
    main()
