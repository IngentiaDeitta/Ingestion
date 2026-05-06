# SOP: Buscador Global en Header

## Objetivo
Implementar una funcionalidad de búsqueda reactiva en el Header que permita a los usuarios encontrar rápidamente proyectos, clientes y transacciones financieras (facturas) desde cualquier parte de la aplicación.

## Entradas
- Input de texto en `src/components/Header.tsx`.
- Datos de las tablas `projects`, `clients` y `finances` de Supabase.

## Lógica de Búsqueda
1. **Estado Local:** Mantener un estado `searchQuery` en el componente Header.
2. **Debouncing (Recomendado):** Para evitar llamadas excesivas a la base de datos, se debe esperar 300ms después de que el usuario deje de escribir.
3. **Consultas a Supabase:**
   - Buscar en `projects` por el campo `name`.
   - Buscar en `clients` por el campo `name`.
   - Buscar en `finances` por el campo `description` o `id` (si aplica).
4. **Resultados:**
   - Mostrar un menú desplegable (dropdown) posicionado debajo del input de búsqueda.
   - Categorizar los resultados por tipo (Proyecto, Cliente, Factura).
   - Limitar los resultados a los 5 más relevantes por categoría.

## UX y Navegación
- **Cierre del Buscador:** El menú debe cerrarse si el usuario hace clic fuera de él, presiona `Escape` o borra el texto de búsqueda.
- **Selección:** Al hacer clic en un resultado, navegar a la ruta correspondiente:
  - Proyectos: `/projects` (o detalle si existe).
  - Clientes: `/clients` (o detalle si existe).
  - Facturas: `/finance`.
- **Estados de Carga:** Mostrar un indicador visual mientras se realiza la búsqueda.

## Restricciones y Casos Borde
- **Búsqueda Vacía:** No realizar consultas si el query tiene menos de 2 caracteres.
- **Sin Resultados:** Mostrar un mensaje amigable indicando que no se encontraron coincidencias.
- **Seguridad:** Asegurar que el componente `Header` maneje correctamente los errores de red o permisos de Supabase.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 06/05 | Buscador inactivo | El buscador en el Header era solo UI (estático) | Se implementó lógica con Supabase (ilike), debouncing de 300ms y dropdown de resultados. |
| 06/05 | Dropdown persistente | No se cerraba al hacer clic fuera | Se añadió `useRef` y listener de `mousedown`. |
| 06/05 | Accesibilidad | No se cerraba con teclado | Se añadió listener para la tecla `Escape`. |
