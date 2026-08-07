# DIRECTIVA: unificar_proyectos_dripcolor_SOP

**ID:** 20260805_unificar_proyectos_dripcolor
**Script Asociado:** `scripts/unify_dripcolor_projects.py`
**Última Actualización:** 2026-08-05
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta directiva establece el procedimiento para unificar los proyectos duplicados o fragmentados de DripColor en un **único proyecto integral** dentro de IngentIA.

- **Proyectos Detectados:**
  1. `DripColor`
  2. `Sistema de Producción y Costeo - DripColor`
  3. `Diagnóstico Operativo - DripColor`

- **Objetivo Principal:** Consolidar toda la información (cliente, presupuesto, hitos del cronograma, tareas del Kanban, asignación de equipo e historial financiero) en un solo proyecto unificado `DripColor` (o `DripColor - Plataforma & Diagnóstico Operativo`), limpiando los registros duplicados y garantizando trazabilidad total.

---

## 2. Especificaciones de Entradas y Salidas

### Entradas
- Registros en la tabla `projects` correspondientes a DripColor.
- Tareas asociadas en la tabla `tasks`.
- Asignaciones de equipo en `project_team`.
- Transacciones financieras en `finances`.

### Salidas
- **Proyecto Unificado:** Un solo registro en `projects` con el cliente estandarizado (`DripColor SRL`), presupuesto total consolidado, cronograma completo de hitos y porcentaje de avance recalculated.
- **Tareas Migradas:** Todas las tareas reasignadas al nombre del proyecto unificado y clasificadas por su fase del *Engineering Path* en el Kanban.
- **Registros Residuales:** Eliminación segura de los proyectos duplicados/fragmentados.

---

## 3. Flujo Lógico del Script (`scripts/unify_dripcolor_projects.py`)

1. **Inspeccionar Datos Existentes:** Consultar los 3 proyectos en la tabla `projects`, sus tareas asociadas, registros de equipo y finanzas.
2. **Consolidar la Información del Proyecto Unificado:**
   - **Nombre:** `DripColor`
   - **Cliente:** `DripColor SRL` (estandarizando `clients` table)
   - **Presupuesto Consolidado:** Presupuesto total acumulado.
   - **Hitos:** Integrar en `project_analysis` los hitos de diagnóstico operativo, prototipado de producción & costeo, desarrollo de conectores y lanzamiento.
3. **Reasignar Tareas y Finanzas:**
   - Actualizar el campo `project` en todas las tareas vinculadas a `Sistema de Producción y Costeo - DripColor` y `Diagnóstico Operativo - DripColor` para que apunten a `DripColor`.
   - Reasignar `project_id` en la tabla `finances` hacia el ID del proyecto unificado.
4. **Eliminar Proyectos Duplicados:** Borrar los registros sobrantes en la tabla `projects` para dejar un único proyecto.
5. **Recalcular Progreso:** Actualizar la columna `progress` según los hitos y tareas completadas.

---

## 4. Restricciones y Casos Borde
- No perder ninguna tarea ni registro financiero existente en los proyectos secundarios.
- Garantizar que los nombres de los clientes en `clients` se unifiquen (`DripColor SRL`).
- Mantener la coherencia del cronograma escalonado y el tablero Kanban.

---

## 5. Historial de Aprendizaje
- *2026-08-05:* Creada la directiva para unificar los 3 proyectos fragmentados de DripColor en un solo proyecto integral.
