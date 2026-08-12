import os
import json
import re
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[-] Error: Faltan credenciales de Supabase.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SECTORES_PERMITIDOS = [
    "Agroindustria y Maquinaria",
    "Alimentos y Bebidas",
    "Automotriz y Autopartes",
    "Construcción y Materiales",
    "Electromecánica y Metalurgia",
    "Farmacéutica y Cosmética",
    "Logística y Transporte",
    "Metalmecánica e Industria Pesada",
    "Plásticos y Química",
    "Textil y Calzado",
    "Tecnología y Servicios B2B",
    "Comercio y Distribución",
    "Servicios Industriales",
    "Otros Industriales"
]

# Reglas de orden prioritario con expresiones regulares amplias
RULES = [
    ("Alimentos y Bebidas", r"alimento|alimentic|repostería|reposteria|pastelería|pasteleria|frigorífico|frigorifico|chacinado|embutido|café|cafe|bebida|lácteo|lacteo|galletita|golosina|caramelo|fiambre|harina"),
    ("Farmacéutica y Cosmética", r"farmac|farmá|cosmétic|cosmetic|medicinal|médico|medico|hospital|laboratorio|dermocosm|drogería|drogeria|higiene|salud"),
    ("Automotriz y Autopartes", r"automotriz|autoparte|autopartista|vehículo|vehiculo|chasis|carrocería|carroceria|neumático|neumatico|movilidad|simulador"),
    ("Logística y Transporte", r"logístic|logistica|transporte|flete|despacho|correo|paquet|almacén|almacen|distribución integral|cadena de suministro"),
    ("Agroindustria y Maquinaria", r"agro|agtech|semilla|grano|cosecha|agrícola|agricola|maquinaria industrial|maquinaria pesada|izaje|grúa|grua|vial|tractore|bomba industrial"),
    ("Electromecánica y Metalurgia", r"electromecá|electromeca|corrosión|corrosion|catódica|catodica|transformador|tablero|eléctric|electric|electrónic|electronic|microchip|semiconductor|iiot|automatización|automatizacion|robótica|robotica|control industrial|variador|cable|conductor|soldadura|conmutador|instalación eléctrica"),
    ("Plásticos y Química", r"plástic|plastic|polímero|polimero|químic|quimic|envase|packaging|film|resina|adhesivo|lubricante|ozono|emulsión|emulsion|caucho|corrugado|cartón|carton|etiqueta|fundas|sanitiz"),
    ("Metalmecánica e Industria Pesada", r"metalm|siderúrg|siderurg|acero|hierro|corte sider|chapa|fundición|fundicion|mecanizado|tornería|torneria|nuclear|caño|perfil|matriz"),
    ("Construcción y Materiales", r"construc|obra|sanitario|cañería|cañeria|grifería|griferia|hormigón|hormigon|cemento|vidrio|vivienda|desarrollo urbano"),
    ("Textil y Calzado", r"textil|calzado|confección|confeccion|indumentaria|tela|guardapolvo|ropa"),
    ("Tecnología y Servicios B2B", r"tecnolog|software|it\b|telecomunicaci|consultor|desarrollo|sistemas|seguridad electrónica|inteligencia artificial|computación|computacion|redes|it /"),
    ("Comercio y Distribución", r"distribuidor|comercio|mayorista|importad|retail|supermercado|venta b2b|reseller|insumos B2B"),
    ("Servicios Industriales", r"ensayos no destructivos|mantenimiento industrial|limpieza industrial|servicios de ingeniería|servicios de ingenieria|certificación|calidad|remediación|inspección técnica|inspeccion tecnica"),
]

def clasificar_lead(lead: dict) -> str:
    empresa = lead.get("empresa") or ""
    brief = lead.get("pre_call_brief") or {}
    perfil = brief.get("perfil") or {}
    rubro = perfil.get("rubro") or ""
    una_frase = brief.get("empresa_una_frase") or ""
    dolor_dec = brief.get("dolor_declarado") or ""
    hipotesis = brief.get("hipotesis_dolor") or ""
    notas = lead.get("notas") or ""

    texto = f"{empresa} {rubro} {una_frase} {dolor_dec} {hipotesis} {notas}".lower()

    for sector_target, regex in RULES:
        if re.search(regex, texto, re.IGNORECASE):
            return sector_target

    return "Servicios Industriales"

def main():
    print("=== CLASIFICANDO EL 100% DE LEADS SEGÚN SECTOR ESTANDARIZADO INGENTIA (REGLAS DEEP MATCH) ===")
    res = supabase.table("leads_cuentas").select("*").execute()
    leads = res.data or []
    print(f"[+] Total de leads a evaluar: {len(leads)}")

    actualizados = 0
    conteo_sectores = {}

    for lead in leads:
        lead_id = lead["id"]
        empresa = lead.get("empresa")
        sector_nuevo = clasificar_lead(lead)

        brief = lead.get("pre_call_brief") or {}
        brief["sector_estandar"] = sector_nuevo
        brief["industry"] = sector_nuevo

        update_payload = {
            "sector": sector_nuevo,
            "pre_call_brief": brief
        }

        supabase.table("leads_cuentas").update(update_payload).eq("id", lead_id).execute()
        actualizados += 1
        conteo_sectores[sector_nuevo] = conteo_sectores.get(sector_nuevo, 0) + 1

    print(f"\n[+] Se actualizaron exitosamente {actualizados} leads en Supabase.")
    print("\n--- DISTRIBUCIÓN FINAL POR SECTOR DE LOS 181 LEADS ---")
    for s, c in sorted(conteo_sectores.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {s}: {c} leads ({(c/len(leads))*100:.1f}%)")

if __name__ == "__main__":
    main()
