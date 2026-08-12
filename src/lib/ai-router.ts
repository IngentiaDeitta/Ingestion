const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY ||
  import.meta.env.OPENROUTER ||
  import.meta.env.OPENROUTER_API_KEY;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const OPENROUTER_FREE_MODELS = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3.5-lightning:free',
  'openai/gpt-oss-20b:free',
  'openrouter/auto'
];

function cleanJsonText(raw: string): string {
  let s = raw.strip ? raw.strip() : raw.trim();
  s = s.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

export interface AiTaskOptions {
  systemInstruction?: string;
  complexity?: 'simple' | 'complex';
  responseJson?: boolean;
}

export async function callOpenRouter(prompt: string, options: AiTaskOptions = {}): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('API Key de OpenRouter (OPENROUTER / VITE_OPENROUTER_API_KEY) no está configurada.');
  }

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  for (const model of OPENROUTER_FREE_MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ingentia.com.ar',
          'X-Title': 'IngentIA Frontend Router'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) {
          if (options.responseJson) {
            const cleaned = cleanJsonText(text);
            JSON.parse(cleaned); // Validate
            console.info(`[AI Router TS -> OpenRouter FREE OK] Modelo ${model} devolvió JSON válido.`);
            return cleaned;
          }
          console.info(`[AI Router TS -> OpenRouter FREE OK] Modelo ${model} devolvió respuesta.`);
          return text;
        }
      }
    } catch (e) {
      console.warn(`[AI Router TS -> OpenRouter Model ${model} Failed]:`, e);
    }
  }

  throw new Error('Todos los modelos free de OpenRouter fallaron.');
}

export async function callGemini(prompt: string, options: AiTaskOptions = {}): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('API Key de Gemini (VITE_GEMINI_API_KEY) no está configurada.');
  }

  let fullPrompt = prompt;
  if (options.systemInstruction) {
    fullPrompt = `INSTRUCCIÓN DE SISTEMA:\n${options.systemInstruction}\n\nSOLICITUD:\n${prompt}`;
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API Error HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('');

  if (!text) {
    throw new Error('Gemini API no devolvió contenido.');
  }

  if (options.responseJson) {
    const cleaned = cleanJsonText(text);
    JSON.parse(cleaned);
    console.info('[AI Router TS -> Gemini OK] Respuesta JSON válida.');
    return cleaned;
  }

  console.info('[AI Router TS -> Gemini OK] Respuesta válida.');
  return text;
}

export async function executeAiTask(prompt: string, options: AiTaskOptions = {}): Promise<string> {
  const complexity = options.complexity || 'simple';

  if (complexity === 'simple') {
    console.info('[AI Router TS] Ejecutando Tarea SIMPLE en OpenRouter Free...');
    try {
      return await callOpenRouter(prompt, options);
    } catch (err) {
      console.warn('[AI Router TS -> Fallback] OpenRouter Free falló. Conmutando a Gemini API...', err);
      return await callGemini(prompt, options);
    }
  } else {
    console.info('[AI Router TS] Ejecutando Tarea COMPLEJA en Gemini API...');
    try {
      return await callGemini(prompt, options);
    } catch (err) {
      console.warn('[AI Router TS -> Fallback] Gemini API falló. Conmutando a OpenRouter Free...', err);
      return await callOpenRouter(prompt, options);
    }
  }
}
