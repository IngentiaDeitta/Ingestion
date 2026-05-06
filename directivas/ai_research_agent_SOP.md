# AI Research Agent SOP

## Objetivo
El **AI Research Agent** es responsable de enriquecer automáticamente el contexto de un cliente y proyecto mediante la búsqueda de información externa, integración con NotebookLM, y generación de análisis estructurado para ser consumido por el Smart Quoter.

## Arquitectura y Bucle de Ejecución

1. **Investigación Web (Gemini Grounding):**
   - Extraer redes sociales (LinkedIn, Instagram), sitio web, reseñas en Google, y panorama competitivo.
   - Herramienta: Gemini 2.5 Flash con Google Search Tools habilitado.
2. **Integración con NotebookLM (vía MCP):**
   - Buscar cuaderno por nombre exacto del cliente. Si no existe, crearlo.
   - Insertar la investigación externa (`add_text`).
   - Insertar documentación aportada del proyecto (minutas, etc.).
3. **Análisis Arquitectónico:**
   - Interrogar a NotebookLM para extraer resumen, problemas y estado AS-IS.
   - Generar el `SolutionAnalysis` JSON final.
4. **Persistencia:**
   - Insertar el JSON directamente en Supabase (`solution_analyses`).

## Restricciones y Casos Borde (El Observador)

- **Auth Expired en MCP:** Si el MCP falla por expiración de tokens, el agente debe detener la ejecución e imprimir que es necesario correr `notebooklm-mcp-auth`.
- **Inexistencia de Cliente:** Si la empresa no existe en la web o no hay reseñas, Gemini devolverá lo mejor que encuentre. Se debe permitir que el script continúe sin errores fatales.
- **Formato del JSON de Supabase:** Asegurar que el payload enviado a Supabase cumpla estrictamente con la interfaz definida en el frontend.
- **Ejecución Local:** Este script debe ejecutarse mediante terminal local: `python scripts/ai_research_agent.py`.

## Formato de Llamada

```bash
# Script Python directo:
python scripts/ai_research_agent.py --client "Nombre Empresa" --project "Nombre Proyecto" --minutes "Texto de minutas"

# Bridge local (necesario para el trigger desde la UI):
node local_bridge.js
```

## Restricciones y Casos Borde (Actualizados)

- **ES Module Error:** El `package.json` tiene `"type": "module"`. El bridge usa `import` ESM, NO `require`. Si se renombra o mueve el archivo, verificar esto.
- **Puerto 3001:** El bridge corre en el puerto 3001. Si hay conflicto, editar `PORT` en `local_bridge.js` y actualizar la URL en `ClientDetail.tsx`.
- **Python en PATH:** El bridge llama a `python`. En sistemas donde python3 es diferente, editar el comando a `python3`.
