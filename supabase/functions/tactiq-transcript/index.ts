// Receives meeting transcripts and detailed summaries from Tactiq (MCP Server / Webhook / Zapier).
// Matches by attendee email across:
// 1. Leads (leads_cuentas) -> Updates transcript_text for Radiografia / Presale
// 2. Clients & Projects (client_contacts / clients -> projects) -> Appends to transcripts with Tactiq detailed summary & action items
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
  const meetingTitle: string = body.title || body.meeting_title || "Minuta de Reunión Tactiq";
  
  // Detailed summary from Tactiq (notes, summary, highlights or custom breakdown)
  const detailedSummary: string = body.detailed_summary || body.summary || body.notes || body.highlights || transcript || "Reunión registrada.";
  const shortSummary: string = body.title || body.short_summary || meetingTitle;
  const actionItems: string[] = Array.isArray(body.action_items) ? body.action_items : [];
  const attendees: string[] = Array.isArray(body.attendees) ? body.attendees : [];

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

  let leadMatched = false;
  let projectMatched = false;
  let clientMatched = false;
  let updatedProjects: string[] = [];
  let matchedLeadId: string | null = null;
  let matchedClientId: string | null = null;

  // 1. Check matching Lead
  const { data: lead } = await supabase
    .from("leads_cuentas")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (lead) {
    leadMatched = true;
    matchedLeadId = lead.id;
    await supabase
      .from("leads_cuentas")
      .update({ transcript_text: transcript })
      .eq("id", lead.id);
  }

  // 2. Check matching Client (Directly or via client_contacts)
  let foundClientId: string | null = null;

  const { data: contact } = await supabase
    .from("client_contacts")
    .select("id, client_id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (contact && contact.client_id) {
    foundClientId = contact.client_id;
  } else {
    const { data: directClient } = await supabase
      .from("clients")
      .select("id, name")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (directClient) {
      foundClientId = directClient.id;
    }
  }

  if (foundClientId) {
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("id, name, client_analysis")
      .eq("id", foundClientId)
      .single();

    if (clientRecord) {
      clientMatched = true;
      matchedClientId = clientRecord.id;

      const currentClientAnalysis = clientRecord.client_analysis || {};
      const clientTranscripts = currentClientAnalysis.transcripts || [];
      
      const newTranscript = {
        id: `tactiq-${crypto.randomUUID()}`,
        client_id: clientRecord.id,
        created_at: new Date().toISOString(),
        summary: shortSummary,
        detailed_summary: detailedSummary,
        action_items: actionItems.length ? actionItems : undefined,
        attendees: attendees.length ? attendees : undefined,
        transcript_text: transcript
      };

      const updatedClientTranscripts = [newTranscript, ...clientTranscripts];

      await supabase
        .from("clients")
        .update({
          client_analysis: {
            ...currentClientAnalysis,
            transcripts: updatedClientTranscripts
          }
        })
        .eq("id", clientRecord.id);

      // Match active projects by client name
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, project_analysis")
        .eq("client", clientRecord.name);

      if (projects && projects.length > 0) {
        for (const proj of projects) {
          const currentAnalysis = proj.project_analysis || {};
          const transcripts = currentAnalysis.transcripts || [];
          
          const projectTranscript = {
            id: `tactiq-${crypto.randomUUID()}`,
            project_id: proj.id,
            created_at: new Date().toISOString(),
            summary: shortSummary,
            detailed_summary: detailedSummary,
            action_items: actionItems.length ? actionItems : undefined,
            attendees: attendees.length ? attendees : undefined,
            transcript_text: transcript
          };

          const updatedProjectTranscripts = [projectTranscript, ...transcripts];

          await supabase
            .from("projects")
            .update({
              project_analysis: {
                ...currentAnalysis,
                transcripts: updatedProjectTranscripts
              }
            })
            .eq("id", proj.id);

          projectMatched = true;
          updatedProjects.push(proj.id);
        }
      }
    }
  }

  if (!leadMatched && !projectMatched && !clientMatched) {
    return new Response(JSON.stringify({
      ok: true,
      matched: false,
      reason: `No lead, client, or project found for email ${email}`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    matched: true,
    lead_id: matchedLeadId,
    client_id: matchedClientId,
    project_ids: updatedProjects
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
