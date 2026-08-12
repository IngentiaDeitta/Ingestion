import os
import sys
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = (
    os.getenv("OPENROUTER")
    or os.getenv("OPENROUTER_API_KEY")
    or os.getenv("VITE_OPENROUTER_API_KEY")
)
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

OPENROUTER_FREE_MODELS = [
    "openrouter/free",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "openai/gpt-oss-20b:free",
    "openrouter/auto"
]

def clean_json_text(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```json"):
        s = s[7:]
    elif s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    return s.strip()

def call_openrouter(prompt: str, system_instruction: str = None, response_json: bool = False) -> str:
    if not OPENROUTER_API_KEY:
        raise Exception("API Key de OpenRouter no configurada en .env.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ingentia.com.ar",
        "X-Title": "IngentIA Agentic Router"
    }

    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    for model in OPENROUTER_FREE_MODELS:
        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2
            }
            res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45)
            if res.ok:
                data = res.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if text:
                    if response_json:
                        cleaned = clean_json_text(text)
                        # Validate JSON
                        json.loads(cleaned)
                        print(f"[AI Router -> OpenRouter SUCCESS] Modelo {model} respondió JSON válido.")
                        return cleaned
                    print(f"[AI Router -> OpenRouter SUCCESS] Modelo {model} respondió exitosamente.")
                    return text
        except Exception as e:
            print(f"[AI Router -> OpenRouter] Intento con modelo {model} falló: {e}")
            continue

    raise Exception("Todos los modelos free de OpenRouter fallaron.")

def call_gemini(prompt: str, system_instruction: str = None, response_json: bool = False) -> str:
    if not GEMINI_API_KEY:
        raise Exception("API Key de Gemini no configurada en .env.")

    full_prompt = prompt
    if system_instruction:
        full_prompt = f"INSTRUCCIÓN DE SISTEMA:\n{system_instruction}\n\nSOLICITUD:\n{prompt}"

    body = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096
        }
    }

    url = f"{GEMINI_URL}?key={GEMINI_API_KEY}"
    res = requests.post(url, headers={"Content-Type": "application/json"}, json=body, timeout=60)
    
    if not res.ok:
        raise Exception(f"Gemini API Error HTTP {res.status_code}: {res.text}")

    data = res.json()
    candidate = data.get("candidates", [{}])[0]
    parts = candidate.get("content", {}).get("parts", [])
    text = "".join([p.get("text", "") for p in parts if p.get("text")])

    if response_json:
        cleaned = clean_json_text(text)
        json.loads(cleaned)
        print(f"[AI Router -> Gemini SUCCESS] Gemini respondió JSON válido.")
        return cleaned

    print(f"[AI Router -> Gemini SUCCESS] Gemini respondió exitosamente.")
    return text

def execute_ai_task(prompt: str, system_instruction: str = None, complexity: str = "simple", response_json: bool = False) -> str:
    """
    Enruta la tarea de IA según su complejidad:
    - simple: Primario OpenRouter Free, Fallback Gemini API.
    - complex: Primario Gemini API, Fallback OpenRouter Free.
    """
    complexity_lower = complexity.lower()
    
    if complexity_lower == "simple":
        print(f"[AI Router] Ejecutando Tarea SIMPLE en OpenRouter Free...")
        try:
            return call_openrouter(prompt, system_instruction, response_json)
        except Exception as err:
            print(f"[AI Router -> Fallback] OpenRouter Free falló ({err}). Conmutando a Gemini API...")
            return call_gemini(prompt, system_instruction, response_json)
    else:
        print(f"[AI Router] Ejecutando Tarea COMPLEJA en Gemini API...")
        try:
            return call_gemini(prompt, system_instruction, response_json)
        except Exception as err:
            print(f"[AI Router -> Fallback] Gemini API falló ({err}). Conmutando a OpenRouter Free...")
            return call_openrouter(prompt, system_instruction, response_json)

if __name__ == "__main__":
    # Test router
    print("=== Probando Router con Tarea SIMPLE ===")
    simple_res = execute_ai_task("Clasificá la empresa 'Globant' en 1 palabra.", complexity="simple")
    print("Resultado Simple:", simple_res)

    print("\n=== Probando Router con Tarea COMPLEJA ===")
    complex_res = execute_ai_task("Desarrollá una justificación de ROI para implementar un CRM con IA en un distribuidor mayorista.", complexity="complex")
    print("Resultado Complejo:", complex_res[:150] + "...")
