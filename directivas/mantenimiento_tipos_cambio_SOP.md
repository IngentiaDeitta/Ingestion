# SOP: Mantenimiento de Tipos de Cambio Automáticos

## Objetivo
Asegurar que el sistema disponga siempre de los tipos de cambio más recientes (USD y EUR) para la consolidación financiera en ARS, y que estos se visualicen correctamente en el dashboard.

## Entradas
- **Primaria:** Web del Banco Nación (BNA) via scraping.
- **Redundancia (Sólida):** [DolarAPI](https://dolarapi.com) para obtener datos oficiales del BNA si el scraping falla o es bloqueado.
- **Persistencia:** `src/data/exchange_rates.json` (para producción) y `.env` (para desarrollo local).

## Lógica de Actualización
1. **GitHub Action (`update_rates.yml`):**
   - Se ejecuta diariamente a las **11:00 UTC (8:00 AM ART)** y **16:00 UTC (1:00 PM ART)**.
   - El segundo horario asegura capturar actualizaciones tardías del BNA.
   - Utiliza el script `scripts/update_bna_rates.py`.
   - **IMPORTANTE:** Requiere `permissions: contents: write`.
2. **Script de Python (`update_bna_rates.py`):**
   - Intenta scraping del BNA con User-Agent real.
   - Si falla, consulta automáticamente la API de DolarAPI.
   - Si ambas fallan, el script sale con código de error `1` para alertar en el panel de Actions.
   - Actualiza `src/data/exchange_rates.json` incluyendo el campo `source`.
3. **Frontend (`Finance.tsx`):**
   - Importa `src/data/exchange_rates.json`.
   - Muestra el valor de venta y la fuente de los datos.
   - Indica la fecha y hora de la última actualización exitosa en el dashboard de finanzas.

## Restricciones y Casos Borde
- **Bloqueos de IP:** Los runners de GitHub a veces son bloqueados por el BNA. Por eso se implementó el fallback a DolarAPI.
- **Rutas de Archivo:** El script utiliza rutas relativas (`os.path`) para funcionar tanto en Windows (local) como en Linux (GitHub Actions). No usar rutas hardcodeadas con `C:\`.
- **Commits Vacíos:** El workflow verifica `git diff` antes de commitear para evitar ensuciar el historial si los precios no cambiaron.

## Procedimiento de Corrección
Si la actualización automática falla:
1. Revisar logs en GitHub Actions -> "Update Exchange Rates".
2. Si el error es "ConnectionResetError" en BNA, es normal; verificar si DolarAPI también falló.
3. Si falla el Push, verificar que la rama `main` no esté protegida contra pushes de bots sin bypass.
