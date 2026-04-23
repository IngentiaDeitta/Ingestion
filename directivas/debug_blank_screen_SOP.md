# DIRECTIVA: DEPURACION_PANTALLA_BLANCO_SOP

**ID:** 2026-04-23-002
**Script Asociado:** `scripts/debug_app.py`
**Última Actualización:** 2026-04-23
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
*Identificar y corregir la causa raíz de la pantalla en blanco en el entorno local.*
- **Objetivo Principal:** Que la aplicación renderice al menos la pantalla de login o el dashboard.
- **Criterio de Éxito:** La aplicación muestra contenido visual en `http://localhost:3000`.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Archivos:** `.env`, `src/lib/supabase.ts`, `index.html`.
- **Browser State:** Logs de la consola.

### Salidas (Outputs)
- **Diagnóstico:** Reporte del error exacto (ej: "Uncaught ReferenceError: process is not defined" o "401 Unauthorized").
- **Fix:** Archivo `.env` configurado.

---

## 3. Flujo Lógico (Algoritmo)

1. **Chequeo de Configuración:** Verificar si falta el archivo `.env`.
2. **Inspección de Errores:**
   - Intentar capturar errores de consola vía `browser_subagent`.
   - Revisar si hay errores de red (archivos que no cargan).
3. **Simulación de Credenciales:** Si faltan variables de Supabase, crear un `.env` con placeholders para evitar el crash del cliente.
4. **Validación de Punto de Montaje:** Revisar que `index.html` tenga `<div id="root"></div>`.

---

## 5. Restricciones y Casos Borde (Edge Cases)

### Limitaciones Conocidas
- **Supabase Crash:** Si `createClient` recibe strings vacías, toda la aplicación puede fallar al inicio.
- **Missing Dependencies:** A veces un `npm install` no es suficiente si faltan paquetes opcionales.

---

## 6. Historial de Aprendizaje

| Fecha | Error Detectado | Causa Raíz | Solución/Parche Aplicado |
|-------|----------------|------------|--------------------------|
| 23/04 | Pantalla en Blanco | Falta archivo `.env` (Supabase URL/Key) | Crear `.env` y solicitar credenciales reales |

---

## 10. Notas Adicionales
Se detectaron claves de Gemini en archivos de test, pero no las de Supabase.
