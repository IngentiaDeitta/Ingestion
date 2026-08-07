# SOP: Migración de DripColor a Lead, Limpieza de Proyectos y Contactos de Clientes

## Objetivo
Documentar los criterios y procedimiento determinista para:
1. Migrar DripColor SRL de `clients` a `leads_cuentas` con estado `PERDIDA` e interacciones de cotización archivadas.
2. Eliminar el registro de cliente DripColor de la tabla `clients`.
3. Limpiar proyectos de prueba y dejar únicamente el proyecto activo **EK CRM** de Elektrokorrosion.
4. Asegurar los 3 contactos registrados para Elektrokorrosion en `client_contacts` (Leandro Gino, Federico Gino y Claudia Mattei).
5. Preservar leads reales: Elektrokorrosion, DripColor, Laboratorios Andrómaco y Leads de Apollo.

## Procedimiento de Migración de Datos (Python Script `scripts/migrate_dripcolor_and_cleanup_projects.py`)

### Paso 1: Migración de DripColor
- Actualizar `leads_cuentas` ID 20 (DripColor SRL): estado = `PERDIDA`.
- En la tabla `quotes`, desvincular `client_id`, asignar `lead_id = 20` y marcar `status = "Perdida"`.
- En `client_contacts`, actualizar los contactos de DripColor (Edith Sanchez, Joaquin Malleret): `lead_id = 20`, `client_id = null`.
- Eliminar el cliente DripColor (`36f4934d-a403-4473-81b1-d74ed7cc3b78`) de `clients`.

### Paso 2: Limpieza de Proyectos
- Eliminar de `projects` todos los proyectos excepto el activo **EK CRM** (`1923ae03-c519-49b5-828c-2e6c14e8f8e2`).

### Paso 3: Contactos de Elektrokorrosion
- Registrar los 3 contactos de Elektrokorrosion en `client_contacts`:
  1. Leandro Gino (Dueño)
  2. Federico Gino (Dueño)
  3. Claudia Mattei (Responsable Comercial y Operativa)

### Paso 4: Leads Reales Conservados
- Verificar presencia de EK, DripColor, Laboratorios Andrómaco y prospectos de Apollo.

## Reglas de Control Cruzado
- `ClientDetail.tsx` y `LeadDetail.tsx` permiten la creación y edición manual de contactos.
- Si un contacto de un lead ya existe en clientes, la deduplicación automática (`buscarCoincidencia`) sugiere vincular al cliente existente sin duplicar la cuenta.
