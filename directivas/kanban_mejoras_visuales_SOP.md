# SOP: Kanban Mejoras Visuales, Agrupación por Proyecto, Filtros y Dependencias de Tareas

## Objetivo
1. Permitir asignar y editar colores personalizados para cada Proyecto (almacenados discretamente en el campo `description` mediante el formato `[color:nombre_color]`).
2. Colorear visualmente las tarjetas de tareas en el Tablero Kanban usando bordes y badges de proyectos premium con un estilo limpio y armonioso.
3. Permitir agrupar las tareas del Kanban por Estado o por Proyecto/Color mediante una vista interactiva de columnas dinámicas.
4. Agregar un selector para filtrar el tablero de forma dinámica por un proyecto específico.
5. Permitir seleccionar dependencias de tareas (Bloqueado por) utilizando el campo `tags` nativo codificado como `dep:task_id`, mostrando badges visuales de bloqueo si las tareas prerrequisito no están completadas.

---

## Cambio 1: Colores de Proyecto y Visualización de Tarjetas

### Archivos Afectados
- `src/pages/NewProject.tsx`
- `src/components/EditProjectModal.tsx`
- `src/pages/Kanban.tsx`

### Lógica
- **Almacenamiento**: Dado que no contamos con una columna `color` física en la base de datos remota, utilizaremos la estructura de etiquetas internas en el campo `description`.
  - Cuando se crea o edita un proyecto, se puede elegir un color de una paleta curada (`indigo`, `emerald`, `rose`, `amber`, `sky`, `violet`, `orange`, `pink`).
  - Al persistir, agregamos `\n\n[color:color_name]` al final de la descripción.
  - Al leer la descripción del proyecto en el cliente, la parseamos y removemos el marcador de color para no ensuciar la visualización del texto.
- **Renderizado de Tarjetas**:
  - En Kanban.tsx, recuperamos los proyectos y mapeamos cada nombre de proyecto a su color correspondiente.
  - Si un proyecto no tiene color explícito, se asigna uno por defecto basado en un hash del nombre del proyecto.
  - Las tarjetas en Kanban muestran un borde lateral de color (`border-l-4 border-l-[color]`) y un badge estilizado con el nombre del proyecto en ese tono.

---

## Cambio 2: Agrupación y Filtros Dinámicos

### Archivos Afectados
- `src/pages/Kanban.tsx`

### Lógica
- **Filtro de Proyecto**:
  - Selector desplegable al lado de la barra de título para filtrar las tareas por proyecto (Todos, General, y cada proyecto recuperado de la base de datos).
- **Agrupación por Color/Proyecto**:
  - Toggle o control de vista interactivo para elegir entre **"Agrupar por: Estado"** y **"Agrupar por: Proyecto"**.
  - Si se agrupa por **Estado**, las columnas son las tradicionales.
  - **Agrupación automática por Color dentro de cada Estado**: Cuando se agrupa por **Estado**, las tareas dentro de cada columna se agrupan y ordenan automáticamente por su proyecto/color para que las del mismo color queden juntas y legibles de forma secuencial.
  - Si se agrupa por **Proyecto**, las columnas son dinámicamente los proyectos que tienen tareas (o todos los proyectos). Dentro de cada columna, las tarjetas muestran su estado actual mediante badges llamativos y elegantes.
  - **Manejo de Drag-and-Drop**:
    - En la vista de **Estado**, mover una tarea entre columnas cambia su estado. Dado que el orden interno dentro del estado es automático por color/proyecto, los movimientos dentro de la misma columna se omiten para evitar discordancia en los índices del DnD, y los movimientos entre columnas calculan una posición al final de la columna de destino antes del reordenamiento automático.
    - En la vista de **Proyecto**, mover una tarea de columna cambia su proyecto asociado.

---

## Cambio 3: Dependencias de Tareas (Bloqueado por / Bloquea a)

### Archivos Afectados
- `src/pages/Kanban.tsx`

### Lógica
- **Almacenamiento de Dependencias**:
  - Se utiliza el campo `tags` (tipo `text[]` en Postgres/Supabase).
  - Las dependencias se guardan con el formato `dep:id_de_tarea`.
  - En el cliente, filtramos los tags regulares para no mezclar las dependencias con otras etiquetas tradicionales.
- **Detalle de Tarea (TaskDetailModal)**:
  - Añadir sección **"Bloqueado por (Dependencias)"** con un selector múltiple de tareas.
  - Mostrar la lista de tareas bloqueadoras con su título, estado e indicador visual.
  - Permitir hacer clic en cualquiera de las tareas dependientes para abrir su modal directamente.
- **Visualización Avanzada en Tarjeta (Bi-direccional)**:
  - **Relación "Bloqueado Por"**: Si la tarea tiene dependencias que no están completadas (estado diferente a `done`), se muestra una sección visible y premium en color rojo/rosa: `🔒 Bloqueado por:` seguido de badges individuales con los títulos reales de las tareas que la bloquean.
  - **Relación "Bloquea A"**: Si la tarea es prerrequisito (dependencia) de otra(s) tarea(s) que no están completadas, se muestra una sección visible y premium en color violeta: `🔗 Bloquea a:` seguido de badges individuales con los títulos reales de las tareas que dependen de ella. Esto ayuda a identificar de un vistazo las tareas críticas y cuellos de botella del proyecto.

---

## Cambio 4: Despliegue en Producción

### Lógica
- Una vez verificados los cambios en localhost mediante pruebas de integración, linting y construcción exitosa:
  - Ejecutar el comando de producción del proyecto (usualmente `vercel` o similar configurado en el ecosistema Vercel del cliente) según las directivas correspondientes.

---

## Checklist de Calidad y Estética
- [ ] La paleta de colores utiliza tonos HSL coordinados y armoniosos en modo claro/oscuro.
- [ ] Las tarjetas en el tablero de estado se agrupan automáticamente por proyecto/color manteniendo la funcionalidad de cambio de estado mediante drag-and-drop.
- [ ] Se muestran badges explícitos con los nombres de las tareas para relaciones "Bloqueado por" y "Bloquea a" en la tarjeta.
- [ ] Las dependencias se guardan y leen correctamente del array `tags` de Supabase sin romper la compatibilidad.
- [ ] El build e integración pasa sin ningún tipo de error de TypeScript o Linter.
- [ ] La aplicación se despliega correctamente a producción en la nube.

