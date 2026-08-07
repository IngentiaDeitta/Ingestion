const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/** De dónde sale cada variable: lo dijo el cliente, o lo estimamos nosotros. */
export type Origen = 'DATO' | 'SUPUESTO';

/**
 * Un renglón de pérdida con su base de cálculo abierta.
 * El costo anual NO lo produce el modelo: se calcula en código a partir de las
 * variables, para que no pueda "redondear" hacia un total que suene bien.
 */
export interface LineaPerdida {
  concepto: string;
  personas: number;
  horas_semana: number;
  costo_hora_usd: number;
  semanas_anio: number;
  origen: {
    personas: Origen;
    horas_semana: Origen;
    costo_hora_usd: Origen;
  };
  justificacion: string;
  cita_transcripcion: string | null;
  /** Calculado en código: personas × horas_semana × costo_hora_usd × semanas_anio */
  costo_anual: number;
  /** Si está en false, el renglón no suma al total ni sale en la propuesta. */
  incluido: boolean;
}

export interface RadiografiaResult {
  detected_inefficiencies: string[];
  waste_breakdown: LineaPerdida[];
  annual_waste_usd: number;
  summary: string;
  /** Datos del trinomio (horas/personas/costo) que la reunión no dejó. */
  datos_faltantes: string[];
  /** Preguntas concretas para conseguir esos datos. */
  preguntas_pendientes: string[];
  /** ALTA si casi todo son datos del cliente; BAJA si casi todo son supuestos. */
  confianza: 'ALTA' | 'MEDIA' | 'BAJA';
  /** Proporción de variables respaldadas por el cliente (0 a 1). */
  ratio_datos_reales: number;
}

const COSTO_HORA_POR_DEFECTO = 12;

function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  return a !== -1 && b > a ? s.slice(a, b + 1) : s;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function normalizarOrigen(v: unknown): Origen {
  return v === 'DATO' ? 'DATO' : 'SUPUESTO';
}

/** Recalcula una línea y su costo anual a partir de las variables. */
export function calcularLinea(linea: LineaPerdida): LineaPerdida {
  const costo_anual = Math.round(
    linea.personas * linea.horas_semana * linea.costo_hora_usd * linea.semanas_anio,
  );
  return { ...linea, costo_anual };
}

/** Recalcula todo el resultado: útil cuando el usuario edita una variable. */
export function recalcularResultado(result: RadiografiaResult): RadiografiaResult {
  const waste_breakdown = result.waste_breakdown.map(calcularLinea);

  // Solo los renglones incluidos suman al total y cuentan para la confianza:
  // lo que el usuario descartó no debe influir en el número que va al cliente.
  const incluidos = waste_breakdown.filter((l) => l.incluido !== false);
  const annual_waste_usd = incluidos.reduce((acc, l) => acc + l.costo_anual, 0);

  const variables = incluidos.flatMap((l) => [
    l.origen.personas, l.origen.horas_semana, l.origen.costo_hora_usd,
  ]);
  const reales = variables.filter((o) => o === 'DATO').length;
  const ratio = variables.length > 0 ? reales / variables.length : 0;
  const confianza: RadiografiaResult['confianza'] =
    ratio >= 0.7 ? 'ALTA' : ratio >= 0.35 ? 'MEDIA' : 'BAJA';

  return { ...result, waste_breakdown, annual_waste_usd, ratio_datos_reales: ratio, confianza };
}

export async function generateRadiografiaAnalysis(
  transcript: string,
  contexto?: { empresa?: string; rubro?: string },
): Promise<RadiografiaResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');
  }

  const prompt = `Sos el Agente A6 de IngentIA. Analizás la transcripción de una "Radiografía Operativa" y armás la BASE DE CÁLCULO de la deuda operativa anual del prospecto.

${contexto?.empresa ? `Empresa: ${contexto.empresa}` : ''}
${contexto?.rubro ? `Rubro: ${contexto.rubro}` : ''}

----------------------------------------
TRANSCRIPCIÓN
----------------------------------------
${transcript}

----------------------------------------
REGLA CENTRAL — LEER CON ATENCIÓN
----------------------------------------
NO inventes cifras. Para cada ineficiencia tenés que declarar las TRES variables que la componen:
  personas afectadas × horas por semana × costo por hora (USD)

Para CADA variable marcá su origen:
- "DATO": el cliente lo dijo explícitamente en la transcripción. En ese caso, copiá en "cita_transcripcion" la frase textual donde lo dice.
- "SUPUESTO": no está en la transcripción y lo estimás vos. Explicá en "justificacion" en qué te basás.

Si la transcripción NO menciona horas, ni personas, ni costos, entonces TODAS las variables son "SUPUESTO". Eso es correcto y esperado: no lo disimules marcando "DATO".

Referencia para supuestos de costo horario en PyMEs industriales argentinas: entre USD 8 y USD 18 por hora según calificación del puesto (administrativo ~USD 10, operario de planta ~USD 9, mando medio ~USD 16). Usá ${COSTO_HORA_POR_DEFECTO} si no tenés mejor información.

NO calcules el costo anual: el sistema lo calcula solo multiplicando las variables. Devolvé únicamente las variables.

----------------------------------------
TAREA
----------------------------------------
1. Identificá las ineficiencias operativas concretas mencionadas o implícitas.
2. Armá un renglón por ineficiencia con sus tres variables y el origen de cada una.
3. Listá en "datos_faltantes" los datos del trinomio que la reunión NO dejó.
4. Listá en "preguntas_pendientes" las preguntas concretas para conseguir esos datos en la próxima conversación.
5. Escribí un "summary" ejecutivo de 2-3 líneas. Si la mayoría son supuestos, decilo explícitamente en el summary.

Respondé ÚNICAMENTE con un JSON válido:
{
  "detected_inefficiencies": ["string"],
  "waste_breakdown": [
    {
      "concepto": "string",
      "personas": number,
      "horas_semana": number,
      "costo_hora_usd": number,
      "semanas_anio": 52,
      "origen": { "personas": "DATO|SUPUESTO", "horas_semana": "DATO|SUPUESTO", "costo_hora_usd": "DATO|SUPUESTO" },
      "justificacion": "string - en qué se basa cada estimación",
      "cita_transcripcion": "string con la frase textual del cliente, o null"
    }
  ],
  "datos_faltantes": ["string"],
  "preguntas_pendientes": ["string"],
  "summary": "string"
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, topP: 0.95, maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`Error de Gemini API: ${response.status} - ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('');
  if (!textContent) throw new Error('Gemini no devolvió contenido válido.');

  let parsed: any;
  try {
    parsed = JSON.parse(extractJson(textContent));
  } catch {
    console.error('Failed to parse Radiografia Analysis:', textContent);
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }

  const waste_breakdown: LineaPerdida[] = (parsed.waste_breakdown || []).map((l: any) =>
    calcularLinea({
      concepto: String(l.concepto || 'Ineficiencia sin nombre'),
      personas: num(l.personas, 1),
      horas_semana: num(l.horas_semana, 0),
      costo_hora_usd: num(l.costo_hora_usd, COSTO_HORA_POR_DEFECTO),
      semanas_anio: num(l.semanas_anio, 52) || 52,
      origen: {
        personas: normalizarOrigen(l.origen?.personas),
        horas_semana: normalizarOrigen(l.origen?.horas_semana),
        costo_hora_usd: normalizarOrigen(l.origen?.costo_hora_usd),
      },
      justificacion: String(l.justificacion || ''),
      cita_transcripcion: l.cita_transcripcion || null,
      costo_anual: 0,
      incluido: true,
    }),
  );

  return recalcularResultado({
    detected_inefficiencies: parsed.detected_inefficiencies || [],
    waste_breakdown,
    annual_waste_usd: 0,
    summary: String(parsed.summary || ''),
    datos_faltantes: parsed.datos_faltantes || [],
    preguntas_pendientes: parsed.preguntas_pendientes || [],
    confianza: 'BAJA',
    ratio_datos_reales: 0,
  });
}
