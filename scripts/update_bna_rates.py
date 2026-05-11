import requests
import re
import os
import json
import sys
from datetime import datetime

def get_bna_rates():
    """Intenta obtener tasas del BNA mediante scraping."""
    url = "https://www.bna.com.ar/Personas"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"BNA error: Status {response.status_code}")
            return None
        
        html = response.text
        
        def extract_rate(currency_name, html_content):
            # Regex flexible para capturar Compra y Venta
            pattern = rf"{currency_name}</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>"
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                # Retornamos el valor de Venta (grupo 2)
                return float(match.group(2).replace(',', '.'))
            return None

        usd = extract_rate("Dolar U.S.A", html)
        eur = extract_rate("Euro", html)
        
        if usd and eur:
            return {"USD": usd, "EUR": eur, "source": "BNA"}
        return None
    except Exception as e:
        print(f"BNA Scraping error: {e}")
        return None

def get_dolar_api_rates():
    """Fallback: Obtiene tasas de DolarAPI (más confiable que scraping)."""
    try:
        # Dolar Oficial (BNA)
        res_usd = requests.get("https://dolarapi.com/v1/dolares/oficial", timeout=10)
        res_eur = requests.get("https://dolarapi.com/v1/cotizaciones/euro", timeout=10)
        
        if res_usd.status_code == 200 and res_eur.status_code == 200:
            usd_data = res_usd.json()
            eur_data = res_eur.json()
            return {
                "USD": float(usd_data['venta']),
                "EUR": float(eur_data['venta']),
                "source": "DolarAPI"
            }
    except Exception as e:
        print(f"DolarAPI error: {e}")
    return None

def update_files(rates):
    # Usar rutas relativas al directorio raíz del proyecto
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_path, ".env")
    json_path = os.path.join(base_path, "src", "data", "exchange_rates.json")

    # 1. Actualizar .env (si existe)
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            lines = f.readlines()

        new_lines = []
        found_usd = False
        found_eur = False

        for line in lines:
            if line.startswith("VITE_EXCHANGE_RATE_USD="):
                new_lines.append(f"VITE_EXCHANGE_RATE_USD={rates['USD']}\n")
                found_usd = True
            elif line.startswith("VITE_EXCHANGE_RATE_EUR="):
                new_lines.append(f"VITE_EXCHANGE_RATE_EUR={rates['EUR']}\n")
                found_eur = True
            else:
                new_lines.append(line)

        if not found_usd:
            new_lines.append(f"VITE_EXCHANGE_RATE_USD={rates['USD']}\n")
        if not found_eur:
            new_lines.append(f"VITE_EXCHANGE_RATE_EUR={rates['EUR']}\n")

        with open(env_path, 'w') as f:
            f.writelines(new_lines)
        print(f"Archivo .env actualizado.")
    else:
        print("Archivo .env no encontrado, omitiendo actualización.")

    # 2. Actualizar JSON (siempre)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, 'w') as f:
        json.dump({
            "USD": rates['USD'],
            "EUR": rates['EUR'],
            "source": rates['source'],
            "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)

    print(f"JSON actualizado: USD={rates['USD']}, EUR={rates['EUR']} (Fuente: {rates['source']})")

def main():
    print(f"[{datetime.now()}] Iniciando actualización de tipos de cambio...")
    
    # Intentar BNA primero
    rates = get_bna_rates()
    
    # Si falla BNA, usar DolarAPI
    if not rates:
        print("BNA falló o bloqueó la solicitud. Intentando DolarAPI...")
        rates = get_dolar_api_rates()
    
    if rates:
        update_files(rates)
    else:
        print("CRÍTICO: No se pudieron obtener tasas de ninguna fuente.")
        sys.exit(1)

if __name__ == "__main__":
    main()

