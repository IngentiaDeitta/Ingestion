# Directiva: Fase Preventa Outbound (Leads y Triage)

## Objetivo
Desarrollar el flujo completo de preventa "Outbound" de la consultora IngentIA. Esto abarca desde la captura del prospecto (Lead), su enriquecimiento simulado (Agentes A1 y A5) previo a las llamadas comerciales, y su eventual conversión a Cliente.

## Entradas
- Datos crudos del Lead (empresa, dominio, nicho).
- Interacción del closer (Pedro) para solicitar el "Pre-Call Brief".

## Salidas
- Script SQL con políticas RLS para crear/modificar tablas (`outbound_leads`, `radiografia_operativa`, `clients`, `quotes`, `projects`, `invoices`).
- Componente `Leads.tsx` con un Kanban (estado del lead por vertical).
- Componente `LeadDetail.tsx` con la UI del "Pre-Call Brief (Agente A5)".
- Datos simulados en JSON provistos por `agents_mock.ts`.

## Lógica y Procedimiento
1. **Base de Datos:** Los esquemas deben soportar políticas RLS garantizando que sólo usuarios autenticados puedan leer/escribir. Las tablas existentes (clients, quotes, projects) se deben modificar (ALTER) agregando las columnas necesarias (lead_id, quote_id, etc.) para mantener la integridad de los datos actuales.
2. **UI Leads (Kanban):** Interfaz premium en modo oscuro usando Tailwind y Lucide React. Debe mostrar tarjetas de leads clasificados.
3. **UI Detalles:** Presentar la "Hipótesis de Deuda Operativa" y tecnología probable para el prospecto.
4. **Mock:** Un botón "Simular Enriquecimiento y Brief" llamará a `agents_mock.ts` para llenar la vista.

## Restricciones / Casos Borde
- *Nota: Asegurarse de usar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para tablas que ya existen en el sistema (ej. `clients`, `projects`, `quotes`) en lugar de recrearlas.*
- *Nota: Respetar estrictamente la estética general de la aplicación (Light mode con efectos Glassmorphism, fondos blancos translúcidos con desenfoque `backdrop-blur`, texto principal `#1A1A1A` y `#666666`, y acentos `#FFD166`). Evitar el modo oscuro.*
