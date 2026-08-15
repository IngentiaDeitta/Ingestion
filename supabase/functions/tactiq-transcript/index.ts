// Receives meeting transcripts and detailed summaries from Tactiq (MCP Server / Webhook / Zapier).
// Matches by attendee emails, corporate domains, or client keywords across:
// 1. Leads (leads_cuentas) -> Updates transcript_text for Radiografia / Presale
// 2. Clients & Projects (client_contacts / clients -> projects) -> Appends to transcripts with Tactiq detailed summary & action items
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-webhook-secret",
};

function extractEmails(input: any): string[] {
  const emails = new Set<string>();
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  function processItem(item: any) {
    if (!item) return;
    if (typeof item === 'string') {
      const matches = item.match(emailRegex);
      if (matches) {
        matches.forEach(e => emails.add(e.toLowerCase().trim()));
      }
    } else if (typeof item === 'object') {
      if (item.email) processItem(item.email);
      if (item.emailAddress) processItem(item.emailAddress);
      if (item.name) processItem(item.name);
      if (Array.isArray(item)) {
        item.forEach(processItem);
      }
    }
  }

  processItem(input);
  return Array.from(emails);
}

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

  const transcript: string | undefined = body.transcript || body.transcript_text || body.text;
  const meetingTitle: string = body.title || body.meeting_title || body.name || "Minuta de Reunión Tactiq";
  
  // Detailed summary from Tactiq (notes, summary, highlights or custom breakdown)
  const detailedSummary: string = body.detailed_summary || body.summary || body.notes || body.highlights || transcript || "Reunión registrada.";
  const shortSummary: string = body.title || body.short_summary || meetingTitle;
  const actionItems: string[] = Array.isArray(body.action_items) ? body.action_items : [];
  
  // Extract all candidate emails from attendees, participants, email fields
  const allCandidateEmails = extractEmails([
    body.email,
    body.attendee_email,
    body.user_email,
    body.host_email,
    body.attendees,
    body.attendee_emails,
    body.participants,
    body.guest_emails,
    body.emails
  ]);

  const attendeesList: string[] = Array.isArray(body.attendees) 
    ? body.attendees.map((a: any) => typeof a === 'string' ? a : (a.name || a.email || 'Asistente'))
    : (allCandidateEmails.length > 0 ? allCandidateEmails : ["Equipo IngentIA"]);

  if (!transcript && !detailedSummary) {
    return new Response(JSON.stringify({ error: "transcript o summary son requeridos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract Tactiq labels, tags, folders
  const candidateTags: string[] = [];
  if (body.tags) candidateTags.push(...(Array.isArray(body.tags) ? body.tags : [body.tags]));
  if (body.labels) candidateTags.push(...(Array.isArray(body.labels) ? body.labels : [body.labels]));
  if (body.tag) candidateTags.push(body.tag);
  if (body.label) candidateTags.push(body.label);
  if (body.folder) candidateTags.push(body.folder);
  if (body.client_tag) candidateTags.push(body.client_tag);
  if (body.client_label) candidateTags.push(body.client_label);

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

  // 1. Check matching Lead by candidate tags or candidate emails
  for (const candidateEmail of allCandidateEmails) {
    const { data: lead } = await supabase
      .from("leads_cuentas")
      .select("id, empresa")
      .ilike("email", candidateEmail)
      .limit(1)
      .maybeSingle();

    if (lead) {
      leadMatched = true;
      matchedLeadId = lead.id;
      await supabase
        .from("leads_cuentas")
        .update({ transcript_text: transcript || detailedSummary })
        .eq("id", lead.id);
      break;
    }
  }

  // 2. Check matching Client (Directly via Tag/Label, Contacts, Email, Corporate domain or Title)
  let foundClientId: string | null = null;

  // A. Coincidencia por Etiqueta/Label de Tactiq
  for (const tagRaw of candidateTags) {
    if (!tagRaw || typeof tagRaw !== 'string') continue;
    const tag = tagRaw.trim();
    if (!tag) continue;

    const tagLower = tag.toLowerCase();
    if (tagLower === "ek" || tagLower.includes("elektro") || tagLower.includes("korrosion")) {
      const { data: ekClient } = await supabase
        .from("clients")
        .select("id, name")
        .ilike("name", "%Elektro Korrosi%")
        .limit(1)
        .maybeSingle();

      if (ekClient) {
        foundClientId = ekClient.id;
        break;
      }
    }

    const { data: taggedClient } = await supabase
      .from("clients")
      .select("id, name")
      .or(`name.ilike.%${tag}%,email.ilike.%${tag}%`)
      .limit(1)
      .maybeSingle();

    if (taggedClient) {
      foundClientId = taggedClient.id;
      break;
    }
  }

  // B. Coincidencia por Contactos de Cliente (emails de asistentes)
  if (!foundClientId) {
    for (const candidateEmail of allCandidateEmails) {
      const { data: contact } = await supabase
        .from("client_contacts")
        .select("id, client_id")
        .ilike("email", candidateEmail)
        .limit(1)
        .maybeSingle();

      if (contact && contact.client_id) {
        foundClientId = contact.client_id;
        break;
      }
    }
  }

  // C. Coincidencia por Email directo del Cliente
  if (!foundClientId) {
    for (const candidateEmail of allCandidateEmails) {
      const { data: directClient } = await supabase
        .from("clients")
        .select("id, name")
        .ilike("email", candidateEmail)
        .limit(1)
        .maybeSingle();

      if (directClient) {
        foundClientId = directClient.id;
        break;
      }
    }
  }

  // D. Coincidencia por dominio corporativo o palabras clave en el título
  if (!foundClientId) {
    const titleLower = meetingTitle.toLowerCase();
    if (titleLower.includes("ek") || titleLower.includes("elektro") || titleLower.includes("korrosion")) {
      const { data: ekClient } = await supabase
        .from("clients")
        .select("id, name")
        .ilike("name", "%Elektro Korrosi%")
        .limit(1)
        .maybeSingle();

      if (ekClient) {
        foundClientId = ekClient.id;
      }
    } else if (titleLower.includes("drip") || titleLower.includes("dripcolor")) {
      const { data: dripClient } = await supabase
        .from("clients")
        .select("id, name")
        .ilike("name", "%DripColor%")
        .limit(1)
        .maybeSingle();

      if (dripClient) {
        foundClientId = dripClient.id;
      }
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
      
      const newTranscriptId = `tactiq-${crypto.randomUUID()}`;
      const newTranscript = {
        id: newTranscriptId,
        client_id: clientRecord.id,
        created_at: new Date().toISOString(),
        summary: shortSummary,
        detailed_summary: detailedSummary,
        action_items: actionItems.length ? actionItems : undefined,
        attendees: attendeesList.length ? attendeesList : undefined,
        transcript_text: transcript || detailedSummary
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
            ...newTranscript,
            project_id: proj.id
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

      // Notificación en sistema
      try {
        await supabase
          .from("system_notifications")
          .insert({
            title: `Nueva Minuta: ${clientRecord.name}`,
            content: `Se registró automáticamente la reunión "${shortSummary}" con ${attendeesList.length} asistentes.`,
            type: 'client',
            is_read: false
          });
      } catch (err) {
        console.error("Error creating notification:", err);
      }
    }
  }

  if (!leadMatched && !projectMatched && !clientMatched) {
    return new Response(JSON.stringify({
      ok: true,
      matched: false,
      reason: `No lead, client, or project found for candidates: ${allCandidateEmails.join(', ') || 'sin emails'}`
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
