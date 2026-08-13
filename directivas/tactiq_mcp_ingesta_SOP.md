# DIRECTIVA: tactiq_mcp_ingesta_SOP

**ID:** 2026-08-13_TACTIQ_MCP
**Endpoint MCP:** `https://mcp.tactiq.io`
**Endpoint Webhook:** `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/tactiq-transcript`
**Última Actualización:** 13/08/2026
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Integrar Tactiq con IngentIA para ingestar y distribuir automáticamente transcripciones y minutas de reuniones de Google Meet, Zoom y MS Teams hacia los módulos de:
  1. **Leads (`leads_cuentas` / `Radiografia.tsx`):** Diagnóstico automático de pain points, estimación de ahorro/desperdicio y cotización de preventa.
  2. **Clientes y Proyectos (`clients` / `projects` / `ProjectDetail.tsx`):** Registro cronológico de minutas técnicas, acuerdos de hitos y actualización del Kanban.
- **Criterio de Éxito:** Conexión MCP establecida y canal de ingesta configurado para ruteo automático por email de contacto o nombre de cuenta.

---

## 2. Configuración MCP (`mcp_config.json`)
El servidor MCP remoto de Tactiq se configura como:
```json
"tactiq": {
  "serverUrl": "https://mcp.tactiq.io"
}
```
- **Autenticación:** Utiliza protocolo OAuth 2.1 de Tactiq. Al invocarse, requiere autorización en la cuenta de Tactiq (Team/Enterprise workspace).

---

## 3. Arquitectura de Ingesta Dual

### Canal 1: Agente MCP (Búsqueda, Consulta e Ingesta Contextual)
- **Caso de uso:** "Ingestá la reunión de hoy con el cliente X", "Analizá los acuerdos de la última llamada de preventa".
- **Flujo:**
  1. El Agente consulta las transcripciones en Tactiq vía herramientas MCP.
  2. Se extrae el resumen, participantes y texto completo.
  3. Se analiza el contenido con modelos de lenguaje.
  4. Se persiste directamente en Supabase según corresponda (Lead o Proyecto).

### Canal 2: Webhook Automático en Background (Event-Driven)
- **Caso de uso:** Apenas termina una llamada, la minuta entra sola a la ficha del lead o proyecto sin intervención humana.
- **Flujo:**
  1. Tactiq finaliza la transcripción ("Meeting Transcript Is Ready").
  2. Dispara webhook a `supabase/functions/tactiq-transcript`.
  3. El endpoint busca coincidencia en `leads_cuentas` o `clients` por email del invitado.
  4. Si coincide con un Lead: carga `transcript_text` y habilita la Radiografía.
  5. Si coincide con un Proyecto: añade la minuta al historial del proyecto.

---

## 4. Ruteo y Matcheo Inteligente

| Tipo de Entidad | Criterio de Matcheo | Destino en Base de Datos | Vista en Frontend |
|-----------------|---------------------|--------------------------|-------------------|
| **Lead (Preventa)** | Email asistente = `leads_cuentas.email` | `leads_cuentas.transcript_text` | `Radiografia.tsx` / `LeadDetail.tsx` |
| **Proyecto / Cliente** | Email asistente = `clients.email` | `projects.project_analysis.transcripts` | `ProjectDetail.tsx` (Minutas) |
| **No asignado** | Sin match de email | Tabla/Log de minutas sin asignar | Bandeja de revisión |

---

## 5. Historial de Aprendizajes y Restricciones
- **Endpoint MCP:** El endpoint oficial es `https://mcp.tactiq.io` (no `/sse`). Responde `405` a GETs y espera llamadas JSON-RPC / SSE Stream de MCP.
- **Planes Tactiq:** La transcripción completa requiere permisos de workspace en planes compatibles; en planes base expone resúmenes y títulos de reuniones.
