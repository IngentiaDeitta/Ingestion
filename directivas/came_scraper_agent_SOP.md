# DIRECTIVA: Agente Scraper y Monitor CAME (redcame.org.ar) (SOP)

**ID:** 20260812_CAME_SCRAPER_AGENT
**Script Asociado:** `scripts/came_scraper_agent.py`
**Frontend:** `src/lib/notifications.ts`, `src/components/Header.tsx`
**Última Actualización:** 2026-08-12
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Extraer, clasificar e ingerir novedades, boletines oficiales, eventos e indicadores económicos (IPIP) provenientes del portal oficial de CAME (**Confederación Argentina de la Mediana Empresa** - `https://www.redcame.org.ar/`).
- **Criterio de Éxito:** El agente rastrea las secciones clave de CAME, filtra duplicados, clasifica cada novedad por tipo (`came_evento`, `came_boletin`, `came_ipip`, `came_novedad`) y publica alertas clasificadas en la tabla `system_notifications` de Supabase.

---

## 2. Clasificación de Notificaciones CAME (Taxonomía)

| Tipo de Notificación | Descripción | Badge Visual UI | Prioridad |
|----------------------|-------------|-----------------|-----------|
| `came_evento` | Rondas de negocios, foros PyME, congresos e hitos de agenda. | Badge Púrpura | ALTA |
| `came_boletin` | Resoluciones, normativas, subsidios y financiamiento PyME. | Badge Azul | ALTA |
| `came_ipip` | Índice de Producción Industrial PyME y estadísticas de ventas minoristas. | Badge Esmeralda | MEDIA |
| `came_novedad` | Comunicados de prensa y noticias generales del sector. | Badge Gris | INFORMATIVA |

---

## 3. Algoritmo del Agente Scraper (`scripts/came_scraper_agent.py`)

1. **Scraping HTTP:** Realizar peticiones HTTP GET a `https://www.redcame.org.ar/` y subpáginas de novedades / prensa.
2. **Extracción de HTML:** Extraer títulos, resúmenes, enlaces y fechas usando `BeautifulSoup`.
3. **Análisis & Clasificación con IA (`ai_router.py`):**
   - Evaluar si el artículo es relevante para el negocio de IngentIA (transformación digital, automatización, PyMEs industriales).
   - Asignar la categoría de la taxonomía.
4. **Prevención de Duplicados:** Almacenar hashes/enlaces conocidos en `.tmp/came_monitored_articles.json`.
5. **Inserción de Alertas:** Publicar las nuevas notificaciones en `system_notifications` de Supabase con `type`: `'came_evento'`, `'came_boletin'`, `'came_ipip'`, `'came_novedad'`.

---

## 4. Historial de Aprendizaje / Errores y Lecciones

| Fecha | Error Detectado | Causa Raíz | Solución Aplicada |
|-------|----------------|------------|-------------------|
| 12/08/2026 | User-Agent bloqueado | CAME utiliza protección básica de servidor contra scrapers automáticos | Incluir headers de navegador real (`User-Agent: Mozilla/5.0...`) en `requests.get` |

---

## 5. Comandos de Verificación

```bash
# Ejecutar Agente Scraper y Monitor CAME
python scripts/came_scraper_agent.py
```
