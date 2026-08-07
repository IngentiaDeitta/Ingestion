# DIRECTIVA: cronograma_y_kanban_tareas_SOP

**ID:** 20260805_cronograma_kanban_tareas
**Última Actualización:** 2026-08-06
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta directiva establece las reglas para la visualización del cronograma de proyectos y la gestión de tareas en el tablero Kanban dentro de IngentIA.

- **Objetivo 1 (Cronograma Responsivo Compacto):** Ajustar el cronograma visual (`CronogramaProyecto.tsx`) al 100% del ancho de la pantalla (`w-full`) sin scroll horizontal, con tarjetas e indicadores reducidos en escala (tarjetas de ~100px, filas escalonadas de ~60px) para maximizar la visibilidad de información.
- **Objetivo 2 (Drag & Drop Fluido y Multicriterio):** Garantizar un Drag & Drop perfecto en `ProjectDetail.tsx` y `Kanban.tsx`. Al arrastrar tarjetas entre columnas, la actualización responde según el tipo de agrupación activa:
  - Agrupación por Estado (`status`): actualiza `status` a `todo`, `in-progress`, `done`.
  - Agrupación por Prioridad (`priority`): actualiza `priority` a `Alta`, `Media`, `Baja`.
  - Agrupación por Fase (`phase`): actualiza `phase` a la fase correspondiente.
  Se aplica actualización optimista en el estado local antes de persistir en Supabase.
- **Objetivo 3 (Sincronización Kanban <-> Hitos):** El cambio de estado de tareas en Kanban evalúa y actualiza inmediatamente la apertura o cierre de los hitos asociados (`completed: true/false`).
- **Objetivo 4 (Kanban Responsivo y Proporciones Compactas):** El tablero Kanban en `ProjectDetail.tsx` utiliza `w-full` y columnas flexibles (`flex-1 min-w-[220px]`). Todas las tarjetas, modales, tipografías y padding se reducen de forma armónica para mostrar más contenido en pantalla sin sobrecargar la vista.

---

## 2. Especificaciones de Entradas y Salidas

### Entradas
- **Hitos de Proyecto (`milestones` / `project_analysis`):** Lista de hitos comprometidos con `id`, `estimated_date`, `title`, `amount`, `completed`, `real_date`.
- **Tareas (`tasks`):** Registros en Supabase vinculados a un proyecto `project`, con campos `status`, `phase`, `priority`, `hours`, `due_date`, `assignees`, `description`, y etiquetas `tags`.

### Salidas
- **Cronograma Responsivo 100% Ancho:** Escala compacta e inset de 6% a 94% sin scroll horizontal.
- **Kanban Integrado con DnD Robusto:** Arrastre de tarjetas 100% funcional y fluido sin errores visuales ni colisiones de ID.
- **UI Compacta e Información Densa:** Densidad de información mejorada con padding reducido (~25-30% más espacio útil).

---

## 3. Flujo Lógico y Reglas de Negocio

1. **Gestión de Drag and Drop Multicriterio (`handleTaskDragEnd`):**
   - Extraer `destination.droppableId` e identificar el modo de agrupación (`status`, `priority` o `phase`).
   - Aplicar cambios en el estado local de manera optimista para feedback instantáneo al usuario.
   - Enviar actualización a Supabase (`tasks`).
   - Disparar `syncTasksWithMilestones` para auto-completar o reabrir hitos afectados.

2. **Diseño Compacto y Densidad Visual:**
   - Reducir paddings generales (`p-8` -> `p-5`, `p-5` -> `p-3.5`).
   - Ajustar tipografías de encabezados y títulos (`text-3xl` -> `text-2xl`, `text-sm` -> `text-xs`).
   - Reducir dimensiones de tarjetas de hitos y altura de líneas escalonadas para optimizar espacio vertical y horizontal.

---

## 4. Herramientas y Componentes Afectados
- `src/components/CronogramaProyecto.tsx`: Proporciones compactas y escalonamiento de 60px.
- `src/pages/ProjectDetail.tsx`: DnD multicriterio, layout 100% ancho y densidad compacta.
- `src/pages/Kanban.tsx`: Escala de fuentes y paddings compactos.

---

## 5. Historial de Aprendizaje
- *2026-08-06:* Corregido el Drag & Drop para soportar agrupación por estado, prioridad y fase. Reducida la escala general de tarjetas y tipografías para aumentar la densidad de información en pantalla.
