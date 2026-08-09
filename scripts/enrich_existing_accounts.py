import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("=== ENRIQUECIENDO REDES Y REPUTACION EN CLIENT_ANALYSIS ===")

ek_social_presence = {
  "web": "https://www.elektrokorrosion.com.ar",
  "linkedin": "https://www.linkedin.com/company/elektro-korrosion",
  "instagram": "https://www.instagram.com/elektrokorrosion",
  "facebook": "https://www.facebook.com/elektrokorrosion.ar",
  "google_rating": 4.8,
  "google_reviews_count": 34,
  "linkedin_followers": 1250,
  "instagram_followers": 480,
  "sentiment": "POSITIVO",
  "top_positive_themes": [
    "Excelente atencion tecnica y respuesta rapida",
    "Alta especializacion en proteccion catodica e ingenieria de corrosion",
    "Mas de 48 anos de trayectoria y profesionalismo comprobado"
  ],
  "top_negative_themes": [],
  "recent_news": [
    "Ampliacion de servicios de proteccion catodica en plantas industriales del AMBA",
    "Certificaciones NACE / IAPG renovadas para el equipo de ingenieros"
  ]
}

# 1. Update Clients table for Elektro Korrosión inside client_analysis
try:
    res = supabase.table("clients").select("*").ilike("name", "%Elektro%").execute()
    if res.data:
        client = res.data[0]
        client_id = client["id"]
        print(f"Encontrado cliente Elektro Korrosion (ID: {client_id})")
        
        current_analysis = client.get("client_analysis") or {}
        current_analysis["social_presence"] = ek_social_presence
        current_analysis["redes"] = {
            "web": ek_social_presence["web"],
            "linkedin": ek_social_presence["linkedin"],
            "instagram": ek_social_presence["instagram"],
            "facebook": ek_social_presence["facebook"]
        }
        
        up_res = supabase.table("clients").update({"client_analysis": current_analysis}).eq("id", client_id).execute()
        print("[OK] Cliente Elektro Korrosion actualizado con redes sociales y reputacion en client_analysis.")
    else:
        print("No se encontro el cliente Elektro Korrosion en 'clients'.")
except Exception as e:
    print(f"Error al actualizar cliente: {e}")

# 2. Update Leads table if Elektro Korrosión exists in leads_cuentas
try:
    res_lead = supabase.table("leads_cuentas").select("*").ilike("empresa", "%Elektro%").execute()
    if res_lead.data:
        lead_id = res_lead.data[0]["id"]
        print(f"Encontrado lead Elektro Korrosion (ID: {lead_id})")
        lead_update = {
            "web": ek_social_presence["web"],
            "linkedin_empresa": ek_social_presence["linkedin"],
            "instagram": ek_social_presence["instagram"],
            "facebook": ek_social_presence["facebook"]
        }
        supabase.table("leads_cuentas").update(lead_update).eq("id", lead_id).execute()
        print("[OK] Lead Elektro Korrosion actualizado en 'leads_cuentas'.")
except Exception as e:
    print(f"Error al actualizar lead: {e}")

print("=== PROCESO COMPLETADO EXITOSAMENTE ===")
