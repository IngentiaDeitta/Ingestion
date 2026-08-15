# DIRECTIVA: tactiq_mcp_ingesta_SOP

**ID:** 2026-08-13_TACTIQ_MCP  
**Endpoint MCP:** `https://mcp.tactiq.io`  
**Endpoint Webhook:** `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/tactiq-transcript`  
**Última Actualización:** 15/08/2026  
**Estado:** ACTIVO — VERSIÓN 2.0 (Datos reales, sin hardcode)

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Integrar Tactiq con IngentIA para ingestar y distribuir automáticamente transcripciones y minutas de reuniones de Google Meet, Zoom y MS Teams hacia los módulos de:
  1. **Leads (`leads_cuentas` / `Radiografia.tsx`):** Diagnóstico automático de pain points, estimación de ahorro/desperdicio y cotización de preventa.
  2. **Clientes y Proyectos (`clients` / `projects` / `ProjectDetail.tsx`):** Registro cronológico de minutas técnicas, acuerdos de hitos y actualización del Kanban.
- **Criterio de Éxito:** Conexión MCP establecida con OAuth 2.1, lectura de transcripciones **reales** de Tactiq y persistencia en Supabase.

---

## 2. Configuración MCP (`mcp_config.json`)
```json
"tactiq": {
  "serverUrl": "https://mcp.tactiq.io"
}
```
- **Autenticación:** OAuth 2.1 + PKCE (S256). Token almacenado como `TACTIQ_ACCESS_TOKEN` en `.env`.
- **Token storage:** `.env` → `TACTIQ_ACCESS_TOKEN`, `TACTIQ_REFRESH_TOKEN`, `TACTIQ_CLIENT_ID`

---

## 3. Endpoints OAuth 2.1 Descubiertos (Testeados el 15/08/2026)

| Endpoint | URL |
|----------|-----|
| Authorization | `https://mcp.tactiq.io/oauth/authorize` |
| Token | `https://mcp.tactiq.io/oauth/token` |
| Registration | `https://mcp.tactiq.io/oauth/register` |
| Revocation | `https://mcp.tactiq.io/oauth/revoke` |
| Discovery | `https://mcp.tactiq.io/.well-known/oauth-authorization-server` |

**Scopes requeridos:**
- `mcp:meetings:own` — reuniones propias
- `mcp:meetings:shared` — reuniones compartidas
- `mcp:meetings:spaces` — espacios de equipo
- `mcp:meetings:details` — transcripción completa

---

## 4. Scripts

### `scripts/tactiq_auth.py` ← **Siempre ejecutar primero**
- Registra cliente OAuth dinámico en Tactiq
- Abre browser con URL de autorización PKCE
- Levanta servidor local en `localhost:8899` para recibir callback
- Guarda tokens en `.env`
- **Ejecutar:** `python scripts/tactiq_auth.py`

### `scripts/test_tactiq_mcp.py` ← **Diagnóstico**
- Verifica conexión MCP completa (initialize → tools/list → tools/call)
- Muestra herramientas disponibles y reuniones reales
- Busca reuniones con "Elektro", "EK", "Leandro Gino"
- **Ejecutar:** `python scripts/test_tactiq_mcp.py`

### `scripts/associate_minutas_ek_crm.py` ← **Ingesta**
- **Modo A:** Conecta via MCP con token y trae minutas reales
- **Modo B (fallback):** Lee archivo `.txt` o `.json` exportado desde tactiq.io
- Filtra por keywords EK: `["elektro", "korrosion", "leandro gino", "ek crm"]`
- Persiste en Supabase: proyecto EK CRM + cliente Elektro Korrosión
- **Ejecutar:** `python scripts/associate_minutas_ek_crm.py`

---

## 5. Arquitectura de Ingesta Dual

### Canal 1: Agente MCP (Búsqueda, Consulta e Ingesta Contextual)
- Script `associate_minutas_ek_crm.py` Modo A
- Requiere `TACTIQ_ACCESS_TOKEN` válido en `.env`
- Flujo: initialize → tools/list → tools/call → filtrar EK → persistir

### Canal 2: Webhook Automático en Background (Event-Driven)
- Endpoint: `supabase/functions/tactiq-transcript`
- Disparo: Tactiq finaliza transcripción → webhook POST
- Matching por: etiqueta/label > email asistente > dominio > keyword en título

---

## 6. Ruteo y Matcheo Inteligente

| Tipo de Entidad | Criterio de Matcheo | Destino en Base de Datos |
|-----------------|---------------------|--------------------------|
| **Lead (Preventa)** | Email asistente = `leads_cuentas.email` | `leads_cuentas.transcript_text` |
| **Proyecto / Cliente** | Email asistente = `clients.email` | `projects.project_analysis.transcripts` |
| **No asignado** | Sin match de email | Log de minutas sin asignar |

---

## 7. Historial de Aprendizajes y Restricciones

### ⚠️ LECCIÓN CRÍTICA — 15/08/2026
**NUNCA hardcodear minutas en `associate_minutas_ek_crm.py`.**  
El script anterior inventaba todas las minutas con texto fijo, causando:
- Resúmenes fabricados de reuniones que no ocurrieron
- Reuniones del día inventadas sin consultar Tactiq
- No traía todas las reuniones reales con EK

**La solución correcta es siempre:**
1. Conectar via MCP con token OAuth
2. Si falla: usar Modo B con archivo exportado
3. Jamás generar contenido de reuniones de memoria

### Restricciones Técnicas Conocidas

- **GET a raíz:** Retorna HTTP 405. El endpoint espera `POST` con JSON-RPC 2.0.
- **POST sin token:** Retorna HTTP 401 `missing_token`. Siempre incluir `Authorization: Bearer <token>`.
- **Formato de respuesta:** Puede ser `application/json` o `text/event-stream` (SSE). El parser debe manejar ambos.
- **Dynamic Client Registration:** Disponible en `/oauth/register`. Usar para obtener `client_id` sin configuración previa.
- **Endpoint `/sse`:** No existe (retorna 404). El protocolo MCP Streamable HTTP usa POST directo a la raíz.
- **Planes Tactiq:** En planes base puede exponer solo resúmenes. El scope `mcp:meetings:details` requiere plan compatible.
