# 46 · Modelo de delegación técnica — Natalia

**Contexto:** Natalia es desarrolladora con perfil amplio, incluso funcional. La intuición inicial de Fernando fue darle gestión integral del proyecto.

## ✅ DECISIÓN TOMADA (28/07/2026)

Natalia arranca el **29/07/2026**. Fernando y ella encaran **de forma conjunta** el módulo de desarrollo de la app de EK, con el objetivo explícito de acelerar el cobro y cierre del proyecto. Presupuesto acordado: **USD 1.000–1.500** para esta etapa.

**Validación de margen** *(regla del `01_MANUAL_DE_PRECIOS_v1.md` §2 — quién ejecuta cambia el margen, no el precio)*:

| Si el alcance es… | Base de cálculo | Costo Natalia | % sobre base | Margen resultante |
|---|---|---|---|---|
| Módulo 2 completo (hito de USD 5.000) | 5.000 | 1.000–1.500 | 20–30% | ~70–80% — **sano, dentro de rango** |
| Sólo el frontend (estimado ~40% del M2) | ~2.000 | 1.000–1.500 | 50–75% | **ajustado — validar antes de dar por cerrado** |

⚠️ **Pendiente de confirmar con Fernando:** si el trabajo conjunto cubre el Módulo 2 completo o sólo una porción (ej. frontend). Si es sólo una porción, el % efectivo sube y conviene revisarlo contra el piso del 40%. No bloquea el arranque — se confirma sobre la marcha.

**Nota sobre el modelo "conjunto" vs. "delegado":** lo que seleccionó Fernando no es exactamente la Etapa 1 tal como se había esbozado más abajo (ejecución delegada con Fernando en arquitectura/QA) — es **trabajo lado a lado** en el mismo módulo. Es una variante razonable para una primera colaboración: mantiene el control de calidad por proximidad en tiempo real, en lugar de por revisión posterior. El resto del documento (etapas 2 y 3, condiciones a cerrar) sigue vigente como hoja de ruta a partir de acá.

---

## Contexto original del análisis (previo a la decisión)

**Recomendación inicial: escalonado en tres etapas, no integral desde el arranque.**

---

## Por qué no integral desde el día uno

No es desconfianza en el perfil. Son cinco riesgos concretos que aparecen sólo cuando una persona sola concentra desarrollo, funcional, gestión y relación con el cliente.

### 1. La propiedad intelectual se vuelve teórica

El contrato con EK, cláusula 4.1, dice que **IngentIA conserva la propiedad del código fuente y la lógica desarrollada**. Si una sola persona externa escribe y entiende ese código, esa propiedad existe en el papel pero no en la práctica: si se va, se va el activo.

Es exactamente el riesgo que le vendemos a los clientes — *"dependencia del conocimiento tácito no documentado"* — y sería irónico construirlo adentro.

### 2. Nadie hace QA

El Playbook es explícito: al delegar, Fernando y Pedro pasan a ser **Arquitectos de Solución, QA y PM**, conservando el 30% de la carga. Si Natalia hace desarrollo, funcional y gestión, **nadie revisa el trabajo**. En una primera colaboración, eso significa enterarse de los problemas en la entrega, no antes.

### 3. Se diluye lo que vendemos

El diferencial que aparece en todo el material comercial es *"somos dos ingenieros que vienen de planta y entienden tu operación antes de escribir código"*. **La presencia de los fundadores es parte del producto.** Delegar la relación con el cliente en la primera colaboración erosiona justo eso.

Ella puede ejecutar. La cara frente al cliente conviene que siga siendo de ustedes hasta que la marca aguante sola.

### 4. El margen se desdibuja

El modelo financiero del Playbook asume subcontratación al **25–35%** de la cotización de desarrollo, con margen que baja de 85% a 55–60%. Si Natalia asume además funcional y gestión, el costo justo se acerca al 50% o va a pedir un esquema de socia. **Esa negociación hay que darla sabiendo qué margen queda, no después.**

### 5. Delegar sin destino es sólo costo

La pregunta que hay que responder antes de sumarla: **¿qué hace Fernando con las horas liberadas?** Si la respuesta no está clara, delegar no escala nada — sólo baja el margen.

---

## El modelo propuesto

### Etapa 1 — Ejecución acotada *(primer proyecto juntos)*

| Rol | Quién |
|---|---|
| Arquitectura y decisiones técnicas | **Fernando** |
| Desarrollo | **Natalia** |
| QA y aceptación de entregables | **Fernando** |
| Funcional y relación con el cliente | **Fernando / Pedro** |

**Primera asignación recomendada: el frontend del Módulo 2 de EK.**

Es el encargo mejor delimitado que existe hoy. El prototipo ya está hecho — seis pantallas HTML y el bundle de handoff con `EK System.dc.html`. Convertir eso en la app real es un trabajo autocontenido, con el diseño ya validado, que **no exige entender todo el proyecto** ni la historia del cliente. Es el mejor escenario posible para una primera colaboración: alcance claro, criterio de aceptación obvio, riesgo acotado.

**Lo que NO conviene:** meterla en el medio de EK CRM Módulo 1, que está por cerrarse. Sumar a alguien a un proyecto en vuelo justo antes de una entrega es el peor momento de todos.

### ⚠️ Objeción de Fernando (28/07) y resolución

**Planteo:** meterla en EK Módulo 2 resigna margen de un proyecto ya cotizado. Conviene incorporarla directamente en un proyecto nuevo, con su costo cotizado desde el inicio.

**El razonamiento económico es correcto** y se incorpora al manual de precios: los rangos por arquetipo se construyeron asumiendo ejecución in-house al 85% de margen. Con Natalia ejecutando, ese supuesto no vale. **Toda cotización nueva valida el piso de 40% de margen con el costo de subcontratación incluido; si no da, se recorta alcance, no se baja el precio.**

**Dos matices que cambian la conclusión:**

1. **Timing.** El pipeline está en cero. Un proyecto nuevo son 6–10 semanas (Radiografía → Diagnóstico → propuesta → firma). Esperar a eso deja a Natalia sin trabajo real hasta octubre, con riesgo de que tome otros compromisos. Un acuerdo sin trabajo no retiene a nadie.

2. **En EK M2 no se resigna margen: se compran horas de Fernando.** El Módulo 2 son ~80 h suyas — un mes entero de capacidad técnica. Ceder el frontend libera ~30 h, que son justo las que hacen falta para cerrar el Módulo 1 (USD 1.500 ya devengados) y construir los agentes comerciales. La alternativa real no es "conservar el 85%": es "el M2 tarda el doble y la máquina comercial no se construye".

**Resolución: secuenciar, no elegir.**

| Momento | Qué | Costo |
|---|---|---|
| **Ahora** | Prueba paga acotada en EK M2: **2 pantallas del prototipo, precio cerrado** | USD 400 – 600 |
| **Primer proyecto nuevo** | Participación completa desde el Diagnóstico, con su costo cotizado desde el día cero | 25–35% del desarrollo |

La prueba acotada resigna margen mínimo, valida la relación de trabajo con riesgo real pero controlado, la mantiene comprometida y libera algunas horas ya.

Sin esa prueba previa, el primer proyecto nuevo sería simultáneamente el primer cliente nuevo **y** la primera colaboración con ella — dos incógnitas a la vez sobre una relación comercial todavía frágil.

### Etapa 2 — Ejecución + funcional *(después de 1 o 2 entregas exitosas)*

Suma el relevamiento funcional y el diseño de la solución. Fernando queda en arquitectura y QA. Ella puede empezar a participar de las reuniones técnicas con el cliente, con Pedro presente.

### Etapa 3 — Gestión integral *(a partir del tercer proyecto)*

Ownership completo de proyectos **S&S y Medium**. Fernando se reserva los **Nominados**, que son los que se usan como laboratorio para el próximo Micro-SaaS.

Acá sí se cumple tu intuición original — pero con dos entregas de historia que la respaldan.

---

## Condiciones a cerrar antes de que trabaje

Esto se acuerda **ahora**, no cuando el gatillo se dispare. Cuando haga falta, no hay tiempo de negociar.

| Punto | Recomendación |
|---|---|
| **Modalidad de pago** | **Por entregable, no por hora.** Protege el margen y alinea incentivos. Si se paga por hora, el sobrecosto es de IngentIA |
| **Rango de costo** | 25–35% de la cotización de desarrollo. Para EK Módulo 2 (USD 5.000): entre USD 1.250 y 1.750 |
| **NDA** | Obligatorio antes de darle cualquier acceso |
| **Cesión de propiedad intelectual** | **Crítico.** Cláusula explícita de que el código y la lógica que produzca son de IngentIA. Sin esto, el compromiso de la cláusula 4.1 con EK no se sostiene |
| **Documentación como condición de aceptación** | No se da por entregado nada sin documentación. Es lo que evita el punto ciego del riesgo 1 |
| **Disponibilidad** | Horas por semana comprometidas y tiempo de respuesta. Una freelance con tres clientes en paralelo no sirve para un cronograma con hitos de cobro |
| **Acceso a datos de clientes** | Trabaja sobre datos de prueba mientras se pueda. Los datos reales de EK están alcanzados por la cláusula 8 de confidencialidad |

---

## Qué hace Fernando con las horas liberadas

Las tres respuestas, en orden:

1. **Cerrar EK Módulo 1 y avanzar el Módulo 2** — USD 1.500 + 5.000 de caja pendiente. Es la prioridad absoluta del trimestre.
2. **Construir los agentes comerciales A1 a A7** — es lo que hace que el pipeline exista, y se reutiliza en la Fase IV de EK.
3. **Empaquetar el primer Micro-SaaS vertical** — el objetivo estratégico de fondo, que hoy no tiene ni una hora asignada.

Si Natalia toma el frontend de EK Módulo 2, Fernando recupera aproximadamente el 40% de la carga técnica de ese proyecto. Eso alcanza para 1 y 2, que es lo urgente.

---

## Un matiz importante sobre el perfil

Que Natalia tenga perfil amplio y funcional es un activo real y poco común. La recomendación de escalonar **no es sobre su capacidad — es sobre el riesgo de una primera colaboración sin historia compartida.**

Dos entregas exitosas y el modelo se puede acelerar. Pero esas dos entregas conviene tenerlas.

---

## Gatillo de activación

Sigue vigente lo del plan: **al firmar el segundo proyecto activo simultáneo, se incorpora.**

Hoy EK CRM ocupa el slot Nominado. Si se cierra Telemetría, Inventario QR o un cliente nuevo, se activa.

**Diferencia respecto del plan original:** ahora sabemos que Natalia es desarrolladora, no PM. Eso cubre el cuello de botella técnico de Fernando, que era el crítico. **Queda sin cubrir la gestión de proyectos**, que hoy hace Fernando y le consume horas de arquitecto. Es el siguiente rol a resolver, después del SDR.
