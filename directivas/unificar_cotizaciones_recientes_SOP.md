# DIRECTIVA: UNIFICAR_COTIZACIONES_RECIENTES_SOP

**ID:** 2026-08-04-UNIFY-QUOTES
**Script Asociado:** None (Frontend UI changes in React Components)
**Última Actualización:** 2026-08-04
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
- **Objetivo Principal:** Garantizar que en el historial de interacciones con el Lead (y fichas asociadas) cada negocio/oportunidad se muestre **una sola vez en su último estadio**.
  - Si una cotización derivó en un Proyecto (existe en la lista de proyectos asociados), el **último estadio** es `PROYECTO`. Se debe mostrar únicamente la tarjeta de Proyecto.
  - Si la cotización no derivó en proyecto (ej. Generada, Enviada, Rechazada), el **último estadio** es `COTIZACIÓN`. Se debe mostrar la versión más reciente de la cotización.
- **Criterio de Éxito:** El historial no muestra duplicidades compuestas por la tarjeta de Cotización Aceptada y la tarjeta del Proyecto Ganado resultante.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- Cotizaciones (`quotes`) de la base de datos Supabase para el `lead_id`.
- Proyectos (`projects`) de la base de datos Supabase para la empresa del lead.

### Salidas (Outputs)
- Array de historial `Interaccion[]` filtrado donde cada oportunidad/deal aparece una sola vez en su estado/estadio más avanzado.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Carga de Cotizaciones y Proyectos
- Consultar `quotes` ordenadas por `generation_date` DESC.
- Consultar `projects` ordenados por `created_at` DESC.

### Paso 2: De-duplicación por Estadio (Cotización vs Proyecto)
1. Para cada cotización `q`:
   - Verificar si ya derivó en un proyecto existente (`q.project_id` coincide con algún `p.id` de la lista de proyectos, o coincidencia equivalente).
   - **SI derivó en proyecto:** Omitir la cotización, ya que el proyecto representa el estadio superior/final de esa interacción.
   - **NO derivó en proyecto:** Mantener solo la versión más reciente por título.
2. Agregar todos los proyectos a la lista final de interacciones.
3. Ordenar la lista resultante por fecha descendente.

---

## 4. Herramientas y Librerías
- **Frontend Framework:** React, TypeScript.
- **Base de Datos:** Supabase JS SDK.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Regla del Último Estadio:** Si una cotización tiene `status === 'Aceptada'` o está vinculada a un `project_id`, su estadio vigente pasa a ser el del Proyecto resultante. Omitir la tarjeta duplicada de Cotización evita la confusión visual del usuario.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 04/08/2026 | Cotizaciones duplicadas en Historial por actualizaciones de estado | Se insertaban nuevas filas en `quotes` sin actualizar la anterior. | De-duplicar cotizaciones en frontend quedándonos con la más reciente por título. |
| 04/08/2026 | Cotización y Proyecto mostrados simultáneamente para el mismo deal | `cargarHistorial` agregaba la Cotización (Aceptada) Y el Proyecto (Ganado) a la lista de interacciones. | Filtrar las cotizaciones que derivaron en un proyecto existente (`p.id === q.project_id`), mostrando únicamente el Proyecto como su último estadio. |
