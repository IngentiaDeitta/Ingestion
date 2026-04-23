# DIRECTIVA: CONSOLIDACION_DIVISAS_ARS_SOP

**ID:** 2026-04-23-003
**Script Asociado:** `scripts/get_bna_rates.py` / `src/lib/exchangeRates.ts`
**Última Actualización:** 2026-04-23
**Estado:** BORRADOR

---

## 1. Objetivos y Alcance
*Implementar la conversión automática de transacciones multimoneda a ARS para mostrar una posición consolidada real.*
- **Objetivo Principal:** Obtener tipos de cambio (TC) de USD y EUR frente a ARS desde el Banco Nación (BNA) y aplicarlos al total financiero.
- **Criterio de Éxito:** El componente "Balance Consolidado" muestra el total en ARS sumando todas las monedas convertidas.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Fuente de Datos:** Página web `https://www.bna.com.ar/Personas`.
- **Datos Actuales:** Transacciones de la tabla `finances`.

### Salidas (Outputs)
- **UI:** Nuevo KPI en la página de Finanzas: "Total Consolidado (ARS)".
- **Servicio:** Función `getExchangeRates()` que retorna `{ USD: number, EUR: number }`.

---

## 3. Flujo Lógico (Algoritmo)

1. **Obtención de TC:**
   - Navegar a `bna.com.ar`.
   - Extraer el valor de "Venta" para Dólar y Euro.
2. **Cálculo de Consolidado:**
   - Iterar sobre todas las transacciones.
   - Si moneda == 'USD', multiplicar por TC_USD.
   - Si moneda == 'EUR', multiplicar por TC_EUR.
   - Si moneda == 'ARS', sumar directamente.
3. **Actualización de UI:**
   - Reemplazar "Total USD" por "Total Consolidado ARS" (o añadirlo).
   - Mostrar los TC utilizados para transparencia.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **CORS:** El navegador no puede scrapear BNA directamente desde el frontend. Se requiere un proxy o un Edge Function.
- **Formato BNA:** Los números en BNA usan coma `,` como separador decimal. El script debe normalizarlos.

### Fallback
- Si el scraping falla, usar valores por defecto (ej. 900/1000) e informar al usuario.

---

## 6. Historial de Aprendizaje
*(A completar tras la ejecución)*

---

## 10. Notas Adicionales
Se propone crear una Edge Function en Supabase para centralizar el scraping y evitar bloqueos de CORS.
