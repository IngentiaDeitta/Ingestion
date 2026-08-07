# 43 · Plan de cierre y facturación — EK Módulo 1

**USD 1.500 ya devengados.** Es la caja más rápida disponible y la prioridad número uno de la Fase 0.

**Referencia contractual:** Oferta N° 1/2026 del 13/04/2026, cláusula 5.3 y Anexo B.

---

## 1. Estado del contrato

| Hito | Monto | Estado |
|---|---|---|
| Anticipo inicio Módulo 1 | USD 1.000 | ✅ Cobrado |
| **Contra entrega Módulo 1** | **USD 1.500** | 🔜 **Este documento** |
| Contra entrega Módulo 2 | USD 5.000 | Pendiente |
| Módulo 3 — soporte y evolución | USD 150/mes | No iniciado |

**Contexto:** el contrato se firmó el 13/04/2026. A la fecha de este plan (27/07/2026) han pasado **más de 3 meses** y sólo se percibió el anticipo. Cerrar este hito no es sólo caja: es la señal de cumplimiento que habilita la conversación del Módulo 2.

---

## 2. Qué exige el contrato para dar el Módulo 1 por entregado

El Anexo B define tres fases con **entregables nominados**. El hito se factura contra los tres, no contra el avance percibido.

| Fase | Alcance según Anexo B | Entregable exigido | Estado |
|---|---|---|---|
| **Fase 0** — Mapeo As-Is / To-Be | Relevamiento de la dinámica actual y herramientas, análisis funcional, detección de la "lógica invisible", documentación formal de reglas de negocio | **Diagrama de Procesos 360°** (mapa de flujo validado) | ⬜ Verificar |
| **Fase I** — Auditoría de datos históricos | Normalización, limpieza y estandarización de orígenes, limitado a HubSpot, Excel y Outlook | **Informe de Diseño Lógico y Diccionario de Datos** | ⬜ Verificar |
| **Fase II** — Prototipado de alta fidelidad | Diseño de interfaz para validar UX y asegurar adopción antes de programar | **Prototipo Interactivo y ajustable** | ⬜ Verificar |

> **Regla:** sin los tres entregables formalizados y con constancia de validación del cliente, **no se emite la factura**. Facturar sin evidencia es la forma más rápida de que el pago se demore otro mes.

---

## 3. Evidencia ya existente en el repositorio

Antes de producir nada nuevo, hay que inventariar lo que ya está hecho. Trabajo en curso identificado en `Clientes\Elektro Korrosión - EK\CRM\`:

| Fase | Material existente | Sirve como evidencia |
|---|---|---|
| Fase 0 | `AS IS vs TO BE\EK_ASIS_TOBE_CRM_PYME.docx` | Probable base del Diagrama 360° |
| Fase 0 | `Arquitectura de la Solución\Mapa de Arquitectura_ CRM Inteligente EK.docx` | Complementario |
| Fase 0 | `Documento Funcional - EK CRM.pdf` | Reglas de negocio |
| Fase 0 | `Criterios de Aceptación y reglas de negocio.gdoc` | Reglas de negocio |
| Fase I | `Presentaciones\Auditoria y limpieza Leads.txt` — informe de auditoría del 29/06/2026 | **Fuerte.** Documenta el proceso completo de depuración |
| Fase I | `BBDD\silver_leads.xlsx`, `silver_leads_rows_v2.xlsx`, `MAESTRO_LEADS` | Resultado de la normalización |
| Fase I | `Gobierno_de_Datos\load_supabase.py` | Proceso de carga |
| Fase I | `Presentaciones\Reporte Conciliación CRM.pdf` | Complementario |
| Fase II | `App\Elektrokorrosión CRM TO-BE-handoff.zip` | Prototipo entregado |
| Fase II | `UX_UI\` — Home, Comercial, Clientes360, Obras, Omnicanal | Pantallas del prototipo |
| Validación | `Minutas\Minuta — Definición Funcional CRM`, `Minuta — Depuración BBDD CRM`, `2_7_2026 - Minuta - Avance CRM` | Constancia de sesiones con el cliente |

**Lectura preliminar: el Módulo 1 parece estar sustancialmente ejecutado.** Lo que falta no es trabajo técnico sino **empaquetado formal y aceptación escrita**.

---

## 4. Checklist de cierre

### Paso 1 — Auditoría interna de entregables *(1 día)*

- [ ] Confirmar que el Diagrama de Procesos 360° existe como documento único, validado y presentable — no disperso en cuatro archivos
- [ ] Confirmar que el Informe de Diseño Lógico y el Diccionario de Datos existen como entregable formal
- [ ] Confirmar que el Prototipo Interactivo está accesible y navegable por el cliente
- [ ] Listar lo que falte y estimar el esfuerzo real de completarlo

### Paso 2 — Empaquetado *(1–2 días)*

- [ ] Consolidar los tres entregables con formato de marca IngentIA
- [ ] Redactar un **Acta de Entrega del Módulo 1** que liste cada entregable del Anexo B contra su evidencia
- [ ] Preparar una presentación breve de cierre — 15 minutos, no más

### Paso 3 — Sesión de aceptación *(1 reunión)*

- [ ] Agendar con Leandro Gino, el responsable de validación designado (cláusula 3.4)
- [ ] Presentar los tres entregables
- [ ] **Obtener conformidad por escrito** — basta un mail que diga "recibido y aprobado"
- [ ] Levantar minuta y enviarla el mismo día

### Paso 4 — Facturación *(mismo día de la aceptación)*

- [ ] Emitir factura por USD 1.500 con referencia explícita a la Oferta N° 1/2026, cláusula 5.3
- [ ] Adjuntar el Acta de Entrega firmada o el mail de conformidad
- [ ] Enviar a Leandro Gino con copia al contacto administrativo
- [ ] Registrar en el tracker con fecha de vencimiento del pago

### Paso 5 — Encadenar el Módulo 2 *(en la misma reunión)*

No se cierra la reunión de aceptación sin dejar planteado el paso siguiente.

- [ ] Presentar el cronograma del Módulo 2 con fecha de inicio
- [ ] Confirmar que el Módulo 3 (USD 150/mes) arranca con la puesta en producción
- [ ] Acordar cadencia de seguimiento quincenal

---

## 5. Riesgos de este cierre

| Riesgo | Mitigación |
|---|---|
| **El cliente pide más alcance antes de aprobar** | El Anexo B es taxativo. Todo lo que exceda Fase 0, I y II es Módulo 2 o adenda escrita (cláusula 16.2). Se dice con amabilidad y por escrito |
| **La aceptación se dilata sin respuesta** | La cláusula 3.4 obliga a EK a designar un responsable de validación y a proveer información en tiempo. Si no hay respuesta en 10 días hábiles, se envía nota formal invocando esa cláusula |
| **Los entregables están dispersos y no se ven como entregables** | Es el riesgo más probable. Se resuelve con el Paso 2 — el trabajo está hecho, falta presentarlo como corresponde |
| **El pago se demora tras la factura** | La cláusula 11.1 prevé multa diaria del 1% por mora. No se invoca de entrada, pero existe |

---

## 6. Aprendizaje para los contratos nuevos

Este hito expone dos correcciones que ya están incorporadas en `01_MANUAL_DE_PRECIOS_v1.md`:

1. **El cronograma 13% / 20% / 67% concentra el riesgo al final.** Los contratos nuevos van 40 / 30 / 30.
2. **Los entregables deben tener un criterio de aceptación explícito y un plazo de validación.** Si el cliente no observa en X días hábiles, se considera aceptado. Esa cláusula no está en el contrato de EK y por eso el cierre depende de la buena voluntad del cliente.

**Acción:** incorporar una cláusula de aceptación tácita por vencimiento de plazo en la plantilla de carta oferta (`22_` y `23_`).
