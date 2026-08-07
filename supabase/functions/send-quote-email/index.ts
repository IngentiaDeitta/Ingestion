// Sends a saved quote to the client's email via Resend. Called from the
// logged-in app (SmartQuoter.tsx), so this DOES verify the caller's Supabase
// JWT (verify_jwt: true at deploy time) — unlike the public intake functions.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const quoteId = body.quoteId;
  if (!quoteId) {
    return new Response(JSON.stringify({ error: "quoteId es requerido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada en los secrets de Supabase." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return new Response(JSON.stringify({ error: "Cotización no encontrada" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("name, email")
    .eq("id", quote.client_id)
    .single();

  if (!client?.email) {
    return new Response(JSON.stringify({ error: "El cliente no tiene email cargado." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const content = quote.content || {};
  const pricing = content.pricing || {};
  const selectedModules: string[] = quote.selected_modules || [];
  const deliverables: string[] = content.deliverables || [];

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:0 auto; color:#1A1A1A; line-height:1.5;">
      <h2 style="color:#1A1A1A; margin-bottom: 4px;">Propuesta para ${client.name}</h2>
      <p style="color:#666666; font-size:13px; margin-top:0;">IngentIA · ${quote.project_name || ""}</p>
      ${content.diagnosis ? `<p>${content.diagnosis}</p>` : ""}
      ${content.financialEstimation?.revenueJustification
        ? `<p style="background:#FFF6DE; padding:14px 16px; border-radius:12px; font-weight:600;">${content.financialEstimation.revenueJustification}</p>`
        : ""}
      <h3 style="margin-bottom:8px;">Propuesta</h3>
      <ul style="padding-left:20px;">
        ${selectedModules.includes("module1") && pricing.module1
          ? `<li>Módulo 1 (Diagnóstico Operativo): USD ${Number(pricing.module1.price || 0).toLocaleString()}</li>`
          : ""}
        ${selectedModules.includes("module2") && pricing.module2
          ? `<li>Módulo 2 (Desarrollo): USD ${Number(pricing.module2.price || 0).toLocaleString()}</li>`
          : ""}
        ${selectedModules.includes("module3") && pricing.module3
          ? `<li>Módulo 3 (Evolución continua): USD ${Number(pricing.module3.monthlyPrice || 0).toLocaleString()}/mes</li>`
          : ""}
      </ul>
      ${deliverables.length
        ? `<h3 style="margin-bottom:8px;">Incluye</h3><ul style="padding-left:20px;">${deliverables.map((d) => `<li>${d}</li>`).join("")}</ul>`
        : ""}
      <p style="font-size:18px; font-weight:700; margin-top:20px;">Total: USD ${Number(quote.total_amount || 0).toLocaleString()}</p>
      <p style="margin-top:24px;">Cualquier duda, respondé este email y lo vemos.</p>
      <p style="color:#666666;">— Equipo IngentIA</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM_EMAIL") || "IngentIA <propuestas@ingentiatech.com>",
      to: [client.email],
      subject: quote.title || `Propuesta IngentIA - ${quote.project_name || ""}`,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const errText = await resendResponse.text();
    return new Response(JSON.stringify({ error: `Error de Resend: ${errText}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("quotes")
    .update({
      sent_date: new Date().toISOString(),
      status: quote.status === "Generada" ? "Enviada" : quote.status,
    })
    .eq("id", quoteId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
