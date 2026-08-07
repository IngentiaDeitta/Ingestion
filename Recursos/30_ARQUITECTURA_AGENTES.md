# 30 · Arquitectura de agentes A1–A7

**Principio rector:** masividad automatizada, **salida personalizada y profesional**. Validación humana en todo lo que sale con la marca — el mismo *human-in-the-loop* que le vendemos a los clientes.

**Stack:** n8n (Docker, ya operativo — ver `OPERACIONES\Explicación manejo de Docker.docx`) · Supabase · Apollo MCP · Claude · cal.com · WhatsApp API.

---

## Mapa del flujo

```
10a_cuentas_prioritarias.csv
        ↓
   ┌─────────┐
   │   A1    │  Enriquecimiento · Apollo → Supabase
   └────┬────┘
        ↓  cuentas con decisor, dominio y headcount validado
   ┌─────────┐
   │   A2    │  Investigación y personalización · genera primera línea
   └────┬────┘
        ↓  ⏸️  APROBACIÓN EN LOTE (Pedro)
   ┌─────────┐
   │   A3    │  Secuenciador · 5 toques, warm-up, opt-out
   └────┬────┘
        ↓  respuestas entrantes
   ┌─────────┐
   │   A4    │  Triage · clasifica y redacta borrador
   └────┬────┘
        ↓  ⏸️  PEDRO LEE Y ENVÍA
   reunión agendada (cal.com)
        ↓
   ┌─────────┐
   │   A5    │  Pre-call brief · 1 h antes
   └────┬────┘
        ↓  Radiografía Operativa → notas + dolor cuantificado
   ┌─────────┐
   │   A6    │  Generador de propuesta · ROI + HTML → PDF
   └────┬────┘
        ↓  ⏸️  FERNANDO VALIDA PRECIO Y MARGEN
   propuesta enviada

   ┌─────────┐
   │   A7    │  Sync de pipeline · escribe todo · reporte viernes
   └─────────┘   (corre en paralelo, escucha todos los eventos)
```

### Los cuatro puntos de control humano

Ningún agente envía nada al exterior por su cuenta.

| Punto | Quién | Qué valida |
|---|---|---|
| Post-A2 | Pedro | Que la primera línea sea verdadera, específica y no suene a robot |
| Post-A4 | Pedro | Toda respuesta a un humano la escribe y envía un humano |
| Post-A6 | Fernando | Precio, margen ≥ 40% y capacidad real de entrega |
| Pre-búsqueda paga | Fernando o Pedro | Autorización del lote y del gasto de créditos de Apollo |

---

## Esquema de datos (Supabase)

Base **separada** de la de EK. Ver `11_PROTOCOLO_BASE_LEADS.md` §2.

```sql
-- Cuentas objetivo
cuentas (
  id, empresa, empresa_norm, dominio, apollo_org_id,
  segmento, subtipo_rubro, localidad, provincia,
  empleados, industria_naics, anio_fundacion,
  score_icp, prioridad,                    -- A1 / A2 / B / X
  estado,                                  -- PENDIENTE | ENRIQUECIDA | DESCARTADA | EN_SECUENCIA | CONTACTADA
  motivo_descarte,
  señales jsonb,                           -- {busqueda_laboral, crecimiento_headcount, sin_erp, ...}
  created_at, updated_at
)

-- Contactos (obtenidos SIEMPRE de Apollo, nunca de la base EK)
contactos (
  id, cuenta_id, nombre, apellido, cargo, persona,   -- DUENO | PLANTA | ADMIN
  email, email_status, telefono, linkedin_url,
  origen,                                  -- APOLLO | CAMARA | ALIADO | INBOUND
  primera_linea, hipotesis_dolor,          -- generados por A2
  aprobado_por, aprobado_at,               -- control humano
  estado_secuencia, toque_actual, proximo_toque_at
)

-- Eventos
eventos (
  id, contacto_id, tipo,                   -- ENVIO | APERTURA | RESPUESTA | REUNION | PROPUESTA | CIERRE | BAJA
  toque, payload jsonb, created_at
)

-- Supresiones — permanente, nunca se borra
supresiones (
  email, dominio, motivo, fecha_baja, origen_pedido
)

-- Oportunidades
oportunidades (
  id, cuenta_id, contacto_id, etapa,
  dolor_descripcion, horas_semana, personas, costo_hora, perdida_anual_usd,
  arquetipo,                               -- S&S | MEDIUM | NOMINADO
  valor_diagnostico, valor_setup, abono_mensual, margen_estimado,
  proximo_paso, proximo_paso_fecha, score_calificacion
)
```

---

## A1 · Enriquecimiento de cuentas

**Dispara:** manual o cron semanal · **Entrada:** `10a_cuentas_prioritarias.csv` · **Salida:** tabla `cuentas` + `contactos`

### Lógica

1. Leer cuentas con `estado = PENDIENTE`
2. **Apollo Organization Lookup** por razón social — **gratis**. Obtener `apollo_org_id`, dominio, headcount, NAICS
3. **Filtrar antes de gastar:**
   - `empleados` fuera de 15–80 → `DESCARTADA`, motivo `TAMANO`
   - NAICS fuera del ICP → `DESCARTADA`, motivo `RUBRO`
   - HQ fuera de AMBA → `DESCARTADA`, motivo `ZONA`
   - Sin match en Apollo → `DESCARTADA`, motivo `SIN_DATO` *(candidata para padrón de cámara)*
4. Recalcular `score_icp` con los datos reales
5. **⏸️ Pedir autorización del lote** con cantidad de cuentas y créditos a consumir
6. **Apollo People Search** — pago. Un decisor verificado por cuenta
7. Cruzar contra `supresiones`
8. Escribir y marcar `ENRIQUECIDA`

> **El paso 3 es el que protege el presupuesto.** Con 75 créditos disponibles, filtrar después de revelar es tirar el trimestre.

### Detección de señales (gratis, sin créditos)

- **🔴 Búsqueda laboral activa** — `q_organization_job_titles` con cargos administrativos, últimos 90 días
- **🔴 Búsqueda de analista de costos**
- **🟠 Crecimiento de headcount > 20%** en 12 meses
- **🟡 Stack sin ERP moderno** — `currently_using_any_of_technology_uids`

### Métrica de validación

Tras las primeras 300 cuentas: **si menos del 50% queda con decisor y cargo identificados, el cuello de botella es la fuente, no el agente.** En ese caso se prioriza Apollo puro y los padrones de ADIMRA/CADIEEL por sobre la base heredada.

---

## A2 · Investigación y personalización

**Dispara:** cuenta pasa a `ENRIQUECIDA` · **Salida:** `primera_linea` + `hipotesis_dolor`

Es el agente que decide si el email parece escrito por una persona o por una máquina.

### Lógica

1. Leer el sitio web de la empresa: qué fabrica, para quién, cuántas plantas
2. Leer el perfil de LinkedIn de la empresa y del contacto
3. Leer las búsquedas laborales publicadas
4. Generar **una** primera línea: específica, verificable y sin adulación
5. Generar hipótesis de dolor con el arquetipo probable
6. Marcar `PENDIENTE_APROBACION`

### Reglas de la primera línea

| ✅ Sirve | ❌ No sirve |
|---|---|
| "Vi que están buscando un administrativo de facturación para la planta de Garín." | "Me encantó conocer su empresa." |
| "Vi que sumaron una segunda planta en Pilar el año pasado." | "Felicitaciones por su crecimiento." |
| "Vi que fabrican matricería para autopartes desde el 92." | "Son líderes en su sector." |

**Regla dura:** si el agente no encontró nada verificable y específico, **devuelve vacío y la cuenta va a la secuencia genérica**. Prohibido inventar. Una primera línea falsa que el prospecto detecta mata la cuenta y la reputación.

**⏸️ Pedro aprueba en lote** — vista de 50 primeras líneas, aprobar / editar / descartar.

---

## A3 · Secuenciador de envío

**Dispara:** contacto aprobado · **Ejecuta:** los 5 toques de `20_SECUENCIA_OUTBOUND.md`

### Reglas duras (se codifican, no se confían al criterio)

```
✓ Cruzar supresiones antes de CADA envío
✓ Máx. 40 emails por buzón por día
✓ Respetar la curva de warm-up según la semana del dominio
✓ Sólo martes a jueves, 9-11 h y 14-16 h (hora Argentina)
✓ PAUSA TOTAL de la secuencia ante cualquier respuesta
✓ Opt-out presente en cada plantilla — verificar antes de enviar
✓ Cero links en el toque 1
✓ Sin imágenes, sin tracking pixels, sin links acortados
✓ Toques 3 y 5 responden sobre el hilo original
✓ FRENO AUTOMÁTICO si bounce rate > 3% o spam > 0,1%
```

El freno automático es innegociable: apaga la campaña y notifica, sin esperar intervención humana.

---

## A4 · Triage de respuestas

**Dispara:** email entrante al dominio de envío

### Lógica

1. Pausar la secuencia de ese contacto
2. Clasificar: `INTERESADO` · `NO_AHORA` · `NO` · `FUERA_ICP` · `AUSENCIA` · `DERIVACION` · `BAJA`
3. Si `BAJA` → escribir en `supresiones` **inmediatamente** y confirmar en menos de 48 h
4. Si `AUSENCIA` → reprogramar después de la fecha de regreso
5. Si `DERIVACION` → crear contacto nuevo y reiniciar secuencia
6. Redactar borrador según la tabla de manejo de respuestas
7. Notificar a Pedro por WhatsApp con resumen, clasificación y borrador
8. Si `INTERESADO` → adjuntar link de cal.com en el borrador

**⏸️ Pedro lee y envía.** Nunca respuesta automática a un humano.

### Formato de la notificación

```
🟢 RESPUESTA — {{empresa}}
{{nombre}}, {{cargo}}

"{{cita textual de la respuesta}}"

Clasificación: INTERESADO
Señales de la cuenta: {{señales}}
Dolor probable: {{hipotesis}}

Borrador listo → {{link}}
```

---

## A5 · Pre-call brief

**Dispara:** 60 minutos antes de un evento de cal.com

Genera una página que Pedro lee 5 minutos antes de entrar:

- Qué hace la empresa, en una frase
- Empleados, plantas, antigüedad, zona
- Señales detectadas y desde cuándo
- Con quién hablamos y si decide
- Hipótesis de dolor y arquetipo probable
- Historial completo del hilo
- Tres preguntas específicas para esta cuenta
- Cámara o parque industrial donde participa

Se entrega por WhatsApp y por mail.

---

## A6 · Generador de propuesta

**Dispara:** oportunidad con `score_calificacion ≥ 12` y formulario completo

Es el agente que hace cumplible el SLA de **cotización en menos de 48 horas**.

### Lógica

1. Leer el formulario de calificación de `21_GUION_RADIOGRAFIA_30MIN.md`
2. Calcular la pérdida anual: `horas × costo_hora × personas × 52`
3. Determinar el arquetipo por complejidad → rango de `01_MANUAL_DE_PRECIOS_v1.md`
4. Posicionar dentro del rango según criticidad
5. **Validar:** ¿el setup cae entre el 20% y el 40% de la pérdida anual?
6. **Validar:** ¿margen ≥ 40%?
7. Armar las tres opciones con la diferencia B–C menor al 2%
8. Rellenar `22_` o `23_` según corresponda → PDF con `html_to_pdf.py`
9. **⏸️ Fernando valida precio, margen y capacidad**

### Bloqueos automáticos

Si alguna validación falla, **el agente no genera la propuesta**: devuelve el motivo.

- Pérdida anual < USD 4.000 → *"no hay proyecto rentable"*
- Margen < 40% → *"ajustar precio o recortar alcance"*
- Setup fuera del 20–40% de la pérdida → *"inconsistencia entre dolor y alcance, resolver antes de cotizar"*
- Capacidad comprometida → *"dispara subcontratación, confirmar con Fernando"*

---

## A7 · Sync de pipeline y reporte

**Dispara:** cualquier evento + cron viernes 17:00

1. Escuchar todos los eventos y escribirlos en `eventos`
2. Actualizar `40_pipeline_tracker.csv` (o el Google Sheet equivalente)
3. Calcular métricas de la semana
4. Comparar contra `41_metas_tablero.csv`
5. Enviar el reporte de los viernes por WhatsApp

### Reporte semanal

```
📊 SEMANA {{n}} — {{fechas}}

ACTIVIDAD              real / meta
Cuentas en secuencia   {{x}} / 150
Emails enviados        {{x}}
Respuestas             {{x}} ({{%}})
Reuniones agendadas    {{x}} / 2-3
Propuestas enviadas    {{x}} / 1

SALUD DEL CANAL
Bounce rate            {{%}}  {{🟢|🔴}}
Entregabilidad         {{%}}  {{🟢|🔴}}

PIPELINE
Oportunidades abiertas {{x}} — USD {{valor}}
Cierres del mes        {{x}} — USD {{valor}}

⚠️ ALERTAS
{{lista}}

🔜 PRÓXIMOS PASOS VENCIDOS
{{lista}}
```

---

## Reutilización en el proyecto EK

El Anexo B del contrato de EK, **Fase IV — Orquestación de Flujos**, pide textualmente *"seguimientos automáticos, lógica de alertas por vencimientos, respuestas automáticas a clientes y prospección inteligente de nuevos leads"*, y la **Fase V** pide *"resúmenes de estados, sugerencias comerciales y reactivación de clientes inactivos"*.

| Agente | Reutilizable en EK | Adaptación necesaria |
|---|---|---|
| **A1** Enriquecimiento | ✅ Alta | Es exactamente lo que la base de EK necesita: score 58% por falta de enriquecimiento |
| **A2** Personalización | ✅ Alta | Cambiar el contexto de industria |
| **A3** Secuenciador | ✅ Alta | Mismo motor, otra plantilla |
| **A4** Triage | ✅ Alta | Agregar clasificación de pedidos de presupuesto |
| **A5** Pre-call brief | 🟡 Media | Adaptar a visitas de obra |
| **A6** Propuesta | 🟡 Media | La lógica de ROI es propia de IngentIA |
| **A7** Sync y reporte | ✅ Alta | Mismo motor, otras métricas |

**Consecuencia práctica:** el tiempo invertido en construir la máquina comercial de IngentIA **no compite** con la entrega a EK — la adelanta. Y deja una demo funcionando que se puede mostrar en cada Radiografía Operativa: *"esto que ves, lo usamos nosotros todos los días"*.

---

## Orden de construcción

| Fase | Agentes | Por qué en ese orden |
|---|---|---|
| **Fase 0** (28/7 – 8/8) | **A1** | Sin cuentas enriquecidas no hay nada que enviar |
| **Fase 1** (11/8 – 5/9) | **A2, A3, A4** | Son los que producen reuniones |
| **Fase 2** (8/9 – 3/10) | **A5, A6** | Recién tienen sentido cuando hay reuniones que preparar y propuestas que emitir |
| **Fase 1 en adelante** | **A7** | Desde el primer envío. Lo que no se mide no se corrige |

---

## Reglas transversales

1. **Ningún agente envía al exterior sin aprobación humana.** Sin excepción.
2. **Ningún agente inventa datos.** Si no encontró algo verificable, devuelve vacío.
3. **Todo evento se registra.** Si no está en `eventos`, no pasó.
4. **Los créditos de Apollo se consumen sólo con autorización explícita** de Fernando o Pedro, por lote.
5. **Las supresiones son permanentes e irreversibles.** Ningún proceso las borra.
6. **Datos de EK y de IngentIA en bases separadas.** Nunca en el mismo workflow.
