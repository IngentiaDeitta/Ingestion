# 13 · Configurar ingentiatech.com en Namecheap — guía paso a paso

## Estado (actualizado 29/07/2026)

- [x] Paso 0 — Dominio comprado
- [x] Paso 1-3 — Dominio verificado en Google Workspace ✅ *("Has verificado ingentiatech.com" confirmado en pantalla)*
- [x] Paso 4 — MX, SPF y DMARC cargados y **confirmados por DNS público** (`smtp.google.com` prioridad 1, SPF y DMARC correctos)
- [x] Paso 5 — DKIM ✅ **confirmado por DNS público** (selector `google`, clave RSA publicada correctamente)
- [ ] Reactivar las 2 licencias suspendidas y renombrarlas a `@ingentiatech.com`
- [ ] Warm-up del dominio (arranca cuando lo anterior esté cerrado)

**Autenticación de correo: 100% completa.** MX + SPF + DKIM + DMARC, los cuatro verificados por DNS público el 29/07/2026.


**Para quién:** Fernando, sin perfil técnico. Cada paso dice exactamente dónde hacer clic.
**Tiempo total:** ~20 minutos, repartidos en 3 momentos (algunos pasos requieren esperar a Google).

---

## Antes de empezar — el orden importa

No se puede hacer todo de una sola vez, porque algunos datos hay que sacarlos de Google primero y pegarlos en Namecheap después. El orden es:

1. Comprar el dominio en Namecheap *(si todavía no lo compraste)*
2. Ir a Google, pedirle que agregue el dominio → **Google te da un código**
3. Ir a Namecheap, pegar ese código
4. Volver a Google, confirmar
5. Ir a Namecheap, cargar los registros de correo (estos ya te los doy hechos, no hay que esperar nada)
6. Volver a Google, generar la clave DKIM → **Google te da otro código**
7. Ir a Namecheap, pegar ese código
8. Listo — avisame y verifico que todo quedó bien

---

## Paso 0 — Comprar el dominio *(si no lo compraste todavía)*

1. Entrá a **namecheap.com**
2. En el buscador de arriba, escribí `ingentiatech.com` y dale a **Search**
3. Debería aparecer en verde como disponible. Hacé clic en **Add to Cart**
4. Arriba a la derecha, clic en el carrito → **Checkout**
5. **Importante:** en esa pantalla te van a ofrecer un montón de extras (hosting, email, protección premium). **No aceptes ninguno.** Sólo necesitás el dominio pelado
6. Completá el pago y confirmá la compra

Namecheap te va a mandar un mail confirmando el registro. Con eso ya estás listo para el paso 1.

---

## Paso 1 — Pedirle a Google que agregue el dominio

*(Esto lo hacés en Google, no en Namecheap. Te lo pongo igual porque es el paso anterior al que sigue.)*

1. Andá a **admin.google.com** e iniciá sesión con la cuenta administradora de IngentIA
2. En el menú de la izquierda: **Cuenta → Dominios → Administrar dominios**
3. Clic en **Agregar un dominio**
4. Escribí `ingentiatech.com` y elegí la opción **"Dominio secundario"** (no "alias de dominio")
5. Google te va a mostrar una pantalla con un texto que empieza más o menos así:

   ```
   google-site-verification=abc123XYZ...
   ```

   **Copiá ese texto completo.** Es el "código de verificación". Lo vas a necesitar en el paso siguiente. No cierres esa pestaña de Google todavía, la vas a necesitar para confirmar después.

---

## Paso 2 — Cargar el código de verificación en Namecheap

Ahora sí, en Namecheap:

1. Entrá a **namecheap.com** e iniciá sesión
2. Arriba a la derecha, hacé clic en tu usuario → **Dashboard** (o directamente si ya estás en el dashboard, seguís)
3. En el menú de la izquierda vas a ver **Domain List**. Hacé clic ahí
4. Vas a ver `ingentiatech.com` en una lista. A la derecha de esa fila hay un botón que dice **Manage**. Hacé clic
5. Se abre la página de gestión del dominio. Arriba vas a ver una fila de pestañas: `Domain | Nameservers | Contacts | Advanced DNS | ...` — **hacé clic en "Advanced DNS"**
6. Vas a ver una sección que dice **Host Records** (o "Registros de host"), con una tabla que puede tener una o dos filas ya cargadas por defecto (a veces Namecheap pone una redirección de "página de estacionamiento" — no te preocupes por eso todavía, lo vemos en el paso 4)
7. Buscá el botón **Add New Record** (suele estar abajo a la izquierda de esa tabla, o como un botón `+`)
8. Se agrega una fila nueva vacía con varios campos. Completala así:

   | Campo | Qué poner |
   |---|---|
   | **Type** (tipo) | Elegí **TXT Record** del desplegable |
   | **Host** | Escribí `@` |
   | **Value** (valor) | Pegá el código completo que copiaste de Google (`google-site-verification=...`) |
   | **TTL** | Dejalo en **Automatic**, no lo toques |

9. A la derecha de esa fila hay un **✓ (tilde verde)** o un botón de guardar — hacé clic ahí para confirmar esa fila
10. Con eso ya está cargado. **Ahora esperá unos 10-15 minutos** antes de seguir (el cambio tarda un poco en "viajar" por internet)

---

## Paso 3 — Confirmar en Google

1. Volvé a la pestaña de Google que dejaste abierta (o volvé a entrar a **admin.google.com → Cuenta → Dominios**)
2. Hacé clic en **Verificar** (o "Verify")
3. Si Google dice que no encuentra el registro todavía, esperá 15 minutos más e intentá de nuevo — es normal, no significa que algo esté mal
4. Cuando confirme, avisame y seguimos con el paso 4

---

## Paso 4 — Cargar los registros de correo (MX, SPF, DMARC)

⚠️ **Corrección importante:** el registro MX en Namecheap **no se carga en "Host Records"** como el resto — Namecheap lo separó en una sección aparte llamada **"Mail Settings"**, y hay que activarla antes de poder escribir nada. Además, Google simplificó su configuración: ya no son 5 registros, **es uno solo**.

### 4.1 — Activar "Custom MX"

1. Seguís en **Namecheap → Domain List → Manage → Advanced DNS**
2. En esa misma página, buscá una sección aparte (arriba o abajo de "Host Records") que se llama **"Mail Settings"**
3. Ahí hay un desplegable. Probablemente diga algo como "No Email" o "Namecheap Private Email" — **cambialo a "Custom MX"**
4. Al elegir "Custom MX" se abre una tabla nueva, específica para el MX, separada de Host Records

### 4.2 — Cargar el único registro MX

En esa tabla de Mail Settings que se abrió, completá:

| Campo | Qué poner |
|---|---|
| Host | `@` |
| Value | `SMTP.GOOGLE.COM` |
| Priority | `1` |
| TTL | Automatic |

Guardá con el tilde ✓.

### 4.3 — Los TXT sí van en "Host Records" (como antes)

Volvés a la sección **Host Records** (la de siempre) y con **Add New Record** cargás estos dos:

| Type | Host | Value | TTL |
|---|---|---|---|
| TXT Record | `@` | `v=spf1 include:_spf.google.com ~all` | Automatic |
| TXT Record | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contacto@ingentiatech.com; pct=100` | Automatic |

**Antes de cargarlos**, fijate si en Host Records ya hay alguna fila puesta por Namecheap por defecto (suele ser una de tipo "URL Redirect Record" o "CNAME" apuntando a una "parking page"). Si hay una, borrala con el ícono de tacho 🗑 — no debería chocar con lo que vamos a cargar, pero mejor que la página quede limpia.

Cuando termines el MX y los dos TXT, avisame.

---

## Paso 5 — DKIM *(el último paso, un poco más adelante)*

Este lo hacemos cuando el paso 4 ya esté propagado (~24 h después). Es el mismo circuito que el paso 1-2: Google te da un código nuevo, vos lo pegás en Namecheap.

1. En Google: **admin.google.com → Apps → Google Workspace → Gmail → Autenticar correo electrónico**
2. Elegí `ingentiatech.com` en el desplegable de arriba
3. Clic en **Generar registro nuevo**
4. Google te muestra un **Nombre de host** (algo como `google._domainkey`) y un **Valor** larguísimo que empieza con `v=DKIM1...`
5. Copiá los dos datos
6. Volvés a Namecheap → Advanced DNS → **Add New Record**:

   | Campo | Qué poner |
   |---|---|
   | Type | TXT Record |
   | Host | Lo que te dio Google (ej. `google._domainkey`) |
   | Value | El valor larguísimo que empieza con `v=DKIM1...` |
   | TTL | Automatic |

7. Guardá con el tilde ✓
8. Esperá unos 15 minutos, volvé a Google y hacé clic en **Iniciar autenticación**

---

## Si te trabás en algún paso

Sacale una captura de pantalla a lo que estás viendo y mandámela — reconozco la interfaz de Namecheap y te digo exactamente dónde hacer clic, aunque haya cambiado un poco de lugar respecto a esta guía (las webs cambian el diseño de vez en cuando).

## Cuando termines todo

Avisame. Yo puedo consultar los registros DNS públicos de `ingentiatech.com` y confirmarte si quedó todo bien configurado, sin necesidad de que me des acceso a nada.
