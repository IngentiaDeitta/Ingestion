# DIRECTIVA: Enrutamiento Inteligente de Agentes IA (OpenRouter Free vs. Gemini API) (SOP)

**ID:** 20260812_OPENROUTER_ROUTING_AGENTES
**Scripts Asociados:** `scripts/ai_router.py`, `scripts/test_openrouter_models.py`, `scripts/enrich_pending_leads.py`
**Última Actualización:** 2026-08-12
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Optimizar los costos y límites de velocidad distribuyendo el procesamiento de IA según la complejidad de la tarea:
  - **Tareas Simples:** Utilizan modelos **FREE** de OpenRouter (autenticados con `OPENROUTER` / `OPENROUTER_API_KEY` en `.env`).
  - **Tareas Complejas:** Utilizan la API primaria de Google Gemini (`VITE_GEMINI_API_KEY`).
- **Criterio de Éxito:** Toda tarea se enruta al proveedor correspondiente con conmutación por error (fallback) automática e invisible si el proveedor primario falla o supera su límite de velocidad.

---

## 2. Clasificación de Tareas (Matriz de Complejidad)

| Nivel de Complejidad | Tipo de Tarea | Proveedor Primario | Proveedor Fallback | Modelos / Configuración |
|----------------------|---------------|-------------------|--------------------|-------------------------|
| **SIMPLE** | Enriquecimiento básico de leads, clasificación industrial corta, extracción de campos JSON sencillos, resúmenes breves, tagging. | OpenRouter Free | Gemini API | `google/gemini-2.0-flash-lite-001:free`, `meta-llama/llama-3.3-70b-instruct:free`, `qwen/qwen-2.5-72b-instruct:free`, `openrouter/auto` |
| **COMPLEJA** | Diagnósticos estratégicos, propuestas de Smart Quoter, informes de radiografía de empresas, análisis arquitectónico de soluciones, descomposición de proyectos en hitos. | Gemini API | OpenRouter Free | `gemini-2.5-flash` / `gemini-1.5-pro` (Gemini API) |

---

## 3. Especificaciones de Variables de Entorno (.env)

El cliente de IA debe soportar indistintamente las siguientes variables:
- **OpenRouter Key:** `OPENROUTER` o `OPENROUTER_API_KEY` o `VITE_OPENROUTER_API_KEY`
- **Gemini Key:** `VITE_GEMINI_API_KEY` o `GEMINI_API_KEY`

---

## 4. Algoritmo de Enrutamiento y Fallback (`ai_router.py`)

1. **Recepción de la Petición:** Recibir `prompt`, `complexity` ("simple" | "complex"), `response_json` (booleano) y `system_instruction`.
2. **Si `complexity == "simple"`:**
   - Intentar llamada con OpenRouter seleccionando iterativamente modelos free (`google/gemini-2.0-flash-lite-001:free` -> `meta-llama/llama-3.3-70b-instruct:free` -> `qwen/qwen-2.5-72b-instruct:free` -> `openrouter/auto`).
   - Si la API de OpenRouter devuelve error o no responde en tiempo límite, ejecutar fallback automático a **Gemini API**.
3. **Si `complexity == "complex"`:**
   - Intentar llamada con **Gemini API** (`gemini-2.5-flash` / `gemini-1.5-pro`).
   - Si Gemini devuelve error 429 (Rate Limit) o fallas de cuota, ejecutar fallback automático a **OpenRouter Free**.
4. **Sanitización de Salida:** Limpiar siempre bloques de código Markdown (```json ... ```) si se solicitó JSON.

---

## 5. Historial de Aprendizaje / Errores y Lecciones

| Fecha | Error Detectado | Causa Raíz | Solución Aplicada |
|-------|----------------|------------|-------------------|
| 12/08/2026 | Incompatibilidad de nombre de variable en `.env` | La clave en `.env` se llama `OPENROUTER` mientras que los scripts buscaban `OPENROUTER_API_KEY` | Actualizar el lector de `.env` para consultar `os.getenv("OPENROUTER") or os.getenv("OPENROUTER_API_KEY")` |

---

## 6. Comandos de Verificación y Pruebas

```bash
# Probar disponibilidad global de OpenRouter
python scripts/test_openrouter_models.py

# Probar enrutamiento en script de enriquecimiento
python scripts/enrich_pending_leads.py
```
