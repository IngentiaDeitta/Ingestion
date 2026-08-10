# DIRECTIVA: Enriquecimiento Automático de Leads en Ingesta (SOP)

**ID:** 20260810_ENRIQUECIMIENTO_INGESTA
**Script Asociado:** `scripts/enrich_pending_leads.py`
**Última Actualización:** 2026-08-10
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Garantizar que todo lead ingresado en la base de datos (`leads_cuentas`) sea enriquecido automáticamente en segundo plano al momento de su ingesta (vía script, API o UI), generando su `pre_call_brief` y redes sociales con Gemini con Google Search, sin requerir que el usuario abra la tarjeta de detalle (`LeadDetail.tsx`).
- **Criterio de Éxito:** Todos los leads en `leads_cuentas` con `pre_call_brief` nulo son procesados y enriquecidos de forma automática. Al crearse un lead desde la interfaz o por script, el enriquecimiento se inicia inmediatamente tras la inserción.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Base de datos:** Registros de la tabla `leads_cuentas` con `pre_call_brief IS NULL` o `estado = 'NUEVO'`.
- **Variables de Entorno (.env):**
  - `VITE_SUPABASE_URL` / `SUPABASE_URL`: URL del proyecto Supabase.
  - `VITE_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: Clave de acceso a Supabase.
  - `VITE_GEMINI_API_KEY`: API Key de Google Gemini con permisos para web search grounding.

### Salidas (Outputs)
- **Base de datos (`leads_cuentas`):** Actualización de las columnas `pre_call_brief` (JSON del brief), `estado` ('ENRIQUECIDO' si era 'NUEVO'), y campos de redes (`web`, `linkedin_empresa`, `instagram`, `facebook`) si la investigación los encuentra.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Identificación de Leads Pendientes
- Consultar en `leads_cuentas` aquellos registros donde `pre_call_brief` es NULL.

### Paso 2: Investigación y Enriquecimiento con Gemini (Web Search Grounding)
- Para cada lead pendiente:
  1. Ejecutar investigación de negocio en Gemini Flash con la herramienta `google_search` para obtener datos duros sobre actividad, empleados, sedes, novedades.
  2. Ejecutar investigación de redes sociales y reputación digital (Google Reviews, LinkedIn, etc.).
  3. Sintetizar y estructurar el `PreCallBrief` en formato JSON según el esquema de IngentIA.
  4. Extraer URLs de redes encontradas para autocompletar la ficha.

### Paso 3: Persistencia en la Base de Datos
- Actualizar la fila en `leads_cuentas`:
  - `pre_call_brief` = brief estructurado.
  - `estado` = 'ENRIQUECIDO' (si estaba en 'NUEVO').
  - Completa `web`, `linkedin_empresa`, `instagram`, `facebook` solo si están vacíos en la base.

### Paso 4: Disparo Automático en UI y API
- **UI (`Leads.tsx`):** Disparar en segundo plano el enriquecimiento de leads que no tengan brief al renderizar la vista o al crear un lead nuevo con `NewLeadModal`.
- **API (`lead-intake` Edge Function):** Ya cuenta con `dispararBrief` en segundo plano tras `insert`/`merge`.

---

## 4. Herramientas y Librerías
- **Python:** `supabase-py`, `requests`, `python-dotenv`.
- **TypeScript / React:** `gemini-lead-enrichment.ts`, Supabase JS Client.

---

## 5. Restricciones y Casos Borde (Edge Cases)
- **Resiliencia:** Si la API de Gemini falla para un lead específico, la inserción del lead debe mantenerse y el error debe loguearse sin detener el procesamiento del resto.
- **Deduplicación:** No re-enriquecer leads que ya poseen `pre_call_brief`.
- **Estética e Integridad:** Los datos de redes sociales no deben sobrescribir datos cargados manualmente si estos ya existen.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 10/08/2026 | El enriquecimiento solo se disparaba en `LeadDetail.tsx` | La función de brief estaba ligada a la carga de la vista de detalle | Se creó script de enriquecimiento batch e integración en la ingesta en `Leads.tsx` |
| 10/08/2026 | HTTP 429 Rate Limit (Gemini API) | Disparo simultáneo en paralelo de múltiples peticiones a Gemini al cargar la vista de leads | Procesar cola secuencial con retardo entre leads (3s) e implementar reintentos con exponential backoff en `callGemini` |

---

## 7. Ejemplos de Uso

```bash
python scripts/enrich_pending_leads.py
```
