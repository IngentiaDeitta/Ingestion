# SOP: Gestión de Retiros de Socios (Actualizado)

## Objetivo
Implementar un tipo de transacción específico para "Retiros", simplificando el formulario al eliminar la obligatoriedad de campos irrelevantes (Referencia, Origen de Fondos) y centralizando la lógica de asignación a socios.

## Cambios en el Flujo

### 1. Tipos de Transacción
Se expanden los tipos de transacción en el sistema:
- **Ingreso**: Facturación a clientes por servicios/proyectos.
- **Gasto**: Costos operativos, sueldos, viáticos, etc.
- **Retiro (NUEVO)**: Salida de capital hacia los socios (Dividendos).

### 2. Frontend: Formulario (`NewInvoice.tsx`)
- **Selector de Tipo**: Tres opciones: [Ingreso, Gasto, Retiro].
- **Simplificación para Retiros**:
  - **Datos Generales**: Solo se muestran los campos `Moneda` y `Fecha`.
  - **Ocultos**: `Categoría`, `Referencia` y `Origen de los Fondos` desaparecen para evitar ruido visual.
- **Detalle de Retiro (Ítems)**:
  - Se oculta la columna `Cantidad` (fijada internamente en 1).
  - Se muestra una única columna de `Importe`.
- **Lógica de Asignación**:
  - Se activa automáticamente al seleccionar `Retiro`.
  - Permite distribución **Equitativa** o **Manual**.

### 3. Frontend: Dashboard (`Finance.tsx`)
- El balance consolidado y los cálculos de CC deben considerar el nuevo tipo `withdrawal`.
- Las tablas deben mostrar el tipo de forma clara.

## Reglas de Base de Datos
- `finances.type` debe permitir el valor `withdrawal`.
- Las transacciones de tipo `withdrawal` se registran en `partner_transactions` como `withdrawal`.

## Casos Borde
- **Aportes de Capital**: Siguen siendo `income` pero con un tag especial, o se puede considerar un tipo `contribution` si el usuario lo prefiere en el futuro. Por ahora, nos enfocamos en el tipo `Retiro` solicitado.
