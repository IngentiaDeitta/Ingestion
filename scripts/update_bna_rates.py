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
            # Example: <td>Dolar U.S.A</td> <td>1365,00</td> <td>1405,00</td>
            pattern = rf"<td>{currency_name}</td>\s*<td>[\d,]+</td>\s*<td>([\d,]+)</td>"
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', '.'))
            return None

        usd = extract_rate("Dolar U.S.A", html)
        eur = extract_rate("Euro", html)
        
        return {"USD": usd, "EUR": eur}
    except Exception as e:
        print(f"Scraping error: {e}")
        return None

def update_env(rates):
    env_path = "c:\\app_ingentia\\.env"
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

    with open(env_path, 'w') as f:
        f.writelines(new_lines)
    
    print(f"Updated .env with USD: {rates['USD']} and EUR: {rates['EUR']}")

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
