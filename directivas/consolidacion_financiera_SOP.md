# SOP: Consolidación Financiera y Tipo de Cambio BNA

## Objetivo
Mantener un balance consolidado preciso en Pesos Argentinos (ARS) utilizando el Tipo de Cambio (TC) oficial del Banco Nación (BNA), y asegurar la correcta visualización de los saldos operativos.

## Entradas
- Datos de transacciones desde Supabase (`finances`).
- Tipo de Cambio oficial desde `https://dolarapi.com/v1/dolares/oficial`.

## Lógica de Negocio
1. **Consolidación de Moneda:**
   - Todas las transacciones en USD deben convertirse a ARS utilizando el valor de **venta** del Dólar Oficial.
   - Las transacciones en EUR se convierten utilizando un factor estimado (Dólar Oficial * 1.08) o una API específica si está disponible.
   - Las transacciones en ARS se suman directamente.
2. **Balance Consolidado:**
   - El resultado es la suma neta (`ingresos - egresos`) de todos los montos convertidos a ARS.
3. **Visualización en Dashboard:**
   - El "Balance Financiero" en la sección de Estado Operativo debe mostrarse siempre con valor absoluto (`Math.abs()`) para evitar confusiones visuales, según preferencia del usuario.

## Restricciones y Casos Borde
- **Fallo de API:** Si `dolarapi.com` no responde, se utiliza un fallback de $1000 ARS por USD para evitar que el dashboard quede en blanco.
- **Signos:** Aunque contablemente el balance puede ser negativo, la visualización en el dashboard se ha forzado a positivo por requerimiento de UX.

## Procedimiento de Actualización
Si se agrega una nueva moneda al sistema:
1. Actualizar el array `CURRENCIES` en `Finance.tsx`.
2. Actualizar la lógica de reducción en `Finance.tsx` y `Dashboard.tsx` para incluir el factor de conversión correspondiente.
