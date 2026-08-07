# Directiva: Radiografía Operativa y Smart Quoter (Proceso Comercial)

## Objetivo
Definir la arquitectura y el flujo determinista del proceso comercial de IngentIA: desde el descubrimiento del prospecto en **Leads** (Radiografía Operativa) hasta la cotización inteligente (Smart Quoter) y propuesta.

## Flujo de Trabajo

### Fase 1: Radiografía Operativa & Pre-Call Brief (`LeadDetail.tsx`)
- **Entradas:** Transcripción de videollamada / notas de la reunión de descubrimiento (texto libre).
- **Procesamiento:** Agente de Diagnóstico (A6) cuantifica la Deuda Operativa / Dolor Estimado en USD/año.
- **Acciones:**
  - `Generar Propuesta Diagnóstico`: Cotiza Módulo 1 (Diagnóstico) a valor fijo ($1.200 USD).
  - `Cotizar con IA`: Invoca la motorización de **Smart Quoter** precargando los datos del Lead.

### Fase 2: Cotizador Inteligente (`SmartQuoter.tsx` como Sub-flujo de Leads)
- **Ubicación:** Sub-flujo invocado desde Leads (`/smart-quoter?leadId=...`). **No vive como elemento independiente en el menú principal ni dentro de Proyectos en ejecución.**
- **Motor Ariely (3 Opciones):**
  - **A. Solo Consultoría (Módulo 1):** Entregable de diagnóstico.
  - **B. Desarrollo a Medida (Módulo 2):** Setup Fee (25% del ahorro anual estimado) + Bonificación del Módulo 1.
  - **C. Desarrollo + Evolución (Módulo 3):** Setup Fee + Abono recurrente mensual ($250 USD/mes).
- **Cálculo de ROI y Payback:** Visualización en tiempo real del tiempo de repago de la inversión.

### Restricciones y Reglas de Negocio
- **No Cotizar en Proyectos:** En la vista de Proyectos ([ProjectDetail.tsx](file:///c:/Ingestion/src/pages/ProjectDetail.tsx)) NO existe botón de "Cotizar con IA" ya que el proyecto ya está contratado y en ejecución dentro del *Engineering Path*.
- **No Cotizar sin Contexto:** La ruta `/smart-quoter` no aparece en el menú lateral principal ([Sidebar.tsx](file:///c:/Ingestion/src/components/Sidebar.tsx)), para forzar que toda propuesta esté estrictamente ligada a un Lead / Prospecto.
