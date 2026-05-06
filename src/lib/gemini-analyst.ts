/**
 * AI Solution Architect — Gemini Analysis Engine
 * 
 * This module handles the complete analysis pipeline:
 * 1. Context extraction from NotebookLM data
 * 2. External research via Gemini with grounding
 * 3. Full analysis generation (problems, AS-IS, TO-BE, architecture, features)
 * 
 * Output feeds into the Smart Quoter as enriched context.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

// ============================================================
// TYPES
// ============================================================

export interface Problem {
  description: string;
  type: 'PROCESOS' | 'TECNOLOGÍA' | 'PERSONAS' | 'DATOS';
  severity: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface ProcessMap {
  description: string;
  mermaid: string;
  bottlenecks?: string[];
}

export interface Solution {
  problem: string;
  classification: 'CONSULTORÍA' | 'DESARROLLO' | 'MIXTO';
  solution_type: string;
  architecture: string;
}

export interface Feature {
  name: string;
  description: string;
  resolution_mode: 'CONSULTORÍA' | 'DESARROLLO' | 'MIXTO';
  complexity: 'SIMPLE' | 'MODERADA' | 'COMPLEJA';
  priority: 'QUICK_WIN' | 'CORE' | 'NICE_TO_HAVE';
}

export interface CompanyInfo {
  name: string;
  industry: string;
  description: string;
  products_services: string[];
  sources: string[];
}

export interface ExternalResearch {
  summary: string;
  market_trends: string[];
  competitors: string[];
  sources: string[];
}

export interface SolutionAnalysis {
  company_info: CompanyInfo;
  external_research: ExternalResearch;
  problems: Problem[];
  as_is_process: ProcessMap;
  to_be_process: ProcessMap;
  solutions: Solution[];
  features: Feature[];
  architecture_mermaid: string;
  executive_summary: string;
}

export interface AnalysisInput {
  clientName: string;
  projectName: string;
  notebookContext: string;
  additionalContext?: string;
  notebookId?: string;
  notebookName?: string;
}

// ============================================================
// CORE ANALYSIS FUNCTION
// ============================================================

export async function generateFullAnalysis(input: AnalysisInput): Promise<SolutionAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error('SISTEMA: La VITE_GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  const prompt = `Sos un AI Solution Architect especializado en diseño de soluciones empresariales con inteligencia artificial y transformación digital. Trabajás para IngentIA, una consultora de IA.

Tu tarea es realizar un análisis exhaustivo del siguiente cliente/prospect basándote en el contexto proporcionado.

═══════════════════════════════════════
DATOS DEL CLIENTE
═══════════════════════════════════════
- Nombre: ${input.clientName}
- Proyecto: ${input.projectName}

═══════════════════════════════════════
CONTEXTO DEL CUADERNO (NotebookLM)
═══════════════════════════════════════
${input.notebookContext || 'No se proporcionó contexto de cuaderno.'}

═══════════════════════════════════════
CONTEXTO ADICIONAL
═══════════════════════════════════════
${input.additionalContext || 'Sin contexto adicional.'}

═══════════════════════════════════════
INSTRUCCIONES DE ANÁLISIS (10 PASOS)
═══════════════════════════════════════

PASO 0 — EXTRACCIÓN DE CONTEXTO
Desde el contexto del cuaderno, extrae:
- Nombre de la empresa, Industria, Productos/servicios
- Fuentes consultadas

PASO 1 — INVESTIGACIÓN EXTERNA
Basándote en lo que conocés del sector y la empresa:
- Describí tendencias del mercado relevantes
- Identificá competidores probables
- Resumí hallazgos clave

PASO 2 — IDENTIFICACIÓN DE PROBLEMAS
Lista todos los problemas/desafíos detectados. Clasificá cada uno por:
- Tipo: PROCESOS | TECNOLOGÍA | PERSONAS | DATOS
- Severidad: ALTA | MEDIA | BAJA

PASO 3 — MAPA DE PROCESO AS-IS
Describí el estado actual de los procesos del cliente.
Generá un diagrama Mermaid (flowchart TD) del proceso actual.
Identificá cuellos de botella.

PASO 4 — CLASIFICACIÓN DE SOLUCIONES
Para cada problema, decidí si requiere:
- CONSULTORÍA (metodología, capacitación, change management)
- DESARROLLO (app, automatización, IA)
- MIXTO (ambos)

PASO 5 — DISEÑO DE ARQUITECTURA
Proponé un diagrama Mermaid de la arquitectura de solución (integraciones, servicios, flujos de datos).

PASO 6 — MAPA DE PROCESO TO-BE
Describí el estado futuro optimizado.
Generá un diagrama Mermaid del proceso mejorado.

PASO 7 — ROADMAP DE FEATURES
Listá los entregables/features propuestos con:
- Modo de resolución: CONSULTORÍA | DESARROLLO | MIXTO
- Complejidad: SIMPLE | MODERADA | COMPLEJA
- Prioridad: QUICK_WIN | CORE | NICE_TO_HAVE

PASO 8 — RESUMEN EJECUTIVO
Escribí un resumen ejecutivo de 2-3 párrafos sintetizando diagnóstico, propuesta y valor esperado.

═══════════════════════════════════════
OUTPUT — JSON ESTRICTO
═══════════════════════════════════════

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto extra) con esta estructura:

{
  "company_info": {
    "name": "string",
    "industry": "string",
    "description": "string - breve descripción del negocio",
    "products_services": ["string"],
    "sources": ["string - fuentes consultadas"]
  },
  "external_research": {
    "summary": "string - resumen de investigación",
    "market_trends": ["string"],
    "competitors": ["string"],
    "sources": ["string"]
  },
  "problems": [
    {
      "description": "string",
      "type": "PROCESOS|TECNOLOGÍA|PERSONAS|DATOS",
      "severity": "ALTA|MEDIA|BAJA"
    }
  ],
  "as_is_process": {
    "description": "string - descripción del estado actual",
    "mermaid": "string - diagrama Mermaid válido (flowchart TD)",
    "bottlenecks": ["string"]
  },
  "to_be_process": {
    "description": "string - descripción del estado futuro",
    "mermaid": "string - diagrama Mermaid válido (flowchart TD)"
  },
  "solutions": [
    {
      "problem": "string - ref al problema",
      "classification": "CONSULTORÍA|DESARROLLO|MIXTO",
      "solution_type": "string - tipo de solución",
      "architecture": "string - componentes técnicos involucrados"
    }
  ],
  "features": [
    {
      "name": "string",
      "description": "string",
      "resolution_mode": "CONSULTORÍA|DESARROLLO|MIXTO",
      "complexity": "SIMPLE|MODERADA|COMPLEJA",
      "priority": "QUICK_WIN|CORE|NICE_TO_HAVE"
    }
  ],
  "architecture_mermaid": "string - diagrama Mermaid de arquitectura de solución",
  "executive_summary": "string - resumen ejecutivo de 2-3 párrafos"
}

IMPORTANTE:
- Respondé SOLO con el JSON, sin ningún texto adicional.
- Los diagramas Mermaid deben ser válidos y renderizables.
- En los Mermaid, NO uses paréntesis dentro de los labels de nodos. Usá corchetes: A["Label aquí"].
- Mínimo 3 problemas, mínimo 4 features.
- El análisis debe ser profundo y profesional.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 16384,
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const apiErrorMessage = errorData?.error?.message || response.statusText;

    if (response.status === 400 && apiErrorMessage.includes('API key not valid')) {
      throw new Error('La API Key de Gemini es inválida. Verificá VITE_GEMINI_API_KEY.');
    }

    throw new Error(`Error de Gemini API: ${response.status} - ${apiErrorMessage}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini no devolvió contenido válido.');
  }

  // Clean JSON from possible markdown formatting
  let cleanJson = textContent.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
  cleanJson = cleanJson.trim();

  try {
    const parsed = JSON.parse(cleanJson) as SolutionAnalysis;
    return validateAnalysis(parsed);
  } catch (parseError) {
    console.error('Failed to parse Gemini analysis response:', cleanJson.substring(0, 500));
    throw new Error('La respuesta de Gemini no es un JSON válido. Intentá de nuevo.');
  }
}

// ============================================================
// VALIDATION
// ============================================================

function validateAnalysis(analysis: SolutionAnalysis): SolutionAnalysis {
  // Ensure required arrays exist
  if (!analysis.problems || !Array.isArray(analysis.problems)) {
    analysis.problems = [];
  }
  if (!analysis.features || !Array.isArray(analysis.features)) {
    analysis.features = [];
  }
  if (!analysis.solutions || !Array.isArray(analysis.solutions)) {
    analysis.solutions = [];
  }

  // Ensure required objects exist
  if (!analysis.company_info) {
    analysis.company_info = {
      name: '', industry: '', description: '',
      products_services: [], sources: []
    };
  }
  if (!analysis.external_research) {
    analysis.external_research = {
      summary: '', market_trends: [], competitors: [], sources: []
    };
  }
  if (!analysis.as_is_process) {
    analysis.as_is_process = { description: '', mermaid: '' };
  }
  if (!analysis.to_be_process) {
    analysis.to_be_process = { description: '', mermaid: '' };
  }

  return analysis;
}

// ============================================================
// NOTEBOOK CONTEXT QUERY BUILDER
// ============================================================

/**
 * Builds semantic queries for extracting structured data from a NotebookLM notebook.
 * These queries are used with the notebook_query MCP tool.
 */
export function getNotebookQueries(): string[] {
  return [
    "Proporciona un resumen completo del negocio: nombre de la empresa, industria, productos y servicios principales, y su propuesta de valor.",
    "¿Cuáles son los principales problemas, desafíos y pain points que enfrenta esta empresa? Detallá áreas como procesos, tecnología, personas y datos.",
    "Describí los procesos operativos actuales de la empresa. ¿Cómo funciona su flujo de trabajo principal?",
    "¿Qué oportunidades de mejora, automatización o transformación digital se identifican para esta empresa?"
  ];
}
