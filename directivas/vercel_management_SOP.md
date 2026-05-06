# DIRECTIVA: VERCEL_MANAGEMENT_SOP

**ID:** 2026-04-28-001
**Script Asociado:** N/A (Uso de `agent-browser` y CLI de Vercel)
**Última Actualización:** 2026-04-28
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
*Consolidar el entorno de producción en Vercel manteniendo un único proyecto activo.*
- **Objetivo Principal:** Eliminar proyectos redundantes y asegurar que el despliegue productivo ocurra en el proyecto correcto.
- **Criterio de Éxito:** Solo existe el proyecto `ingestion` en Vercel y está desplegado con éxito.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Vercel Dashboard:** Acceso a la interfaz web de Vercel.
- **Local Config:** `.vercel/project.json`.

### Salidas (Outputs)
- **Confirmación de Eliminación:** El proyecto `app-ingentia` ya no es visible.
- **Despliegue Exitoso:** URL de producción de `ingestion` activa.

---

## 3. Flujo Lógico (Algoritmo)

1. **Identificación:** Verificar los proyectos existentes en Vercel.
2. **Eliminación:** 
   - Navegar a `Settings` -> `General` -> `Delete Project` del proyecto a eliminar (`app-ingentia`).
   - Confirmar la eliminación.
3. **Relinking (Local):**
   - Actualizar `.vercel/project.json` o usar `vercel link` para apuntar a `ingestion`.
4. **Despliegue:**
   - Ejecutar despliegue en el proyecto `ingestion`.
5. **Verificación:** Comprobar que la URL de `ingestion` refleja los últimos cambios.

---

## 4. Herramientas y Librerías
- **Browser Automation:** `agent-browser`.
- **CLI:** `vercel` (si está disponible).

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Protección de Proyectos:** Vercel requiere escribir el nombre del proyecto para confirmar la eliminación.
- **Variables de Entorno:** Al cambiar de proyecto, asegurar que las variables necesarias (Supabase, etc.) estén en el proyecto destino.

### Errores Comunes y Soluciones
- **Auth Timeout:** El navegador puede requerir re-autenticación si la sesión expira.
- **Linked Project Conflict:** El archivo `.vercel/project.json` local puede causar errores si apunta a un proyecto borrado. Debe borrarse o actualizarse.

---

## 6. Historial de Aprendizaje / Protocolo de Errores y Aprendizajes [Memoria Viva]

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 28/04 | Múltiples proyectos vinculados | Despliegues previos crearon proyectos duplicados | Proceder con eliminación manual vía UI y relinking local. |

---

## 7. Checklist de Pre-Ejecución
- [x] Identificar nombre del proyecto a borrar: `app-ingentia`.
- [x] Identificar nombre del proyecto a mantener: `ingestion`.
- [x] Verificar que `ingestion` tiene la configuración de dominio deseada.
