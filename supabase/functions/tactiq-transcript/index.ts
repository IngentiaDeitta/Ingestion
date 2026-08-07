// Receives meeting transcripts from the Tactiq -> Zapier -> "Webhooks by Zapier"
// bridge (Tactiq has no native generic webhook, see Recursos/README for the Zap
// setup). Matches the lead by the attendee's email and stores the transcript.
// Auth: shared-secret header (external caller, not a logged-in app user) —
// verify_jwt is disabled at deploy time and this custom check replaces it.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-webhook-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sharedSecret = Deno.env.get("TACTIQ_WEBHOOK_SECRET");
  const provided = req.headers.get("x-webhook-secret");
  if (sharedSecret && provided !== sharedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email: string | undefined = body.email || body.attendee_email;
  const transcript: string | undefined = body.transcript || body.transcript_text;

  if (!email || !transcript) {
    return new Response(JSON.stringify({ error: "email y transcript son requeridos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: lead, error: findError } = await supabase
    .from("leads_cuentas")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (findError) {
    return new Response(JSON.stringify({ error: findError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!lead) {
    // No matching lead: respond 200 (not an error) so Zapier doesn't retry forever,
    // but flag it clearly so it's easy to spot in logs.
    return new Response(JSON.stringify({ ok: true, matched: false, reason: `No lead found for email ${email}` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updateError } = await supabase
    .from("leads_cuentas")
    .update({ transcript_text: transcript })
    .eq("id", lead.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, matched: true, lead_id: lead.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
