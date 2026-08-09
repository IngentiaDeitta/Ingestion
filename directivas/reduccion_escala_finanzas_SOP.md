# DIRECTIVA: REDUCCION_ESCALA_FINANZAS_SOP

**ID:** 2026-08-09-003
**Script Asociado:** `scripts/reduce_finance_scale.py`
**Última Actualización:** 2026-08-09
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance

- **Objetivo Principal:** Reducir la escala general de la sección "Finanzas" (`src/pages/Finance.tsx`) para que sus tamaños de tipografía, paddings de tarjetas, alturas de gráficos y densidad de tablas se alineen armónica y proporcionalmente con las demás secciones del sistema (Dashboard, Proyectos, Leads, Kanban, etc.).
- **Criterio de Éxito:**
  1. El título principal de "Finanzas" se escala de `text-4xl/md:text-[42px]` a `text-2xl md:text-3xl font-semibold`.
  2. Los paddings y bordes de las tarjetas de KPIs, Balances, Analíticas y Cuentas de Socios se reducen de `p-6/p-8` y `rounded-[32px]` a `p-4/p-5` y `rounded-2xl`.
  3. Las métricas principales (cifras en dinero) se ajustan de `text-4xl` a `text-2xl/text-3xl`.
  4. Los gráficos de Facturación vs Costes y Distribución de Gastos reducen su altura (`h-64` a `h-48/h-52`) manteniendo su legibilidad.
  5. La densidad de la tabla de Registro de Operaciones y Motor de Comisiones se optimiza (paddings de celdas reducidos de `px-8 py-5/py-6` a `px-4 py-2.5/py-3`, textos de encabezado y celdas ajustados a `text-[10px]` / `text-xs`).

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)

- `src/pages/Finance.tsx`: Componente React de la vista de Finanzas.

### Salidas (Outputs)

- `src/pages/Finance.tsx` actualizado con la escala reducida y consistente con la UI compacta de la aplicación.

---

## 3. Flujo Lógico (Algoritmo)

1. Reemplazar estilos de la cabecera (Header):
   - Título `text-4xl md:text-[42px]` -> `text-2xl md:text-3xl font-semibold`
   - Botones `px-6 py-3`, `px-8 py-3` -> `px-4 py-2 text-xs`, `px-5 py-2 text-xs`
   - Contenedor global `gap-8 pb-12` -> `gap-5 pb-8`
2. Reemplazar tarjetas de KPIs (Plan 90 Días y Balances por Moneda):
   - `rounded-[32px] p-6` -> `rounded-2xl p-4`
   - `text-4xl` -> `text-2xl font-medium` (o `text-2xl font-light`)
   - `text-3xl` -> `text-xl font-medium`
   - Contenedores de iconos `p-3 ... rounded-2xl` -> `p-2 ... rounded-xl`, iconos de `size={24}` a `size={18}`
3. Reemplazar sección de Analíticas (Gráficos):
   - `rounded-[32px] p-8` -> `rounded-2xl p-5`
   - Títulos `text-xl` -> `text-sm font-semibold`
   - Contenedores de gráfico `h-64` -> `h-48`
4. Reemplazar Cuenta Corriente Socios:
   - Título de sección `text-2xl` -> `text-base font-semibold`
   - Tarjetas `rounded-[32px] p-8 gap-6` -> `rounded-2xl p-5 gap-4`
   - Saldo Neto Disponible `text-4xl` -> `text-2xl font-light`
5. Reemplazar Tablas de Transacciones y Comisiones:
   - Encabezados de tabla y botones de filtro ajustados a baja escala (`px-4 py-2`, `text-xs`).
   - Celdas de tabla `px-8 py-5`, `px-8 py-6` -> `px-4 py-2.5`, `px-4 py-3`, `text-xs`.
   - Menús desplegables y badges escalados proporcionalmente.

---

## 4. Herramientas y Librerías

- **Python**: Script `scripts/reduce_finance_scale.py` para aplicar transformaciones deterministas de clases en `src/pages/Finance.tsx`.

---

## 5. Restricciones y Casos Borde (Edge Cases)

- Asegurar que no se rompa la funcionalidad interactiva ni los IDs/eventos (`onClick`, `setOpenActionId`, etc.).
- Conservar la responsividad (`grid-cols-1 md:grid-cols-3`, `overflow-x-auto`, etc.).

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
| ------- | ---------------- | ------------ | -------------------------- |
| 09/08 | Vista de Finanzas con escala desproporcionada | Uso excesivo de `text-4xl`, `p-8` y `rounded-[32px]` en comparación al Dashboard | Reducir escala general de tipografías a `text-2xl/xl/xs`, paddings a `p-4/p-5`, y alturas de gráficos a `h-48`. |
