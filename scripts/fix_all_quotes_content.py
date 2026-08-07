import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

quotes = supabase.table("quotes").select("*").execute().data

for q in quotes:
    content = q.get("content") or {}
    
    # Asegurar la estructura mínima requerida por SmartQuoter
    updated = False
    
    if "pricing" not in content or not isinstance(content["pricing"], dict):
        total = q.get("total_amount") or 1800
        content["pricing"] = {
            "module1": {
                "price": round(total * 0.3) if total > 0 else 600,
                "description": "Diagnóstico operativo, levantamiento de requerimientos y arquitectura del sistema.",
                "deliveryDays": 15
            },
            "module2": {
                "price": round(total * 0.7) if total > 0 else 1200,
                "description": "Desarrollo de solución a medida, automatizaciones n8n y configuración de interfaz.",
                "pricingModel": "Precio Fijo con 50% anticipo"
            },
            "module3": {
                "monthlyPrice": 150,
                "description": "Mantenimiento evolutivo, soporte técnico y optimización continua."
            },
            "totalInitialInvestment": total if total > 0 else 1800
        }
        updated = True
        
    if "diagnosis" not in content or not content["diagnosis"]:
        content["diagnosis"] = f"Diagnóstico de requerimientos para {q.get('title')}: automatización de flujos y optimización operativa."
        updated = True
        
    if "deliverables" not in content or not isinstance(content["deliverables"], list):
        content["deliverables"] = [
            f"Especficación funcional de {q.get('title')}",
            "Integraciones de flujos de trabajo automatizados",
            "Capacitación de uso y soporte inicial"
        ]
        updated = True

    if "roiEstimate" not in content:
        content["roiEstimate"] = "Reducción estimada del 35% en tiempos de gestión manual y eliminación de errores de procesamiento."
        updated = True

    if updated:
        res = supabase.table("quotes").update({"content": content}).eq("id", q["id"]).execute()
        print(f"[+] Contenido de propuesta '{q.get('title')}' normalizado correctamente.")

print("\n--- RESUMEN DE TODAS LAS PROPUESTAS ---")
final_quotes = supabase.table("quotes").select("id, title, client_name, status, total_amount").execute().data
print(json.dumps(final_quotes, indent=2))
