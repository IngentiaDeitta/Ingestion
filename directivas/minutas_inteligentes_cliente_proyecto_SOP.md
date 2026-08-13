# DIRECTIVA: minutas_inteligentes_cliente_proyecto_SOP

**ID:** 2026-08-13_MINUTAS_INTELIGENTES
**Última Actualización:** 13/08/2026
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Proporcionar una capa de inteligencia ejecutiva sobre todas las minutas y transcripciones de reuniones de proyectos y cuentas clientes en IngentIA.
- **Criterio de Éxito:**
  1. Las minutas ingeridas automáticamente vía Tactiq o webhook se consolidan en `projects.project_analysis.transcripts` y `clients.client_analysis.transcripts`.
  2. Ambas vistas (`ProjectDetail.tsx` y `ClientDetail.tsx`) presentan:
     - **Resumen Inteligente Consolidado:** Síntesis ejecutiva de decisiones técnicas, acuerdos comerciales e hitos, problemas operativos y próximos pasos.
     - **Explorador Cronológico de Minutas:** Visualización individual con fecha, participantes, resumen y transcripción/acta completa.
  3. No se requiere ni existe input manual de pegado de minutas en el detalle de proyecto.
  4. La vista de cliente mantiene una escala homogénea (`max-w-7xl`, `rounded-2xl`, jerarquía tipográfica estándar) sin huecos vacíos y con métricas de presencia digital limpias y reales.

---

## 2. Estructura de Datos (JSON Schema)

### Estructura de Minuta Individual (`ProjectTranscript`)
```json
{
  "id": "tactiq-uuid",
  "project_id": "uuid",
  "created_at": "2026-07-09T17:00:00Z",
  "summary": "Título / Resumen corto de la sesión",
  "attendees": ["Leandro Gino", "Equipo IngentIA"],
  "transcript_text": "Texto completo o notas estructuradas de la reunión..."
}
```

### Estructura de Resumen Inteligente Consolidado (`MeetingIntelligence`)
```json
{
  "last_updated": "2026-08-13T19:40:00Z",
  "executive_summary": "Párrafo conciso con la visión global del estado del proyecto / relación con el cliente...",
  "key_decisions": [
    "Aprobación del prototipo de alta fidelidad para el flujo comercial.",
    "Centralización de datos de 20k presupuestos en arquitectura To-Be."
  ],
  "agreed_commitments": [
    "Hito 1 facturable contra entrega por USD 1.000.",
    "Inicio de Módulo 2 con flujos n8n para WhatsApp y CRM."
  ],
  "identified_pain_points": [
    "Dispersión de información entre HubSpot, Excel y correos personales de Outlook.",
    "Demora en la confección manual de presupuestos de tratamientos de agua."
  ],
  "next_steps": [
    "Validación de credenciales para conectores n8n.",
    "Revisión de matriz de roles con equipo comercial."
  ]
}
```

---

## 3. Reglas de Ingesta y Visualización
1. **Ruteo:** Cuando ingrese una minuta con un email de contacto de cliente:
   - Debe asociarse a los proyectos activos del cliente correspondiente (`projects.client = client.name`).
   - Se debe actualizar el historial de transcripciones.
2. **Generación con IA:** Utiliza `executeAiTask` (conmutando entre Gemini y OpenRouter) para generar la síntesis estructurada a partir del array completo de minutas.
3. **Persistencia:** La síntesis se guarda en `project_analysis.meeting_intelligence` y `client_analysis.meeting_intelligence` para carga instantánea en frontend.

---

## 4. Historial de Aprendizajes y Restricciones
- **Proyectos vs Clientes:** La tabla `projects` referencia al cliente mediante el campo `client` (nombre del cliente) y no por un campo `client_id` obligatorio. Siempre buscar proyectos por `client = client.name`.
- **Presencia Digital:** No asumir valores fijos de rating (ej: 4.8 / 1250 seguidores). Si no hay datos comprobados, mostrar estado neutro ("Sin reseñas verificadas" o "Google Maps").
