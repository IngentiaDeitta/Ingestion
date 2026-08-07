import type { PreCallBrief } from './gemini-lead-enrichment';
import type { RadiografiaResult } from './gemini-radiografia';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export interface Benchmark {
  indicador: string;
  referencia: string;
  fuente: string;
}

export interface FaseCamino {
  fase: string;
  objetivo: string;
  entregable: string;
  duracion: string;
}

export interface BeneficioItem {
  concepto: string;
  impacto_anual_usd: number;
  como_se_logra: string;
}

export interface InformeRadiografia {
  titulo: string;
  introduccion: string;
  contexto_empresa: string;
  industria: {
    panorama: string;
    benchmarks: Benchmark[];
    buenas_practicas: string[];
  };
  requerimiento: {
    planteo: string;
    indicios: string[];
  };
  diagnostico: {
    hallazgos: { titulo: string; detalle: string; severidad: 'ALTA' | 'MEDIA' | 'BAJA' }[];
  };
  solucion: {
    meta: string;
    camino: FaseCamino[];
    quick_wins: string[];
  };
  beneficios: {
    resumen: string;
    items: BeneficioItem[];
    impacto_total_anual_usd: number;
    payback_meses: number;
  };
  proximo_paso: string;
  fuentes: string[];
  generado_el: string;
}

export interface InformeInput {
  empresa: string;
  dominio?: string | null;
  sector?: string | null;
  brief: PreCallBrief | null;
  radiografia: RadiografiaResult;
  transcript?: string | null;
}

function extractJson(raw: string): string {
  let s = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  return a !== -1 && b > a ? s.slice(a, b + 1) : s;
}

async function callGemini(body: Record<string, unknown>) {
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(`Error de Gemini API: ${res.status} - ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || []).map((p: any) => p.text).filter(Boolean).join('');
  return { candidate, text };
}

/**
 * PASO 1 — Investigación de industria con búsqueda web real.
 * En lenguaje natural: con un prompt largo y estructurado el modelo omite la
 * búsqueda y responde de memoria (comprobado). Así sí busca.
 */
async function investigarIndustria(input: InformeInput): Promise<{ texto: string; fuentes: string[] }> {
  const rubro = input.sector || input.brief?.perfil?.rubro || 'PyME industrial argentina';
  const prompt = `Investigá en la web el sector "${rubro}" en Argentina, con foco en PyMEs de 10 a 80 empleados.

Necesito, con datos concretos y fuente:
- Cómo gestionan hoy la producción, los costos y la trazabilidad las empresas de este rubro.
- Qué porcentaje sigue usando planillas de cálculo o papel en lugar de un sistema.
- Cuánto tiempo administrativo se pierde típicamente en carga manual de datos (horas por semana, si hay estudios).
- Qué mejoras de productividad reportan las que digitalizaron: porcentajes, plazos de retorno de inversión.
- Buenas prácticas y estándares del sector (trazabilidad de lotes, control de costos, gestión de calidad).

Respondé en prosa breve, citando la fuente de cada dato. Si algo no lo encontrás, decí explícitamente "no hay dato" en vez de estimarlo.`;

  const { candidate, text } = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 3072 },
  });

  const fuentes: string[] = Array.from(new Set(
    (candidate?.groundingMetadata?.groundingChunks || [])
      .map((c: any) => c?.web?.title || c?.web?.uri).filter(Boolean),
  ));

  return { texto: text || '', fuentes };
}

/** PASO 2 — Redacción del informe, sin herramientas, sobre datos ya reunidos. */
export async function generarInforme(input: InformeInput): Promise<InformeRadiografia> {
  if (!GEMINI_API_KEY) throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');

  const industria = await investigarIndustria(input);
  const r = input.radiografia;
  const incluidos = r.waste_breakdown.filter((l) => l.incluido !== false);

  const detalleCalculo = incluidos.map((l) =>
    `- ${l.concepto}: ${l.personas} personas × ${l.horas_semana} hs/semana × USD ${l.costo_hora_usd}/h × ${l.semanas_anio} semanas = USD ${l.costo_anual}/año. ` +
    `Origen: personas=${l.origen.personas}, horas=${l.origen.horas_semana}, costo=${l.origen.costo_hora_usd}. ${l.justificacion}`,
  ).join('\n');

  const prompt = `Sos el equipo de IngentIA (consultora argentina de automatización e IA para PyMEs industriales). Redactás el informe de la Radiografía Operativa que se le entrega a ${input.empresa} después de la reunión de descubrimiento.

OBJETIVO DEL DOCUMENTO: que el lector vea con claridad cuánto le cuesta hoy su operación manual, qué camino concreto hay para resolverlo, y que el próximo paso lógico sea contratar el Diagnóstico Operativo (USD 1.200, que se descuenta 100% si luego avanza con la implementación).

TONO: profesional, directo, sin jerga técnica. El lector es el dueño o gerente, no un informático. Nunca menciones nombres de tecnologías, stack ni herramientas de programación. Hablá de procesos, tiempo y dinero.

----------------------------------------
INVESTIGACIÓN DE INDUSTRIA (usar SOLO esto para benchmarks; si un dato no está, no lo inventes)
----------------------------------------
${industria.texto || '(la búsqueda no devolvió información)'}

----------------------------------------
LA EMPRESA
----------------------------------------
Nombre: ${input.empresa}
Rubro: ${input.sector || input.brief?.perfil?.rubro || 'sin dato'}
${input.brief ? `Qué hace: ${input.brief.empresa_una_frase}
Perfil: ${JSON.stringify(input.brief.perfil)}
Señales detectadas antes de la reunión: ${JSON.stringify(input.brief.senales)}
Hipótesis previa de dolor: ${input.brief.hipotesis_dolor}
Lo que el prospecto escribió al contactarnos: ${input.brief.dolor_declarado || 'no dejó mensaje'}` : '(sin brief previo)'}

----------------------------------------
LO QUE SALIÓ DE LA REUNIÓN
----------------------------------------
Ineficiencias detectadas: ${JSON.stringify(r.detected_inefficiencies)}
Resumen: ${r.summary}

BASE DE CÁLCULO DE LA DEUDA OPERATIVA (total USD ${r.annual_waste_usd}/año):
${detalleCalculo}

Nivel de confianza del cálculo: ${r.confianza} (${Math.round(r.ratio_datos_reales * 100)}% de las variables son datos que dio el cliente).
Datos que todavía faltan: ${JSON.stringify(r.datos_faltantes)}

----------------------------------------
REGLAS DURAS
----------------------------------------
1. El total de la deuda operativa es USD ${r.annual_waste_usd}/año. NO lo cambies ni lo redondees.
2. Los beneficios estimados NO pueden superar la deuda operativa: como máximo se recupera lo que hoy se pierde. Sé conservador: estimá recuperar entre el 50% y el 80% según la dificultad.
3. Los benchmarks deben salir de la investigación de arriba y llevar su fuente. Si no hay dato real, no inventes un porcentaje: omití ese benchmark.
4. ${r.confianza !== 'ALTA' ? 'El cálculo se apoya mayormente en estimaciones nuestras. En la introducción aclaralo con naturalidad: decí que las cifras son una primera aproximación a validar en el Diagnóstico. No lo escondas, pero tampoco lo conviertas en el tema central.' : 'El cálculo se apoya en datos que dio el cliente: podés presentarlo con seguridad.'}
5. El camino de trabajo tiene 4 fases: Auditoría, Arquitectura y Prototipo, Construcción, Lanzamiento.

Respondé ÚNICAMENTE con un JSON válido:
{
  "titulo": "string - título del informe, con el nombre de la empresa",
  "introduccion": "string - 2 párrafos. Qué es este documento, de dónde sale y qué va a encontrar el lector.",
  "contexto_empresa": "string - 2 párrafos describiendo a la empresa, su momento actual y por qué este problema aparece ahora.",
  "industria": {
    "panorama": "string - 1-2 párrafos sobre cómo está el sector en este tema",
    "benchmarks": [{ "indicador": "string", "referencia": "string - el dato concreto", "fuente": "string" }],
    "buenas_practicas": ["string - prácticas del sector que la empresa todavía no aplica"]
  },
  "requerimiento": {
    "planteo": "string - qué nos plantearon, en sus términos",
    "indicios": ["string - señales concretas detectadas en la conversación"]
  },
  "diagnostico": {
    "hallazgos": [{ "titulo": "string", "detalle": "string", "severidad": "ALTA|MEDIA|BAJA" }]
  },
  "solucion": {
    "meta": "string - una frase con el estado final deseado, medible",
    "camino": [{ "fase": "string", "objetivo": "string", "entregable": "string", "duracion": "string" }],
    "quick_wins": ["string - mejoras que se pueden lograr en las primeras semanas"]
  },
  "beneficios": {
    "resumen": "string - 1 párrafo",
    "items": [{ "concepto": "string", "impacto_anual_usd": number, "como_se_logra": "string" }],
    "payback_meses": number
  },
  "proximo_paso": "string - qué proponemos hacer ahora, con el Diagnóstico Operativo de USD 1.200 y la regla de que se descuenta 100% si avanza"
}`;

  const { text } = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.65, topP: 0.95, maxOutputTokens: 8192 },
  });

  if (!text) throw new Error('Gemini no devolvió contenido válido.');

  let parsed: any;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    console.error('Failed to parse Informe:', text);
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }

  const items: BeneficioItem[] = (parsed.beneficios?.items || []).map((b: any) => ({
    concepto: String(b.concepto || ''),
    impacto_anual_usd: Math.max(0, Number(b.impacto_anual_usd) || 0),
    como_se_logra: String(b.como_se_logra || ''),
  }));

  // Tope duro: el beneficio nunca puede superar lo que hoy se pierde.
  let total = items.reduce((a, b) => a + b.impacto_anual_usd, 0);
  if (total > r.annual_waste_usd && r.annual_waste_usd > 0) {
    const factor = r.annual_waste_usd / total;
    items.forEach((i) => { i.impacto_anual_usd = Math.round(i.impacto_anual_usd * factor); });
    total = items.reduce((a, b) => a + b.impacto_anual_usd, 0);
  }

  return {
    titulo: String(parsed.titulo || `Radiografía Operativa · ${input.empresa}`),
    introduccion: String(parsed.introduccion || ''),
    contexto_empresa: String(parsed.contexto_empresa || ''),
    industria: {
      panorama: String(parsed.industria?.panorama || ''),
      benchmarks: parsed.industria?.benchmarks || [],
      buenas_practicas: parsed.industria?.buenas_practicas || [],
    },
    requerimiento: {
      planteo: String(parsed.requerimiento?.planteo || ''),
      indicios: parsed.requerimiento?.indicios || [],
    },
    diagnostico: { hallazgos: parsed.diagnostico?.hallazgos || [] },
    solucion: {
      meta: String(parsed.solucion?.meta || ''),
      camino: parsed.solucion?.camino || [],
      quick_wins: parsed.solucion?.quick_wins || [],
    },
    beneficios: {
      resumen: String(parsed.beneficios?.resumen || ''),
      items,
      impacto_total_anual_usd: total,
      payback_meses: Math.max(0, Number(parsed.beneficios?.payback_meses) || 0),
    },
    proximo_paso: String(parsed.proximo_paso || ''),
    fuentes: industria.fuentes,
    generado_el: new Date().toISOString(),
  };
}
