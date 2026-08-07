# 50 · Cambios en web y materiales comerciales

**Objetivo:** eliminar la ambigüedad entre la reunión gratuita de 30 minutos y el Diagnóstico Operativo pago.

**Origen del problema:** la web y el guion de presentación ofrecen un *"Diagnóstico de Eficiencia gratuito de 30 minutos"*, mientras el Playbook v6 define el Diagnóstico como un producto pago de USD 1.200. Un prospecto que llega por la web esperando un diagnóstico gratis y recibe una cotización de USD 1.200 siente que le cambiaron las reglas — y ese es el momento exacto en que se pierde la confianza.

**La solución no es sacar los 30 minutos gratis.** Los 30 minutos son el primer contacto y funcionan. Lo que cambia es **cómo se llaman**.

---

## La regla

| Nombre | Qué es | Precio |
|---|---|---|
| **Radiografía Operativa** | Videollamada de 30 min. Descubrimiento y calificación. Sin entregable escrito | Sin cargo |
| **Diagnóstico Operativo** | Servicio con entregable: As-Is / To-Be + ROI cuantificado | USD 1.200, 100% descontable |

> La palabra **"diagnóstico" sola nunca se usa para la reunión gratuita.** Es el nombre del producto pago.

---

## 1. Sitio web — `ingentia.com.ar`

### 1.1 CTA principal (hero y footer) — 🔴 Crítico

| Actual | Nuevo |
|---|---|
| `Agendar diagnóstico →` | `Agendar 30 min sin cargo →` |

Alternativa si se prefiere mantener el nombre del método: `Pedir una Radiografía Operativa →`

### 1.2 Sección "Empecemos este trimestre" — 🔴 Crítico

Agregar bajo el CTA, en texto secundario:

> *30 minutos por videollamada, sin cargo y sin compromiso. Miramos tu proceso y te decimos si hay algo que se pueda recuperar. Si lo hay, te lo mostramos con un número.*

Esto encuadra la expectativa antes del clic y evita la sensación de anzuelo.

### 1.3 Módulo 1 del método — 🔴 Crítico

| Actual | Nuevo |
|---|---|
| **Diagnóstico** — "Mapeo del estado actual vs. el deseado. El plano es 100% tuyo." | **Diagnóstico Operativo** — "Mapeo del estado actual vs. el deseado, con el cálculo de lo que estás perdiendo hoy. El plano es 100% tuyo. **Servicio con costo, descontable del desarrollo.**" |

Que el sitio diga que el Diagnóstico se cobra **filtra curiosos antes de que consuman una reunión** y hace que el precio no sea una sorpresa.

### 1.4 Nueva sección — "Cómo trabajamos juntos" — 🟠 Recomendado

Un bloque de tres pasos que haga transparente la escalera comercial:

```
01 · Radiografía Operativa        02 · Diagnóstico Operativo      03 · Implementación
    30 min · sin cargo                Una semana · USD 1.200          Según alcance
    Entendemos tu operación           El plano completo de tu         Construimos y ponemos
    y vemos si hay algo que           proceso, con el número          en producción. El
    se pueda recuperar.               real de la pérdida.             diagnóstico se descuenta.
```

Es el activo que más fricción elimina: el prospecto llega a la reunión sabiendo qué sigue.

### 1.5 Formulario de contacto — 🟡 Opcional

Agregar dos campos que permiten calificar antes de la llamada:
- **Cantidad de empleados** (desplegable: 1-14 / 15-40 / 41-80 / 81-200 / +200)
- **¿Qué proceso te está costando más tiempo hoy?** (texto libre)

Con eso, A5 puede generar el pre-call brief antes de la reunión.

---

## 2. cal.com — 🔴 Crítico

| Elemento | Actual | Nuevo |
|---|---|---|
| Nombre del evento | "Diagnóstico" | **"Radiografía Operativa · 30 min"** |
| Descripción | — | *"30 minutos para entender cómo opera tu empresa hoy. No es una demo ni una presentación. Si detectamos una fuga de rentabilidad, te la mostramos con un número."* |
| Duración | Verificar | 30 min exactos |
| Preguntas de reserva | — | Empleados · Rubro · Proceso que más duele |

Las preguntas de reserva alimentan directamente el pre-call brief de A5.

---

## 3. Brochure de servicios — 🟠 Recomendado

Archivo: `COMERCIAL\IngentIA - Brochure de servicios.pdf` (fuente en `Branding Kit\IngentIA Design System\Brochure.html`)

| Página | Cambio |
|---|---|
| **p. 3** — Módulo 1 | "Diagnóstico" → **"Diagnóstico Operativo"**, agregando que es un servicio con costo descontable |
| **p. 5** — CTA final | "Agendar diagnóstico →" → **"Agendar 30 min sin cargo →"** |
| **p. 2** — dato de 15 h | El pie dice "dato estimado en base a relevamientos previos". **Mantener esa aclaración.** Es honesta y protege ante una pregunta incómoda |
| **p. 4** — Casos de éxito | ⚠️ Ver §5 |

Regenerar el PDF con `html_to_pdf.py` tras editar el HTML.

---

## 4. Guion de presentación — 🔴 Crítico

Archivo: `COMERCIAL\Nueva estrategia Comercial\Guion de Presentación IngentIA.docx`, sección 5 (El Cierre).

| Actual | Nuevo |
|---|---|
| "Los queremos invitar a coordinar un **Diagnóstico de Eficiencia gratuito** de 30 minutos." | "Los queremos invitar a una **Radiografía Operativa**: 30 minutos, sin cargo, donde nos cuentan cómo opera hoy la empresa y nosotros detectamos dónde se está yendo la rentabilidad." |

**Agregar a continuación** el puente al producto pago:

> "Si de esos 30 minutos sale algo concreto, el paso siguiente es el **Diagnóstico Operativo**: una semana de trabajo donde les dejamos el plano completo del proceso y el número firme de lo que se puede recuperar. Ese sí tiene costo — y si después construimos la herramienta con nosotros, se descuenta al 100%."

**También revisar en el guion:**
- "Entregamos la solución funcionando en un plazo ágil de **6 a 8 semanas**" → cambiar a *"según el alcance, típicamente entre 5 y 8 semanas"*. Un plazo dicho como promesa se vuelve una obligación.
- "Reducimos **hasta un 40%** el tiempo…" y "**garantizamos**" → suavizar a *"en los casos que trabajamos, la reducción fue de…"*. **No se garantizan resultados por contrato.**

---

## 5. Casos de éxito — ⚠️ Verificar antes de seguir usándolos

El material comercial actual presenta tres casos con métricas específicas (+35% beneficios / −25% costos, reducción del ciclo de facturación de 7 días a 1, etc.). En el brochure figuran como "tres ejemplos reales de sectores muy distintos".

**Acción requerida de Fernando y Pedro:**

- [ ] Confirmar cuáles de los tres casos corresponden a proyectos efectivamente ejecutados por IngentIA
- [ ] Para los que sí: verificar que los números sean atribuibles y que el cliente autorice su uso, aunque sea anonimizado
- [ ] Para los que no: reetiquetarlos explícitamente como **"escenario ilustrativo"** o retirarlos

> **Por qué importa ahora.** Con la máquina outbound corriendo, estos números van a llegar a cientos de prospectos industriales de AMBA — un mercado chico donde todos se conocen. Un caso que no resiste una pregunta en la reunión cuesta mucho más que la credibilidad que aporta.

**Alternativa sólida:** construir un caso verificable con Elektro Korrosión. La depuración de la base — de ~189.000 registros a 101.603 contactables, con deduplicación total y trazabilidad de descarte — es un resultado real, medible y documentado en `Auditoria y limpieza Leads.txt`. Requiere autorización de EK para nombrarlo, o puede presentarse como "empresa de servicios industriales" sin identificar.

---

## 6. Orden de ejecución

| Prioridad | Cambio | Cuándo |
|---|---|---|
| 🔴 1 | CTA de la web y nombre del evento en cal.com | Fase 0, primeros días |
| 🔴 2 | Módulo 1 de la web: aclarar que el Diagnóstico tiene costo | Fase 0 |
| 🔴 3 | Guion de presentación: sección 5 y suavizado de garantías | Fase 0 |
| ⚠️ 4 | Verificación de los casos de éxito | **Antes del primer envío outbound** |
| 🟠 5 | Sección "Cómo trabajamos juntos" en la web | Fase 0 – 1 |
| 🟠 6 | Brochure regenerado | Fase 1 |
| 🟡 7 | Campos de calificación en el formulario | Fase 1 |

---

## 7. Documentos a archivar

Mover a `No vigente\` para que nadie los use por error:

- `OPERACIONES\Estrategia Comercial.docx`
- `OPERACIONES\Estrategia Comercial v2.docx`
- `OPERACIONES\Estrategia Comercial, Casos de Éxito y Escenarios Financieros v3.docx`
- `OPERACIONES\Estrategia Comercial, Casos de Éxito y Escenarios Financieros v5.docx`
- `COMERCIAL\Nueva estrategia Comercial\Estrategia Comercial v2.docx`

**Se mantienen vigentes:**
- `Playbook de Estrategia Comercial y Estandarización.docx` — marco estratégico
- `PROCESO ESTÁNDAR DE COTIZACIÓN.docx` — el flujo de 6 fases sigue siendo válido
- `Claves del negocio IngentiA.docx` — la tesis de micro-SaaS vertical

En los tres, agregar una nota al inicio: *"Para precios y condiciones comerciales, la fuente única es `COMERCIAL\Plan Comercial 90D\01_MANUAL_DE_PRECIOS_v1.md`."*
