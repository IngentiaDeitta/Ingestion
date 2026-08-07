/**
 * agents_mock.ts
 * Simulador de enriquecimiento de Leads (Agentes A1 y A5)
 * Devuelve un JSON con la hipótesis de deuda operativa y tecnologías detectadas.
 */

export interface LeadEnrichmentData {
  company: string;
  industry: string;
  tech_stack_detected: string[];
  estimated_headcount: number;
  hypothesis_operational_debt: string;
  suggested_icebreaker: string;
  red_flags: string[];
}

export const simulateEnrichment = async (companyName: string, domain: string): Promise<LeadEnrichmentData> => {
  // Simulamos un delay de red/procesamiento de Agentes (A1 scraper, A5 analyzer)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        company: companyName,
        industry: "Logística y Transporte",
        tech_stack_detected: ["Excel (Intensivo)", "Odoo (Parcial)", "WhatsApp Business"],
        estimated_headcount: 45,
        hypothesis_operational_debt: "Alto riesgo operativo por dependencia de Excel para ruteo. Se estima una pérdida del 15% de horas semanales en carga manual de datos y conciliación de remitos. Posible fricción en comunicación con choferes (uso desestructurado de WhatsApp).",
        suggested_icebreaker: "He notado que en empresas logísticas de su tamaño, la consolidación de remitos desde WhatsApp a Excel genera cuellos de botella diarios. ¿Cómo están resolviendo hoy la trazabilidad en tiempo real de sus choferes?",
        red_flags: [
          "Baja madurez digital detectada en su sitio web.",
          "Probable resistencia al cambio en mandos medios."
        ]
      });
    }, 2000);
  });
};

export interface AgentA6Result {
  detected_inefficiencies: string[];
  annual_waste_usd: number;
  waste_breakdown: { concept: string; cost: number }[];
  summary: string;
}

export const simulateAgentA6 = async (transcript: string): Promise<AgentA6Result> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        detected_inefficiencies: [
          "Doble carga manual de datos (WhatsApp a Excel)",
          "Errores de tipeo en remitos que retrasan facturación",
          "Tiempo de búsqueda de historial de viajes"
        ],
        annual_waste_usd: 15000,
        waste_breakdown: [
          { concept: "Horas hombre en doble carga", cost: 9500 },
          { concept: "Retrasos financieros por errores", cost: 3500 },
          { concept: "Tiempos muertos de choferes", cost: 2000 }
        ],
        summary: "La empresa pierde aproximadamente $15,000 USD al año debido a la falta de integración entre WhatsApp y su ERP. Una automatización simple eliminaría el 90% de este desperdicio."
      });
    }, 2500);
  });
};
