# 44 · Auditoría de entregables — EK Módulo 1

**Fecha:** 28/07/2026 · **Objetivo:** determinar qué falta para facturar los USD 1.500 del hito "contra entrega de Módulo 1" (Oferta N° 1/2026, cláusula 5.3).

---

## Veredicto

**El Módulo 1 está sustancialmente ejecutado.** Lo que falta no es trabajo técnico: es **empaquetado formal y aceptación escrita**. Estimación: **2 a 3 días de trabajo**, la mayor parte de redacción y consolidación.

| Fase | Entregable exigido (Anexo B) | Estado | Falta |
|---|---|---|---|
| **Fase 0** | Diagrama de Procesos 360° (mapa de flujo validado) | 🟡 **90%** | Representación visual del flujo |
| **Fase I** | Informe de Diseño Lógico y Diccionario de Datos | 🟠 **60%** | **El Diccionario de Datos** y el modelo entidad-relación |
| **Fase II** | Prototipo Interactivo y ajustable | 🟢 **95%** | Confirmar que EK lo navegó |
| — | Acta de Entrega + conformidad escrita | 🔴 **0%** | Todo |

---

## Fase 0 — Mapeo As-Is / To-Be

### Lo que existe

| Documento | Fecha | Aporte |
|---|---|---|
| **`Relevamiento AS IS v2.0`** *(Google Doc)* | 09/07/2026 | ⭐ **Es el entregable.** Actores, flujo paso a paso de 16 pasos, 6 excepciones documentadas, traducción funcional To-Be, matriz de trazabilidad y puntos de dolor. Cierra con "FASE 0.6 — VALIDACIÓN (THE CHECK-OFF)" declarando nivel de preparación ALTO |
| `EK_ASIS_TOBE_CRM_PYME.docx` | 28/05/2026 | Informe de avance. Marcado "Borrador para revisión", con todo "en progreso" — **quedó superado por el anterior** |
| `Informe de Transformación Digital (Fase 1).docx` | 29/05/2026 | Cuantifica el AS-IS: 155.666 contactos hallados vs. 10.000 esperados. Excelente material de valor percibido |
| `Mapa de Arquitectura_ CRM Inteligente EK.docx` | 05/05/2026 | Arquitectura técnica |
| `Documento Funcional - EK CRM.pdf` | — | Reglas de negocio |
| `Criterios de Aceptación y reglas de negocio` *(Google Doc)* | 10/06/2026 | Criterios de aceptación |

### Lo que falta

**El Anexo B dice literalmente "Diagrama de Procesos 360° (Mapa de flujo validado)".** Lo que existe es un documento de texto excelente, pero **no hay un diagrama**. Un cliente que lee "diagrama" en el contrato espera ver un flujo dibujado.

**Acción:** generar el diagrama de flujo a partir del `Relevamiento AS IS v2.0`, que ya tiene los 16 pasos y las 6 ramificaciones definidas. Es trabajo de representación, no de análisis. Con Mermaid o similar sale en pocas horas.

### Observación de gobierno

`Relevamiento AS IS v2.0` es propiedad de **`deittausfm@gmail.com`**, una cuenta personal externa. Un entregable contractual no debería vivir ahí. Transferir la propiedad a `contacto@ingentia.com.ar` antes de entregarlo.

---

## Fase I — Auditoría de datos históricos

### Lo que existe

| Documento | Fecha | Aporte |
|---|---|---|
| **`Informe de Auditoría y Calidad de Datos.docx`** | 02/07/2026 | ⭐ Muy completo. 5 dimensiones de calidad, semáforo de scores, lógica de cada filtro aplicado, tratamiento diferenciado de emails |
| `Informe_Auditoria_Proceso_Calidad_Datos.txt` | 02/07/2026 | Versión técnica del anterior |
| `EK_MASTER_PROMPT_DQ.md` | 25/05/2026 | Reglas de calidad codificadas |
| `Directivas_Panel_EK.md` | 08/06/2026 | Directivas del panel |
| Tablas `silver_*` en Supabase | 02/07/2026 | Datos cargados y normalizados |
| Exportaciones `silver_*_rows_v2.xlsx` | 02/07/2026 | Entregables de revisión para el cliente |

### Estado real de los datos en Supabase

| Tabla | Registros |
|---|---|
| `silver_leads` | 101.603 |
| `silver_leads_eliminados` | 154.860 |
| `silver_pptos` | 2.284 |
| `silver_obras` | 1.212 |
| `master_instalaciones_tanques` | 477 |
| `silver_clientes` | 277 |
| `silver_terceros` | 20 |
| `master_servicios` | 9 |

### Lo que falta — el gap principal

El Anexo B exige **"Informe de Diseño Lógico y Diccionario de Datos"**. Son dos cosas y **ninguna existe como documento formal**:

1. **Diccionario de Datos** — tabla por tabla, campo por campo, con tipo de dato, obligatoriedad, dominio de valores y descripción funcional. El informe de auditoría explica las *reglas de calidad*, no el *esquema*.
2. **Informe de Diseño Lógico** — el modelo entidad-relación: qué entidades existen, cómo se vinculan, qué claves las relacionan.

**Buena noticia:** el esquema real ya está en Supabase y es consistente. El diccionario se genera a partir de él. Ya lo hice — ver `Clientes\Elektro Korrosión - EK\CRM\Entregables Módulo 1\Diccionario de Datos - EK CRM.md`.

El modelo entidad-relación también sale del `Relevamiento AS IS v2.0`, que ya define las 6 entidades core: Lead · Cliente · Tercero · Presupuesto · Obra · Tanque.

---

## Fase II — Prototipado de alta fidelidad

### Lo que existe

| Artefacto | Fecha | Contenido |
|---|---|---|
| `UX_UI\` — 6 pantallas HTML | 09/06/2026 | Home · Comercial · Clientes · Clientes360 · Obras · Omnicanal |
| `App\Elektrokorrosión CRM TO-BE-handoff.zip` | — | Bundle de handoff de Claude Design |
| `App\...\project\EK System.dc.html` | — | Diseño principal, 117 KB |

Cubre el alcance: *"Diseño de la interfaz destinada a centralizar la operación, con el objetivo de validar la experiencia de usuario y asegurar la adopción temprana"*.

### Lo que falta

**Confirmar que EK efectivamente lo navegó.** El Anexo B pide un prototipo "interactivo y ajustable" — eso implica que el cliente pudo usarlo y pedir ajustes. Si las pantallas sólo se mostraron en una pantalla compartida durante una reunión, conviene publicarlas en una URL para que Leandro las recorra por su cuenta antes de firmar la aceptación.

Hay una minuta de definición funcional que probablemente cubre esta validación — **verificar si consta ahí la conformidad sobre el prototipo.**

---

## 🔴 Hallazgo de seguridad — fuera del alcance del hito, pero urgente

**10 tablas tienen Row Level Security desactivado**, entre ellas `silver_leads` (101.603 registros con datos personales de terceros), `silver_clientes`, `silver_pptos` y `silver_obras`.

Con RLS desactivado, cualquiera que tenga la `anon key` — que por diseño viaja en el frontend y se considera pública — puede **leer y modificar** todas esas filas.

**Por qué importa:**
- Son datos personales de terceros alcanzados por la **Ley 25.326**
- La **cláusula 10.2** del contrato obliga a ambas partes a aplicar medidas de seguridad adecuadas a la naturaleza de la información
- La **cláusula 10.3** obliga a notificar a la otra parte cualquier acceso no autorizado

**Situación contractual:** RLS figura en la **Fase III (Módulo 2)** del Anexo B, así que no hay incumplimiento de este hito. Pero los datos ya están cargados y expuestos ahora, antes de que exista la capa de seguridad. **El riesgo es real hoy, aunque la obligación venza después.**

**Estado: 🅿️ PARQUEADO por decisión de Fernando (28/07/2026).**

Motivo: el Módulo 1 es prototipado para validar user flow y funcionalidades, no desarrollo productivo. La app no está publicada y el acceso estuvo limitado a los socios. El riesgo real hoy es bajo.

> ⚠️ **Bloqueante de puesta en producción.** La exposición no depende de qué datos muestre el prototipo: los 105.396 registros reales ya están cargados en Supabase. **No se publica la app en ninguna URL accesible sin resolver esto primero.**

Solución ya escrita y lista para aplicar: `Clientes\Elektro Korrosión - EK\Gobierno_de_Datos\RLS_politicas_propuestas.sql`

Incluye el diagnóstico completo, las políticas, la verificación, el checklist de pruebas y el rollback. Pendientes asociados: definir la autenticación de los ESP32 para `telemetry`, y rotar la `anon key` al pasar a producción.

> **No se aplica el `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sin definir políticas primero:** RLS sin políticas bloquea todo acceso y rompe cualquier integración activa.

---

## Plan de cierre — 5 pasos

| # | Acción | Quién | Esfuerzo |
|---|---|---|---|
| 1 | **Generar el Diccionario de Datos** *(hecho — revisar)* | — | ✅ |
| 2 | Redactar el Informe de Diseño Lógico con el modelo entidad-relación | Fernando | ~4 h |
| 3 | Dibujar el Diagrama de Procesos 360° a partir del Relevamiento AS IS v2.0 | Fernando | ~3 h |
| 4 | Transferir la propiedad del Google Doc a la cuenta corporativa | Fernando | 5 min |
| 5 | Consolidar todo en una carpeta de entregables + **Acta de Entrega** | — | ~2 h |
| 6 | Sesión de aceptación con Leandro Gino + conformidad por escrito | Pedro | 1 reunión |
| 7 | **Emitir factura por USD 1.500** | Fernando | — |

**Camino crítico: 2–3 días de trabajo + 1 reunión.**

---

## Riesgo del cierre

El contrato **no tiene cláusula de aceptación tácita**. Si EK no responde, el hito queda en el limbo indefinidamente. La cláusula 3.4 obliga a EK a designar un responsable de validación y proveer información en tiempo — se puede invocar si pasan 10 días hábiles sin respuesta.

**Corrección para contratos nuevos** *(ya incorporada en las plantillas `22_` y `23_`)*: si no se reciben observaciones dentro de los 5 días hábiles posteriores a la entrega, los entregables se consideran aceptados.
