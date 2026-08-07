/**
 * ariely-engine.ts
 * Motor de Economía Conductual para el Smart Quoter de Ingentia.
 * Implementa los 4 principios de Dan Ariely ("Las Trampas del Deseo"):
 *   1. Efecto Anzuelo  — 3 paquetes (A, B, C)
 *   2. Poder del Gratis — ítems bonificados con valor real tachado
 *   3. Efecto IKEA     — pain points presentados como "co-definidos" con el cliente
 *   4. Anclaje         — costo de ineficiencia anual calculado ANTES de mostrar el precio
 */

import type { AnalysisResult } from '../pages/SmartQuoter';

export interface ArielyPackage {
  id: 'essential' | 'target' | 'premium';
  label: string;
  tagline: string;
  price: number;
  monthlyPrice?: number;
  isRecommended: boolean;
  features: string[];
  premiumExtras?: string[];
  redTag?: string;
}

export interface BonifiedItem {
  concept: string;
  realValue: number;
  finalPrice: 0;
}

export interface IkeaPriorityItem {
  description: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  checked: boolean;
}

export interface FinancialAnchor {
  annualWastedHours: number;
  annualInefficencyCost: number;
  revenueAtRisk: number;
  investmentVsWasteRatio: string;
  narrativeText: string;
}

export interface ArielyResult {
  anchor: FinancialAnchor;
  packages: [ArielyPackage, ArielyPackage, ArielyPackage]; // [Consultoria, Desarrollo, Desarrollo+Evolucion]
  bonifiedItems: BonifiedItem[];
  totalBonified: number;
  ikeaPriorities: IkeaPriorityItem[];
  targetPackage: ArielyPackage;
}

const HOURLY_RATE_USD = 35;
const REVENUE_AT_RISK_RATE = 0.08;

function round(n: number): number {
  return Math.round(n / 50) * 50;
}

function extractPainPoints(analysisData: any): string[] {
  if (!analysisData) return [];
  const points: string[] = [];
  if (Array.isArray(analysisData?.pain_points)) {
    points.push(...analysisData.pain_points.slice(0, 4).map((p: any) =>
      typeof p === 'string' ? p : p?.description || p?.label || JSON.stringify(p)
    ));
  }
  if (Array.isArray(analysisData?.features)) {
    analysisData.features.slice(0, 3).forEach((f: any) => {
      const label = typeof f === 'string' ? f : f?.name || f?.feature || f?.label;
      if (label && !points.includes(label)) points.push(label);
    });
  }
  if (Array.isArray(analysisData?.problems)) {
    analysisData.problems.slice(0, 3).forEach((p: any) => {
      const label = typeof p === 'string' ? p : p?.description || p?.title;
      if (label && !points.includes(label)) points.push(label);
    });
  }
  return points.slice(0, 4);
}

export function computeArielyPackages(
  setupFee: number,
  annualSavings: number,
  result: AnalysisResult | null,
  analysisData: any,
  clientName: string
): ArielyResult {

  // Precios Fijos
  const MODULO_1_PRICE = 1200;
  const MODULO_3_MONTHLY = 250;

  // Features
  const featuresA = [
    "Inmersión Profunda y Diagnóstico Operativo",
    "Hoja de ruta de implementación",
    "Análisis de Deuda Operativa y ROI",
    "Entregable Documentado (PDF)"
  ];

  const featuresB = [
    ...featuresA,
    "Desarrollo e Implementación a Medida",
    "Setup de Entornos y Despliegue",
    "Sin soporte evolutivo mensual"
  ];

  const featuresC = [
    ...featuresA,
    "Desarrollo e Implementación a Medida",
    "Soporte Mensual y Mantenimiento",
    "SLA garantizado de 24 horas",
    "Evolución continua del producto"
  ];

  const packages: [ArielyPackage, ArielyPackage, ArielyPackage] = [
    {
      id: 'essential',
      label: 'Opción A: Solo Consultoría',
      tagline: 'Módulo 1: Diagnóstico Operativo',
      price: MODULO_1_PRICE,
      isRecommended: false,
      features: featuresA,
    },
    {
      id: 'target',
      label: 'Opción B: Desarrollo a Medida',
      tagline: 'Módulo 1 + Módulo 2',
      price: setupFee,
      isRecommended: false,
      features: featuresB,
      redTag: 'BONIFICA 100% LOS $1.200 DEL DIAGNÓSTICO',
    },
    {
      id: 'premium',
      label: 'Opción C: Desarrollo + Evolución',
      tagline: 'Solución Completa',
      price: setupFee,
      monthlyPrice: MODULO_3_MONTHLY,
      isRecommended: true,
      features: featuresC,
      redTag: 'BONIFICA $1.200 + SOPORTE INCLUIDO',
    },
  ];

  const bonifiedItems: BonifiedItem[] = [
    {
      concept: 'Módulo 1: Diagnóstico Operativo (Bonificado en Opciones B y C)',
      realValue: MODULO_1_PRICE,
      finalPrice: 0,
    },
    {
      concept: 'Setup y configuración inicial de servidores',
      realValue: round(setupFee * 0.10),
      finalPrice: 0,
    },
    {
      concept: 'Documentación técnica del sistema',
      realValue: 800,
      finalPrice: 0,
    }
  ];

  const totalBonified = bonifiedItems.reduce((sum, item) => sum + item.realValue, 0);

  const rawPainPoints = extractPainPoints(analysisData);
  const fallbackPoints = result ? [
    result.deliverables?.[0] || 'Automatización de procesos',
    result.deliverables?.[1] || 'Centralización de datos',
    result.risks?.[0] || 'Mitigación de errores manuales',
  ].filter(Boolean) : ['Automatización de procesos', 'Centralización de datos'];

  const pointsToUse = rawPainPoints.length >= 2 ? rawPainPoints : fallbackPoints;

  const ikeaPriorities: IkeaPriorityItem[] = pointsToUse.map((point, idx) => ({
    description: point,
    priority: idx < 2 ? 'ALTA' : idx < 3 ? 'MEDIA' : 'BAJA',
    checked: idx < 2,
  }));

  const annualInefficencyCost = annualSavings > 0 ? annualSavings : (result ? round(result.hoursStage1 * 12 * HOURLY_RATE_USD) : 0);
  const revenueAtRisk = result ? round(result.financialEstimation?.estimatedRevenue * REVENUE_AT_RISK_RATE) : 0;
  const ratio = annualInefficencyCost > 0
    ? `${((setupFee / annualInefficencyCost) * 100).toFixed(1)}%`
    : '—';

  const narrativeText =
    `Basándonos en el análisis de los procesos actuales de ${clientName || 'la empresa'}, ` +
    `estimamos un ahorro potencial de ` +
    `$${annualInefficencyCost.toLocaleString('es-ES')} USD al año mediante automatización. ` +
    `La inversión en la Opción B (Desarrollo) representa ` +
    `únicamente el ${ratio} del ahorro anual estimado, ofreciendo un rápido retorno de inversión.`;

  const anchor: FinancialAnchor = {
    annualWastedHours: result ? result.hoursStage1 * 12 : 0,
    annualInefficencyCost,
    revenueAtRisk,
    investmentVsWasteRatio: ratio,
    narrativeText,
  };

  return {
    anchor,
    packages,
    bonifiedItems,
    totalBonified,
    ikeaPriorities,
    targetPackage: packages[2], // Recomendamos Opción C
  };
}
