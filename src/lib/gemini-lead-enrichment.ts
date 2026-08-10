const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

/**
 * Pre-Call Brief (Agente A5).
 * La estructura sigue la checklist "Antes de la reunión" y los bloques de
 * descubrimiento A/B/C de Recursos/21_GUION_RADIOGRAFIA_30MIN.md.
 */
export interface PreCallBrief {
  empresa_una_frase: string;
  perfil: {
    empleados_estimado: string;
    plantas_ubicaciones: string;
    antiguedad: string;
    rubro: string;
  };
  senales: { nivel: 'ALTA' | 'MEDIA' | 'BAJA'; descripcion: string }[];
  camaras_redes: string[];
  interlocutor: {
    nombre: string;
    cargo_estimado: string;
    es_decisor: 'SI' | 'PROBABLE' | 'NO' | 'DESCONOCIDO';
  };
  dolor_declarado: string | null;
  hipotesis_dolor: string;
  stack_probable: string[];
  preguntas: {
    bloque_a_mapa: string[];
    bloque_b_dolor: string[];
    bloque_c_urgencia: string[];
  };
  encuadre_sugerido: string;
  fuentes: string[];
  /** true solo si la búsqueda web devolvió fuentes reales. Si es false, el
   *  contenido sale de la memoria del modelo y NO está verificado. */
  investigacion_verificada: boolean;

  /** URLs encontradas en la investigación. Completan la ficha del lead. */
  redes: {
    web: string | null;
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
  };
  /** Reseñas y actividad pública. Heredado del agente de research de Clientes. */
  presencia_digital: {
    google_rating: number | null;
    google_reviews: number | null;
    linkedin_followers: number | null;
    instagram_followers: number | null;
    sentimiento: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO' | 'SIN_DATOS';
    temas_positivos: string[];
    temas_negativos: string[];
    novedades: string[];
  };
  /** Puntajes de 0 a 100. El de fit es el que decide si vale la reunión. */
  scores: {
    reputacion: number;
    presencia_digital: number;
    madurez_mercado: number;
    fit_ingentia: number;
    global: number;
  };
}

export interface LeadBriefInput {
  empresa: string;
  dominio?: string | null;
  sector?: string | null;
  localidad?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  empleados_estimado?: string | null;
  notas?: string | null;
}

function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(body: Record<string, unknown>, maxRetries = 3): Promise<{ candidate: any; text: string }> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        attempt++;
        if (attempt <= maxRetries) {
          const waitTime = Math.pow(2, attempt) * 3000; // 6s, 12s, 24s
          console.warn(`[Gemini Rate Limit 429] Reintentando llamada (${attempt}/${maxRetries}) en ${waitTime / 1000}s...`);
          await delay(waitTime);
          continue;
        }
        throw new Error('Límite de velocidad/cuota de Gemini alcanzado (HTTP 429). Por favor aguardá unos minutos.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Error de Gemini API: ${response.status} - ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('');
      return { candidate, text };
    } catch (err: any) {
      if (attempt >= maxRetries || !err.message.includes('429')) {
        throw err;
      }
      attempt++;
      await delay(Math.pow(2, attempt) * 3000);
    }
  }
  throw new Error('Error inesperado al conectar con Gemini API.');
}

/**
 * PASO 1 — Investigación real.
 * Se pide en lenguaje natural y sin exigir JSON: con un prompt largo y
 * estructurado el modelo omite la búsqueda y responde de memoria (verificado
 * en pruebas: 0 búsquedas ejecutadas). Así sí busca.
 */
async function investigarEmpresa(input: LeadBriefInput): Promise<{ texto: string; fuentes: string[] }> {
  const prompt = `Investigá en la web la empresa argentina "${input.empresa}"${input.dominio ? ` (sitio ${input.dominio})` : ''}.

Necesito saber:
- A qué se dedica exactamente: qué fabrica o qué servicio presta.
- Cuántos empleados tiene y dónde están sus plantas u oficinas.
- Desde cuándo opera y quiénes la dirigen.
- En qué cámaras industriales o parques participa (ADIMRA, CADIEEL, UIPBA, etc.).
- Novedades recientes: crecimiento, nuevas plantas, inversiones, premios.
- Si tiene búsquedas laborales publicadas, sobre todo de perfiles administrativos, de costos o de calidad.

Respondé en prosa breve. Si algo no lo encontrás, decí explícitamente "no hay dato" en vez de suponerlo.`;

  const { candidate, text } = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.3, topP: 0.95, maxOutputTokens: 3072 },
  });

  const fuentes: string[] = (candidate?.groundingMetadata?.groundingChunks || [])
    .map((c: any) => c?.web?.title || c?.web?.uri)
    .filter(Boolean);

  return { texto: text || '', fuentes: Array.from(new Set(fuentes)) };
}

/**
 * PASO 1b — Reseñas y presencia en redes.
 * Va en una llamada aparte de la investigación de negocio: mezclarlas en un solo
 * pedido hace que el modelo priorice una y descuide la otra.
 * Hereda la lógica del agente Python de research de Clientes.
 */
async function investigarPresenciaDigital(input: LeadBriefInput): Promise<{ texto: string; fuentes: string[] }> {
  const prompt = `Buscá la presencia pública y las reseñas de la empresa argentina "${input.empresa}"${input.dominio ? ` (${input.dominio})` : ''}.

1. GOOGLE MAPS / RESEÑAS: buscá "opiniones ${input.empresa}", "${input.empresa} google reviews". Necesito el rating (ej. 4,5), la cantidad de reseñas, y qué dicen: temas que se repiten a favor y en contra.
2. REDES: encontrá las URLs de LinkedIn, Instagram y Facebook de la empresa, y su cantidad de seguidores.
3. SITIO WEB: la URL oficial.
4. NOVEDADES: menciones en medios, premios, aperturas o inversiones del último año.

Respondé en prosa breve. Poné "no hay dato" en todo lo que no encuentres — es preferible a estimarlo.`;

  const { candidate, text } = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2, topP: 0.95, maxOutputTokens: 2048 },
  });

  const fuentes: string[] = (candidate?.groundingMetadata?.groundingChunks || [])
    .map((c: any) => c?.web?.title || c?.web?.uri)
    .filter(Boolean);

  return { texto: text || '', fuentes: Array.from(new Set(fuentes)) };
}

/** PASO 2 — Estructurar el brief a partir de la investigación, sin herramientas. */
async function estructurarBrief(
  input: LeadBriefInput,
  investigacion: { texto: string; fuentes: string[] },
  social: { texto: string; fuentes: string[] },
): Promise<PreCallBrief> {
  const prompt = `Sos el Agente A5 de IngentIA, consultora argentina de automatización e IA para PyMEs industriales del AMBA. Preparás a Pedro (CCO) para una "Radiografía Operativa": una videollamada de 30 minutos de descubrimiento puro.

REGLAS DE LA REUNIÓN (condicionan todo lo que generes):
- NO es una demo ni una presentación. Pedro habla como máximo 6 minutos en total.
- El objetivo único es salir con un número de pérdida anual y vender el Diagnóstico Operativo (USD 1.200).
- Las preguntas deben apuntar a obtener HORAS por semana, PERSONAS afectadas y COSTO por hora. Sin esos tres datos no se puede cotizar.
- Nunca hablar de tecnología, stack ni arquitectura: el dueño no compra tecnología.

----------------------------------------
INVESTIGACIÓN WEB YA REALIZADA (única fuente de datos duros que podés usar)
----------------------------------------
${investigacion.texto || '(la búsqueda no devolvió información)'}

----------------------------------------
RESEÑAS Y PRESENCIA EN REDES (segunda búsqueda)
----------------------------------------
${social.texto || '(la búsqueda no devolvió información)'}

----------------------------------------
DATOS DEL PROSPECTO EN NUESTRA BASE
----------------------------------------
Empresa: ${input.empresa}
Dominio web: ${input.dominio || 'no provisto'}
Rubro declarado: ${input.sector || 'no provisto'}
Localidad: ${input.localidad || 'no provista'}
Contacto: ${input.contacto_nombre || 'no provisto'} ${input.contacto_cargo ? `(${input.contacto_cargo})` : ''}
Empleados (estimación previa): ${input.empleados_estimado || 'sin dato'}

LO QUE EL PROSPECTO ESCRIBIÓ AL CONTACTARNOS (sus propias palabras — es el dato más valioso):
${input.notas || '(no dejó mensaje)'}

----------------------------------------
TAREA
----------------------------------------
1. Usá SOLO la investigación de arriba para los datos duros (empleados, plantas, antigüedad, cámaras). Si un dato no aparece ahí, escribí "sin dato". PROHIBIDO completarlo de memoria: un dato falso que el prospecto detecta mata la cuenta.
2. Detectá señales de dolor operativo y clasificalas: ALTA (búsqueda laboral administrativa activa, crecimiento fuerte, sin sistema visible), MEDIA (indicios indirectos), BAJA (contexto de industria).
3. Si el prospecto dejó un mensaje, resumí en "dolor_declarado" lo que él mismo dijo que le duele. Si no dejó mensaje, poné null.
4. Formulá preguntas ESPECÍFICAS para esta empresa (no genéricas), repartidas en los tres bloques:
   - Bloque A (el mapa): cómo entra un pedido y qué pasa hasta que se factura, cuántas personas tocan la información, qué herramientas usan, dónde se traba.
   - Bloque B (el dolor): qué es lo que más molesta, cuántas horas por semana, quién lo hace y cuánto se le paga, frecuencia de errores, qué pasa cuando esa persona falta.
   - Bloque C (intento previo y urgencia): si intentaron resolverlo antes y qué pasó, qué ocurre si sigue igual 6 meses, qué colapsa primero si duplican ventas, quién más tiene que estar de acuerdo para avanzar.
5. Escribí un "encuadre_sugerido": el texto EXACTO que Pedro va a decir en voz alta al abrir la reunión, redactado en primera persona y tuteando al prospecto, listo para leer tal cual. NO escribas instrucciones sobre qué debe hacer Pedro; escribí sus palabras. Molde: agradecer el tiempo, aclarar que son 30 minutos y que no le va a presentar nada ni hacerle una demo, que quiere entender cómo funciona hoy la operación de ${input.empresa}, que si ve algo que se pueda recuperar se lo dice con un número y si no lo ve también se lo dice, y cerrar preguntando "¿te parece?".

Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "empresa_una_frase": "string - qué fabrica o hace, en una sola frase",
  "perfil": { "empleados_estimado": "string", "plantas_ubicaciones": "string", "antiguedad": "string", "rubro": "string" },
  "senales": [{ "nivel": "ALTA|MEDIA|BAJA", "descripcion": "string" }],
  "camaras_redes": ["string"],
  "interlocutor": { "nombre": "string", "cargo_estimado": "string", "es_decisor": "SI|PROBABLE|NO|DESCONOCIDO" },
  "dolor_declarado": "string o null",
  "hipotesis_dolor": "string - el dolor principal que probablemente tiene",
  "stack_probable": ["string - herramientas que probablemente usan"],
  "preguntas": { "bloque_a_mapa": ["string"], "bloque_b_dolor": ["string"], "bloque_c_urgencia": ["string"] },
  "encuadre_sugerido": "string",
  "redes": {
    "web": "URL o null", "linkedin": "URL o null", "instagram": "URL o null", "facebook": "URL o null"
  },
  "presencia_digital": {
    "google_rating": "número o null", "google_reviews": "número o null",
    "linkedin_followers": "número o null", "instagram_followers": "número o null",
    "sentimiento": "POSITIVO|NEUTRO|NEGATIVO|SIN_DATOS",
    "temas_positivos": ["string - lo que elogian en las reseñas"],
    "temas_negativos": ["string - lo que critican"],
    "novedades": ["string - menciones recientes en medios"]
  },
  "scores": {
    "reputacion": "0-100, según reseñas y menciones. 0 SOLO si no encontraste ninguna reseña ni mención.",
    "presencia_digital": "0-100, según web, redes y actividad. 0 SOLO si no encontraste ni sitio ni redes.",
    "madurez_mercado": "0-100, según antigüedad, tamaño y consolidación en su mercado.",
    "fit_ingentia": "0-100. NO depende de las redes ni de las reseñas: se evalúa con el perfil operativo. Puntuá ALTO (70-95) si hay procesos manuales, planillas, crecimiento y entre 15 y 80 empleados. MEDIO (40-69) si el encaje es parcial. BAJO (0-39) solo si es demasiado chica, demasiado grande, o ya tiene sistemas maduros. Este puntaje SIEMPRE se completa: es la decisión de si vale la reunión.",
    "global": "0-100, promedio ponderado priorizando fit_ingentia"
  }
}

Sobre los puntajes: poné 0 únicamente en "reputacion" y "presencia_digital" si la búsqueda no encontró absolutamente nada de eso. "madurez_mercado" y "fit_ingentia" se evalúan siempre con el perfil de la empresa, aunque no haya datos de redes.`;

  const { text } = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, topP: 0.95, maxOutputTokens: 8192 },
  });

  if (!text) throw new Error('Gemini no devolvió contenido válido.');

  try {
    return JSON.parse(extractJson(text)) as PreCallBrief;
  } catch {
    console.error('Failed to parse Pre-Call Brief:', text);
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }
}

export async function generateLeadEnrichment(input: LeadBriefInput): Promise<PreCallBrief> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');
  }

  // Las investigaciones se realizan secuencialmente con retardo para cuidar los límites de tasa de la API.
  const investigacion = await investigarEmpresa(input);
  await delay(1500);
  const social = await investigarPresenciaDigital(input);
  await delay(1500);

  const brief = await estructurarBrief(input, investigacion, social);

  const fuentes = Array.from(new Set([...investigacion.fuentes, ...social.fuentes]));
  brief.fuentes = fuentes;
  brief.investigacion_verificada = fuentes.length > 0;

  // Normalizamos lo que puede venir flojo del modelo.
  const n = (v: unknown): number | null => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? x : null;
  };
  const pct = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) ? Math.min(100, Math.max(0, Math.round(x))) : 0;
  };

  brief.redes = {
    web: brief.redes?.web || null,
    linkedin: brief.redes?.linkedin || null,
    instagram: brief.redes?.instagram || null,
    facebook: brief.redes?.facebook || null,
  };
  brief.presencia_digital = {
    google_rating: n(brief.presencia_digital?.google_rating),
    google_reviews: n(brief.presencia_digital?.google_reviews),
    linkedin_followers: n(brief.presencia_digital?.linkedin_followers),
    instagram_followers: n(brief.presencia_digital?.instagram_followers),
    sentimiento: brief.presencia_digital?.sentimiento || 'SIN_DATOS',
    temas_positivos: brief.presencia_digital?.temas_positivos || [],
    temas_negativos: brief.presencia_digital?.temas_negativos || [],
    novedades: brief.presencia_digital?.novedades || [],
  };
  brief.scores = {
    reputacion: pct(brief.scores?.reputacion),
    presencia_digital: pct(brief.scores?.presencia_digital),
    madurez_mercado: pct(brief.scores?.madurez_mercado),
    fit_ingentia: pct(brief.scores?.fit_ingentia),
    global: pct(brief.scores?.global),
  };

  return brief;
}
