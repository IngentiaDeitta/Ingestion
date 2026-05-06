# DIRECTIVA: BRANDING_UPDATE_SOP

**ID:** 2026-04-29-001
**Script Asociado:** `scripts/update_branding_logo.py`
**Última Actualización:** 2026-04-29
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
*Reemplazar el branding textual actual por un logo de imagen específico.*
- **Objetivo Principal:** Sustituir el texto "Ingentia Management" y su icono actual por la imagen `Recursos/Logo Blanco_T.png`.
- **Criterio de Éxito:** El archivo `src/components/Sidebar.tsx` contiene la etiqueta `<img>` con la ruta correcta, altura de ~84px (ajustado para compensar el gran espacio en blanco del archivo original) y está perfectamente centrado en su sección h-24.

---

## 2. Especificaciones de Entrada/Salida (I/O)
... (omitted) ...

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Espacio en blanco en imagen:** El archivo `Logo Blanco_T.png` tiene márgenes transparentes internos significativos (534px de alto total, pero el logo es pequeño). Se requiere una altura de clase CSS mayor (ej. 56px-64px) para que el logo se vea de ~30px reales.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 29/04 | N/A | Tarea inicial | Implementado reemplazo en Sidebar.tsx. Se movió el logo a `public/Recursos` para asegurar su disponibilidad en Vite. Se usó `justify-center` y altura de 22px. |
| 29/04 | Logo pequeño | El usuario solicitó agrandarlo | Se incrementó la altura del logo a 32px y el contenedor a h-24 para mejor balance visual. |
| 29/04 | Tamaño no percibido | El archivo PNG tiene mucho whitespace lateral y superior | Se incrementó la altura a 56px para compensar el margen interno del archivo. |
| 29/04 | Ajuste final | El usuario solicitó fijar en 58px | Se ajustó a 58px y se realizó deploy forzado a producción. |
| 06/05 | Logo ligeramente pequeño | El usuario solicitó agrandarlo 2px más | Se incrementó la altura a 60px y se verificó el centrado en el contenedor h-24. |
| 06/05 | Logo aún pequeño | El usuario solicitó agrandarlo 4px más | Se incrementó la altura a 64px. |
| 06/05 | Cambio no percibido | El usuario no nota el cambio | Se incrementó agresivamente a 84px para compensar el whitespace del PNG. |

---

## 7. Ejemplos de Uso

```bash
python scripts/update_branding_logo.py
```

---

## 8. Checklist de Pre-Ejecución
- [x] Verificar existencia de `src/components/Sidebar.tsx`.
- [x] Verificar existencia de `Recursos/Logo Blanco_T.png`.

---

## 9. Checklist Post-Ejecución
- [ ] Verificar cambios en el código.
- [ ] Validar visualmente si es posible (vía screenshot si se tiene acceso).
