import requests
import json

res = requests.get("https://openrouter.ai/api/v1/models")
if res.ok:
    data = res.json().get("data", [])
    free_models = []
    for m in data:
        model_id = m.get("id", "")
        pricing = m.get("pricing", {})
        prompt_price = float(pricing.get("prompt", "0") or "0")
        completion_price = float(pricing.get("completion", "0") or "0")
        if model_id.endswith(":free") or (prompt_price == 0 and completion_price == 0):
            free_models.append({
                "id": model_id,
                "name": m.get("name"),
                "context_length": m.get("context_length")
            })
    
    print(f"[+] Total de modelos FREE encontrados en OpenRouter: {len(free_models)}")
    for fm in free_models:
        print(f"  - {fm['id']} ({fm['name']}) [Context: {fm['context_length']}]")
    
    with open(".tmp/openrouter_free_models_catalog.json", "w", encoding="utf-8") as f:
        json.dump(free_models, f, indent=2)
else:
    print("[-] Error consultando modelos:", res.status_code, res.text)
