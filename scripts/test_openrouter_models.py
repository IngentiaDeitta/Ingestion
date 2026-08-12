import os
import sys
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

# Detect key from various possible variable names in .env
OPENROUTER_API_KEY = (
    os.getenv("OPENROUTER")
    or os.getenv("OPENROUTER_API_KEY")
    or os.getenv("VITE_OPENROUTER_API_KEY")
)

if not OPENROUTER_API_KEY:
    print("[-] Error: No se encontró la API Key de OpenRouter (OPENROUTER u OPENROUTER_API_KEY) en el archivo .env.")
    sys.exit(1)

print(f"[+] API Key de OpenRouter detectada: {OPENROUTER_API_KEY[:10]}...{OPENROUTER_API_KEY[-4:]}")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Exact active free models on OpenRouter
FREE_MODELS_TO_TEST = [
    "openrouter/free",
    "openrouter/auto",
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "openai/gpt-oss-20b:free"
]

TEST_PROMPTS = {
    "simple_classification_json": {
        "description": "Clasificación simple de Lead e Industria (JSON)",
        "prompt": """Analizá este lead rápido:
Empresa: Dripcolor SA
Descripción: Fabricación y distribución de pinturas industriales y revestimientos arquitectónicos.
País: Argentina

Devolvé ÚNICAMENTE un JSON válido con las claves:
{
  "industria": "<industria principal>",
  "es_b2b": true,
  "resumen": "<resumen en 1 oración>"
}""",
        "expect_json": True
    },
    "simple_reasoning": {
        "description": "Razonamiento corto y estructurado",
        "prompt": "Decime 3 beneficios clave de automatizar procesos de ingesta de datos con IA en una PyME comercial. Sé sintético y directo.",
        "expect_json": False
    }
}

def clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def run_tests():
    os.makedirs(".tmp", exist_ok=True)
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "openrouter_key_present": True,
        "models_tested": []
    }

    print("\n" + "="*75)
    print("      INICIANDO PRUEBAS GLOBALES DE FUNCIONAMIENTO - OPENROUTER FREE")
    print("="*75)

    for model in FREE_MODELS_TO_TEST:
        print(f"\n[TESTING MODEL] {model}")
        model_result = {
            "model": model,
            "tests": []
        }

        for test_key, test_info in TEST_PROMPTS.items():
            print(f"  -> Prueba: {test_info['description']}...", end=" ", flush=True)
            start_time = time.time()
            
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ingentia.com.ar",
                "X-Title": "IngentIA Agentic System Global Test"
            }
            
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": test_info["prompt"]}],
                "temperature": 0.2
            }

            test_record = {
                "test_name": test_key,
                "description": test_info["description"],
                "success": False,
                "status_code": None,
                "latency_seconds": 0,
                "response_text": None,
                "json_parsed": None,
                "error": None
            }

            try:
                response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45)
                elapsed = round(time.time() - start_time, 2)
                test_record["latency_seconds"] = elapsed
                test_record["status_code"] = response.status_code

                if response.ok:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    test_record["response_text"] = content

                    if test_info["expect_json"]:
                        cleaned = clean_json_text(content)
                        try:
                            parsed = json.loads(cleaned)
                            test_record["json_parsed"] = parsed
                            test_record["success"] = True
                            print(f"OK ({elapsed}s) [JSON VÁLIDO]")
                        except json.JSONDecodeError as err:
                            test_record["error"] = f"JSON parse error: {str(err)}"
                            test_record["success"] = False
                            print(f"WARN ({elapsed}s) [Respuesta recibida pero JSON no válido]")
                    else:
                        test_record["success"] = True
                        print(f"OK ({elapsed}s) [RESPUESTA OK]")
                else:
                    err_msg = f"HTTP {response.status_code}: {response.text}"
                    test_record["error"] = err_msg
                    print(f"FAIL ({elapsed}s) -> {err_msg[:70]}")

            except Exception as e:
                elapsed = round(time.time() - start_time, 2)
                test_record["latency_seconds"] = elapsed
                test_record["error"] = str(e)
                print(f"ERROR ({elapsed}s) -> {str(e)[:60]}")

            model_result["tests"].append(test_record)

        results["models_tested"].append(model_result)

    # Output JSON result
    output_path = ".tmp/openrouter_test_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "="*75)
    print("                    RESUMEN GLOBAL DE PRUEBAS")
    print("="*75)
    
    successful_models = []
    failed_models = []

    for m in results["models_tested"]:
        model_name = m["model"]
        total_tests = len(m["tests"])
        passed = sum(1 for t in m["tests"] if t["success"])
        avg_latency = round(sum(t["latency_seconds"] for t in m["tests"]) / total_tests, 2) if total_tests > 0 else 0
        
        status_str = f"PASSED ({passed}/{total_tests})" if passed == total_tests else f"PARTIAL ({passed}/{total_tests})" if passed > 0 else "FAILED"
        print(f"• {model_name:<42} | Estado: {status_str:<15} | Latencia Promedio: {avg_latency}s")
        
        if passed > 0:
            successful_models.append(model_name)
        else:
            failed_models.append(model_name)

    print(f"\nResultados guardados en: {output_path}")
    return results

if __name__ == "__main__":
    run_tests()
