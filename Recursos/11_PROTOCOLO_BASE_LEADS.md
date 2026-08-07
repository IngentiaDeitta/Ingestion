# 11 · Protocolo de datos y prospección

**Responsable:** Fernando · **Aplica a:** toda actividad de prospección de IngentIA.

---

## 1. Origen de los datos

| Fuente | Titularidad | Uso permitido |
|---|---|---|
| **Base EK** (`silver_leads_rows_v2.xlsx`, 101.612 registros) | Elektro Korrosión — **con autorización de uso otorgada a IngentIA** | Extracción de cuentas objetivo y enriquecimiento. Ver §2 |
| **Apollo.io** | Datos firmográficos públicos, licenciados | Fuente principal de contactos |
| **Padrones de cámaras** (ADIMRA, CADIEEL, UIPBA) | Públicos | Libre |
| **LinkedIn / búsquedas laborales** | Público | Sólo lectura para detección de señales |

---

## 2. Cómo se usa la base de EK

### El estado real del dato

La autorización existe, pero el dato no está en condiciones de usarse tal cual. Números de la auditoría propia (`CRM\Presentaciones\Auditoria y limpieza Leads.txt`, 29/06/2026):

| Métrica | Valor |
|---|---|
| Registros activos post-depuración | 101.603 |
| Cumplimiento de regla de contactabilidad | 100% |
| **Cumplimiento de campos de negocio** (nombre, cargo, empresa, segmento) | **2,3%** |
| Registros con algún campo clave nulo | 99.241 |
| **Score global** | **~58% 🔴 Crítica** |

En el archivo curado de 7.058 filas, el campo `cargo` está vacío en **5.630 registros (80%)**.

> **Conclusión operativa:** la base sirve como **directorio de razones sociales**, no como lista de envío. Enviar sobre datos sin cargo ni decisor identificado produce mensajes genéricos, tasa de respuesta baja y quema de dominio. El valor está en las **empresas**, no en los contactos.

### Qué se extrae y qué no

| ✅ Se extrae | ❌ No se usa para envío |
|---|---|
| Razón social | Emails de la base EK |
| Segmento y subtipo de rubro | Teléfonos de la base EK |
| Localidad y provincia | Notas comerciales de EK |
| Densidad de contactos (señal de tamaño) | Estado del lead en el CRM de EK |
| Cargos conocidos (como pista para A1) | Historial de presupuestos de EK |

**Los contactos se obtienen siempre desde Apollo**, sobre las razones sociales extraídas. Esto no es sólo prolijidad legal: es lo que garantiza un decisor real con cargo verificado, que es lo que la base heredada no tiene.

### Separación de instancias

Los datos de EK y los de IngentIA **viven en bases separadas**. No se mezclan en la misma tabla ni se cruzan en el mismo workflow. La cláusula 8 del contrato (Oferta N° 1/2026) obliga a confidencialidad por 5 años desde la terminación, y la cláusula 10 limita el tratamiento de datos personales al cumplimiento del objeto del contrato.

---

## 3. Resultado de la extracción

Archivos generados:

| Archivo | Contenido |
|---|---|
| `10_cuentas_objetivo.csv` | Universo completo de cuentas únicas del segmento industrial/construcción de AMBA, con score y prioridad |
| `10a_cuentas_prioritarias.csv` | Subconjunto A1+A2 recortado a 1.800 cuentas — el volumen exacto del trimestre |

### Criterios aplicados

**Inclusión:** segmento Industrial, Automotriz, Energía/Infraestructura, Logística, Telecomunicaciones (tier A) o Construcción/Ingeniería, Proveedor/Contratista, Servicios Técnicos (tier B), con ubicación en AMBA.

**Deduplicación:** por razón social normalizada — sin acentos, sin puntuación, sin sufijo societario (SA, SRL, SACIF, SAIC…). "METALÚRGICA DEL SUR S.A." y "Metalurgica del Sur SRL" colapsan en una sola cuenta.

**Limpieza de localidad:** el campo `localidad` de la base viene contaminado con direcciones de calle. Si contiene dígitos se mueve a `direccion_detectada` y la localidad queda vacía, marcando la cuenta como `amba_confirmado = A VALIDAR`.

**Scoring:**

| Criterio | Puntos |
|---|---|
| Razón social con sufijo societario (empresa real, no fragmento) | +3 |
| Localidad de AMBA confirmada | +2 |
| Tiene al menos un cargo/decisor conocido | +2 |
| Tiene al menos un email en la base | +1 |
| Densidad de contactos | +1 por contacto, tope +3 |
| Nombre de una sola palabra y menos de 7 caracteres | −3 |
| Multinacional o gran corporativo (lista de exclusión) | −10 |

**Prioridades:** `A1` (score ≥ 7) · `A2` (score 4–6) · `B` (score < 4, cola) · `X` (excluida por tamaño).

### Exclusión por tamaño

Se descartan automáticamente las cuentas que matchean una lista de grandes corporativos y organismos: automotrices terminales, petroleras, telecomunicaciones, siderúrgicas, alimenticias multinacionales, bancos, retail, tecnológicas globales, sector público y salud pública. **Estas empresas están fuera del ICP** — tienen SAP, área de IT propia y compran por licitación.

Las que sobrevivan a la lista pero superen los 200 empleados serán filtradas por el agente **A1** con el dato de headcount de Apollo.

---

## 4. Cumplimiento — Ley 25.326

La autorización de EK cubre el uso del activo. **No exime del cumplimiento de la ley de protección de datos personales** en la comunicación con los destinatarios.

### Obligatorio en todo email saliente

1. **Identificación del remitente:** IngentIA, con dirección física y datos de contacto reales.
2. **Opt-out visible** en cada mensaje, con texto explícito:
   > *"Si no querés recibir más correos de IngentIA, respondé BAJA y no volvemos a escribirte."*
3. **Baja procesada en menos de 48 horas** y registrada en una tabla `supresiones` permanente.
4. **La lista de supresión se cruza antes de cada envío.** Un contacto dado de baja no vuelve a entrar en ninguna secuencia, nunca, aunque cambie de empresa.
5. **Derecho de acceso, rectificación y supresión:** si alguien lo pide, se responde y se ejecuta.
6. **No se envía a datos sensibles ni a personas físicas fuera de contexto profesional.** Sólo direcciones corporativas de decisores en su rol laboral.

### Registro de trazabilidad

Cada envío queda registrado con: fecha, destinatario, secuencia, origen del dato (Apollo / cámara / aliado) y estado. Ante un reclamo, hay que poder decir de dónde salió ese contacto.

---

## 5. Higiene de dominio y entregabilidad

> **Regla dura: nunca se envía cold email desde `ingentia.com.ar`.** Es el dominio de las facturas, los contratos y la comunicación con clientes. Si entra en una blocklist, se pierde el canal principal del negocio.

### Setup del dominio de envío

| Paso | Detalle | Cuándo |
|---|---|---|
| 1 | Comprar dominio secundario ✅ `ingentiatech.com` | Hecho 29/07/2026 |
| 2 | Configurar **SPF**, **DKIM** y **DMARC** (`p=none` al inicio) | ✅ Hecho y confirmado por DNS 29/07/2026 |
| 3 | Crear buzón(es) real(es) con nombre y apellido de persona — nunca `info@` o `ventas@` | ✅ `pedro@ingentiatech.com` — **1 solo buzón por decisión de Fernando (29/07), para no pagar una licencia extra** |
| 4 | Firma completa con teléfono, web y dirección física | Pendiente |
| 5 | **Warm-up progresivo** — ver tabla | ✅ **Fecha confirmada** |

### Calendario confirmado (29/07/2026)

| Cuándo | Qué |
|---|---|
| **Jueves 30/07** | 🧪 **Piloto** — ~10 emails enviados manualmente desde `pedro@ingentiatech.com`, uno por uno, a contactos reales verificados. Objetivo: confirmar que el dominio nuevo entrega a inbox y no a spam antes de comprometer el resto de la semana |
| **Fin de semana** | Revisar entregabilidad del piloto (¿entró a inbox o a spam/promociones? ¿algún rebote?) |
| **Martes 4/08** | Arranca formalmente la curva de warm-up de abajo — **una semana antes** de lo previsto originalmente (11/08) |

### Curva de warm-up — 1 buzón (`pedro@ingentiatech.com`)

> ⚠️ **Actualizado 29/07/2026.** El plan original asumía 2 buzones. Se decidió operar con uno solo para no sumar costo de licencia. Los números de abajo reflejan esa realidad — **no son la mitad de la tabla vieja, son menores**, porque el envío sigue limitado a martes-jueves.

| Semana | Fechas | Envíos/día | Volumen semanal (máx.) |
|---|---|---|---|
| 1 | 4–6 ago | 10 | ~30 |
| 2 | 11–13 ago | 20 | ~60 |
| 3 | 18–20 ago | 30 | ~90 |
| **4 en adelante** | **desde el 25 ago** | **40** | **~120** |

Con 3 toques de email por cuenta en la secuencia, el techo de ~120 envíos/semana en régimen equivale a aproximadamente **40 cuentas nuevas/semana** entrando al embudo por este canal — no las 150/semana del plan original con 2 buzones.

**Compensación:** el volumen que no cubre el cold email lo aportan Apollo 1:1, la red de aliados y los contactos personales — canales que no dependen de la capacidad del buzón. Si en unas semanas 40/semana resulta insuficiente, la opción más simple es sumar días de envío (lunes a viernes en vez de martes-jueves), que llevaría el techo a ~200/semana sin agregar un buzón nuevo.

### Reglas de envío

- Máximo **40 emails por buzón por día**. Nunca más.
- **Sin imágenes, sin tracking pixels, sin links acortados** en el primer email. Todo eso dispara filtros.
- Máximo **un link** por email, y recién a partir del toque 2.
- **Texto plano o HTML mínimo.** Un email de un ingeniero a otro ingeniero no lleva banner.
- **Pausa automática de toda la secuencia** ante cualquier respuesta del destinatario.
- Envíos en horario laboral argentino, martes a jueves, 9–11 h o 14–16 h.

### Umbrales de alarma

| Métrica | Umbral | Acción |
|---|---|---|
| Bounce rate | > 3% | **Frenar todo.** La lista está sucia, hay que re-verificar |
| Tasa de spam reportado | > 0,1% | Frenar. Revisar copy y segmentación |
| Entregabilidad a inbox | < 90% | No escalar volumen hasta corregir |
| Tasa de respuesta | < 2% | El problema es el copy o la lista, no el volumen |

---

## 6. Verificación de emails antes de enviar

Todo email obtenido de Apollo pasa por verificación antes de entrar en secuencia:

1. **Sintaxis y dominio** — el dominio debe resolver MX.
2. **Filtro de proveedores muertos** — heredado de la depuración de EK: `@arnet.com.ar`, `@speedy.com.ar`, `@fibertel.com.ar` y similares son rebotes seguros.
3. **Descarte de catch-all sin verificación** — si el servidor acepta todo, el email no está confirmado.
4. **Descarte de rol genérico** — `info@`, `ventas@`, `administracion@` no son decisores. Sólo nominativos.

Apollo devuelve un estado de verificación; **sólo se envía a `verified`.** Los `guessed` van a la cola de llamada telefónica, no a email.

---

## 7. Checklist antes de activar cualquier campaña

- [ ] Dominio secundario con SPF, DKIM y DMARC configurados y verificados
- [ ] Warm-up completado (mínimo 3 semanas) o volumen ajustado a la semana correspondiente
- [ ] Lista cruzada contra la tabla de supresiones
- [ ] Todos los emails en estado `verified`
- [ ] Opt-out presente en cada plantilla de la secuencia
- [ ] Bounce rate del último envío por debajo del 3%
- [ ] Ningún dato de contacto proveniente de la base de EK
- [ ] Dry-run de 20 cuentas ejecutado y medido
