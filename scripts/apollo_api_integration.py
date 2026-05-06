import os
import sys
import json
import argparse
import requests
from dotenv import load_dotenv

load_dotenv()

def get_apollo_data(domain: str) -> dict:
    """
    Enriquece datos de una empresa usando el dominio (Enrichment API).
    """
    api_key = os.getenv("APOLLO_API_KEY")
    if not api_key:
        print("[-] Error: APOLLO_API_KEY no configurada.")
        return {}
    
    url = "https://api.apollo.io/api/v1/organizations/enrich"
    headers = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    
    try:
        response = requests.get(url, headers=headers, params={"domain": domain}, timeout=10)
        if response.status_code == 200:
            organization = response.json().get("organization", {})
            if organization:
                return _parse_organization(organization)
            print("[-] Apollo.io: Organización no encontrada por dominio.")
        else:
            print(f"[-] Error en Apollo.io (domain): {response.status_code}")
    except Exception as e:
        print(f"[-] Excepción en Apollo.io (domain): {e}")
    return {}

def search_apollo_by_name(name: str) -> dict:
    """
    Busca una empresa en Apollo.io por su nombre (Search API).
    """
    api_key = os.getenv("APOLLO_API_KEY")
    if not api_key:
        return {}
    
    url = "https://api.apollo.io/api/v1/organizations/search"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    
    payload = {
        "q_organization_name": name,
        "page": 1
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            accounts = response.json().get("organizations", [])
            if accounts:
                # Retornamos el primer match
                return _parse_organization(accounts[0])
            print(f"[-] Apollo.io: No se encontraron resultados para el nombre '{name}'.")
        else:
            print(f"[-] Error en Apollo.io (name search): {response.status_code} - {response.text}")
    except Exception as e:
        print(f"[-] Excepción en Apollo.io (name search): {e}")
    return {}

def _parse_organization(org: dict) -> dict:
    """Helper para normalizar la salida de Apollo"""
    return {
        "name": org.get("name", ""),
        "website": org.get("website_url", ""),
        "phone": org.get("primary_phone", {}).get("number", "") if isinstance(org.get("primary_phone"), dict) else org.get("phone", ""),
        "linkedin_url": org.get("linkedin_url", ""),
        "facebook_url": org.get("facebook_url", ""),
        "instagram_url": org.get("instagram_url", ""),
        "twitter_url": org.get("twitter_url", ""),
        "estimated_num_employees": org.get("estimated_num_employees", ""),
        "industry": org.get("industry", ""),
        "keywords": org.get("keywords", []),
        "short_description": org.get("short_description", "")
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apollo.io API Integration")
    parser.add_argument("--domain", required=False, help="Dominio de la empresa")
    parser.add_argument("--name", required=False, help="Nombre de la empresa")
    
    args = parser.parse_args()
    os.makedirs(".tmp", exist_ok=True)
    
    result = {}
    if args.name:
        print(f"[*] Buscando en Apollo.io por nombre: {args.name}...")
        result = search_apollo_by_name(args.name)
    
    if not result and args.domain:
        print(f"[*] Consultando Apollo.io por dominio: {args.domain}...")
        result = get_apollo_data(args.domain)
    
    if result:
        print("[+] Éxito: Datos obtenidos.")
        with open(".tmp/apollo_result.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print("[+] Resultados guardados en .tmp/apollo_result.json")
    else:
        print("[-] No se obtuvieron resultados o hubo un error.")
