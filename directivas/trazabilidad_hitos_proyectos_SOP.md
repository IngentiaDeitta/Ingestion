# DIRECTIVA: trazabilidad_hitos_proyectos_SOP

**ID:** 20260630_trazabilidad_hitos
**Script Asociado:** `scripts/test_pdf_milestones.py`
**Última Actualización:** 2026-06-30
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
Esta tarea tiene como objetivo implementar la trazabilidad de los proyectos en la aplicación IngentIA, dividida en dos tipos de hitos: hitos entregables (delivery) e hitos de facturación o cobro (billing).
- **Objetivo Principal:** Permitir al usuario cargar un PDF de planificación/cronograma o propuesta comercial, extraer automáticamente los hitos con sus fechas y montos estimados usando Gemini, visualizarlos como un plan interactivo en el detalle del proyecto, permitir al usuario ingresar fechas reales de finalización, calcular automáticamente el progreso del proyecto según los hitos completados, y poder registrar los cobros confirmados en la sección de finanzas.
- **Criterio de Éxito:** 
  1. El usuario puede subir un PDF en el detalle del proyecto.
  2. Gemini extrae correctamente los hitos y los almacena en el campo `project_analysis` (o columna específica) de la tabla `projects`.
  3. El usuario puede ver, editar, añadir, eliminar y marcar como completado cada hito, ingresando la fecha real.
  4. El progreso general del proyecto se calcula automáticamente: `(hitos_completados / hitos_totales) * 100`.
  5. Al confirmar un cobro de un hito, se crea un registro correspondiente en la tabla `finances` como ingreso.

---

## 2. Especificaciones de Entrada/Salida (I/O)

### Entradas (Inputs)
- **Archivos Fuente (PDF):**
  - `Plan de Trabajo Detallado.pdf` y `Cronograma CRM EK v2.pdf` (como modelos para pruebas).
- **Variables de Entorno (.env):**
  - `VITE_SUPABASE_URL`: Endpoint de Supabase.
  - `VITE_SUPABASE_ANON_KEY`: API Key pública de Supabase.
  - `VITE_GEMINI_API_KEY`: API Key de Gemini para el frontend y backend de pruebas.

### Salidas (Outputs)
- **Estructura de Datos de Hitos (JSON):**
  Guardados en el campo `milestones` dentro del objeto `project_analysis` (de tipo `jsonb`) en la tabla `projects`.
  ```json
  [
    {
      "id": "uuid-v4-string",
      "title": "Firma de contrato e Inicio",
      "description": "Firma de contrato y acuerdo de confidencialidad",
      "type": "billing",
      "estimated_date": "2026-05-04",
      "real_date": null,
      "completed": false,
      "amount": 750.0,
      "billing_confirmed": false
    }
  ]
  ```

---

## 3. Flujo Lógico (Algoritmo)

1. **Carga y Lectura del PDF (Frontend):**
   - El usuario selecciona un archivo PDF en la UI.
   - El archivo se convierte a Base64 en el cliente (frontend) usando `FileReader`.
2. **Extracción con Gemini:**
   - Se envía el PDF codificado en base64 como `inlineData` junto con el prompt a la API de Gemini.
   - Gemini procesa el PDF (extrayendo textos y tablas del cronograma y de cobros) y responde con un JSON de hitos.
3. **Persistencia de los Hitos:**
   - Se actualiza la columna `project_analysis` en la tabla `projects` con los nuevos hitos cargados.
4. **Visualización y Edición en UI:**
   - Listar los hitos en una sección llamada "Plan de Hitos y Facturación".
   - Permitir al usuario editarlos, borrarlos o agregar nuevos de forma manual.
   - Permitir marcar un hito de entregable como Completado e ingresar la `real_date`.
   - Permitir confirmar el cobro para hitos de facturación (`billing` o `both`). Al confirmarlo, se inserta una transacción en la tabla `finances` con tipo `income`, estado `Paid` y el monto correspondiente del hito.
5. **Cálculo del Progreso:**
   - Cada vez que se actualiza un hito (completado/desmarcado), se recalcula el progreso: `Math.round((completados / total) * 100)` y se actualiza `progress` en la tabla `projects`.

---

## 4. Herramientas y Librerías
- **Librerías Python (Pruebas):** `google-genai`, `supabase`, `python-dotenv`, `pypdf` (para parsear PDFs en el script de prueba).
- **APIs Externas:** Gemini API (`gemini-2.5-flash` o `gemini-1.5-flash`).

---

## 5. Restricciones y Casos Borde (Edge Cases)
- **Fechas Estimadas:** Si el PDF solo menciona "Semana 1", "Semana 2", estimar fechas partiendo del día de hoy o de la fecha de creación del proyecto.
- **Montos Vacíos:** Si no se especifica el monto del cobro en el PDF, se deja en `null` o se permite ingresar manualmente en la UI.
- **Sin Hitos:** Si el proyecto no tiene hitos cargados, mostrar un estado vacío (empty state) con la opción de cargarlos por PDF o agregarlos manualmente.
- **Sincronización de Avance:** Si se recalculan los hitos, se debe actualizar la columna `progress` de la tabla `projects` para que se refleje en el Kanban y Dashboard.

---

## 6. Historial de Aprendizaje
*No se han detectado errores todavía.*

---

## 7. Ejemplos de Uso
El script de prueba en Python permite simular la extracción del PDF local:
```bash
python scripts/test_pdf_milestones.py --pdf "Recursos/Plan de Trabajo Detallado.pdf"
```
