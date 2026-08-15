# DIRECTIVA: notificaciones_y_minutas_ek_SOP

**ID:** 2026-08-14_NOTIFICACIONES_Y_MINUTAS_EK
**Última Actualización:** 14/08/2026
**Estado:** ACTIVO

---

## 1. Objetivos y Alcance
1. **Centro de Notificaciones:** Proporcionar una interfaz modal/drawer completa para explorar, buscar, filtrar y gestionar todas las notificaciones del sistema (`system_notifications`), resolviendo la limitación de visualización del header.
2. **Ingesta y Sincronización de Minutas:** Garantizar que todas las reuniones realizadas con cuentas clientes (especialmente cuentas clave como Elektro Korrosión / EK) se asocien y visualicen automáticamente tanto en el perfil del cliente como en sus proyectos activos.

---

## 2. Reglas del Centro de Notificaciones
1. **Acceso:** Debe abrirse desde el botón "Ver todas las notificaciones" en el menú desplegable de notificaciones del Header y permitir cierre con ESC o clic exterior.
2. **Filtros:** Pestañas activas:
   - Todas
   - No leídas
   - Proyectos (`project`)
   - Finanzas (`invoice`)
   - Clientes y Leads (`client`, `quote`)
   - Radar y CAME (`came_evento`, `came_boletin`, `came_ipip`, `came_novedad`)
3. **Búsqueda:** Filtrado instantáneo por texto en título o descripción.
4. **Acciones:**
   - "Marcar todas como leídas" actualiza `is_read = true` en base de datos y refresca el contador del Header.
   - Click en una notificación redirige a la sección correspondiente (Proyecto, Cliente, Finanzas, etc.) y marca la notificación como leída.

---

## 3. Reglas de Ingesta y Matcheo de Reuniones
1. **Formatos de Entrada:** El webhook y las herramientas de ingesta deben aceptar múltiples formatos de asistentes:
   - Array de strings (`["email1@dominio.com", "Nombre <email2@dominio.com>"]`)
   - Campos `attendees`, `attendee_emails`, `participants`, `email`.
2. **Jerarquía de Matcheo:**
   - 1º: **Coincidencia por Etiqueta/Label de Tactiq:** Inspeccionar `tags`, `labels`, `label`, `tag`, `folder`, `client_label` en el JSON recibido. Si contiene la etiqueta del cliente/lead (ej: `"EK"`, `"Elektro Korrosión"`), vincular directamente.
   - 2º: **Coincidencia por Emails de Asistentes:** Extraer todos los emails de `attendees`, `participants`, `guest_emails`, `email` y buscar coincidencia en `client_contacts.email`, `clients.email` y `leads_cuentas.email`.
   - 3º: **Coincidencia de dominio corporativo** (ej: `@elektrokorrosion.com.ar`).
   - 4º: **Coincidencia por palabra clave** en el título de la reunión (ej: `"EK"`, `"Elektro Korrosión"`).

3. **Persistencia y Formateo Visual UI:**
   - Guardar en `clients.client_analysis.transcripts` y replicar en `projects.project_analysis.transcripts`.
   - Formatear la previsualización del resumen con `whitespace-pre-line` o bloques estructurados por secciones (`🎯 OBJETIVO`, `📌 PUNTOS TRATADOS`, `💡 CONCLUSIÓN`). Evitar comprimir el texto en párrafos continuos sin saltos de línea.
   - Permitir registrar o pegar minutas históricas desde la interfaz para poblar el perfil cuando se etiquetan reuniones pasadas.

---

## 4. Reglas de Cálculo Financiero de Proyectos

1. **Cobros por Avances en Hitos:**
   - Debe calcularse **estrictamente** sumando solo los hitos completados y cobrados (`m.completed && m.billing_confirmed`).
   - Jamás deben incluirse en el acumulado de cobros por avances los hitos pendientes (`completed = false`), ya que los cobros de hitos se efectúan únicamente al finalizar la entrega.
2. **Total Facturado (`billedAmount`) en Resumen Financiero:**
   - Debe sumar los ingresos en la tabla `finances` asociados al `project_id` o `client_id`, y asegurar que la conciliación incluya los hitos completados y confirmados.

---

## 5. Historial de Aprendizajes y Restricciones
- **Nota:** No limitar las consultas de la base de datos a `limit(10)` en vistas completas de notificaciones.
- **Nota:** No asumir que el webhook recibe un único email en `body.email`; en llamadas grupales el host suele ser la propia cuenta de IngentIA, por lo que es mandatorio inspeccionar la lista completa de participantes (`attendees`) y las etiquetas (`labels`/`tags`).
- **Nota:** En los hitos de proyectos, verificar que `billing_confirmed` no esté activado en hitos pendientes para evitar sobreestimar el cobro por avances.
