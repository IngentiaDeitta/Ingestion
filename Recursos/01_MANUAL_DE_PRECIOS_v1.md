# 01 · Manual de Precios IngentIA — v1.0

**Vigencia:** desde el 28/07/2026 · **Responsable:** Fernando (CEO) · **Aplica:** todo presupuesto emitido a partir de la fecha.

> **Este documento es la única fuente de precios de IngentIA.**
> Quedan **derogados** a efectos de cotización:
> - `COMERCIAL\Nueva estrategia Comercial\Estrategia Comercial v2.docx` (sec. 2 y 3)
> - `OPERACIONES\Estrategia Comercial, Casos de Éxito y Escenarios Financieros v5.docx` (sec. 1 y 5) — precios fijos 3.800 / 6.800 / 6.900
> - `OPERACIONES\...v3.docx` y `Estrategia Comercial.docx`
>
> El `Playbook de Estrategia Comercial y Estandarización.docx` v6.0 sigue vigente como marco estratégico; **este manual prevalece sobre él en cualquier discrepancia numérica.**
>
> Ante una diferencia entre lo que dice este manual y lo que dice cualquier otro documento, presentación o página web: **manda este manual.** El resto se corrige.

---

## 1. La escalera comercial

Tres peldaños, en este orden. No se saltea ninguno.

| # | Producto | Precio | Qué es | Quién lo hace |
|---|---|---|---|---|
| 1 | **Radiografía Operativa** | **Sin cargo** — 30 min | Videollamada de descubrimiento y calificación. No es un entregable, no se deja documento escrito | Pedro |
| 2 | **Diagnóstico Operativo** | **USD 1.200** | Servicio pago con entregable propio: As-Is / To-Be + ROI cuantificado. **100% descontable** del desarrollo | Fernando (ejecuta) / Pedro (vende) |
| 3 | **Desarrollo** | Según arquetipo (ver §3) | Construcción de la solución | Fernando (+ tercero si aplica) |
| — | **Evolución** | **USD 250/mes mínimo** | Obligatorio en todo contrato. Nunca opcional | Ambos |

### Regla de nomenclatura (obligatoria)

| ❌ Nunca decir | ✅ Decir siempre |
|---|---|
| "Diagnóstico gratuito" | "Radiografía Operativa, sin cargo" |
| "Reunión de diagnóstico" | "Radiografía Operativa" |
| "Auditoría gratis" | "Radiografía Operativa" |

La palabra **"Diagnóstico" sola siempre significa el producto pago de USD 1.200.** Esta regla existe porque hoy la web, el brochure y el guion prometen un "diagnóstico gratuito" que contradice el modelo. Ver `50_CAMBIOS_WEB_Y_MATERIALES.md`.

---

## 2. Diagnóstico Operativo — USD 1.200

### El pitch del anzuelo

> "El Diagnóstico Operativo tiene un costo de USD 1.200 y es un entregable de ingeniería con valor propio: te llevás el plano completo de tu proceso, el As-Is y el To-Be, con el número de lo que estás perdiendo hoy. Ahora bien — si decidís avanzar con nosotros en la construcción de la herramienta, **te descontamos el 100% de ese valor** del setup. En la práctica, si seguís, el diagnóstico te sale gratis."

### Alcance blindado (va en la carta oferta, no negociable)

| Ítem | Límite |
|---|---|
| Procesos auditados | **1 (uno)** proceso crítico. No se audita "toda la empresa" |
| Archivos muestra | **Máximo 3.** Ej: un reporte actual, un Excel modelo, un PDF de ejemplo |
| Entrevistas | **1 sesión de 60 min** con el operario + **30 min** de presentación al dueño |
| Plazo de entrega | 7 días hábiles desde la firma |
| Carga interna objetivo | **15–20 h** |

**Fuera de alcance, se cotiza aparte:** limpieza de bases históricas, migración de datos, auditoría de más de un proceso, análisis de más de 3 archivos, especificación técnica de desarrollo.

### Entregables
1. Diagrama de proceso As-Is validado
2. Diseño de proceso To-Be
3. Cuantificación del dolor en pesos/dólares anuales
4. Recomendación de solución con rango de inversión

### Cláusula anti-fuga
El entregable se estructura como **arquitectura funcional de procesos**, no como especificación técnica de desarrollo. Contractualmente, el valor del Diagnóstico se deduce del desarrollo sólo si la fase se aprueba **con IngentIA**.

---

## 3. Desarrollo — Matriz de arquetipos

Clasificación interna. **Nunca se le muestra al cliente**; el cliente ve un rango de inversión o un precio cerrado.

| Arquetipo | Perfil | Horas est. | **Setup (USD)** | Abono/mes |
|---|---|---|---|---|
| **S&S** — Small & Standard | Complejidad baja. Puede no incluir Web App: optimización de procesos, Excel avanzado, automatizaciones n8n sin interfaz | ~40 h (M1 15 / M2 25) | **1.500 – 2.500** | 250 |
| **Medium** | Híbrido. App sencilla, integraciones con adaptación de código, o cliente corporativo burocrático | ~70 h (M1 25 / M2 45) | **3.000 – 5.000** | 300 – 400 |
| **Nominado** | Misión crítica. End-to-end, arquitectura robusta, IA generativa, RLS. Línea base: EK CRM | ~120+ h (M1 40 / M2 80) | **7.500+** | 400 – 600 |

### Cómo se ubica el precio dentro del rango

El orden importa. **La complejidad define el piso; el impacto justifica subir dentro del rango. El impacto nunca es el método de cálculo principal.**

1. **Complejidad técnica** → determina el arquetipo y el precio base.
2. **Criticidad para el negocio del cliente** → posiciona dentro del rango:
   - Baja (proceso de soporte) → piso del rango
   - Media (afecta eficiencia operativa) → medio del rango
   - Alta (afecta facturación, reputación o es core) → techo del rango
3. **Impacto económico** → **valida** que el precio tenga sentido. Regla: el setup debe caer entre el **20% y el 40% del ahorro o ganancia anual** que genera el sistema.
4. **Validación de margen** → si el margen neto proyectado es **< 40%**, se ajusta precio o se recorta alcance. No se emite la propuesta.

### ⚠️ Quién ejecuta cambia el margen, no el precio

Los rangos de la tabla anterior se construyeron asumiendo **ejecución 100% in-house al 85% de margen**. Ese supuesto deja de valer en cuanto un tercero toma parte del desarrollo.

**Regla:** antes de emitir cualquier propuesta hay que definir quién ejecuta y validar el piso de 40% **con el costo de subcontratación adentro**.

| Escenario | Costo de subcontratación | Margen resultante |
|---|---|---|
| 100% in-house | 0% | ~85% |
| Con tercero (frontend, DB, maquetado) | 25–35% del desarrollo | ~55–60% |
| Con tercero + comisión de aliado (10%) | 35–45% | ~45–50% |
| Con tercero + closer externo (15%) | 40–50% | **~40% — al límite** |

**Si el margen no llega al 40%, se recorta alcance — no se baja el precio ni se sube por encima del 40% del ahorro anual.** Subir el precio para cubrir el costo interno rompe el anclaje al valor y el cliente lo detecta.

**Ejemplo:** S&S de USD 2.000 ejecutado por un tercero al 30% (USD 600) más un aliado al 10% (USD 200) deja USD 1.200 = 60% de margen. Cierra. El mismo proyecto a USD 1.500 con closer externo al 15% deja el margen al filo: conviene revisar el alcance antes de firmar.

**Ejemplo de validación:** el cliente pierde 60 h/mes en conciliaciones ≈ USD 500/mes ≈ **USD 6.000/año**. Rango válido de setup: USD 1.200 – 2.400. Si el arquetipo dio Medium (3.000–5.000), hay una inconsistencia: o el dolor está subvaluado o el alcance está sobredimensionado. **Se resuelve antes de cotizar.**

---

## 4. Estructura de la propuesta — tres opciones con anzuelo

La propuesta post-Diagnóstico se presenta **siempre** con tres opciones. La opción B es el señuelo: existe para que la C parezca obviamente mejor.

| Opción | Contenido | Cómo se calcula |
|---|---|---|
| **A** — Base | Diagnóstico ya realizado + automatizaciones sobre herramientas existentes. Sin desarrollo a medida | ~55% de la Opción C |
| **B** — Desarrollo (el anzuelo) | Diagnóstico + desarrollo a medida completo. **Sin meses de soporte bonificados** — el abono se cobra desde el día 1 | 98–99% del valor de la Opción C |
| **C** — Desarrollo + Soporte (el target) | Todo lo de B + **3 meses de abono de Evolución bonificados** | Precio del arquetipo según §3 |

**La mecánica:** si el abono es USD 400/mes, la Opción C regala USD 1.200 de valor. Poniendo B a USD 6.800 y C a USD 6.900, por USD 100 de diferencia el cliente percibe USD 1.200 de beneficio. Nadie elige B — pero sin B, la C no se ve barata.

**Regla:** la diferencia entre B y C nunca supera el **2%** del valor de C.

---

## 5. Condiciones de pago

### Cronograma estándar — 40 / 30 / 30

| Hito | % | Cuándo |
|---|---|---|
| Anticipo | **40%** | A la firma, antes de arrancar |
| Hito intermedio | **30%** | Contra entrega del prototipo / Módulo 1 |
| Entrega final | **30%** | Contra puesta en producción |

> **Por qué cambia.** El contrato de EK quedó en 13% / 20% / 67%: USD 5.000 de 7.500 se cobran recién al final. Para dos socios sin colchón financiero eso es una trampa de caja. **No se repite.**

### Reglas duras

1. **Nunca se vende sin abono mensual.** Aunque sea el mínimo. Sin recurrencia no hay empresa, hay proyectos sueltos.
2. **El abono arranca con la puesta en producción**, no cuando el cliente "termine de adoptar".
3. **El Diagnóstico se cobra 100% por adelantado.** Es lo que lo convierte en filtro.
4. **Licencias de terceros son del cliente** (IA, base de datos, hosting, WhatsApp API). Se aclara siempre en la propuesta.
5. **Fuera de paquete cerrado:** hora de consultoría USD 60.
6. **Mora:** 1% diario automático sobre el pago vencido (cláusula ya usada en EK).

### Política de descuentos

| Situación | Descuento máximo | Quién autoriza |
|---|---|---|
| Pago 100% adelantado | 5% | Pedro |
| Segundo proyecto del mismo cliente | 10% sobre setup | Pedro |
| Cualquier otro caso | **0%** | Requiere acuerdo de ambos socios |

Si hay que bajar el precio para cerrar, **se recorta alcance, no se regala margen.**

---

## 6. Comisiones

Se paga **contra cobro efectivo**, nunca contra firma. Si el cliente paga por hitos, la comisión se liquida proporcionalmente sobre lo efectivamente acreditado.

| Rol | S&S | Medium | Nominado |
|---|---|---|---|
| **Referidor pasivo** — pasa un contacto tibio y no participa más | 5% | 5% | 3% (tope USD 500) |
| **Aliado estratégico** — contador/consultor que acompaña el proceso | 10% | 10% | 8% (tope USD 800) |
| **Closer externo** — hace el ciclo completo de venta | 15% | 12% | 10% (tope USD 1.200) |
| **SDR / agendador** — sólo genera la reunión calificada | USD 40 por reunión efectiva + 3% al cierre | ídem | ídem (tope USD 400) |

**Reunión efectiva** = el prospecto asistió, está dentro del ICP y hay una segunda instancia acordada. No se paga por reuniones que no ocurrieron o por contactos fuera de perfil.

La comisión se calcula sobre el **setup neto**, nunca sobre el abono mensual ni sobre licencias de terceros.

---

## 7. Costos internos de referencia

Para validar margen antes de cotizar.

| Concepto | Valor |
|---|---|
| Capacidad in-house combinada | 120–160 h/mes (Fernando + Pedro) |
| Costo de subcontratación (dev freelance front/back) | 25–35% de la cotización de desarrollo |
| Margen neto ejecución 100% interna | ~85% |
| Margen neto con subcontratación | ~55–60% |
| **Margen neto mínimo aceptable** | **40%** |
| Stack comercial (Apollo, dominio, infra) | USD 60–120/mes |

### Límite de proyectos simultáneos in-house

`[3 S&S]` ó `[2 Medium]` ó `[1 Nominado + 1 S&S]`

**Al cruzar el umbral se activa obligatoriamente el tercero.** Fernando y Pedro pasan a Arquitecto de Solución / QA / PM. Se resigna margen para no colapsar la entrega.

> **Estado actual:** EK CRM ocupa el slot Nominado. **El próximo proyecto que se firme dispara la incorporación de la colega desarrolladora.**

---

## 8. Checklist antes de enviar cualquier propuesta

- [ ] ¿El dolor está cuantificado en dinero anual?
- [ ] ¿El setup cae entre el 20% y el 40% de ese valor anual?
- [ ] ¿El arquetipo está definido y el precio dentro de su rango?
- [ ] ¿El margen neto proyectado es ≥ 40%?
- [ ] ¿Incluye abono mensual de al menos USD 250?
- [ ] ¿El cronograma es 40/30/30?
- [ ] ¿Están excluidas explícitamente las licencias de terceros?
- [ ] ¿Hay tres opciones con la diferencia B–C menor al 2%?
- [ ] ¿Hay capacidad real para entregarlo, o dispara la subcontratación?

Si alguna respuesta es "no", **la propuesta no sale.**

---

## 9. Registro obligatorio post-cotización

Cada cotización emitida se registra en `40_pipeline_tracker.csv` con: industria · tipo de problema · valor anual detectado · precio ofrecido · precio aceptado · horas reales invertidas.

Sin este registro no hay forma de productizar en 6 meses ni de saber si el pricing funciona.
