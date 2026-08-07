# Guía paso a paso · Activar la entrada automática de Leads

Objetivo: que los leads del formulario de la web y de las reuniones agendadas en Cal.com
aparezcan solos en la sección **Leads** de Ingestion.

> Los dos códigos secretos que necesitás para esta guía te los pasé por chat.
> No se guardan en este archivo por seguridad. Si los perdiste, pedímelos de nuevo.

---

## BLOQUE 1 · Supabase — cargar los dos códigos (5 minutos)

1. Abrí este link: https://supabase.com/dashboard/project/gaawloviqgyzmqbtjsmd/settings/functions
2. Si te pide login, entrá con tu cuenta.
3. La página se llama **Edge Functions**. Buscá la sección **Secrets** (o "Edge Function Secrets").
4. Vas a ver un botón **Add new secret**. Clickealo.
5. Aparecen dos casilleros: **Key** y **Value**.
   - En **Key** escribí: `LEAD_INTAKE_SECRET`
   - En **Value** pegá el **CÓDIGO 1** que te pasé por chat.
6. Clickeá **Save**.
7. Repetí desde el paso 4 para el segundo:
   - En **Key** escribí: `CALCOM_WEBHOOK_SECRET`
   - En **Value** pegá el **CÓDIGO 2**.
8. Clickeá **Save**. Deberías ver los dos nombres listados.

✅ Listo el Bloque 1. Avisame acá y yo verifico que quedaron bien cargados.

---

## BLOQUE 2 · Vercel — cargar un código en la web (3 minutos)

1. Entrá a https://vercel.com y logueate.
2. En la lista de proyectos, entrá al de la web de IngentIA.
3. Arriba, clickeá la pestaña **Settings**.
4. En el menú de la izquierda, clickeá **Environment Variables**.
5. Vas a ver casilleros para **Key** y **Value**:
   - En **Key** escribí: `LEAD_INTAKE_SECRET`
   - En **Value** pegá el **CÓDIGO 1** (el mismo del Bloque 1, paso 5 — tiene que ser idéntico).
6. Abajo hay tres opciones marcables: **Production**, **Preview**, **Development**.
   Dejá las tres tildadas.
7. Clickeá **Save**.

✅ Listo el Bloque 2.

---

## BLOQUE 3 · Publicar la web (lo hago yo)

Ya modifiqué el archivo del formulario para que mande los leads a Ingestion.
Falta publicarlo. Decime "publicá la web" por chat y yo me encargo.

---

## BLOQUE 4 · Cal.com — conectar el calendario (3 minutos)

1. Entrá a https://app.cal.com y logueate.
2. Abajo a la izquierda clickeá tu foto/nombre → **Settings**.
3. En el menú de la izquierda buscá la sección **Developer** → clickeá **Webhooks**.
4. Clickeá el botón **New** (arriba a la derecha).
5. Completá el formulario:
   - **Subscriber URL**: `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/lead-intake`
   - **Event Triggers**: destildá todo y dejá tildado SOLO **Booking Created**
   - **Secret**: pegá el **CÓDIGO 2** (el mismo del Bloque 1, paso 7)
   - **Enable Webhook**: dejalo activado
6. Clickeá **Create Webhook**.

### Opcional pero recomendado: preguntar la empresa al agendar

Si el formulario de reserva no pregunta por la empresa, el sistema la deduce del
dominio del email (ej. `juan@acme.com` → `acme.com`). Si la persona agenda con Gmail,
queda solo el nombre. Para evitarlo:

1. En Cal.com andá a **Event Types** → abrí el evento de 30 minutos.
2. Clickeá la pestaña **Advanced**.
3. Buscá **Booking questions** → **Add a question**.
4. Type: `Short Text` · Label: `¿Nombre de tu empresa?` · Marcala como requerida.
5. **Save**.

✅ Listo el Bloque 4.

---

## BLOQUE 5 · Probar que todo funciona

### Prueba A — Formulario web
1. Entrá a tu web y completá el formulario de contacto con datos de prueba
   (usá un email tuyo, no uno inventado).
2. Esperá 1 minuto.
3. Abrí Ingestion → sección **Leads**. Tiene que aparecer el lead nuevo.

### Prueba B — Cal.com
1. Entrá a tu propio link de Cal.com (el de la sesión de 30 min) y agendá una reunión de prueba.
2. Esperá 1 minuto.
3. Abrí Ingestion → sección **Leads**. Tiene que aparecer con estado **REUNION_AGENDADA**.

> Si hiciste las dos pruebas con el mismo email, NO vas a ver dos leads: el sistema
> detecta que es la misma persona y actualiza el existente. Eso es correcto.

---

## Si algo no aparece

Avisame y yo reviso los registros del sistema para ver dónde se cortó.
No hace falta que investigues nada.
