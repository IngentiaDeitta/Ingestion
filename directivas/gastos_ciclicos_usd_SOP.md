# DIRECTIVA: Gastos Cíclicos con Débito Automático (USD/Otros) SOP

**ID:** 20260630-GASTOS-CICLICOS
**Script Asociado:** No aplica (lógica implementada directamente en el frontend React + Supabase)
**Última Actualización:** 2026-06-30
**Estado:** BORRADOR

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Permitir registrar gastos cíclicos con débito automático (por ejemplo, suscripciones como AWS, GitHub, etc.), especialmente en USD. Estos gastos deben replicarse automáticamente todos los meses si no existen, tomando por defecto el valor del mes anterior pero permitiendo modificaciones manuales del usuario.
- **Criterio de Éxito:** 
  1. El usuario puede marcar un gasto como cíclico (debito automático) al crearlo o editarlo.
  2. Al cargar la pantalla de finanzas, el sistema detecta si faltan transacciones cíclicas para los meses transcurridos desde el registro inicial del gasto hasta el mes actual.
  3. Si faltan, el sistema autogenera las transacciones correspondientes en la base de datos copiando los atributos (monto, moneda, categoría, ítems, etc.) del mes inmediatamente anterior.
  4. El usuario puede modificar cualquier instancia mensual de forma independiente sin afectar el comportamiento cíclico general.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Base de Datos (Supabase):**
  - Tabla `finances`.
  - Columna existente: `category` (TEXT, con valor `'cyclic'` para indicar débito automático/cíclico).
- **UI (Formulario de Transacciones):**
  - Checkbox/Toggle para activar el estado cíclico (guarda `'cyclic'` en `category`) únicamente en transacciones de tipo `expense`.

### Salidas (Outputs)
- **Base de Datos:**
  - Nuevos registros de gastos generados automáticamente para los meses faltantes con `is_cyclic: true`.
- **UI:**
  - Icono indicador en la tabla de operaciones para identificar transacciones cíclicas.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Selección de Columna de Persistencia
- Para evitar errores de caché del esquema en Supabase (`Could not find the column in the schema cache`), se utiliza la columna nativa `category` de tipo `TEXT` que ya existe en la tabla `finances` (con el valor `'cyclic'` para indicar que es cíclica). No se requiere alterar la base de datos físicamente.

### Paso 2: Creación/Edición en Formulario (`NewInvoice.tsx`)
1. Si el tipo de transacción es `expense` (gasto), mostrar la opción "Gasto Cíclico (Débito Automático)".
2. Al guardar la transacción (crear o editar), persistir `'cyclic'` (si es cíclico) o `null` (si no lo es) en la columna `category` de Supabase.
3. Al cargar una transacción para edición, marcar la casilla si `category === 'cyclic'`.

### Paso 3: Proceso de Auto-Replicación Mensual (`Finance.tsx`)
1. Al cargar la pantalla de finanzas (`fetchData`):
   - Obtener todas las transacciones de tipo `expense` donde `category = 'cyclic'`.
2. Agrupar las transacciones por su descripción (`description`).
3. Para cada grupo de descripción (es decir, cada suscripción o gasto recurrente):
   - Encontrar la transacción más antigua del grupo para determinar la fecha de inicio.
   - Determinar los meses faltantes desde el mes posterior al de la transacción más antigua hasta el mes actual.
   - Para cada mes faltante:
     - Comprobar si ya existe una transacción en ese mes (año y mes) con la misma descripción y `category = 'cyclic'`.
     - Si no existe:
       - Buscar la transacción de este grupo en el mes inmediatamente anterior.
       - Generar una nueva transacción copiando todos sus datos (monto, moneda, tag, items, etc., y `category: 'cyclic'`).
       - Ajustar la fecha al mismo día del mes faltante (o al último día del mes si el día excede la longitud del mes).
       - Insertar el nuevo registro en Supabase.
4. Si se insertaron registros nuevos, volver a consultar los datos (`fetchData`) para refrescar la UI.

---

## 4. Herramientas y Librerías
- **Frontend:** React, Tailwind CSS, Lucide React (para iconos).
- **Backend:** Supabase Client.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Coincidencia de Descripciones:** La replicación se basa en la descripción exacta para agrupar y rastrear los meses de un gasto. Si el usuario cambia drásticamente la descripción de una instancia, se considerará como otro grupo. Mantendremos el agrupamiento por descripción exacta.
- **Inserciones Concurrentes:** Si se cargan múltiples meses faltantes de golpe, se debe realizar la inserción de manera secuencial o en lote para evitar duplicados en recargas rápidas.
- **Zona Horaria y Fechas:** Al calcular los meses faltantes y las nuevas fechas, usar funciones nativas de JS en UTC o fechas locales consistentes para evitar saltos de mes no deseados.

### Validaciones Requeridas
- Solo permitir marcar como cíclico si el tipo es `expense` (gastos).
- Comprobar que no haya duplicados de la misma descripción en el mismo mes antes de insertar un nuevo registro cíclico.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 30/06 | `Property 'items' does not exist on type 'Transaction'` | La interfaz de TypeScript para `Transaction` en `Finance.tsx` no declaraba la columna `items` de la tabla, impidiendo copiarla en las replicaciones. | Añadir la propiedad opcional `items?: any` a la interfaz `Transaction` en `Finance.tsx`. |
| 30/06 | `Could not find the 'is_cyclic' column of 'finances' in the schema cache` | Supabase (PostgREST) dio error de caché de esquema porque la columna `is_cyclic` no existía o no se refrescó la caché. | Usar la columna existente `category` como string y guardar `'cyclic'` para marcar gastos cíclicos, eliminando la columna `is_cyclic`. |

---

## 7. Checklist de Pre-Ejecución
- [ ] Crear y ejecutar la migración SQL en Supabase para añadir `is_cyclic`.
- [ ] Modificar la interfaz `Transaction` en el código de React.

---

## 8. Checklist Post-Ejecución
- [ ] Verificar que el checkbox de gasto cíclico se visualice correctamente en `NewInvoice.tsx`.
- [ ] Crear un gasto en USD y marcarlo como cíclico para un mes anterior.
- [ ] Navegar a la sección de Finanzas y comprobar que se cree automáticamente para el mes actual.
- [ ] Editar el gasto del mes actual y verificar que al pasar al mes siguiente tome el valor modificado por defecto.
