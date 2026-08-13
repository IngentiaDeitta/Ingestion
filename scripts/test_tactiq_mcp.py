import urllib.request
import urllib.error
import ssl

def check_url(url):
    print(f"Probando {url}...", flush=True)
    ctx = ssl.create_default_context()
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/event-stream, application/json, text/html, */*"
            }
        )
        with urllib.request.urlopen(req, context=ctx, timeout=5) as response:
            print(f"[{url}] Status: {response.status}", flush=True)
            for k, v in response.headers.items():
                if "auth" in k.lower() or "mcp" in k.lower() or "content-type" in k.lower():
                    print(f"  Header {k}: {v}", flush=True)
            body = response.read(500).decode('utf-8', errors='ignore')
            print(f"  Body: {body}", flush=True)
    except urllib.error.HTTPError as e:
        print(f"[{url}] HTTP {e.code}: {e.reason}", flush=True)
        for k, v in e.headers.items():
            if "auth" in k.lower() or "mcp" in k.lower() or "location" in k.lower() or "www-authenticate" in k.lower():
                print(f"  Header {k}: {v}", flush=True)
        try:
            body = e.read(500).decode('utf-8', errors='ignore')
            print(f"  Error body: {body}", flush=True)
        except Exception:
            pass
    except Exception as ex:
        print(f"[{url}] Error: {ex}", flush=True)

if __name__ == "__main__":
    check_url("https://mcp.tactiq.io")
    check_url("https://mcp.tactiq.io/sse")
