# DIRECTIVA: restauracion_kanban_limpieza_dripcolor_SOP

**ID:** 20260813_restauracion_kanban_limpieza_dripcolor
**Script Asociado:** `scripts/cleanup_dripcolor_tasks.py`
**Última Actualización:** 2026-08-13
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta directiva define el procedimiento determinista para revertir y eliminar la contaminación de tareas sintéticas creadas para el proyecto de simulación "DripColor" en el tablero Kanban y la base de datos de Supabase, preservando intactas todas las funcionalidades desarrolladas en la aplicación (filtros por proyecto, vistas responsivas, Drag & Drop, sincronización de hitos y modales).

- **Objetivo 1:** Identificar y eliminar de la tabla `tasks` todas las tareas sintéticas asociadas a `DripColor` (creadas masivamente durante ejercicios de simulación).
- **Objetivo 2:** Eliminar o inactivar registros sintéticos sobrantes en `projects` o `clients` vinculados a DripColor, manteniendo las cuentas reales o clasificadas según el flujo comercial (ej. Lead en `leads_cuentas`).
- **Objetivo 3:** Asegurar que las tarjetas reales del usuario (proyectos `General`, `EK CRM`, `QR - Control de Inventario`, `Telemetría`, `Aplicación Monitor`) permanezcan intactas y correctamente visibles en el tablero Kanban por defecto.
- **Objetivo 4:** Mantener todas las mejoras de código UI/UX (Kanban responsivo, layout compacto, selectores de filtro y agrupación por fase/estado).

---

## 2. Especificaciones de Entradas y Salidas

### Entradas
- Tabla `tasks` en Supabase con registros de tareas.
- Tabla `projects` y `clients` en Supabase.

### Salidas
- Eliminación limpia de las 11-14 tareas sintéticas etiquetadas con `project = 'DripColor'`.
- Limpieza de proyectos/clientes sintéticos duplicados en Supabase.
- Conservación exacta de las 64 tareas reales del usuario (`General`: 33, `EK CRM`: 24, `Telemetría`: 3, `QR`: 2, `Aplicación Monitor`: 2).
- Verificación del tablero Kanban en `src/pages/Kanban.tsx`.

---

## 3. Flujo Lógico del Script (`scripts/cleanup_dripcolor_tasks.py`)

1. **Conexión a Supabase:** Cargar URL y anon key desde `.env`.
2. **Filtrar y Eliminar Tareas DripColor:** Ejecutar borrado en la tabla `tasks` filtrando por `project = 'DripColor'` o `ilike project '%DripColor%'`.
3. **Limpiar Proyectos y Clientes Sintéticos Sobrantes:** Borrar entradas de `projects` donde `name = 'DripColor'` y en `clients` donde `name = 'DripColor'` o `name = 'DripColor SRL'`.
4. **Validación de Integridad:** Verificar que las tareas de los proyectos reales del usuario sigan intactas en la base de datos y contar el total remanente.
5. **Verificación de Kanban Frontend:** Confirmar que `src/pages/Kanban.tsx` muestre la vista general/IngentIA por defecto sin tareas de DripColor.

---

## 4. Restricciones y Casos Borde
- **RESTRICCIÓN CRÍTICA:** No eliminar ni modificar ninguna tarea perteneciente a los proyectos reales (`General`, `EK CRM`, `QR - Control de Inventario`, `Telemetría - Tableros eléctricos para electrólisis`, `Aplicación Monitor maestro IoT Tableros`).
- No eliminar funcionalidades ni lógica de interfaz desarrolladas en React / TSX.
- Registrar el caso borde en las directivas anteriores (`ejercicio_dripcolor_cronograma_kanban_SOP.md` y `unificar_proyectos_dripcolor_SOP.md`) advirtiendo que los ejercicios de simulación NO deben insertar tareas en la base de datos de producción/Kanban real del usuario.

---

## 5. Historial de Aprendizaje
- *2026-08-13:* Creada la directiva para restaurar el tablero Kanban al contenido original del usuario, eliminando la contaminación de tareas sintéticas de DripColor sin afectar las funcionalidades desarrolladas en el sistema.
