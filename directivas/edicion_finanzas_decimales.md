# Edición de Transacciones y Soporte de Decimales en Finanzas

## Objetivo
Permitir a los usuarios editar registros de operaciones financieras existentes y habilitar la carga de montos con decimales para mayor precisión.

## Entradas
- ID de la transacción a editar (vía URL `/finance/edit/:id`).
- Montos con decimales en el formulario de Nueva/Editar Transacción.

## Salidas
- Registro actualizado en la tabla `finances` de Supabase.
- Visualización correcta de decimales en la tabla de "Registro de operaciones".

## Lógica de Implementación

### 1. Edición de Registros
- En `src/pages/Finance.tsx`, dentro del menú de acciones de cada fila de la tabla, añadir un botón "Editar".
- El botón debe redirigir a `/finance/edit/${id}`.
- El componente `NewInvoice.tsx` ya tiene la lógica para cargar datos si detecta un `id` en los parámetros, por lo que no requiere cambios estructurales masivos, solo asegurar que todos los campos se carguen correctamente.

### 2. Soporte de Decimales
- En `src/pages/NewInvoice.tsx`, los inputs de `cantidad` y `precio` deben permitir decimales.
- Añadir el atributo `step="any"` o `step="0.01"` a los inputs de tipo `number`.
- Asegurar que el cálculo de `subtotal`, `tax` y `total` mantenga la precisión necesaria (usar `toFixed(2)` al guardar).

### 3. Visualización de Decimales
- En `src/pages/Finance.tsx`, actualizar la visualización del importe para que muestre decimales de forma consistente.
- Usar `toLocaleString` con opciones de fracciones mínimas y máximas si es necesario.

## Restricciones / Casos Borde
- **IVA en Ingresos:** Al editar un ingreso, el sistema desglosa el IVA (divide por 1.21). Asegurar que esto no cause errores de redondeo perceptibles.
- **Permisos:** La edición debe estar restringida a usuarios con permisos (actualmente controlado por `isAdmin` en el header, pero el botón de edición también debería respetarlo).
- **Tipos de Datos:** Supabase debe almacenar el monto como un tipo numérico que soporte decimales (ej. `numeric` o `float`).

## Verificación
- Crear una transacción con decimales (ej. 10.50) y verificar que se guarde y muestre correctamente.
- Editar una transacción existente y verificar que los cambios persistan.
- Confirmar que el cálculo del IVA sigue siendo correcto.
