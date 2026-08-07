# 12 · Apollo — configuración y economía de créditos

**Estado de la conexión al 27/07/2026:** ✅ **Conectada y operativa** vía MCP.

---

## 1. Estado real de la cuenta — leer esto primero

| Recurso | Disponible | Para qué sirve |
|---|---|---|
| **Lead credits** | **75** | Revelar email de un contacto. **1 crédito = 1 contacto** |
| Direct dial credits | 160 | Revelar teléfono directo |
| AI credits | 5.000 | Funciones de IA de Apollo |
| **Export credits** | **0** | ⚠️ **No se pueden exportar listas a CSV** |
| Cuenta conectada | `deittausfm@gmail.com` | ⚠️ No es una casilla de IngentIA |

### Las dos cosas que hay que resolver en Fase 0

**⚠️ 1. Los 75 créditos no alcanzan.** La meta del trimestre es 1.800 cuentas en secuencia. Con 75 créditos se revelan 75 contactos: **el 4% de lo necesario**. El plan de volumen depende directamente de resolver esto.

**⚠️ 2. La cuenta está a nombre de un correo personal externo.** Todo el trabajo de prospección — listas, secuencias, historial — queda en una cuenta que no es de IngentIA. Hay que migrarla a una casilla corporativa antes de cargar cualquier dato de valor. Es un activo de la empresa, no de una persona.

### Decisión de Fase 0

| Opción | Costo | Cuándo conviene |
|---|---|---|
| **A. Upgrade a plan pago** | ~USD 49–99/mes según plan y facturación anual | **Recomendada.** Es el único camino al volumen objetivo. Verificar el plan vigente y los créditos incluidos antes de contratar |
| **B. Quedarse en free y priorizar** | USD 0 | Sólo viable para un piloto de 75 cuentas. Sirve para validar el copy antes de invertir, no para el trimestre completo |
| **C. Híbrido** | ~USD 50/mes | Apollo para descubrimiento de cuentas (barato) + verificación de emails con otra herramienta |

> **Recomendación:** arrancar con **B durante la semana 1** para validar el copy con 20 cuentas del dry-run, y **pasar a A antes del 11/08** (inicio de Fase 1). Sin upgrade, la meta de 600 cuentas/mes no es alcanzable y hay que reescribir las metas a la baja.

---

## 2. Economía de créditos — cómo no quemarlos

Esto es lo que hace la diferencia entre 75 créditos que rinden y 75 créditos tirados.

| Operación | Costo | Regla |
|---|---|---|
| **Organization Lookup** (`apollo_organizations_lookup`) | **Gratis** | ✅ **Usar siempre para descubrir cuentas.** Devuelve id, nombre, dominio y web |
| **Organization Search** (`apollo_mixed_companies_search`) | **1 crédito por request** (no por registro) | Devuelve hasta **100 empresas por request**. Usar `per_page: 100` siempre — con `per_page: 10` se paga lo mismo por 10 veces menos datos |
| **People Search** (`apollo_mixed_people_api_search`) | Créditos por revelar contacto | Filtrar al máximo antes de llamar |
| **Organization Enrich** | Según plan | Sólo sobre cuentas ya priorizadas |

### Las tres reglas de oro

1. **Nunca `per_page` menor a 100** en Organization Search. Un request de 10 resultados cuesta lo mismo que uno de 100.
2. **Descubrimiento con Lookup (gratis), revelado con Search (pago).** Se arma la lista completa de cuentas sin gastar, y sólo se pagan los contactos de las cuentas que superaron el score del ICP.
3. **Un contacto por cuenta al inicio.** Con 15–80 empleados alcanza con el decisor. Revelar 3 contactos por empresa triplica el costo sin triplicar la conversión.

> ⚠️ **Confirmación obligatoria:** las búsquedas pagas de Apollo consumen créditos irreversibles. **Ninguna búsqueda paga se ejecuta sin autorización explícita de Fernando o Pedro, caso por caso.** Los créditos gastados no se recuperan.

---

## 3. Búsqueda guardada — Industrial GBA

Configuración exacta para el ICP definido en `02_ICP_INDUSTRIAL_GBA.md`.

### Parámetros de Organization Search

```json
{
  "organization_locations": [
    "Buenos Aires, Argentina",
    "Ciudad Autónoma de Buenos Aires, Argentina",
    "San Isidro, Buenos Aires, Argentina",
    "Vicente López, Buenos Aires, Argentina",
    "Tigre, Buenos Aires, Argentina",
    "San Fernando, Buenos Aires, Argentina",
    "Pilar, Buenos Aires, Argentina",
    "Escobar, Buenos Aires, Argentina",
    "Malvinas Argentinas, Buenos Aires, Argentina",
    "General San Martín, Buenos Aires, Argentina",
    "Tres de Febrero, Buenos Aires, Argentina",
    "Morón, Buenos Aires, Argentina",
    "Hurlingham, Buenos Aires, Argentina",
    "Ituzaingó, Buenos Aires, Argentina",
    "La Matanza, Buenos Aires, Argentina",
    "Merlo, Buenos Aires, Argentina",
    "Avellaneda, Buenos Aires, Argentina",
    "Lanús, Buenos Aires, Argentina",
    "Quilmes, Buenos Aires, Argentina",
    "Lomas de Zamora, Buenos Aires, Argentina"
  ],
  "organization_num_employees_ranges": ["11,50", "51,200"],
  "organization_not_locations": ["United States", "Spain", "Brazil", "Chile", "Mexico"],
  "per_page": 100,
  "page": 1
}
```

### Clasificación de industria

Apollo indexa industria por **NAICS** y **SIC**. Códigos que corresponden al ICP:

| Rubro | NAICS |
|---|---|
| Fabricación de productos metálicos | `332` |
| Maquinaria | `333` |
| Equipamiento eléctrico y componentes | `335` |
| Autopartes y equipo de transporte | `3363` |
| Plásticos y caucho | `326` |
| Química y pinturas | `325` |
| Alimentos (procesamiento) | `311` |
| Packaging y papel | `322` |

**Exclusiones (`not_organization_naics_codes`):** `5415` (servicios informáticos) · `5416` (consultoría) · `44`–`45` (retail) · `52` (finanzas) · `92` (administración pública).

### Filtro por señal de compra — el más valioso

La señal más predictiva del ICP es **estar buscando gente para tapar un agujero de proceso**:

```json
{
  "q_organization_job_titles": [
    "administrativo", "administrativa", "facturación", "data entry",
    "analista de costos", "control de gestión", "asistente administrativo",
    "liquidación", "conciliación"
  ],
  "organization_job_posted_at_range": { "min": "2026-05-01" },
  "organization_job_locations": ["Buenos Aires", "Argentina"]
}
```

Una empresa industrial de 15–80 empleados que publicó una búsqueda de administrativo de facturación en los últimos 90 días es **la cuenta de mayor prioridad que existe** en este vertical. Entra directo a personalización profunda (A2).

### Filtro complementario: crecimiento de headcount

```json
{
  "organization_headcount_growth_past_n_months": 12,
  "organization_headcount_growth_range": { "min": 20 }
}
```

Creció más de 20% en 12 meses → la estructura administrativa está por crujir. Es exactamente el pitch de "¿si duplicás las ventas, qué colapsa primero?".

---

## 4. Búsqueda de personas

### Cargos objetivo

```json
{
  "person_titles": [
    "Owner", "Founder", "Dueño", "Socio Gerente",
    "CEO", "Gerente General", "Director General",
    "Gerente de Operaciones", "Director de Operaciones",
    "Gerente de Planta", "Jefe de Planta",
    "Gerente de Producción", "Jefe de Producción",
    "Gerente Administrativo", "Gerente de Administración y Finanzas",
    "CFO", "Director Financiero", "Contador General"
  ],
  "person_locations": ["Argentina"],
  "contact_email_status": ["verified"]
}
```

### Reglas

- **Sólo `verified`.** Los `guessed` no entran a email: van a la cola de llamada, usando los 160 créditos de direct dial.
- **Un decisor por cuenta.** Segundo contacto sólo si la cuenta supera 50 empleados o si el primero rebota.
- **Nunca casillas genéricas** (`info@`, `ventas@`, `administracion@`). No son decisores y disparan filtros de spam.

---

## 5. Orden de operaciones (el que ejecuta A1)

```
1. Leer 10a_cuentas_prioritarias.csv
       ↓
2. Organization Lookup por razón social          [GRATIS]
   → obtener apollo_org_id + dominio
       ↓
3. Filtrar: empleados 15–80, industria en ICP, HQ en AMBA
   → descartar todo lo que no cumple ANTES de gastar
       ↓
4. Cruzar contra la lista de supresiones
       ↓
5. Priorizar por score del ICP (§8 del doc 02)
       ↓
6. ⚠️ CONFIRMAR CON FERNANDO/PEDRO el lote y el costo
       ↓
7. People Search sobre el lote aprobado          [PAGO]
   → revelar 1 decisor verificado por cuenta
       ↓
8. Escribir en Supabase → estado_enriquecimiento = OK
       ↓
9. Pasar a A2 (personalización)
```

**El paso 3 es el que protege el presupuesto.** Filtrar después de revelar es tirar créditos.

---

## 6. Uso de los 75 créditos actuales — plan concreto

Mientras no haya upgrade, así se asignan:

| Asignación | Créditos | Para qué |
|---|---|---|
| Dry-run de validación de copy | 20 | Las 20 cuentas del test de entregabilidad de la semana 2 |
| Cuentas con señal 🔴 (búsqueda laboral activa) | 40 | Las de mayor probabilidad de conversión |
| Reserva | 15 | Reposición de rebotes y cuentas que aparezcan vía aliados |

Los **160 créditos de direct dial** se reservan para las cuentas A1 sin email verificado: llamada directa, que en PyME industrial argentina suele convertir mejor que el email.

---

## 7. Secuencias — dónde se ejecutan

Apollo permite crear secuencias, pero **el envío se hace desde el dominio secundario propio** (ver `11_PROTOCOLO_BASE_LEADS.md`), no desde la infraestructura compartida de Apollo. Motivo: control total de la reputación del dominio y de los límites de envío.

**Arquitectura:** Apollo = fuente de datos · n8n = orquestación y envío · Supabase = estado.

Los detalles del orquestador están en `30_ARQUITECTURA_AGENTES.md`.

---

## 8. Checklist de Fase 0

- [ ] Migrar la cuenta de Apollo a una casilla corporativa de IngentIA
- [ ] Decidir plan (upgrade vs. free) y, si aplica, contratarlo antes del 11/08
- [ ] Verificar créditos incluidos y costo por crédito adicional del plan elegido
- [ ] Crear la búsqueda guardada "Industrial GBA 15-80" con los parámetros de §3
- [ ] Crear la búsqueda guardada "Señal — búsqueda administrativa activa"
- [ ] Validar que Organization Lookup devuelve resultados útiles para razones sociales argentinas *(dato a confirmar: la cobertura de Apollo en PyME industrial argentina es desigual — si el hit rate es bajo, los padrones de ADIMRA y CADIEEL pasan a ser la fuente primaria)*
- [ ] Definir con Fernando el tope mensual de créditos y quién autoriza cada lote
