# DIRECTIVA: Agente Radar de Eventos Industriales & Alertas (SOP)

**ID:** 20260812_AI_EVENT_RADAR_AGENT
**Script Asociado:** `scripts/ai_event_radar_agent.py`
**Frontend:** `src/lib/notifications.ts`, `src/pages/Dashboard.tsx`, `src/components/Header.tsx`
**Última Actualización:** 2026-08-12
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Implementar un agente de IA autónomo que monitoree y descubra nuevos eventos, ferias comerciales, foros PyME y congresos de la industria en Argentina, incorporándolos automáticamente a la Agenda del Dashboard y enviando alertas al equipo.
- **Criterio de Éxito:** Todo evento nuevo relevante descubierto se agrega al catálogo (`src/data/eventos_industria.json` y Supabase) y genera una notificación en `system_notifications` visible en el Header y Dashboard.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- Catálogo actual de eventos: `src/data/eventos_industria.json` y Supabase `eventos_industria`.
- Prompts de búsqueda y extracción alimentados a `ai_router.py`.

### Salidas (Outputs)
- Catálogo actualizado de eventos en `src/data/eventos_industria.json` y Supabase.
- Notificaciones de alerta creadas en la tabla `system_notifications` (título, contenido, tipo `'info'|'system'`).

---

## 3. Algoritmo del Agente Radar (`ai_event_radar_agent.py`)

1. **Lectura de Eventos Existentes:** Cargar los IDs y títulos del catálogo actual para prevención estricta de duplicados.
2. **Ejecución de Rastreo:** Llamar a `ai_router.py` con `complexity="simple"` para evaluar posibles eventos industriales/PyME en Argentina para los próximos meses.
3. **Calificación de Relevancia Comercial:**
   - Evaluar si el evento aplica a sectores target (Metalmecánica, Alimentos, Logística, PyMEs, Plásticos, Software B2B).
   - Asignar nivel de relevancia: `MUY ALTA`, `ALTA`, `MEDIA`.
4. **Inserción y Alerta:**
   - Si se identifica un evento no registrado con relevancia >= MEDIA, agregarlo al archivo JSON local y upsert en Supabase.
   - Enviar registro de notificación a `system_notifications` en Supabase con el formato:
     `title`: `"🔔 Nuevo Evento Industrial: [Nombre Del Evento]"`
     `content`: `"Se descubrió el evento '[Nombre]' ({fecha}) en {lugar}. Relevancia: {relevancia}."`

---

## 4. Historial de Aprendizaje / Errores y Lecciones

| Fecha | Error Detectado | Causa Raíz | Solución Aplicada |
|-------|----------------|------------|-------------------|
| 12/08/2026 | Duplicación de alertas | Re-ejecución del agente detectaba eventos conocidos | Filtrar por normalización de títulos e ID único (`evt_...`) antes de notificar |

---

## 5. Comandos de Verificación

```bash
# Ejecutar Agente Radar de Eventos
python scripts/ai_event_radar_agent.py
```
