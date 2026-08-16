/**
 * Diseñador de Arquitectura.
 *
 * Toma el requerimiento de un proyecto y lo cruza contra el catálogo real de
 * herramientas y las arquitecturas de referencia de IngentIA para producir el
 * "Plan Maestro": el documento Markdown que el runbook de despliegue manda
 * pegar en Antigravity antes de escribir la primera línea de código.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export interface HerramientaCatalogo {
  nombre: string;
  categoria: string;
  que_es: string;
  cuando_usar: string;
  costo: string;
  estado: string;
}

export interface ArquitecturaReferencia {
  nombre: string;
  caso_uso: string;
  cuando_aplica: string;
  componentes: { capa: string; herramienta: string; detalle: string }[];
  costo_estimado: string;
  justificacion: string;
}

export interface DecisionArquitectura {
  capa: string;
  herramienta: string;
  justificacion: string;
  alternativa_descartada: string | null;
  /** True si el modelo trajo algo que no está en el catálogo aprobado. */
  fuera_de_catalogo?: boolean;
}

export interface TablaPropuesta {
  tabla: string;
  proposito: string;
  campos: { nombre: string; tipo: string; detalle: string }[];
}

export interface FlujoPropuesto {
  nombre: string;
  disparador: string;
  pasos: string[];
}

export interface PlanMaestro {
  resumen_ejecutivo: string;
  arquitectura_base: string;
  decisiones: DecisionArquitectura[];
  estrategia_automatizacion?: {
    tipo: 'n8n' | 'agentes' | 'hibrido' | 'sin_automatizacion';
    justificacion: string;
    pros: string[];
    contras: string[];
  };
  esquema_datos: TablaPropuesta[];
  flujos: FlujoPropuesto[];
  integraciones: string[];
  riesgos: string[];
  fuera_de_alcance: string[];
  costo_infraestructura: string;
  primer_paso: string;
}

export interface ArquitecturaInput {
  proyecto: string;
  cliente: string;
  /** Qué pidió el cliente, en sus términos. */
  requerimiento: string;
  /** Contexto extra: radiografía, transcripción, análisis previo. */
  contexto?: string;
  /** Cantidad estimada de usuarios concurrentes. */
  usuarios?: string;
  /** Canales por los que el usuario final interactúa. */
  canales?: string[];
  catalogo: HerramientaCatalogo[];
  referencias: ArquitecturaReferencia[];
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) return body.trim();
  return body.slice(start, end + 1);
}

export async function diseniarArquitectura(input: ArquitecturaInput): Promise<PlanMaestro> {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta VITE_GEMINI_API_KEY en el archivo .env');
  }

  const catalogoTexto = input.catalogo
    .map(
      (h) =>
        `- ${h.nombre} [${h.categoria}] (${h.estado}) · ${h.que_es} · Cuándo: ${h.cuando_usar} · Costo: ${h.costo}`,
    )
    .join('\n');

  const referenciasTexto = input.referencias
    .map(
      (a) =>
        `### ${a.nombre}\nCaso de uso: ${a.caso_uso}\nCuándo aplica: ${a.cuando_aplica}\nComponentes: ${(a.componentes || [])
          .map((c) => `${c.capa}=${c.herramienta}`)
          .join(', ')}\nCosto: ${a.costo_estimado}\nPor qué: ${a.justificacion}`,
    )
    .join('\n\n');

  const prompt = `Sos el arquitecto técnico de IngentIA, una consultora que construye software a medida para PyMEs argentinas con metodología de vibe coding asistido por IA.

----------------------------------------
EL PROYECTO
----------------------------------------
Cliente: ${input.cliente}
Proyecto: ${input.proyecto}
Requerimiento: ${input.requerimiento}
${input.usuarios ? `Usuarios estimados: ${input.usuarios}` : ''}
${input.canales?.length ? `Canales de interacción: ${input.canales.join(', ')}` : ''}
${input.contexto ? `\nContexto adicional:\n${input.contexto}` : ''}

----------------------------------------
CATÁLOGO DE HERRAMIENTAS APROBADAS
----------------------------------------
${catalogoTexto}

----------------------------------------
ARQUITECTURAS DE REFERENCIA DE LA CASA
----------------------------------------
${referenciasTexto}

----------------------------------------
REGLAS INNEGOCIABLES
----------------------------------------
1. Elegí SIEMPRE una de las arquitecturas de referencia como base y decí cuál. Adaptala, no inventes una desde cero.
2. Usá ÚNICAMENTE herramientas del catálogo. Si algo no se puede resolver con el catálogo, decilo en "riesgos" en vez de traer una herramienta nueva.
3. Preferí las herramientas marcadas como "estandar" sobre las marcadas como "evaluacion".
4. Analizá estratégicamente si conviene usar automatización determinista (n8n), automatización agéntica o un enfoque híbrido. Reservá los agentes para lo que realmente requiere criterio, usando herramientas como mcpmarket o skills.sh si es necesario. Si no se requiere automatización, indicalo.
5. El hosting por defecto es VPS Hostinger + Dokploy, salvo que sea contenido 100% estático (ahí no hace falta VPS).
6. Toda credencial va en variables de entorno, nunca en el código.
7. El esquema de datos debe ser concreto: nombres de tabla en snake_case y campos con tipo de PostgreSQL.

----------------------------------------
TAREA
----------------------------------------
Diseñá la arquitectura completa. Sé específico y accionable: esto se le pega a un agente codificador para que arranque a construir.

Respondé ÚNICAMENTE con un JSON válido:
{
  "resumen_ejecutivo": "string - 3 o 4 líneas: qué se construye y para qué",
  "arquitectura_base": "nombre exacto de la arquitectura de referencia elegida",
  "decisiones": [
    {
      "capa": "Frontend|Backend & Datos|Autenticación|Automatización|IA|Canal|Hosting|Versionado",
      "herramienta": "nombre exacto del catálogo",
      "justificacion": "por qué esta y no otra, en una línea",
      "alternativa_descartada": "nombre de lo que se descartó, o null"
    }
  ],
  "estrategia_automatizacion": {
    "tipo": "n8n|agentes|hibrido|sin_automatizacion",
    "justificacion": "string",
    "pros": ["string"],
    "contras": ["string"]
  },
  "esquema_datos": [
    {
      "tabla": "snake_case",
      "proposito": "string - una línea",
      "campos": [{ "nombre": "snake_case", "tipo": "uuid|text|numeric|boolean|timestamptz|jsonb", "detalle": "PK, FK a X, nullable, etc." }]
    }
  ],
  "flujos": [
    { "nombre": "string", "disparador": "qué lo dispara", "pasos": ["paso concreto", "..."] }
  ],
  "integraciones": ["APIs o servicios externos que hay que conectar"],
  "riesgos": ["riesgo técnico o comercial concreto"],
  "fuera_de_alcance": ["lo que explícitamente NO entra en esta arquitectura"],
  "costo_infraestructura": "string - estimación mensual y de qué depende",
  "primer_paso": "string - la primera acción concreta del equipo mañana"
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, topP: 0.95, maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      `Error de Gemini API: ${response.status} - ${err?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text)
    .filter(Boolean)
    .join('');
  if (!text) throw new Error('Gemini no devolvió contenido válido.');

  let parsed: any;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    console.error('Respuesta cruda del diseñador de arquitectura:', text);
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }

  // El catálogo manda: descartamos cualquier herramienta que el modelo se haya inventado.
  const nombresCatalogo = new Set(input.catalogo.map((h) => h.nombre.toLowerCase()));

  return {
    resumen_ejecutivo: String(parsed.resumen_ejecutivo || ''),
    arquitectura_base: String(parsed.arquitectura_base || ''),
    decisiones: (parsed.decisiones || [])
      .filter((d: any) => d?.herramienta)
      .map((d: any) => ({
        capa: String(d.capa || 'General'),
        herramienta: String(d.herramienta),
        justificacion: String(d.justificacion || ''),
        alternativa_descartada: d.alternativa_descartada ? String(d.alternativa_descartada) : null,
        fuera_de_catalogo: !nombresCatalogo.has(String(d.herramienta).toLowerCase()),
      })),
    estrategia_automatizacion: parsed.estrategia_automatizacion ? {
      tipo: parsed.estrategia_automatizacion.tipo || 'sin_automatizacion',
      justificacion: String(parsed.estrategia_automatizacion.justificacion || ''),
      pros: (parsed.estrategia_automatizacion.pros || []).map((s: any) => String(s)),
      contras: (parsed.estrategia_automatizacion.contras || []).map((s: any) => String(s)),
    } : undefined,
    esquema_datos: (parsed.esquema_datos || [])
      .filter((t: any) => t?.tabla)
      .map((t: any) => ({
        tabla: String(t.tabla),
        proposito: String(t.proposito || ''),
        campos: (t.campos || []).map((c: any) => ({
          nombre: String(c.nombre || ''),
          tipo: String(c.tipo || 'text'),
          detalle: String(c.detalle || ''),
        })),
      })),
    flujos: (parsed.flujos || [])
      .filter((f: any) => f?.nombre)
      .map((f: any) => ({
        nombre: String(f.nombre),
        disparador: String(f.disparador || ''),
        pasos: (f.pasos || []).map((p: any) => String(p)),
      })),
    integraciones: (parsed.integraciones || []).map((s: any) => String(s)),
    riesgos: (parsed.riesgos || []).map((s: any) => String(s)),
    fuera_de_alcance: (parsed.fuera_de_alcance || []).map((s: any) => String(s)),
    costo_infraestructura: String(parsed.costo_infraestructura || ''),
    primer_paso: String(parsed.primer_paso || ''),
  };
}

/**
 * Convierte el plan en el Markdown que se pega en Antigravity.
 * Se arma en código, no lo genera el modelo: así el formato es siempre el mismo.
 */
export function planMaestroAMarkdown(plan: PlanMaestro, input: { proyecto: string; cliente: string }): string {
  const hoy = new Date().toISOString().split('T')[0];
  const L: string[] = [];

  L.push(`# Plan Maestro — ${input.proyecto}`);
  L.push('');
  L.push(`**Cliente:** ${input.cliente}  `);
  L.push(`**Fecha:** ${hoy}  `);
  L.push(`**Arquitectura base:** ${plan.arquitectura_base}`);
  L.push('');
  L.push('## 1. Objetivo');
  L.push('');
  L.push(plan.resumen_ejecutivo);
  L.push('');

  L.push('## 2. Stack tecnológico');
  L.push('');
  L.push('| Capa | Herramienta | Por qué |');
  L.push('| --- | --- | --- |');
  plan.decisiones.forEach((d) => {
    L.push(`| ${d.capa} | ${d.herramienta} | ${d.justificacion} |`);
  });
  L.push('');
  const descartadas = plan.decisiones.filter((d) => d.alternativa_descartada);
  if (descartadas.length) {
    L.push('**Alternativas descartadas:** ' + descartadas.map((d) => `${d.alternativa_descartada} (${d.capa})`).join(' · '));
    L.push('');
  }

  if (plan.estrategia_automatizacion) {
    L.push('## 3. Estrategia de automatización');
    L.push('');
    const est = plan.estrategia_automatizacion;
    const tipoLabel = est.tipo === 'n8n' ? 'Automatización Determinista (n8n)' : est.tipo === 'agentes' ? 'Automatización Agéntica' : est.tipo === 'hibrido' ? 'Enfoque Híbrido' : 'Sin automatización';
    L.push(`**Enfoque recomendado:** ${tipoLabel}`);
    L.push('');
    L.push(est.justificacion);
    L.push('');
    if (est.pros.length) {
      L.push('**Pros:**');
      est.pros.forEach(p => L.push(`- ${p}`));
      L.push('');
    }
    if (est.contras.length) {
      L.push('**Contras:**');
      est.contras.forEach(c => L.push(`- ${c}`));
      L.push('');
    }
  }

  L.push('## 4. Esquema de datos');
  L.push('');
  plan.esquema_datos.forEach((t) => {
    L.push(`### \`${t.tabla}\``);
    L.push('');
    L.push(t.proposito);
    L.push('');
    L.push('| Campo | Tipo | Detalle |');
    L.push('| --- | --- | --- |');
    t.campos.forEach((c) => L.push(`| \`${c.nombre}\` | ${c.tipo} | ${c.detalle} |`));
    L.push('');
  });

  L.push('## 5. Flujos funcionales');
  L.push('');
  plan.flujos.forEach((f) => {
    L.push(`### ${f.nombre}`);
    L.push('');
    L.push(`*Disparador:* ${f.disparador}`);
    L.push('');
    f.pasos.forEach((p, i) => L.push(`${i + 1}. ${p}`));
    L.push('');
  });

  if (plan.integraciones.length) {
    L.push('## 6. Integraciones externas');
    L.push('');
    plan.integraciones.forEach((s) => L.push(`- ${s}`));
    L.push('');
  }

  L.push('## 7. Restricciones de implementación');
  L.push('');
  L.push('- Todas las credenciales van en variables de entorno. Nunca en el código.');
  L.push('- Dos proyectos Supabase separados: `-DEV` con datos ficticios y `-PROD` con datos reales.');
  L.push('- Primer commit a GitHub antes de configurar nada más.');
  L.push('- No subir código a git sin autorización explícita.');
  L.push('- La app debe ser usable en un celular con 4G: es el contexto real del usuario final.');
  L.push('');

  if (plan.fuera_de_alcance.length) {
    L.push('## 8. Fuera de alcance');
    L.push('');
    plan.fuera_de_alcance.forEach((s) => L.push(`- ${s}`));
    L.push('');
  }

  if (plan.riesgos.length) {
    L.push('## 9. Riesgos identificados');
    L.push('');
    plan.riesgos.forEach((s) => L.push(`- ${s}`));
    L.push('');
  }

  L.push('## 10. Costo de infraestructura');
  L.push('');
  L.push(plan.costo_infraestructura);
  L.push('');
  L.push('## 11. Primer paso');
  L.push('');
  L.push(plan.primer_paso);
  L.push('');
  L.push('---');
  L.push('');
  L.push('*Generado por IngentIA · Diseñador de Arquitectura*');

  return L.join('\n');
}
