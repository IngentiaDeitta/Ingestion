# DIRECTIVA: DASHBOARD_REDESIGN_SOP

**ID:** 2026-08-09-002
**Script Asociado:** `scripts/apply_dashboard_redesign.py`
**Última Actualización:** 2026-08-09
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance

- **Objetivo Principal:** Rediseñar el Dashboard de la aplicación Ingestion para transformar el Funnel Comercial a un formato vertical clásico con distintas tonalidades y escalas adecuadas, reorganizar la disposición de las tarjetas en la pantalla de forma armónica y hacer interactiva cada tarjeta permitiendo la navegación directa a las secciones origen (`/finance`, `/projects`, `/leads`, `/propuestas`, `/kanban`).
- **Criterio de Éxito:**
  1. El Funnel Comercial es vertical, con forma cónica/trapezoidal escalada, colores diferenciados por estadío y etiquetas claras de conversión.
  2. Todas las tarjetas (Finanzas ARS/USD, Proyectos Activos/En Riesgo, Estadíos del Funnel) son interactivas, con cursores `pointer`, efectos hover y navegación mediante `useNavigate`.
  3. El layout de tarjetas está reorganizado eficientemente en la pantalla sin desbordamientos ni espacios desperdiciados.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)

- `src/pages/Dashboard.tsx`: Componente React de Dashboard.
- `useNavigate` de `react-router-dom`: Para ruteo interactivo.
- Métricas de la base de datos de Supabase (`leads_cuentas`, `quotes`, `finances`, `projects`).

### Salidas (Outputs)

- `src/pages/Dashboard.tsx` actualizado con el nuevo diseño visual, el funnel vertical y la interactividad completa en todas las tarjetas.

---

## 3. Flujo Lógico (Algoritmo)

### Paso 1: Rediseño del Funnel Comercial Vertical

- Organizar los 4 estadíos de forma vertical (de arriba hacia abajo):
  1. **Leads Totales**: Ancho máximo (100%), tonalidad azul oscuro/índigo (`from-slate-900 to-indigo-950` o gradiente elegante).
  2. **Leads Calificados**: Ancho 82%, tonalidad azul cobalto (`from-blue-600 to-indigo-700`) + badge % de conversión desde Leads Totales.
  3. **Pptos. Enviados**: Ancho 64%, tonalidad azul turquesa/teal (`from-cyan-600 to-teal-700`).
  4. **Pptos. Aceptados**: Ancho 46%, tonalidad verde esmeralda (`from-emerald-500 to-teal-600`) + badge % de conversión desde Pptos. Enviados.
- Aplicar formas trapezoidales o de embudo vertical mediante anchos decrecientes centrados o `clip-path` cónico, bordes redondeados y microinteracciones hover (`hover:scale-[1.02]`).

### Paso 2: Hacer Interactivas Todas las Tarjetas

- **Tarjetas de Finanzas (ARS y USD)**:
  - Añadir `onClick={() => navigate('/finance')}`
  - Añadir cursor pointer, animación de escala en hover y un icono sutil de redirección (`ArrowUpRight` o `ChevronRight`).
- **Tarjetas de Estado de Proyectos (Activos y En Riesgo)**:
  - Añadir `onClick={() => navigate('/projects')}`
  - Añadir cursor pointer, animación hover e icono de redirección.
- **Estadíos del Funnel**:
  - Leads Totales / Calificados -> `onClick={() => navigate('/leads')}`
  - Pptos. Enviados / Aceptados -> `onClick={() => navigate('/propuestas')}`
- **Tarjeta de Agenda y Tareas**:
  - Tareas en el listado -> `onClick={() => navigate('/kanban')}`

### Paso 3: Reorganización del Layout

- Estructurar el grid responsive:
  - **Fila Principal / Columna Izquierda (lg:col-span-8 o 7)**:
    - Sección de Finanzas (2 tarjetas en grid `grid-cols-1 md:grid-cols-2`).
    - Sección de Proyectos (2 tarjetas en grid `grid-cols-1 md:grid-cols-2`).
  - **Columna Central / Embudo (lg:col-span-5 o 4)**:
    - Tarjeta contenedora de Funnel Comercial Vertical de alto completo.
  - **Columna Derecha / Agenda (lg:col-span-4 o 5)**:
    - Tarjeta de Agenda y Tareas.

---

## 4. Herramientas y Librerías

- **React / Tailwind CSS**: Clases utilitarias de flexbox, grid, gradientes, sombras y transformaciones.
- **Lucide React Icons**: `ArrowUpRight`, `ChevronRight`, `DollarSign`, `Target`, `Briefcase`, `Calendar`, etc.
- **Python**: Script `scripts/apply_dashboard_redesign.py`.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas

- En pantallas pequeñas (móvil), el grid debe colapsar limpiamente a 1 sola columna.
- Los textos dentro de los bloques reducidos del funnel (como Pptos. Aceptados al 46% de ancho) deben ser legibles y bien alineados sin desbordar.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
| ------- | ---------------- | ------------ | -------------------------- |
| 09/08 | Funnel horizontal poco legible | Los trapezoides horizontales ajustaban mal en pantallas angostas | Transformar a Funnel Vertical apilado con anchos decrecientes (100%, 88%, 74%, 60%) y tonalidades gradiente distintivas por estadío. |
| 09/08 | Tarjetas estáticas sin navegación | Las tarjetas no permitían trazabilidad | Implementar `onClick={() => navigate(...)}` con efectos hover en todas las tarjetas de Finanzas, Proyectos, Funnel y Kanban. |

---

## 7. Checklist de Pre-Ejecución

- [x] Inspeccionar `src/pages/Dashboard.tsx`.
- [x] Verificar rutas activas (`/finance`, `/projects`, `/leads`, `/propuestas`, `/kanban`).
