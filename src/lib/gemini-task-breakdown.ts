import type { ProjectMilestone } from '../pages/ProjectDetail';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const ENGINEERING_PATH_PHASES = [
  'Auditoría',
  'Arquitectura & Prototipo',
  'Construcción & IA',
  'Lanzamiento',
] as const;

export type EngineeringPathPhase = typeof ENGINEERING_PATH_PHASES[number];

export interface GeneratedTask {
  title: string;
  description: string;
  phase: EngineeringPathPhase;
  task_type: 'architecture' | 'development';
  hours: number;
  priority: 'Alta' | 'Media' | 'Baja';
  /** Hito facturable al que contribuye. */
  milestone_id: string | null;
  /** Fecha límite, siempre anterior o igual a la del hito. */
  due_date: string | null;
  /** Nombre del integrante sugerido según su rol. */
  responsable_sugerido: string | null;
}

/** Carga de una persona: lo que ya tiene comprometido más lo que sumaría. */
export interface CargaPersona {
  persona: string;
  rol: string;
  horas_actuales: number;
  horas_nuevas: number;
  total: number;
  veredicto: 'OK' | 'AJUSTADO' | 'SOBRECARGADO';
  comentario: string;
}

export interface BalanceEquipo {
  carga: CargaPersona[];
  /** La regla de IngentIA: un socio sostiene 1 proyecto S&S + 1 grande a la vez. */
  cumple_regla_1ss_1grande: boolean;
  advertencias: string[];
  recomendacion: string;
}

export interface TaskBreakdownResult {
  tareas: GeneratedTask[];
  balance: BalanceEquipo;
}

export interface MiembroEquipo {
  nombre: string;
  rol: string;
  /** Horas ya comprometidas en otros proyectos activos. */
  horas_comprometidas: number;
  /** Proyectos activos en los que ya participa. */
  proyectos_activos: string[];
}

export interface TaskBreakdownInput {
  projectName: string;
  clientName: string;
  description: string;
  projectAnalysis: any;
  solutionAnalysis: any | null;
  existingMilestones: ProjectMilestone[];
  equipo: MiembroEquipo[];
  fechaInicio?: string | null;
  fechaFin?: string | null;
  /** Horas por semana que cada persona puede dedicar. Por defecto 20. */
  capacidadSemanal?: number;
}

const CAPACIDAD_SEMANAL = 20;

function extractJson(raw: string): string {
  let s = raw.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  return a !== -1 && b > a ? s.slice(a, b + 1) : s;
}

function buildContextBlock(input: TaskBreakdownInput): string {
  const parts: string[] = [];
  parts.push(`Descripción del proyecto: ${input.description || 'No provista'}`);

  if (input.solutionAnalysis) {
    parts.push('--- Análisis TO-BE (AI Solution Architect) ---');
    if (input.solutionAnalysis.to_be_process?.description) {
      parts.push(`Proceso TO-BE: ${input.solutionAnalysis.to_be_process.description}`);
    }
    (input.solutionAnalysis.features || []).forEach((f: any) => {
      parts.push(`- ${f.name}: ${f.description} (complejidad ${f.complexity}, prioridad ${f.priority})`);
    });
  } else if (input.projectAnalysis) {
    parts.push('--- Análisis de Proyecto ---');
    ['project_summary', 'problem', 'impact'].forEach((k) => {
      if (input.projectAnalysis[k]) parts.push(`${k}: ${input.projectAnalysis[k]}`);
    });
    if (Array.isArray(input.projectAnalysis.areas)) parts.push(`Áreas: ${input.projectAnalysis.areas.join(', ')}`);
  }
  return parts.join('\n');
}

export async function generateTaskBreakdown(input: TaskBreakdownInput): Promise<TaskBreakdownResult> {
  if (!GEMINI_API_KEY) throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada.');

  const cap = input.capacidadSemanal || CAPACIDAD_SEMANAL;

  const hitosTexto = (input.existingMilestones || []).map((m: any) =>
    `- id "${m.id}" | ${m.title} | comprometido para ${m.estimated_date}` +
    `${m.amount ? ` | cobra USD ${m.amount}` : ''} | ${m.description || ''}`,
  ).join('\n') || '(el proyecto no tiene hitos cargados)';

  const equipoTexto = (input.equipo || []).map((m) =>
    `- ${m.nombre} (${m.rol}) · ya comprometido: ${m.horas_comprometidas} h en ${m.proyectos_activos.length} proyecto(s)` +
    `${m.proyectos_activos.length ? `: ${m.proyectos_activos.join(', ')}` : ''}`,
  ).join('\n') || '(sin equipo asignado)';

  const prompt = `Sos el AI Project Manager de IngentIA. Armás el plan de trabajo completo de un proyecto ya vendido, respetando los hitos comprometidos con el cliente y la capacidad real del equipo.

----------------------------------------
PROYECTO: ${input.projectName} · CLIENTE: ${input.clientName}
Inicio: ${input.fechaInicio || 'sin dato'} · Entrega comprometida: ${input.fechaFin || 'sin dato'}
----------------------------------------
${buildContextBlock(input)}

----------------------------------------
HITOS COMPROMETIDOS (fechas que NO se pueden mover: hay cobros atados)
----------------------------------------
${hitosTexto}

----------------------------------------
EQUIPO DISPONIBLE Y SU CARGA ACTUAL
----------------------------------------
${equipoTexto}

Capacidad asumida: ${cap} horas por semana por persona dedicadas a proyectos.

----------------------------------------
REGLAS DE ASIGNACIÓN
----------------------------------------
1. Por ROL:
   - Socio IngentIA → arquitectura, relevamiento, decisiones técnicas, validación con el cliente y capacitación. NO código de detalle.
   - Desarrollador → construcción, integraciones, pruebas. Marcalos como delegables.
   - Si no hay desarrollador disponible, la tarea igual se crea como "development" y queda delegable a un tercero.
2. REGLA DE CAPACIDAD DE IngentIA: un socio sostiene como máximo **1 proyecto Small & Standard + 1 proyecto grande** en simultáneo. Si al sumar las horas nuevas un socio queda por encima de eso, avisalo explícitamente en las advertencias y sugerí qué delegar.
3. Cada tarea debe pertenecer a un hito (usá el id exacto de la lista) y tener una fecha límite ANTERIOR o IGUAL a la del hito.
4. Las horas totales por hito deben ser realistas contra el tiempo disponible hasta su fecha: si no entran, decilo en las advertencias en vez de comprimir estimaciones.

----------------------------------------
TAREA
----------------------------------------
Generá TODAS las tareas necesarias para completar el proyecto (típicamente entre 10 y 25), con horas estimadas realistas, fecha límite, hito y responsable sugerido. Después analizá el balance de carga del equipo.

Respondé ÚNICAMENTE con un JSON válido:
{
  "tareas": [
    {
      "title": "string - accionable y concreto",
      "description": "string - 1-2 líneas",
      "phase": "Auditoría|Arquitectura & Prototipo|Construcción & IA|Lanzamiento",
      "task_type": "architecture|development",
      "hours": number,
      "priority": "Alta|Media|Baja",
      "milestone_id": "id exacto del hito, o null si no aplica",
      "due_date": "YYYY-MM-DD",
      "responsable_sugerido": "nombre exacto de un integrante del equipo, o null"
    }
  ],
  "balance": {
    "carga": [
      {
        "persona": "string", "rol": "string",
        "horas_actuales": number, "horas_nuevas": number, "total": number,
        "veredicto": "OK|AJUSTADO|SOBRECARGADO",
        "comentario": "string - por qué"
      }
    ],
    "cumple_regla_1ss_1grande": boolean,
    "advertencias": ["string - riesgos concretos de plazo o sobrecarga"],
    "recomendacion": "string - qué hacer: delegar, correr una fecha, sumar a un tercero"
  }
}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.55, topP: 0.95, maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(`Error de Gemini API: ${response.status} - ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('');
  if (!text) throw new Error('Gemini no devolvió contenido válido.');

  let parsed: any;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    console.error('Failed to parse Task Breakdown:', text);
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }

  const idsHitos = new Set((input.existingMilestones || []).map((m: any) => m.id));
  const nombresEquipo = new Set((input.equipo || []).map((m) => m.nombre));

  const tareas: GeneratedTask[] = (parsed.tareas || []).filter((t: any) => t?.title).map((t: any) => ({
    title: String(t.title),
    description: String(t.description || ''),
    phase: ENGINEERING_PATH_PHASES.includes(t.phase) ? t.phase : 'Construcción & IA',
    task_type: t.task_type === 'architecture' ? 'architecture' : 'development',
    hours: Number(t.hours) > 0 ? Number(t.hours) : 4,
    priority: ['Alta', 'Media', 'Baja'].includes(t.priority) ? t.priority : 'Media',
    // Solo aceptamos ids de hitos que existen de verdad.
    milestone_id: t.milestone_id && idsHitos.has(t.milestone_id) ? t.milestone_id : null,
    due_date: /^\d{4}-\d{2}-\d{2}$/.test(t.due_date || '') ? t.due_date : null,
    responsable_sugerido: t.responsable_sugerido && nombresEquipo.has(t.responsable_sugerido)
      ? t.responsable_sugerido : null,
  }));

  // El balance de horas se recalcula en código: el modelo se equivoca sumando.
  const horasPorPersona = new Map<string, number>();
  tareas.forEach((t) => {
    if (!t.responsable_sugerido) return;
    horasPorPersona.set(t.responsable_sugerido, (horasPorPersona.get(t.responsable_sugerido) || 0) + t.hours);
  });

  const carga: CargaPersona[] = (input.equipo || []).map((m) => {
    const nuevas = horasPorPersona.get(m.nombre) || 0;
    const total = m.horas_comprometidas + nuevas;
    const declarado = (parsed.balance?.carga || []).find((c: any) => c.persona === m.nombre);
    // Con la capacidad semanal asumida, un trimestre da ~13 semanas de trabajo.
    const techoTrimestre = (input.capacidadSemanal || CAPACIDAD_SEMANAL) * 13;
    const veredicto: CargaPersona['veredicto'] =
      total > techoTrimestre ? 'SOBRECARGADO' : total > techoTrimestre * 0.75 ? 'AJUSTADO' : 'OK';
    return {
      persona: m.nombre,
      rol: m.rol,
      horas_actuales: m.horas_comprometidas,
      horas_nuevas: nuevas,
      total,
      veredicto,
      comentario: declarado?.comentario || `${total} h contra un techo de ${techoTrimestre} h por trimestre.`,
    };
  });

  const socios = carga.filter((c) => c.rol.toLowerCase().includes('socio'));
  const cumpleRegla = socios.every((c) => c.veredicto !== 'SOBRECARGADO');

  return {
    tareas,
    balance: {
      carga,
      cumple_regla_1ss_1grande: cumpleRegla,
      advertencias: parsed.balance?.advertencias || [],
      recomendacion: String(parsed.balance?.recomendacion || ''),
    },
  };
}
