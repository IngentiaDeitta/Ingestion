# 00 · Plan Comercial IngentIA — 90 días

**Período:** 28/07/2026 – 31/10/2026 · **Versión 1.0** · **Socios:** Fernando (CEO) · Pedro (CCO)

> Documento maestro. Empieza acá.
> Para compartir con terceros existe la versión en PDF: `Plan Comercial IngentIA - 90 dias.pdf`

---

## Punto de partida

Primera reunión de IngentIA: **16/02/2026**. A hoy, **5 meses y 11 días** después, el ingreso total percibido es de **USD 1.000** — el anticipo del Módulo 1 de Elektro Korrosión. Un cliente, un contrato, cero pipeline corriendo.

No falta estrategia. **Sobra estrategia contradictoria**: tres documentos vigentes dicen cosas distintas sobre precio, sobre el Diagnóstico y sobre qué vertical atacar. Por eso nada se ejecuta y nada se puede delegar.

Este plan congela las decisiones, corrige lo que se contradice y pone a correr una máquina que produzca reuniones de forma predecible.

---

## Las siete decisiones congeladas

1. **Un solo vertical:** Industrial y metalmecánica de AMBA, 15–80 empleados.
2. **Base de EK:** se usa donde sirve — como fuente de razones sociales a enriquecer, no como lista de envío.
3. **Diagnóstico Operativo pago:** USD 1.200, 100% descontable.
4. **Rol comercial a sumar:** SDR / agendador. Pedro sigue cerrando.
5. **Nomenclatura:** los 30 minutos sin cargo se llaman **Radiografía Operativa**. "Diagnóstico" queda reservado al producto pago.
6. **Todo lo masivo se automatiza** con agentes, con salida personalizada y validación humana.
7. **Telemetría e Inventario QR de EK no se computan** en la meta. Son upside.

---

## Metas

### Caja del trimestre

| Fuente | Piso | Objetivo | Stretch |
|---|---|---|---|
| Hito Módulo 1 EK *(devengado)* | 1.500 | 1.500 | 1.500 |
| Hito Módulo 2 EK | — | 5.000 | 5.000 |
| Diagnósticos nuevos | 2.400 | 4.800 | 7.200 |
| Desarrollos nuevos *(neto de crédito)* | — | 1.500 | 3.600 |
| **Total USD** | **3.900** | **12.800** | **17.300** |

**MRR al 31/10:** piso 150 · **objetivo 650** · stretch 900

### Actividad

| Métrica | Trimestre | Mensual | Semanal |
|---|---|---|---|
| Cuentas en secuencia (cold email) | ~340 | ~110 | 40 en régimen |
| Radiografías Operativas | 10 | 3 | 1 |
| Propuestas de Diagnóstico | 12 | 4 | 1 |
| Diagnósticos cerrados | 4 | 1–2 | — |
| Aliados contactados / firmados | 10 / 3 | — | — |

> ⚠️ **Actualizado 29/07/2026.** Se opera con **1 solo buzón** (`pedro@ingentiatech.com`) en lugar de 2 — Fernando decidió no pagar la segunda licencia. El techo de envío pasó de ~400 a ~120 emails/semana, y de 150 a **~40 cuentas nuevas/semana** por este canal. Ver `11_PROTOCOLO_BASE_LEADS.md` para la curva de warm-up actualizada. El volumen que no cubre el cold email lo compensan Apollo 1:1, aliados y red personal — coherente con la preferencia ya expresada de priorizar contacto de calidad sobre volumen masivo.

### SLA

Respuesta a lead entrante **< 4 h hábiles** · cotización base **< 48 h** · propuesta post-Diagnóstico **< 5 días hábiles**

---

## Índice de documentos

### Núcleo de decisión
| Archivo | Para qué |
|---|---|
| [`01_MANUAL_DE_PRECIOS_v1.md`](01_MANUAL_DE_PRECIOS_v1.md) | **Fuente única de precios.** Deroga los demás documentos |
| [`02_ICP_INDUSTRIAL_GBA.md`](02_ICP_INDUSTRIAL_GBA.md) | A quién le vendemos, con qué señales y con qué mensaje |

### Datos y prospección
| Archivo | Para qué |
|---|---|
| `10_cuentas_objetivo.csv` | 46.698 cuentas únicas extraídas de la base EK |
| `10a_cuentas_prioritarias.csv` | Las 1.800 mejor rankeadas — el volumen del trimestre |
| [`11_PROTOCOLO_BASE_LEADS.md`](11_PROTOCOLO_BASE_LEADS.md) | Uso de la base, Ley 25.326, higiene de dominio |
| [`12_APOLLO_SETUP.md`](12_APOLLO_SETUP.md) | Filtros exactos y **economía de créditos** |

### Máquina de ventas
| Archivo | Para qué |
|---|---|
| [`20_SECUENCIA_OUTBOUND.md`](20_SECUENCIA_OUTBOUND.md) | 5 toques con el copy listo |
| [`21_GUION_RADIOGRAFIA_30MIN.md`](21_GUION_RADIOGRAFIA_30MIN.md) | Guion minuto a minuto + calificación |
| `22_PROPUESTA_DIAGNOSTICO.html` | Carta oferta del Diagnóstico |
| `23_PROPUESTA_DESARROLLO.html` | Propuesta con tres opciones y anzuelo |
| `24_ONEPAGER_ALIADOS.html` | Para contadores y consultores ISO |

### Automatización
| Archivo | Para qué |
|---|---|
| [`30_ARQUITECTURA_AGENTES.md`](30_ARQUITECTURA_AGENTES.md) | Diseño de A1–A7 y esquema de datos |
| `31_n8n_workflows/A1_enriquecimiento.json` | Workflow importable |
| `32_prompts/A2_personalizacion.md` | Prompt de personalización |

### Gestión
| Archivo | Para qué |
|---|---|
| `40_pipeline_tracker.csv` | CRM liviano — cargar en Google Sheets |
| `41_metas_tablero.csv` | Metas semana a semana |
| [`42_PLAYBOOK_SDR.md`](42_PLAYBOOK_SDR.md) | Onboarding del SDR |
| [`43_PLAN_CIERRE_EK_M1.md`](43_PLAN_CIERRE_EK_M1.md) | **Cómo cobrar los USD 1.500** |
| [`50_CAMBIOS_WEB_Y_MATERIALES.md`](50_CAMBIOS_WEB_Y_MATERIALES.md) | Correcciones a web, brochure y guion |

---

## Calendario

### Fase 0 — Fundaciones · 28 jul – 1 ago *(comprimida — dominio resuelto en 2 días en vez de 12)*

| # | Acción | Quién | Estado |
|---|---|---|---|
| 1 | **Cerrar y facturar EK Módulo 1** — USD 1.500 | Fernando | Pendiente — ver `43` |
| 2 | Comprar dominio secundario e iniciar warm-up | Fernando | ✅ **Hecho.** `ingentiatech.com` — MX, SPF, DKIM y DMARC confirmados por DNS el 29/07 |
| 2b | 🧪 **Piloto de entregabilidad** — ~10 emails manuales | Pedro | **Jueves 30/07** |
| 3 | Decidir plan de Apollo (gratis con trabajo manual vs. upgrade) | Fernando | ⬜ Decisión abierta — ver `12` |
| 4 | Congelar precios y archivar documentos superados | Ambos | ✅ Hecho |
| 5 | Corregir web, cal.com y guion | Pedro | Pendiente — `50` |
| 6 | **Verificar los casos de éxito** antes de usarlos en outbound | Ambos | Pendiente — `50` §5 |
| 7 | Construir A1 y correrlo sobre 300 cuentas | Fernando | Bloqueado por la decisión de Apollo (punto 3) |
| 8 | Cerrar acuerdo con la colega desarrolladora | Ambos | ✅ Hecho — Natalia arrancó el 29/07 |

### Fase 1 — Activación · **4 ago** – 5 sep *(adelantada una semana — arranque original era 11 ago)*

- Construir A2, A3 y A4 *(A3 puede esperar si el envío sigue siendo manual mientras no se resuelva Apollo)*
- Warm-up: semana del 4/08 → 10/día · 11/08 → 20/día · 18/08 → 30/día · 25/08 en adelante → 40/día (techo de 1 buzón)
- Contactar a los 10 aliados con el one-pager
- Pedro: 3 bloques fijos de 2 h semanales para llamadas
- Reactivar Dripcolor con el encuadre nuevo
- **Checkpoint día 30** — última semana de agosto

### Fase 2 — Diagnósticos y cierre · 8 sep – 3 oct

- Sostener 40 cuentas/semana por cold email (techo de 1 buzón) + flujo continuo de Apollo 1:1 y aliados
- Construir A5 y A6 para cumplir el SLA de 48 h
- Ejecutar Diagnósticos con alcance blindado
- Avanzar EK Módulo 2 hacia el hito de USD 5.000

### Fase 3 — Producción y caja · 6 oct – 31 oct

- Convertir Diagnósticos en desarrollos
- **Gatillo de delegación:** al firmar el 2º proyecto simultáneo entra la colega dev
- **Gatillo de SDR:** ≥ 8 reuniones/mes por 2 meses
- **Checkpoint día 90:** continuidad o pivot

---

## Rituales

| Cuándo | Qué | Duración |
|---|---|---|
| **Lunes 9:00** | Revisión de pipeline. Qué se mueve, qué está trabado, qué se hace esta semana | 30 min |
| **Mar–Jue, 2 bloques de 2 h** | Bloque comercial de Pedro. Llamadas y reuniones. No se interrumpe | 4 h/día |
| **Viernes 17:00** | Números de la semana contra `41_metas_tablero.csv`. A7 manda el reporte antes | 30 min |
| **Último viernes del mes** | Revisión de conversión. ¿Qué mensaje funciona? ¿Hay que ajustar el ICP? | 60 min |

**Reparto de horas:** Fernando máximo 4 h/semana en comercial — el resto es capacidad técnica, que es el recurso más escaso. Pedro es el dueño del pipeline.

---

## Gatillos

| Gatillo | Condición | Acción |
|---|---|---|
| 🟢 **Delegación técnica** | Se firma el 2º proyecto activo simultáneo | Entra la colega desarrolladora. Sin excepción |
| 🟢 **Incorporar SDR** | ≥ 8 reuniones/mes durante 2 meses | Onboarding con `42` |
| 🔴 **Frenar prospección** | 3 proyectos activos sin la colega incorporada | Se para el outbound. No se vende lo que no se entrega |
| 🔴 **Frenar campaña** | Bounce > 3% o spam > 0,1% | A3 corta solo. Auditar lista y dominio |
| 🟠 **Reescribir el copy** | Tasa de respuesta < 2% al día 30 | El problema es el copy o la lista, no el volumen |
| 🟠 **Cambiar de fuente** | A1 rinde < 50% de decisores sobre 300 cuentas | Apollo puro + padrones de ADIMRA/CADIEEL como fuente primaria |

---

## Checkpoints

### Semana 2 — validación técnica
- Entregabilidad del dry-run de 20 cuentas ≥ 90%, o se corrige el dominio antes de escalar
- A1 con ≥ 50% de decisores identificados sobre las primeras 300 cuentas
- EK Módulo 1 facturado

### Día 30 — recalibración
Reemplazar **todos** los benchmarks por datos propios. Los números de arranque son estimaciones de mercado, no verdades.

### Día 90 — continuidad
**Criterio:** ≥ 2 Diagnósticos pagos cerrados **y** ≥ 1 conversión a desarrollo.
- **Se cumple** → doblar la apuesta en industrial y empezar a empaquetar el primer micro-SaaS vertical
- **No se cumple** → pivotar a Logística reutilizando toda la maquinaria, que es agnóstica al nicho

---

## Riesgos vivos

| Riesgo | Estado | Mitigación |
|---|---|---|
| **Concentración total en un cliente** | 🔴 Activo | El 100% del ingreso es EK. Todo el plan apunta a romperlo |
| **Capacidad in-house** | 🟠 Latente | EK CRM ocupa el slot Nominado. El 2º proyecto dispara la delegación |
| **Créditos de Apollo insuficientes** | 🔴 Activo | 75 créditos = 4% de lo necesario. Resolver en Fase 0 |
| **Cuenta de Apollo a nombre personal externo** | 🟠 Activo | Migrar a casilla corporativa antes de cargar datos |
| **Casos de éxito sin verificar** | 🟠 Activo | Verificar antes del primer envío. Ver `50` §5 |
| **Quema de dominio** | 🟢 Mitigado | Dominio secundario + warm-up + freno automático |
| **Cobranza concentrada al final** | 🟢 Corregido | 40/30/30 en contratos nuevos |

---

## Lo que no se hace sin aprobación explícita

- Enviar cualquier email a un prospecto
- Publicar cambios en la web
- Contactar aliados
- Ejecutar búsquedas pagas en Apollo
- Enviar cualquier propuesta

Los entregables se preparan listos para salir. **La decisión de enviar es de Fernando o Pedro, caso por caso.**
