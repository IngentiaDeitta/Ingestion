import os
import sys
import json
import base64
import argparse
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("[-] Error: VITE_GEMINI_API_KEY no está configurada en el archivo .env")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

def extract_milestones_from_pdf(pdf_path: str):
    print(f"[*] Leyendo archivo PDF: {pdf_path}")
    if not os.path.exists(pdf_path):
        print(f"[-] Error: El archivo {pdf_path} no existe.")
        return None
        
    try:
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()
            pdf_base64 = base64.b64encode(pdf_data).decode("utf-8")
    except Exception as e:
        print(f"[-] Error al leer/codificar PDF: {e}")
        return None

    print("[*] Enviando archivo a Gemini...")
    
    prompt = """
    Analiza el documento adjunto (puede ser una propuesta comercial, plan de trabajo o cronograma) y extrae todos los hitos del proyecto, tanto hitos entregables como hitos de facturación o cobro.

    Para cada hito detectado, extrae:
    1. Nombre o título corto del hito.
    2. Descripción del hito o de lo que se entrega.
    3. Tipo de hito: 'delivery' (si es solo un entregable técnico o hito de trabajo), 'billing' (si es un hito de pago o cobro, por ejemplo un anticipo o pago al inicio), o 'both' (si es la entrega de un módulo que tiene un pago asociado).
    4. Fecha estimada: busca en el cronograma la fecha estimada de finalización o de entrega de ese hito. Si solo hay semanas de duración (ej. semana 1, 2, etc.), calcula la fecha estimada a partir de la fecha de inicio del proyecto (hoy es 2026-06-30). Si no hay fecha en absoluto, estima una fecha razonable basada en el orden de las fases. Por favor, usa formato YYYY-MM-DD.
    5. Monto en USD: si el hito está asociado a un cobro o facturación, busca el monto en USD o el porcentaje de cobro (e infiere el monto a partir del presupuesto del proyecto si es posible). Si no aplica, deja null.

    Responde ÚNICAMENTE con un JSON válido con esta estructura (no utilices markdown, no utilices ```json ni texto adicional, solo el JSON):
    [
      {
        "title": "Firma de contrato e Inicio",
        "description": "Firma de contrato y acuerdo de confidencialidad",
        "type": "billing",
        "estimated_date": "2026-05-04",
        "amount": 750.0
      }
    ]
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(
                    data=pdf_data,
                    mime_type='application/pdf'
                ),
                types.Part.from_text(text=prompt)
            ]
        )
        
        text_response = response.text.strip()
        
        # Sanitizar respuesta si viene con bloques de código markdown
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.startswith("```"):
            text_response = text_response[3:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
        text_response = text_response.strip()
        
        try:
            milestones = json.loads(text_response)
            return milestones
        except json.JSONDecodeError as je:
            print("[-] Error parseando JSON de la respuesta de Gemini:")
            print(text_response)
            print(f"Error detail: {je}")
            return None
            
    except Exception as e:
        print(f"[-] Error en la llamada a Gemini API: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extrae hitos de un PDF usando Gemini")
    parser.parse_args() # no arguments for now, default to specific path
    
    pdf_paths = [
        "c:\\Ingestion\\Recursos\\Plan de Trabajo Detallado.pdf",
        "c:\\Ingestion\\Recursos\\Cronograma CRM EK v2.pdf"
    ]
    
    for path in pdf_paths:
        print("\n" + "="*50)
        milestones = extract_milestones_from_pdf(path)
        if milestones:
            print(f"[+] Hitos extraídos exitosamente ({len(milestones)} hitos):")
            print(json.dumps(milestones, indent=2, ensure_ascii=False))
        else:
            print(f"[-] No se pudieron extraer hitos para {path}")
