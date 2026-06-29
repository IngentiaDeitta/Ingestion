/**
 * ariely-engine.ts
 * Motor de Economía Conductual para el Smart Quoter de Ingentia.
 * Implementa los 4 principios de Dan Ariely ("Las Trampas del Deseo"):
 *   1. Efecto Anzuelo  — 3 paquetes donde el Objetivo parece la elección obvia
 *   2. Poder del Gratis — ítems bonificados con valor real tachado
 *   3. Efecto IKEA     — pain points presentados como "co-definidos" con el cliente
 *   4. Anclaje         — costo de ineficiencia anual calculado ANTES de mostrar el precio
 *
 * Esta capa es PURAMENTE determinista: no llama a ninguna API.
 * Consume el output de analyzeWithGemini() tal como existe hoy.
 */

import type { AnalysisResult } from '../pages/SmartQuoter';

// ─── Tipos exportados ──────────────────────────────────────────────────────────

export interface ArielyPackage {
  id: 'essential' | 'target' | 'premium';
  label: string;
  tagline: string;
  price: number;
  isRecommended: boolean;
  features: string[];
  /** Features extra sólo presentes en Premium (el "relleno de anzuelo") */
  premiumExtras?: string[];
}

export interface BonifiedItem {
  concept: string;
  /** Valor real estimado (se muestra tachado en el PDF) */
  realValue: number;
  /** Siempre $0 en el output final */
  finalPrice: 0;
}

export interface IkeaPriorityItem {
  description: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  checked: boolean;
}

export interface FinancialAnchor {
  /** Horas anuales perdidas en procesos ineficientes */
  annualWastedHours: number;
  /** Costo estimado de esas horas en USD (tarifa × horas × 12 meses) */
  annualInefficencyCost: number;
  /** Fracción de la facturación anual en riesgo operativo */
  revenueAtRisk: number;
  /** Ratio inversión propuesta / costo de ineficiencia */
  investmentVsWasteRatio: string;
  /** Texto narrativo listo para pegar en el PDF */
  narrativeText: string;
}

export interface ArielyResult {
  anchor: FinancialAnchor;
  packages: [ArielyPackage, ArielyPackage, ArielyPackage]; // [Esencial, Objetivo, Premium]
  bonifiedItems: BonifiedItem[];
  totalBonified: number;
  ikeaPriorities: IkeaPriorityItem[];
  /** El paquete objetivo (índice 1) para referencia rápida */
  targetPackage: ArielyPackage;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Tarifa hora promedio RRHH para empresas SME-Medium en LatAm (USD) */
const HOURLY_RATE_USD = 35;

/** Multiplicadores de precio para Esencial y Premium vs el Objetivo */
const ESSENTIAL_MULTIPLIER = 0.65;
const PREMIUM_MULTIPLIER = 1.55;

/** % de la facturación anual asumido como "en riesgo" por ineficiencias */
const REVENUE_AT_RISK_RATE = 0.08;

/** Pool de features de relleno para el paquete Premium (anzuelo) */
const PREMIUM_DECOY_FEATURES = [
  'Arquitecto de soluciones dedicado (5 hs/mes por 3 meses)',
  'Repositorio Git privado administrado por Ingentia (3 años)',
  'SLA de respuesta garantizado en 4 horas hábiles',
  'Sesión de transferencia de conocimiento al equipo (4 hs)',
  'Dashboard de seguimiento de proyecto en tiempo real',
  'Revisión de seguridad de la arquitectura entregada',
];

// ─── Funciones auxiliares ──────────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n / 50) * 50; // Redondear a múltiplos de $50 para precios limpios
}

/**
 * Selecciona N elementos del pool rotando por el totalPrice para no repetir
 * las mismas features en propuestas del mismo cliente.
 */
function pickDecoyFeatures(count: number, seed: number): string[] {
  const shuffled = [...PREMIUM_DECOY_FEATURES];
  // Rotación determinista basada en el precio (no aleatoria para reproducibilidad)
  const offset = seed % shuffled.length;
  const rotated = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
  return rotated.slice(0, count);
}

/**
 * Extrae pain points del analysisData (output de AI Solution Architect)
 * para construir los ítems del Efecto IKEA.
 */
function extractPainPoints(analysisData: any): string[] {
  if (!analysisData) return [];

  const points: string[] = [];

  // Intentar extraer desde los distintos formatos posibles del analysisData
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

// ─── Función principal exportada ───────────────────────────────────────────────

/**
 * computeArielyPackages
 *
 * Recibe el AnalysisResult de Gemini (y opcionalmente el analysisData raw)
 * y devuelve un ArielyResult con todos los efectos conductuales calculados.
 *
 * @param result      Output de analyzeWithGemini()
 * @param analysisData JSON crudo del Solution Architect (para Efecto IKEA)
 * @param clientName  Nombre del cliente (para textos narrativos)
 */
export function computeArielyPackages(
  result: AnalysisResult,
  analysisData: any,
  clientName: string
): ArielyResult {

  const m1Price = result.pricing.module1.price;
  const m2Price = result.pricing.module2.price;
  const m3Price = result.pricing.module3.monthlyPrice;
  const targetPrice = m1Price + m2Price; // Precio del paquete Objetivo

  // ── 1. EFECTO ANZUELO — Calcular los 3 paquetes ────────────────────────────

  const essentialPrice = round(targetPrice * ESSENTIAL_MULTIPLIER);
  const premiumPrice = round(targetPrice * PREMIUM_MULTIPLIER);

  // Features base del paquete objetivo (shared con Esencial y Premium)
  const baseFeatures = [
    result.pricing.module1.description,
    ...(m2Price > 0 ? [result.pricing.module2.description] : []),
    ...(m3Price > 0 ? [`Soporte mensual: ${result.pricing.module3.description}`] : []),
    'Entregables documentados y presentados al equipo',
  ].filter(Boolean);

  const essentialFeatures = [
    result.pricing.module1.description,
    'Hoja de ruta de implementación entregada',
    'Sin soporte post-entrega incluido',
  ];

  const decoyExtras = pickDecoyFeatures(2, premiumPrice);

  const packages: [ArielyPackage, ArielyPackage, ArielyPackage] = [
    {
      id: 'essential',
      label: 'Esencial',
      tagline: 'Diagnóstico y hoja de ruta',
      price: essentialPrice,
      isRecommended: false,
      features: essentialFeatures,
    },
    {
      id: 'target',
      label: 'Profesional',
      tagline: 'Diagnóstico + Implementación completa',
      price: targetPrice,
      isRecommended: true,
      features: baseFeatures,
    },
    {
      id: 'premium',
      label: 'Premium',
      tagline: 'Solución completa + SLA y dedicación exclusiva',
      price: premiumPrice,
      isRecommended: false,
      features: [...baseFeatures, ...decoyExtras],
      premiumExtras: decoyExtras,
    },
  ];

  // ── 2. PODER DEL GRATIS — Calcular ítems bonificados ──────────────────────

  const bonifiedItems: BonifiedItem[] = [];

  // Siempre bonificados
  bonifiedItems.push({
    concept: 'Setup y configuración de entornos de desarrollo',
    realValue: round(m1Price * 0.10),
    finalPrice: 0,
  });
  bonifiedItems.push({
    concept: 'Documentación técnica del proyecto',
    realValue: round(targetPrice * 0.07),
    finalPrice: 0,
  });

  // Si hay implementación (módulo 2)
  if (m2Price > 0) {
    bonifiedItems.push({
      concept: 'Deployment en entorno de producción',
      realValue: round(m2Price * 0.08),
      finalPrice: 0,
    });
    bonifiedItems.push({
      concept: 'Garantía de corrección de bugs — 30 días post-entrega',
      realValue: round(m2Price * 0.12),
      finalPrice: 0,
    });
  }

  // Si hay soporte recurrente (módulo 3)
  if (m3Price > 0) {
    bonifiedItems.push({
      concept: 'Primer mes de soporte y evolución incluido',
      realValue: m3Price,
      finalPrice: 0,
    });
  }

  const totalBonified = bonifiedItems.reduce((sum, item) => sum + item.realValue, 0);

  // ── 3. EFECTO IKEA — Extraer prioridades co-definidas ─────────────────────

  const rawPainPoints = extractPainPoints(analysisData);

  // Fallback si el analysisData no tiene estructura esperada
  const fallbackPoints = [
    result.deliverables[0],
    result.deliverables[1],
    result.risks[0],
  ].filter(Boolean);

  const pointsToUse = rawPainPoints.length >= 2 ? rawPainPoints : fallbackPoints;

  const ikeaPriorities: IkeaPriorityItem[] = pointsToUse.map((point, idx) => ({
    description: point,
    priority: idx < 2 ? 'ALTA' : idx < 3 ? 'MEDIA' : 'BAJA',
    checked: idx < 2, // Los 2 primeros ya están "marcados" (priorizados)
  }));

  // ── 4. ANCLAJE — Calcular costo de ineficiencia anual ────────────────────

  const annualWastedHours = result.hoursStage1 * 12; // Proyección anual simple
  const annualInefficencyCost = round(annualWastedHours * HOURLY_RATE_USD);
  const revenueAtRisk = round(result.financialEstimation.estimatedRevenue * REVENUE_AT_RISK_RATE);
  const ratio = targetPrice > 0
    ? `${((targetPrice / annualInefficencyCost) * 100).toFixed(1)}%`
    : '—';

  const narrativeText =
    `Basándonos en el análisis de los procesos actuales de ${clientName}, ` +
    `estimamos que la organización invierte aproximadamente ` +
    `$${annualInefficencyCost.toLocaleString('es-ES')} USD al año en procesos manuales ` +
    `susceptibles de automatización. Adicionalmente, el ${result.financialEstimation.investmentToRevenueRatio} ` +
    `de la facturación anual estimada está expuesto a riesgo operativo por falta de ` +
    `visibilidad y control en tiempo real. La inversión en esta solución representa ` +
    `únicamente el ${ratio} del costo anual actual de la ineficiencia.`;

  const anchor: FinancialAnchor = {
    annualWastedHours,
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
    targetPackage: packages[1],
  };
}
