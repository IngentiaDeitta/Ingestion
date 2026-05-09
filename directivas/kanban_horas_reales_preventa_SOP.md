# SOP: Horas Reales, Progreso Automático y Estado "Preventa"

## Objetivo
1. Permitir cargar **horas reales incurridas** en las tareas del Kanban.
2. Renombrar el estado **"Pendiente"** → **"Preventa"** en toda la plataforma.
3. Automatizar el cálculo de **progreso de proyectos** basado en el avance de tareas.
4. Visualizar métricas de horas en el **Dashboard**.
5. Calcular **saldos de socios en ARS** (Saldo = Retiros - Gastos).

---

## Cambio 1: Horas Reales en Kanban

### Archivos afectados
- `src/pages/Kanban.tsx`

### Lógica
- Mostrar badge compacto con `Xh est. / Yh real`.
- Campo `Horas Reales` editable en `TaskDetailModal`, solo visible si `est > 0`.
- Lógica `onDragEnd`: no sobrescribir `actual_hours` si ya existen.

---

## Cambio 2: "Pendiente" → "Preventa"

### Archivos afectados
- `src/pages/Projects.tsx`, `src/pages/ProjectDetail.tsx`, `src/pages/NewProject.tsx`, `src/components/EditProjectModal.tsx`.

### Lógica
- Reemplazar `'Pendiente'` → `'Preventa'`.
- Badge índigo: `bg-indigo-500/10 text-indigo-700 border-indigo-500/20`.

---

## Cambio 3: Automatización del Progreso de Proyectos

### Archivos afectados
- `src/pages/Kanban.tsx` (en actualizaciones de tareas)
- `src/pages/ProjectDetail.tsx` (al editar tareas o cargar horas)

### Lógica de Cálculo
El progreso de un proyecto es el promedio del avance de todas sus tareas:
- **Tarea 'done'**: 100% de avance.
- **Tarea abierta**: `% avance = min(100, (actual_hours / estimated_hours) * 100)`.
- **Fórmula**: `Project % = (Suma % tareas) / (Total tareas)`.
- Si un proyecto no tiene tareas, el progreso se mantiene manual o en 0%.

---

## Cambio 4: Dashboard de Horas y Productividad

### Archivos afectados
- `src/pages/Dashboard.tsx`

### Requerimientos
- Gráfico o métrica que compare **Horas Totales Estimadas** vs. **Horas Totales Reales**.
- Visualización del "Gap" de productividad global y por proyecto.

---

## Cambio 5: Saldos de Socios en ARS

### Archivos afectados
- `src/pages/Finance.tsx`

### Lógica
- **Fórmula**: `Saldo = Total Retiros - Total Gastos`.
- **Moneda**: Presentar en **ARS**.
- **Conversión**: Multiplicar USD por la tasa de cambio vigente (ej. 1100 ARS/USD).
- Actualizar cards de socios en el Dashboard Financiero.
