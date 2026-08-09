# DIRECTIVA: HOMOGENEIZACION_ESCALAS_APP_SOP

**ID:** 2026-08-09-004
**Script Asociado:** `scripts/homogenize_app_scales.py`
**Última Actualización:** 2026-08-09
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance

- **Objetivo Principal:** Unificar y estandarizar la escala tipográfica y el tamaño de títulos, subtítulos, tarjetas y elementos en TODAS las secciones y subsecciones de la aplicación (`src/pages/*.tsx`), asegurando que no existan vistas con tipografía sobredimensionada (ej. `Team.tsx`, `Projects.tsx`, `Clients.tsx`, `Settings.tsx`, `TechStack.tsx`, `NewClient.tsx`, `NewProject.tsx`, `NewInvoice.tsx`, `ProjectDetail.tsx`).
- **Criterio de Éxito:**
  1. Todos los títulos principales de vista (Page Headers) utilizan el estándar homogéneo: `text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A]`.
  2. Todos los subtítulos de cabecera usan `text-xs text-[#666666]`.
  3. Los títulos de sección y tarjetas secundarias (`h4`/`h3`) usan `text-base` / `text-sm font-semibold`.
  4. Los paddings y bordes de las tarjetas de contenedores se estandarizan a `p-4` / `p-5` y `rounded-2xl` / `rounded-xl`.
  5. Ninguna página o subpágina conserva fuentes desproporcionadas (`text-4xl`, `text-[42px]`, `rounded-[32px]`).

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)

- Todos los componentes de vista en `src/pages/*.tsx`:
  - `Team.tsx`
  - `Projects.tsx`
  - `Clients.tsx`
  - `Settings.tsx`
  - `TechStack.tsx`
  - `NewClient.tsx`
  - `NewProject.tsx`
  - `NewInvoice.tsx`
  - `ProjectDetail.tsx`
  - `Kanban.tsx`
  - `Leads.tsx`
  - `Finance.tsx`
  - `Propuestas.tsx`
  - `Radiografia.tsx`
  - `SmartQuoter.tsx`
  - `SolutionArchitect.tsx`

### Salidas (Outputs)

- Archivos `.tsx` en `src/pages/` actualizados con la jerarquía visual y escala estandarizadas.

---

## 3. Flujo Lógico (Algoritmo)

1. Escanear y mapear cada archivo `.tsx` en `src/pages/`.
2. Para cada archivo, aplicar el reemplazo de patrones de tamaño desproporcionado:
   - `text-4xl md:text-[42px]` -> `text-2xl md:text-3xl font-semibold`
   - `text-[42px]` -> `text-2xl md:text-3xl font-semibold`
   - `text-3xl md:text-[42px]` -> `text-2xl md:text-3xl font-semibold`
   - `text-4xl font-extrabold` / `text-4xl font-semibold` / `text-4xl font-light` en títulos de vista -> `text-2xl md:text-3xl font-semibold`
   - `text-2xl md:text-[32px]` -> `text-2xl md:text-3xl font-semibold`
   - Subtítulos de cabecera `text-sm text-[#666666]` -> `text-xs text-[#666666]`
   - Ajustar paddings excesivos `rounded-[32px]`, `p-8`, `p-6` a `rounded-2xl` y `p-4`/`p-5`.
3. Ejecutar verificación de tipos TypeScript (`npx tsc --noEmit`).

---

## 4. Herramientas y Librerías

- **Python**: Script `scripts/homogenize_app_scales.py`.

---

## 5. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
| ------- | ---------------- | ------------ | -------------------------- |
| 09/08 | Inconsistencia de fuentes entre páginas (ej: Equipo, Proyectos, Clientes con `text-[42px]`) | Diseños heredados con clases de tamaño no estandarizadas | Aplicar script de homogeneización a todas las vistas en `src/pages/*.tsx`. |
