# Índice — Plan Comercial IngentIA 90D

**Actualizado:** 28/07/2026. Este documento explica **para qué sirve cada archivo** de la carpeta. Si sólo vas a leer uno, que sea `00_PLAN_COMERCIAL_90D.md` — es el mapa general; todo lo demás es detalle de ejecución.

---

## 🎯 Empezar por acá

| Archivo | Para qué sirve |
|---|---|
| **`00_PLAN_COMERCIAL_90D.md`** | El plan maestro. Metas, calendario por fases, rituales semanales, gatillos de decisión. **Si tenés 5 minutos, leé este.** |
| **`Plan Comercial IngentIA - 90 dias.pdf`** | Versión diseñada del plan maestro, para compartir con Pedro o terceros sin exponer el detalle operativo interno |

---

## 📐 Reglas fijas — lo que no se negocia cada vez

| Archivo | Para qué sirve | Por qué existe |
|---|---|---|
| **`01_MANUAL_DE_PRECIOS_v1.md`** | La única tabla de precios válida: Diagnóstico, arquetipos de desarrollo, condiciones de pago, comisiones, y la regla de que **quién ejecuta cambia el margen, no el precio** | Había tres documentos históricos con precios distintos entre sí. Este los reemplaza a todos |
| **`02_ICP_INDUSTRIAL_GBA.md`** | Quién es el cliente ideal: rubro, tamaño, zona, señales de dolor observables, y el mensaje según a quién le hablás (dueño, gerente de planta, gerente administrativo) | Define a quién le escribimos y por qué, para no perseguir cualquier empresa |

---

## 🎣 Prospección — cómo conseguimos leads

| Archivo | Para qué sirve |
|---|---|
| **`10_cuentas_objetivo.csv`** | 46.698 empresas únicas extraídas y depuradas de la base histórica de EK, con score de fit al ICP. Es el **pool de candidatas**, no una lista lista para enviar |
| **`10a_cuentas_prioritarias.csv`** | Las 1.800 mejores de esa lista, ya ordenadas — el volumen nominal del trimestre si se activara outbound masivo |
| **`11_PROTOCOLO_BASE_LEADS.md`** | Reglas para usar la base de EK sin pisar la Ley 25.326 ni el contrato: qué se puede usar, cómo, y las reglas de higiene de dominio para no quemar la casilla de correo |
| **`12_APOLLO_SETUP.md`** | Cómo está configurada la cuenta de Apollo, qué endpoints funcionan con el plan actual y cuáles no, economía de créditos, y los filtros de búsqueda para el ICP |
| **`25_RED_DE_ALIADOS.md`** | Análisis uno por uno de los 5 contactos de la red personal (Rodrigo, Marina, Santiago, Diego, Natalia): qué rol cumple cada uno, por qué, y el mensaje largo para cada caso |
| **`25a_MENSAJES_WHATSAPP.md`** | Los mismos 5 mensajes pero en formato corto e informal, listos para copiar y pegar en WhatsApp |
| **`45_aliados_tracker.csv`** | Seguimiento de esos 5 contactos: estado, próximo paso, fecha, comisión devengada. Se actualiza a mano a medida que avanza cada uno |

---

## 💬 Máquina de ventas — qué decimos y en qué orden

| Archivo | Para qué sirve |
|---|---|
| **`20_SECUENCIA_OUTBOUND.md`** | Los 5 toques de la secuencia de cold email/LinkedIn, con el copy completo, para cuando se active el canal masivo |
| **`21_GUION_RADIOGRAFIA_30MIN.md`** | Guion minuto a minuto de la primera reunión (la "Radiografía Operativa" gratuita), con el formulario de calificación y el puntaje que decide si se envía propuesta |
| **`22_PROPUESTA_DIAGNOSTICO.html`** | Plantilla de la carta oferta para el Diagnóstico Operativo (USD 1.200), con el branding de IngentIA. Se completa con los datos del prospecto y se convierte a PDF |
| **`23_PROPUESTA_DESARROLLO.html`** | Plantilla de la propuesta de desarrollo, con las tres opciones (A/B/C) y el efecto ancla explicado en el manual de precios |
| **`24_ONEPAGER_ALIADOS.html`** + **`.pdf`** | Una hoja para mostrarle a un aliado (contador, consultor) cómo detectar a un cliente nuestro y cuánto gana por derivarlo. El PDF ya está generado y listo para adjuntar |

---

## 🤖 Automatización — la parte que escala sin que ustedes tipeen

| Archivo | Para qué sirve |
|---|---|
| **`30_ARQUITECTURA_AGENTES.md`** | Diseño de los 7 agentes (A1 a A7) que en conjunto arman la "máquina": desde enriquecer una cuenta hasta generar la propuesta y hacer seguimiento. Explica qué hace cada uno y en qué orden se activan |
| **`31_n8n_workflows/A1_enriquecimiento.json`** | El primer workflow ya armado y listo para importar en n8n: toma una lista de empresas y las enriquece contra Apollo |
| **`32_prompts/A2_personalizacion.md`** | El prompt exacto que usa el agente de personalización para escribir el primer mensaje a cada prospecto sin sonar genérico |

---

## 🗂️ Gestión y seguimiento — para no perder el hilo

| Archivo | Para qué sirve |
|---|---|
| **`40_pipeline_tracker.csv`** | El tablero de oportunidades comerciales: EK (Módulo 1, 2, Telemetría, Inventario QR), Dripcolor, y todo lo que se sume. Etapa, valor, próximo paso |
| **`41_metas_tablero.csv`** | Las metas semana por semana del trimestre (cuentas contactadas, reuniones, propuestas, cierres) contra las cuales se mide el avance real |
| **`42_PLAYBOOK_SDR.md`** | Manual completo para cuando se incorpore un SDR: qué hace, qué no hace, cómo se le paga, guion de llamada |
| **`43_PLAN_CIERRE_EK_M1.md`** | Plan de acción específico para cerrar y facturar el Módulo 1 de EK (USD 1.500 pendientes de cobro) |
| **`44_AUDITORIA_ENTREGABLES_EK_M1.md`** | Resultado de auditar qué entregables del Anexo B del contrato de EK ya existen y cuáles faltan para poder facturar el Módulo 1 |
| **`46_MODELO_DELEGACION.md`** | Cómo se incorpora Natalia al trabajo técnico: qué hace en cada etapa, qué condiciones cerrar antes (pago, propiedad intelectual, NDA), y el chequeo de margen de la decisión ya tomada |
| **`50_CAMBIOS_WEB_Y_MATERIALES.md`** | Lista de ajustes pendientes en la web, el brochure y el guion de presentación para que todo hable con el mismo precio y el mismo mensaje |

---

## 🗄️ Fuera de esta carpeta, pero parte del mismo trabajo

| Dónde | Qué es |
|---|---|
| `Clientes\Elektro Korrosión - EK\CRM\Entregables Módulo 1\Diccionario de Datos - EK CRM.md` | El diccionario de datos que faltaba para poder cerrar el Módulo 1 de EK, generado a partir del esquema real de Supabase |
| `Clientes\Elektro Korrosión - EK\Gobierno_de_Datos\RLS_politicas_propuestas.sql` | Las políticas de seguridad para cerrar el acceso público a la base de EK. **Parqueado por decisión de Fernando** hasta que la app entre en producción |
| **Supabase — proyecto "Ingestion"** (`gaawloviqgyzmqbtjsmd`), tabla `leads_cuentas` | La base de datos de prospección propia de IngentIA, separada de la de EK. Ahí se van cargando las cuentas a medida que se identifican y enriquecen (no es un volcado masivo — ver más abajo) |

---

## Cómo se relacionan entre sí

```
02_ICP  ─┬─→ 10/10a (candidatas) ──→ Apollo / camaras ──→ Supabase leads_cuentas
         │                                                        │
         └─→ 20/21/22/23/24 (mensajes y propuestas)  ←────────────┘
                       │
                       ▼
              40_pipeline_tracker (una vez que hay conversación real)
                       │
                       ▼
              41_metas_tablero (medición semanal contra el plan)

01_MANUAL_DE_PRECIOS y 30_ARQUITECTURA_AGENTES son transversales:
el primero valida cada propuesta, el segundo describe cómo se
automatiza todo el circuito de arriba.
```

---

## Sobre la base de datos en Supabase — una aclaración importante

Se creó la tabla `leads_cuentas` en el proyecto "Ingestion", **separada** de la base de EK (cumple la regla de `11_PROTOCOLO_BASE_LEADS.md` de no mezclar datos de clientes con prospección propia).

**No se volcaron ahí las 1.800 cuentas de `10a_cuentas_prioritarias.csv` en bloque.** Motivo: ese archivo es un *pool de candidatas sin verificar* — sólo 1.524 de las 46.698 tienen algún cargo conocido, y ninguna pasó por Apollo. Como el enfoque que elegiste es 1:1 y de calidad, cargar 1.800 filas sin enriquecer en la base de trabajo real sólo generaría ruido.

**El criterio que quedó aplicado:** algo entra a `leads_cuentas` cuando es un resultado real — una empresa identificada en un padrón, enriquecida con Apollo, o surgida de un contacto de la red. Hoy tiene **10 registros reales**, cargados desde el directorio público de CADIEEL (ver detalle en la respuesta del chat). El CSV de 1.800 sigue siendo la cantera de la que se van sacando candidatas una por una.

Si preferís que sí se cargue todo el CSV en bloque como universo de trabajo (aunque no esté enriquecido), decímelo y lo hago — es una decisión de criterio, no una limitación técnica.
