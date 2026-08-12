# DIRECTIVA: Enriquecimiento Total, Catalogación por Sector y Clasificación de Leads (SOP)

**ID:** 20260811_ENRIQUECIMIENTO_TOTAL_LEADS
**Script Asociado:** `scripts/enrich_all_leads_catalog_classify.py`
**Última Actualización:** 2026-08-11
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Ejecutar un enriquecimiento exhaustivo del 100% de los leads en `leads_cuentas`, garantizando la investigación con IA + web search grounding, la catalogación precisa por sector industrial estandarizado y la clasificación según su potencialidad comercial (`qualification_status` y `fit_ingentia`).
- **Criterio de Éxito:** Todos los leads en `leads_cuentas` poseen:
  1. `pre_call_brief` completo con investigación de negocio, señales de dolor, redes y scores.
  2. `sector` catalogado dentro del taxón industrial estandarizado de IngentIA.
  3. `qualification_status` clasificado (`CALIFICADO`, `POTENCIAL`, `NO_CALIFICADO`, `DESCARTADO`) según el nivel de fit comercial.
  4. Redes sociales (`web`, `linkedin_empresa`, `instagram`, `facebook`) y datos de contacto (`email`, `telefono`, `localidad`, `empleados_estimado`) autocompletados.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Base de Datos:** Tabla `leads_cuentas` en Supabase.
- **Variables de Entorno (.env):**
  - `VITE_SUPABASE_URL` / `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` / `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY` / `GEMINI_API_KEY`
  - `OPENROUTER_API_KEY` (Fallback)

### Salidas (Outputs)
- **Base de Datos (`leads_cuentas`):**
  - `pre_call_brief`: JSON completo con brief pre-reunión, preguntas, hipótesis de dolor y scores.
  - `sector`: Rubro industrial estandarizado.
  - `qualification_status`: Estado de calificación comercial (`CALIFICADO`, `POTENCIAL`, `NO_CALIFICADO`, `DESCARTADO`).
  - `estado`: Actualizado a `'ENRIQUECIDO'` si estaba en `'NUEVO'`.
  - Campos suplementarios: `web`, `linkedin_empresa`, `instagram`, `facebook`, `email`, `telefono`, `empleados_estimado`, `localidad`.
- **Logs de Consola y Reporte:** Resumen final de la ejecución batch indicando cantidad de leads procesados, catalogados y clasificados.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Obtención de Leads
- Consultar todas las filas en `leads_cuentas`.
- Identificar leads pendientes de enriquecimiento o con datos de sector/potencialidad desactualizados o faltantes.

### Paso 2: Investigación Web de Mercado & Web Scraping
- Si el lead posee dominio o sitio web, intentar scraping técnico con Playwright para extraer emails, teléfonos y enlaces sociales.
- Ejecutar consulta a Gemini 2.0 / Flash (con Google Search Grounding) para obtener:
  - Actividad comercial detallada, cantidad de empleados, plantas y sedes.
  - Presencia digital, reputación (Google Reviews, seguidores en LinkedIn/Instagram).
  - Participación en cámaras o asociaciones industriales (ADIMRA, CADIEEL, UIPBA, etc.).

### Paso 3: Catalogación por Sector Estandarizado
- Asignar el sector de la empresa a una de las categorías estandarizadas de IngentIA:
  - `Agroindustria y Maquinaria`
  - `Alimentos y Bebidas`
  - `Automotriz y Autopartes`
  - `Construcción y Materiales`
  - `Electromecánica y Metalurgia`
  - `Farmacéutica y Cosmética`
  - `Logística y Transporte`
  - `Metalmecánica e Industria Pesada`
  - `Plásticos y Química`
  - `Textil y Calzado`
  - `Tecnología y Servicios B2B`
  - `Comercio y Distribución`
  - `Servicios Industriales`
  - `Otros Industriales`

### Paso 4: Clasificación por Potencialidad (`qualification_status`)
- Evaluar el `fit_ingentia` (0-100) según:
  - **Calidad de Interlocutor:** ¿Es dueño, director o gerente con capacidad de decisión?
  - **Tamaño y Escala:** >15 empleados o múltiples plantas suma mayor potencial.
  - **Dolor Operativo:** Señales claras de procesos manuales, falta de trazabilidad o necesidad de automatización.
- Mapeo de `qualification_status`:
  - `CALIFICADO`: `fit_ingentia` >= 75
  - `POTENCIAL`: `fit_ingentia` entre 50 y 74
  - `NO_CALIFICADO`: `fit_ingentia` < 50
  - `DESCARTADO`: Datos ficticios, sin actividad comercial o fuera de target absoluto.

### Paso 5: Persistencia e Idempotencia
- Actualizar la fila correspondiente en `leads_cuentas`.
- Preservar información ingresada manualmente por el usuario (no sobrescribir datos valiosos ya existentes).

---

## 4. Herramientas y Librerías
- **Python:** `supabase-py`, `requests`, `python-dotenv`, `playwright`.
- **LLM Services:** Google Gemini API (con grounding), OpenRouter API (fallback).

---

## 5. Restricciones y Casos Borde (Edge Cases)
- **Manejo de Rate Limits (429):** Usar retardo entre peticiones (3s a 5s) e implementar exponential backoff en `call_gemini`. Usar OpenRouter como respaldo si Gemini agota cuotas.
- **Resiliencia de Conexión:** Si el scraping de un sitio web falla o da timeout, continuar inmediatamente con la búsqueda en Gemini sin detener el script.
- **Idempotencia:** Ejecutar el script múltiples veces no debe corruptar los datos ya guardados.

---

## 6. Historial de Aprendizaje / Memoria Viva

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 10/08/2026 | HTTP 429 Rate Limit (Gemini API) | Solicitudes concurrentes aceleradas | Agregar retardos de 3s y reintentos exponenciales con fallback a OpenRouter |
| 11/08/2026 | Columna `industry` inexistente en `leads_cuentas` | `leads_cuentas` utiliza `sector` y `qualification_status` en la base de datos | Mapear la catalogación de sector a la columna `sector` de `leads_cuentas` |
| 12/08/2026 | `new row violates row-level security policy for table "leads_cuentas"` | RLS activado en Supabase sin política pública o sin `SUPABASE_SERVICE_ROLE_KEY` en `.env` | Aplicar `supabase/migrations/20260811_leads_cuentas_rls_policies.sql` en Supabase o configurar `SUPABASE_SERVICE_ROLE_KEY` en `.env`. |
| 12/08/2026 | Cadenas `"null"` / `"N/A"` guardadas como URL | El modelo IA devuelve cadenas de texto descriptivas en campo de redes | Implementar helper `clean_url` para validar formato HTTP/HTTPS y descartar placeholders. |

---

## 7. Ejemplos de Uso

```bash
python scripts/enrich_all_leads_catalog_classify.py
```
