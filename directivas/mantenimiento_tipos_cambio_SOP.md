# SOP: Mantenimiento de Tipos de Cambio Automáticos

## Objetivo
Asegurar que el sistema disponga siempre de los tipos de cambio más recientes (USD y EUR) para la consolidación financiera en ARS, y que estos se visualicen correctamente en el dashboard.

## Entradas
- Web del Banco Nación (BNA) o API de contingencia (DolarAPI).
- Repositorio GitHub para persistencia de datos históricos en `src/data/exchange_rates.json`.

## Lógica de Actualización
1. **GitHub Action (`update_rates.yml`):**
   - Se ejecuta diariamente a las 11:00 UTC (8:00 AM ART).
   - Utiliza el script `scripts/update_bna_rates.py` para obtener los valores.
   - **IMPORTANTE:** El workflow debe tener permisos de escritura (`contents: write`) para poder persistir los cambios en el repositorio.
2. **Script de Python (`update_bna_rates.py`):**
   - Scrapea la web oficial del BNA.
   - Si el scraping falla, utiliza valores de contingencia (fallback).
   - Actualiza tanto el archivo `.env` (desarrollo local) como `src/data/exchange_rates.json` (producción/build).
3. **Frontend (`Finance.tsx`):**
   - Prioriza la lectura de `src/data/exchange_rates.json`.
   - Muestra el valor de venta, la fecha y la hora de la última actualización exitosa.

## Restricciones y Casos Borde
- **Permisos de GitHub:** Si el token no tiene permisos de escritura, la actualización fallará con un error 403. Se debe configurar `permissions: contents: write` en el archivo `.yml`.
- **Cambios en el DOM del BNA:** El scraping por regex es frágil. Si el BNA cambia su estructura o añade clases (ej. `class="destacado"`), el script debe usar un regex que ignore atributos en las etiquetas `<td>` y maneje espacios en blanco excesivos (ej. `rf"{currency_name}</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>\s*<td[^>]*>\s*([\d,.]+)\s*</td>"`).
- **Diferencia Compra/Venta:** Siempre utilizar el valor de **venta** para la consolidación de activos/balance, según política contable de la empresa.

## Procedimiento de Corrección
Si la actualización falla:
1. Verificar los logs de la GitHub Action.
2. Si es un error 403, revisar los permisos del workflow.
3. Si es un error de scraping, validar la URL del BNA y los patrones regex.
