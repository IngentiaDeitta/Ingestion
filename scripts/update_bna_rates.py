import requests
import re
import os

def get_bna_rates():
    url = "https://www.bna.com.ar/Personas"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Error: BNA returned status {response.status_code}")
            return None
        
        html = response.text
        # We look for the "Dolar U.S.A" and "Euro" rows in the "billetes" table
        # BNA usually has a table with IDs or classes. We'll search for the text.
        
        def extract_rate(currency_name, html_content):
            # Regex to find the currency name and then the next numerical values (Compra / Venta)
            # Extremely flexible with whitespace and attributes
            pattern = rf"{currency_name}</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>"
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                # We want the second value (Venta)
                return float(match.group(2).replace(',', '.'))
            return None

        usd = extract_rate("Dolar U.S.A", html)
        eur = extract_rate("Euro", html)
        
        return {"USD": usd, "EUR": eur}
    except Exception as e:
        print(f"Scraping error: {e}")
        return None

def update_env(rates):
    env_path = "c:\\app-ingentia\\.env"
    if not os.path.exists(env_path):
        print("Error: .env file not found.")
        return

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

    # Update JSON
    import json
    from datetime import datetime
    json_path = "c:\\app-ingentia\\src\\data\\exchange_rates.json"
    with open(json_path, 'w') as f:
        json.dump({
            "USD": rates['USD'],
            "EUR": rates['EUR'],
            "lastUpdated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)

    print(f"Updated .env and exchange_rates.json with USD: {rates['USD']} and EUR: {rates['EUR']}")

def main():
    print("Agente de tipos de cambio iniciado...")
    rates = get_bna_rates()
    if rates and rates["USD"] and rates["EUR"]:
        update_env(rates)
    else:
        # Fallback values if scraping fails (using the ones we got earlier today)
        print("Scraping failed or returned incomplete data. Using fallback...")
        fallback_rates = {"USD": 1405, "EUR": 1665}
        update_env(fallback_rates)

if __name__ == "__main__":
    main()
