# SOP · Intake y Envío Automático (Cal.com, Formulario Web, Tactiq, Cotizaciones)

Este documento cubre la configuración **externa** (fuera del repo) necesaria para que los leads entren solos a la bandeja de `Leads.tsx` y las transcripciones de Tactiq lleguen solas a la ficha del lead.

Endpoints ya desplegados (Supabase Edge Functions, proyecto `gaawloviqgyzmqbtjsmd`):

- `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/lead-intake`
- `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/tactiq-transcript`

Ambos endpoints están probados con `curl` y funcionando. **Antes de exponerlos en producción**, configurá los secretos en el dashboard de Supabase (Project Settings → Edge Functions → Secrets):

- `LEAD_INTAKE_SECRET` — string random cualquiera. El formulario web debe mandarlo en el header `x-webhook-secret`.
- `CALCOM_WEBHOOK_SECRET` — el mismo secret que configures en Cal.com (paso 1 de abajo). Sin este secret configurado, el endpoint **rechaza todos los webhooks de Cal.com** (falla cerrado, no abierto).
- `TACTIQ_WEBHOOK_SECRET` — string random para el Zap de Tactiq (header `x-webhook-secret`).

---

## 1. Cal.com → `lead-intake`

1. Entrá a tu cuenta de Cal.com → **Settings → Developer → Webhooks → New Webhook**.
2. Payload URL: `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/lead-intake`
3. Event: `Booking Created` (marcá solo ese, no todos).
4. Secret: generá un string random y guardalo como `CALCOM_WEBHOOK_SECRET` en Supabase (paso de arriba). Cal.com firma cada request con este secret en el header `cal-signature-256`; el endpoint lo verifica antes de insertar nada.
5. Guardar y hacer un booking de prueba → confirmar que aparece un lead nuevo con `fuente = 'Cal.com'` en `Leads.tsx`.

## 2. Formulario Web → `lead-intake`

El formulario de la web debe hacer un `POST` a la misma URL con:

```json
{
  "company": "Nombre de la empresa",
  "name": "Nombre del contacto",
  "email": "contacto@empresa.com",
  "phone": "+54 9 11 ...",
  "message": "Lo que haya escrito en el campo de mensaje"
}
```

y el header `x-webhook-secret: <LEAD_INTAKE_SECRET>`.

## 3. Tactiq → Zapier → `tactiq-transcript`

Tactiq no tiene webhook genérico nativo (su "AI Workflow" builder solo soporta integraciones nombradas: Slack, HubSpot, Notion, etc). El puente soportado es vía Zapier:

1. En Zapier, creá un Zap nuevo.
2. **Trigger:** app "Tactiq" → evento **"Meeting Transcript Is Ready"**. Conectá tu cuenta de Tactiq.
3. **Action:** app "Webhooks by Zapier" → evento **POST**.
   - URL: `https://gaawloviqgyzmqbtjsmd.supabase.co/functions/v1/tactiq-transcript`
   - Payload Type: `json`
   - Data:
     - `email`: mapeá el campo del asistente/invitado de la reunión que trae el trigger de Tactiq (email del contacto — es el campo que usamos para matchear el lead).
     - `transcript`: mapeá el campo de texto completo de la transcripción.
   - Headers: `x-webhook-secret: <TACTIQ_WEBHOOK_SECRET>`
4. Publicá el Zap y hacé una reunión corta de prueba. Si el email de Tactiq coincide con el `email` cargado en `leads_cuentas`, el transcript aparece solo en `Radiografia.tsx` sin pegarlo a mano. Si no matchea a ningún lead, el endpoint devuelve `matched: false` (revisar en el historial de tareas de Zapier) — no rompe el Zap, pero tampoco carga nada.

> Nota: los nombres exactos de los campos disponibles en el trigger "Meeting Transcript Is Ready" de Tactiq no están documentados públicamente — al configurar el Zap, Zapier te muestra un test real con los campos disponibles; ahí confirmás cuál es el de email y cuál el de transcript completo.

## 4. Envío de cotizaciones por email → `send-quote-email`

A diferencia de las funciones de arriba, esta la llama la app estando vos logueado (no un webhook externo), así que no necesita secret propio — pero sí necesita las credenciales de Resend:

1. Creá una cuenta en [resend.com](https://resend.com) (tiene tier gratuito, 100 emails/día).
2. **Verificá el dominio de envío.** Usá `ingentiatech.com` (el dominio secundario ya calentado para cold email según `Recursos/11_PROTOCOLO_BASE_LEADS.md` §5) y **no** `ingentia.com.ar` — mandar cotizaciones desde el dominio de cold email no arriesga la reputación del dominio de facturas/contratos.
3. En Resend, generá una API Key (Settings → API Keys).
4. Cargá dos secrets en Supabase (Project Settings → Edge Functions → Secrets):
   - `RESEND_API_KEY` — la key que generaste.
   - `RESEND_FROM_EMAIL` (opcional) — remitente, por ejemplo `IngentIA <propuestas@ingentiatech.com>`. Si no lo cargás, usa ese mismo valor por default.
5. En `SmartQuoter.tsx`, después de guardar una cotización cuyo cliente tiene email cargado, aparece la opción "Enviar por Email". Al enviarla, `quotes.sent_date` se actualiza y el estado pasa de `Generada` a `Enviada` automáticamente (si ya estaba en `Aceptada`, no se pisa).
