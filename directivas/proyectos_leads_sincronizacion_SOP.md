# DIRECTIVA: PROYECTOS_LEADS_SINCRONIZACION_SOP

**ID:** 2026-08-09-003
**Script Asociado:** `scripts/apply_sync_and_enrichment_improvements.py`
**Última Actualización:** 2026-08-09
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:**
  1. **Enriquecimiento 360 de Redes y Reputación:** Reactivar la detección y visualización automática de redes sociales (Web, LinkedIn, Instagram, Facebook) y reputación digital (Google Reviews, Followers, Sentimiento) en las fichas 360 de Clientes (`ClientDetail.tsx`) y Leads (`LeadDetail.tsx`), ejecutando el enriquecimiento automático para cuentas existentes como Elektrokorrosión.
  2. **Integrantes del Equipo y Kanban:** Sincronizar los integrantes asignados a cada proyecto (`project_team`) con la selección de recursos disponibles al crear/editar tareas en el Kanban y en el desglose automático del cronograma.
  3. **Edición Integral del Proyecto:** Asegurar que la edición de fechas, presupuesto o nombre del proyecto impacte en las tareas y cronograma asociado.
  4. **Gestión de Hitos y Tareas:** Al marcar un hito como completado, actualizar automáticamente las tareas asociadas a `done` con fecha actual, y activar las tareas del hito en curso para su aparición en el Kanban.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- Componentes UI: `ClientDetail.tsx`, `LeadDetail.tsx`, `ProjectDetail.tsx`, `Kanban.tsx`, `EditProjectModal.tsx`, `CronogramaProyecto.tsx`.
- Tablas de Supabase: `clients`, `leads_cuentas`, `projects`, `project_team`, `tasks`, `team`.

### Salidas (Outputs)
- Fichas de Clientes y Leads con tarjeta completa de Redes Sociales y Reputación Digital + botón de re-investigación IA.
- Modales de Tareas filtrados dinámicamente por los integrantes del proyecto asignado.
- Flujo de actualización automática de Hitos -> Tareas del Hito completadas + Hito en curso activado.

---

## 3. Flujo Lógico (Algoritmo)

### Requisito 1: Redes Sociales y Reputación Digital (Clientes y Leads)
- En `LeadDetail.tsx` y `ClientDetail.tsx`:
  - Extraer y renderizar URLs de sitio `web`, `linkedin`, `instagram`, `facebook`.
  - Extraer y renderizar métricas de `presencia_digital` (Google rating, reviews, seguidores en redes, sentimiento).
  - Al ejecutar el enriquecimiento IA (`generateLeadEnrichment`), guardar explícitamente en la base de datos Supabase los campos de redes y la estructura `social_presence`.

### Requisito 2: Sincronización de Equipo del Proyecto a Kanban y Tareas
- Al consultar las tareas de un proyecto en `ProjectDetail.tsx` o `Kanban.tsx`:
  - Cargar los integrantes de `project_team` correspondientes al `project_id`.
  - Usar la lista de integrantes asignados al proyecto como las opciones de asignación de tareas (`assignees`).
  - Al generar el desglose automático de tareas con IA (`generateTaskBreakdown`), pasar la lista de nombres del equipo asignado al proyecto.

### Requisito 3: Edición de Proyecto (Fechas e Información)
- En `EditProjectModal.tsx`:
  - Si cambia la fecha estimada (`due_date`) o el nombre del proyecto, actualizar `projects` y sincronizar los nombres de proyecto en `tasks.project`.

### Requisito 4: Completado de Hitos (Hito Completado -> Tareas Done -> Hito en Curso Activo)
- En `ProjectDetail.tsx` (al marcar un hito como completado):
  - Actualizar el hito en `projects.project_analysis.milestones` con `completed: true` y `real_date: hoy`.
  - Buscar las tareas asociadas al hito completado y marcarlas como `status: 'done'` y `actual_hours: hours`.
  - Identificar el siguiente hito no completado ("Hito en Curso") y activar sus tareas a `status: 'todo'` o `'in_progress'`.

### Requisito 5: Tarjeta de Cobros por Avances y Creación Manual de Tareas vía Modal (Múltiples Responsables)
- En `ProjectDetail.tsx`:
  - **Cobros por Avances:** La tarjeta debe mostrar únicamente la suma total cobrada al momento (hitos con `billing_confirmed: true` o registros de ingresos cobrados en `finances`), eliminando la comparación relativa "de $X USD" para que sea un indicador directo del flujo ingresado.
  - **Creación y Asignación Múltiple de Tareas:** En la sección "Tareas del Proyecto" y su modal emergente (`taskManualModal`), permitir seleccionar **múltiples responsables por tarea** (`ProjectMultiAssigneeSelector`), de forma que tareas compartidas puedan asignarse simultáneamente a Natalia Salerti, Fernando Miceli, Pedro Sequeira o freelancers, mostrando los avatares de todos los asignados.

---

## 4. Herramientas y Librerías
- **React / TypeScript:** Componentes `ClientDetail.tsx`, `LeadDetail.tsx`, `ProjectDetail.tsx`, `Kanban.tsx`.
- **Supabase SDK:** Consultas y updates en `clients`, `leads_cuentas`, `projects`, `tasks`, `project_team`.
- **Gemini IA:** `generateLeadEnrichment`, `generateTaskBreakdown`.

---

## 5. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 09/08 | Redes vacías en Ficha 360 | Los resultados del agente IA de redes no se persistían en `clients` ni se visualizaban en la UI | Implementar guardado de `web`, `linkedin`, `instagram`, `facebook` y renderizado de `presencia_digital` en `ClientDetail` y `LeadDetail`. |
| 09/08 | Tareas Kanban desconectadas de equipo | El modal de tareas usaba la lista global de `team` en lugar del `project_team` asignado al proyecto | Filtrar asignados en tareas por los miembros vinculados en `project_team`. |
| 09/08 | Hito completado no cerraba tareas | La marca de hito solo cambiaba el JSON de hitos sin mutar el estado de las tareas | Implementar cascada automática: Hito completado -> Tareas vinculadas a `done` -> Hito en curso activado. |
| 09/08 | Muestra de presupuesto en Cobros | La tarjeta de cobros mostraba la fracción "de $X USD" | Ajustado para mostrar únicamente el valor monetario cobrado al momento. |
| 09/08 | Falta de creación manual de tareas en vista de proyecto | No había botón directo para abrir la ventana emergente modal de tarea manual en el proyecto | Agregado el botón `+ Nueva Tarea Manual` en el encabezado de "Tareas del Proyecto". |
| 09/08 | Tarea con responsable único | La selección de responsable en la modal manual usaba un `<select>` simple que solo permitía 1 persona | Creado `ProjectMultiAssigneeSelector` para permitir seleccionar múltiples responsables simultáneos. |

---

## 6. Checklist de Pre-Ejecución
- [x] Analizar `ClientDetail.tsx`, `LeadDetail.tsx`, `ProjectDetail.tsx`, `Kanban.tsx`, `EditProjectModal.tsx`.
- [x] Verificar tablas de Supabase (`clients`, `leads_cuentas`, `projects`, `tasks`, `project_team`).
