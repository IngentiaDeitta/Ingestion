# DIRECTIVA: Integración de Fallback con OpenRouter (SOP)

**ID:** 20260810_OPENROUTER_FALLBACK
**Script Asociado:** `scripts/enrich_pending_leads.py`
**Última Actualización:** 2026-08-10
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Implementar una capa de conmutación por error (fallback) y procesamiento distribuido utilizando los modelos gratuitos de OpenRouter (API Key de OpenRouter) cuando Gemini API sufra límites de tasa (HTTP 429), saturación o para acelerar tareas repetitivas/paralelas.
- **Criterio de Éxito:** Toda solicitud de enriquecimiento o tarea de LLM que falle por límite de cuota o tasa en Gemini conmuta automáticamente a OpenRouter sin interrumpir el flujo ni arrojar errores al usuario.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Variables de Entorno (.env):**
  - `VITE_OPENROUTER_API_KEY` / `OPENROUTER_API_KEY`: Key de OpenRouter.
  - `VITE_GEMINI_API_KEY`: Key primaria de Google Gemini.
- **Payloads:** Prompt / Contenido de la solicitud.

### Salidas (Outputs)
- **Respuesta JSON / Texto:** Contenido generado por modelos como `google/gemini-2.0-flash-lite-001:free`, `meta-llama/llama-3.3-70b-instruct:free` u `openrouter/auto`.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Intento Primario con Gemini API
- Realizar la llamada a Gemini API (`gemini-flash-latest`).
- Si la respuesta es exitosa (200 OK), retornar el resultado.

### Paso 2: Detección de Rate Limit (HTTP 429) o Fallo
- Si Gemini responde 429 o agota reintentos, activar el disparador de fallback a OpenRouter.

### Paso 3: Llamada a OpenRouter API
- Enviar la petición a `https://openrouter.ai/api/v1/chat/completions` utilizando el modelo `google/gemini-2.0-flash-lite-001:free` u `openrouter/auto`.
- Incluir headers `Authorization: Bearer <OPENROUTER_API_KEY>`, `HTTP-Referer` y `X-Title`.
- Procesar la respuesta del chat completion.

---

## 4. Herramientas y Librerías
- **API Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Modelos Free Preferidos:**
  - `google/gemini-2.0-flash-lite-001:free`
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `openrouter/auto`

---

## 5. Restricciones y Casos Borde (Edge Cases)
- **Sanitización de Respuestas:** OpenRouter devuelve respuestas en formato OpenAI (`choices[0].message.content`). El parser debe limpiar bloques markdown ```json ... ``` si se requiere JSON.
- **Búsqueda Web en Fallback:** Si OpenRouter no soporta la herramienta de búsqueda de Google nativa directamente en modelos free sin plugins, se provee el prompt enriquecido con contexto existente o búsqueda alternativa.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 10/08/2026 | Gemini Rate Limit (HTTP 429) | Exceso de solicitudes en cuota de Gemini | Implementar fallback automático a OpenRouter con modelos free |

---

## 7. Ejemplos de Uso

```bash
# Probar fallback en scripts de Python
python scripts/enrich_pending_leads.py
```
