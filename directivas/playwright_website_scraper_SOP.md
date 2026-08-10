# DIRECTIVA: Scraping Web con Playwright para Enriquecimiento de Leads (SOP)

**ID:** 20260810_PLAYWRIGHT_SCRAPER
**Script Asociado:** `scripts/enrich_pending_leads.py`
**Última Actualización:** 2026-08-10
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Extraer automáticamente el contenido relevante del `<header>`, `<footer>`, sección de contactos, direcciones, teléfonos (ventas, soporte, 0800), correos electrónicos y redes sociales desde el sitio web oficial del prospecto utilizando **Playwright** (y BeautifulSoup como respaldo).
- **Criterio de Éxito:** Al procesar un lead con dominio o sitio web, la información del header/footer se captura de forma estructurada y se integra en el `PreCallBrief` y los datos de contacto del lead.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Dominio o URL Web del Lead:** Ej: `adox.com.ar` o `https://www.adox.com.ar`.
- **Navegador Headless:** Chromium vía Playwright.

### Salidas (Outputs)
- **JSON de Scraping:**
  - `url_scraped`: URL final del sitio.
  - `header_text`: Texto extraído de la cabecera.
  - `footer_text`: Texto extraído del pie de página y sección de contacto.
  - `telefonos`: Lista de teléfonos/WhatsApp/0800 detectados.
  - `emails`: Lista de correos institucionales/ventas detectados.
  - `direccion`: Dirección física de la planta/oficina.
  - `redes`: URLs de LinkedIn, Instagram, Facebook, YouTube, Twitter.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Normalización de la URL
- Recibir el dominio o web (ej: `adox.com.ar`). Asegurar protocolo `https://` o `http://`.

### Paso 2: Navegación y Captura con Playwright
- Inicializar navegador Chromium en modo headless.
- Abrir la página principal (`/`) con timeout de 15s.
- Opcionalmente intentar `/contacto` o `/contact` si el footer o la página principal tiene enlaces de contacto.
- Extraer selectores DOM: `header`, `footer`, `#footer`, `.footer`, `#contacto`, `.contacto`, `address`, y todos los enlaces `a[href]`.

### Paso 3: Extracción de Datos mediante Expresiones Regulares y Selectores
- Regex para correos: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Regex para teléfonos: `(?:\+?54|\b0800|\b11|\b\(?\d{2,4}\)?)\s?\d{3,4}[-\s]?\d{4}`
- Mapeo de redes sociales por dominio de URL de enlaces `a[href]`.

### Paso 4: Fusión con la Inteligencia de Enriquecimiento (Gemini / OpenRouter)
- El texto y datos duros extraídos por el scraper se inyectan en el prompt del Agente A5 (`estructurar_brief`) como "DATOS REALES CAPTURADOS DEL SITIO WEB (HEADER/FOOTER)", asegurando 100% de precisión en los datos de contacto.

---

## 4. Herramientas y Librerías
- **Python:** `playwright` (Chromium async/sync API), `beautifulsoup4`, `requests`, `re`.

---

## 5. Restricciones y Casos Borde (Edge Cases)
- **Timeouts & Blanqueos:** Si un sitio web no responde o bloquea la conexión (timeout > 15s), el scraper debe fallar elegantemente retornando datos vacíos sin detener el enriquecimiento de Gemini/OpenRouter.
- **Limpieza de HTML:** Sanitizar y truncar textos extensos para evitar sobrecargar los tokens del modelo.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 10/08/2026 | Sitios lentos o caídos congelaban la ejecución | Playwright esperando `networkidle` indefinidamente | Usar `wait_until='domcontentloaded'` y timeout estricto de 15s con fallback |

---

## 7. Ejemplos de Uso

```bash
python scripts/enrich_pending_leads.py
```
