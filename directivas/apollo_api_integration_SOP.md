# DIRECTIVA: apollo_api_integration_SOP

**ID:** APOLLO_ENRICHMENT_001
**Script Asociado:** `scripts/apollo_api_integration.py` + `scripts/ai_research_agent.py`
**Última Actualización:** 2026-05-03
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Consultar Apollo.io para enriquecer la información de un cliente (redes sociales, website, teléfonos, tamaño, particularidades). Integrar estos datos junto con reseñas de Google y redes sociales en el análisis AI del dashboard de cliente.
- **Criterio de Éxito:** El agente puede buscar una empresa por nombre, obtener su perfil social real, y visualizar correctamente en el dashboard sin scroll ni datos truncados.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Argumentos Requeridos:**
  - `client_name`: Nombre de la empresa para buscar en Apollo (método primario).
  - `domain`: Dominio de la empresa (solo como fallback si búsqueda por nombre falla).
- **Variables de Entorno (.env):**
  - `APOLLO_API_KEY`: Clave de acceso a la API de Apollo.io (para fallback).
  - `membrane` CLI debe estar autenticado.

### Salidas (Outputs)
- **Artefactos Generados:**
  - `.tmp/apollo_result.json`: Respuesta de la API guardada localmente para revisión.
- **Retorno de Consola:** Imprime `Exito: Datos obtenidos` o mensaje de error.

---

## 3. Flujo Lógico (Algoritmo)

### Método Primario: membrane CLI (búsqueda por nombre)
1. `membrane connection ensure "https://www.apollo.io" --json` → obtener `connection_id`.
2. Si `state == "READY"`: `membrane action run search-accounts --connectionId=ID --input '{"q_organization_name": "EMPRESA", "per_page": 1}' --json`
3. Extraer del primer resultado: `website_url`, `linkedin_url`, `instagram_url`, `facebook_url`, `phone`, `estimated_num_employees`, `industry`, `keywords`.

### Método Fallback: API REST por dominio (solo si paso primario falla)
- Endpoint: `https://api.apollo.io/api/v1/organizations/enrich?domain=DOMINIO`
- Headers: `x-api-key: [APOLLO_API_KEY]`

---

## 4. Herramientas y Librerías
- **CLI:** `membrane` (npm package `@membranehq/cli`)
- **Librerías Python:** `subprocess`, `requests`, `os`, `json`, `dotenv`.
- **Librerías Frontend:** React + TypeScript (`src/pages/ClientDetail.tsx`).
- **APIs Externas:** Apollo.io API v1 + Membrane.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Límites de Tasa (Rate Limits):** Apollo restringe las llamadas según el tier del plan. Manejar status code 429 con retry o backoff.
- **Resultados Vacíos:** Si no encuentra a la empresa, retorna array vacío.
- **Falta de Datos:** Empresas pequeñas argentinas pueden no estar en Apollo o tener campos vacíos.

### Errores Comunes y Soluciones
- **Error 401:** Clave de API inválida o expirada.
- **Error 422:** Parámetros inválidos. Validar formato antes de enviar.
- **membrane `CLIENT_ACTION_REQUIRED`:** Sesión expirada → saltar Apollo silenciosamente.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 03/05 | N/A | N/A | Creación inicial de la directiva. |
| 03/05 | Apollo traía website erróneo | Gemini infería el dominio del `research_text`, confundiendo empresas similares. **NO usar dominio inferido por LLM como método primario.** | Reemplazado por `membrane action run search-accounts` con `q_organization_name`. Dominio inferido queda como fallback. |
| 03/05 | Instagram/Facebook vacíos | Apollo devuelve `instagram_url`/`facebook_url` que no se mapeaban en el script. | Se mapean explícitamente ambos campos. Prompt social de Gemini reforzado para pedir URL exacta de Instagram y Facebook. |
| 03/05 | Reseñas Google mostraban "-" | Prompt de búsqueda social era genérico, Gemini no buscaba en Google Maps/GMB con suficiente precisión. | Prompt reescrito exigiendo calificación promedio, cantidad EXACTA de reseñas y temas recurrentes positivos/negativos. |
| 03/05 | Layout con scroll en contenedores de texto del perfil AI | `max-h` fijo + `grid-cols-2` comprimía el espacio en los 2/3 del dashboard. | Eliminados `max-h`/`overflow-y-auto`. Layout cambiado a `flex-col` full-width. Reputación expandida a 4 columnas horizontales. Temas positivos/negativos y noticias recientes ahora visibles sin scroll. |

### Restricciones Adicionales (aprendidas)
- **Nota:** `search-accounts` por nombre puede no encontrar empresas pequeñas/locales argentinas → usar fallback por dominio.
- **Nota:** `facebook_url` puede estar vacío en Apollo aunque la empresa tenga Facebook → confiar en Gemini Grounding social para recuperarlo.
- **Nota:** El análisis del prompt final de Gemini usa `apollo_text` como contexto, por lo tanto si Apollo trae datos erróneos, el JSON resultante será incorrecto. La búsqueda por nombre evita este problema.

---

## 7. Ejemplos de Uso

```bash
# Ejecución estándar (standalone)
python scripts/apollo_api_integration.py --domain "ingentia.com"

# Usando membrane CLI directamente para buscar por nombre
membrane action run search-accounts --connectionId=CONNECTION_ID --input '{"q_organization_name": "Elektrokorrosion", "per_page": 1}' --json

# Verificar conexión Apollo
membrane connection ensure "https://www.apollo.io" --json
```

---

## 8. Checklist de Pre-Ejecución
- [x] `APOLLO_API_KEY` → Configurada en `.env` y verificada con test exitoso
- [x] `membrane` CLI instalado (`npm install -g @membranehq/cli@latest`)
- [x] Conexión Apollo.io activa (`membrane connection ensure "https://www.apollo.io" --json` → `state: READY`)
- [x] Dependencias Python instaladas (`requests`, `python-dotenv`, `subprocess`)

---

## 9. Checklist Post-Ejecución
- [ ] Salidas generadas correctamente en `.tmp/apollo_result.json`
- [ ] Directiva actualizada con nuevos aprendizajes (si aplica)
