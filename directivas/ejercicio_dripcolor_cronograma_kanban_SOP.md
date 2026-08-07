# DIRECTIVA: ejercicio_dripcolor_cronograma_kanban_SOP

**ID:** 20260805_ejercicio_dripcolor
**Script Asociado:** `scripts/setup_dripcolor_exercise.py`
**Última Actualización:** 2026-08-05
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta directiva establece el procedimiento para estructurar la simulación completa del proyecto **DripColor** en IngentIA, incluyendo:
1. **Cronograma de Hitos Entregables y Facturables:** Estructura completa de hitos con montos, tipos (`delivery`, `billing`, `both`), fechas estimadas y estado de cobro/completado.
2. **Tareas por Fase del Engineering Path:** Generación de un desglose realista de tareas estructuradas por fase (*Auditoría*, *Arquitectura & Prototipo*, *Construcción & IA*, *Lanzamiento*), con estimaciones de horas, prioridades, responsables (`Fer`, `Pedro`, `Tercero (Freelance)`), fechas límite y estado.
3. **Distribución en Kanban:** Poblar el Kanban del proyecto y el Kanban general con las tareas en sus estados correspondientes (`Por Hacer`, `En Progreso`, `En Revisión`, `Completado`), priorizando la fase actual en curso para que el tablero esté activo y con trabajo distribuido de forma realista.

---

## 2. Especificaciones de Entradas y Salidas

### Entradas
- **Proyecto Objetivo:** Proyecto registrado en Supabase con nombre `DripColor`.
- **Fases del Engineering Path:**
  - *Auditoría* (Completada o en cierre)
  - *Arquitectura & Prototipo* (En curso)
  - *Construcción & IA* (Próxima)
  - *Lanzamiento* (Final)

### Salidas
- **Hitos (`milestones` en `project_analysis`):** JSON con 4-5 hitos clave estructurados en la línea de tiempo.
- **Registros en Tabla `tasks`:** 12-15 tareas asignadas al proyecto `DripColor` distribuidas proporcionalmente entre `Por Hacer` (4-5 tareas), `En Progreso` (3-4 tareas), `En Revisión` (2 tareas) y `Completado` (3-4 tareas).
- **Actualización del Progreso del Proyecto (`progress`):** Avance calculado en la tabla `projects`.

---

## 3. Flujo Lógico del Script Python (`scripts/setup_dripcolor_exercise.py`)

1. **Conexión a Supabase:** Leer credenciales desde `.env` (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` o `VITE_SUPABASE_ANON_KEY`).
2. **Buscar o Crear el Proyecto DripColor:** Verificar la existencia del proyecto `DripColor`. Si existe, actualizar sus datos principales (cliente, presupuesto, fechas); si no, crearlo.
3. **Insertar Hitos en `project_analysis`:**
   - Hito 1: *Firma de Contrato e Insumos Iniciales* ($1,500 - Completado y Cobrado)
   - Hito 2: *Auditoría & Prototipo Interactivo UI/UX* ($2,500 - En Progreso)
   - Hito 3: *Entrega Módulo Core & Agentes IA DripColor* ($3,500 - Pendiente)
   - Hito 4: *Despliegue Final y Salida a Producción* ($2,500 - Pendiente)
4. **Borrar / Reemplazar Tareas Anteriores de DripColor:** Limpiar tareas desactualizadas o de prueba para evitar duplicaciones.
5. **Crear y Distribuir Tareas Realistas:**
   - **Por Hacer (Etapa en Curso / Siguiente):** Tareas de prototipado, conexión a BBDD real, configuración de agentes IA.
   - **En Progreso (Etapa en Curso):** Tareas activas de arquitectura de agentes, diseño de interfaz y validación de reglas de negocio.
   - **En Revisión:** Tareas terminadas que requieren QA o revisión del cliente.
   - **Completado:** Tareas de auditoría e insumos iniciales finalizadas.
6. **Recalcular Progreso:** Actualizar la columna `progress` en `projects`.

---

## 4. Restricciones y Casos Borde
- Las fechas de vencimiento de las tareas de cada fase deben ser anteriores o iguales a la fecha estimada del hito correspondiente.
- El proyecto debe asignarse correctamente al cliente correspondiente (ej. *DripColor* o crear el cliente si no existe).
- Garantizar que las tareas aparezcan correctamente clasificadas en el Kanban general y de proyecto.

---

## 5. Historial de Aprendizaje
- *2026-08-05:* Creada la directiva para poblar la simulación del ejercicio DripColor con cronograma, tareas por fase y distribución de estados en Kanban.
