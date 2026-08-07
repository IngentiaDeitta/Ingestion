// Public intake endpoint for inbound leads: Cal.com booking webhook + website form.
// Auth: shared-secret header (this endpoint is hit by external services, not by
// logged-in app users, so it does NOT verify a Supabase JWT — verify_jwt is
// disabled at deploy time and this custom check replaces it).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-webhook-secret, x-cal-signature-256",
};

// Free mail providers never represent the prospect's company domain.
const FREE_EMAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.ar",
  "live.com", "icloud.com", "protonmail.com", "aol.com", "msn.com",
];

function domainFromEmail(email: string | null): string | null {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain || FREE_EMAIL_DOMAINS.includes(domain)) return null;
  return domain;
}

// Cal.com `responses` entries look like { label, value, isHidden } where value
// may itself be a string, a number, or a nested { value } object.
function unwrapResponse(entry: any): string | null {
  if (entry === null || entry === undefined) return null;
  let v = entry;
  if (typeof v === "object" && "value" in v) v = v.value;
  if (typeof v === "object" && v !== null && "value" in v) v = v.value;
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "object") return null;
  return String(v).trim() || null;
}

// Custom booking questions get arbitrary slugs, so match on the slug AND the
// human label the user typed when creating the question.
function findResponse(responses: any, needles: string[]): string | null {
  if (!responses || typeof responses !== "object") return null;
  for (const [key, entry] of Object.entries<any>(responses)) {
    const label = typeof entry === "object" && entry?.label ? String(entry.label) : "";
    const haystack = `${key} ${label}`.toLowerCase();
    if (needles.some((n) => haystack.includes(n))) {
      const value = unwrapResponse(entry);
      if (value) return value;
    }
  }
  return null;
}

async function verifyCalcomSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = Deno.env.get("CALCOM_WEBHOOK_SECRET");
  if (!secret || !signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === signatureHeader.toLowerCase().trim();
}

function normalizeCalcomPayload(body: any) {
  const payload = body?.payload || {};
  const attendee = payload.attendees?.[0] || {};
  const responses = payload.responses || {};

  const email = attendee.email || findResponse(responses, ["email"]) || null;
  const contacto = attendee.name || findResponse(responses, ["name", "nombre"]) || null;
  const dominio = domainFromEmail(email);

  const empresa =
    findResponse(responses, ["empresa", "company", "organizacion", "organización"]) ||
    dominio ||
    contacto ||
    "Lead sin nombre (Cal.com)";

  const telefono =
    findResponse(responses, ["phone", "telefono", "teléfono", "whatsapp", "celular"]) ||
    attendee.phoneNumber ||
    null;

  // "Motivo de la reunión" es la pregunta del formulario de reserva de Cal.com:
  // es el equivalente al mensaje del formulario web y alimenta el Pre-Call Brief.
  const notasExtra = findResponse(responses, [
    "motivo", "consulta", "notes", "notas", "mensaje", "additionalnotes", "razon", "razón",
  ]);
  const notas = [
    `Reunión agendada vía Cal.com: ${payload.title || ""}`.trim(),
    payload.startTime ? `Fecha: ${payload.startTime}` : null,
    notasExtra,
  ].filter(Boolean).join(" · ");

  return {
    empresa,
    contacto_nombre: contacto,
    email,
    telefono,
    dominio,
    fuente: "Cal.com",
    notas,
    // Una reunión ya agendada no es un lead "nuevo": ya está más avanzado.
    estado: "REUNION_AGENDADA",
  };
}

function normalizeFormPayload(body: any) {
  const email = body.email || null;
  const dominio = domainFromEmail(email);
  return {
    empresa: body.company || body.empresa || dominio || body.name || "Lead sin empresa (Form Web)",
    contacto_nombre: body.name || body.contacto_nombre || null,
    email,
    telefono: body.phone || body.telefono || null,
    dominio,
    fuente: "Form Web",
    notas: body.message || body.notas || null,
    estado: "NUEVO",
  };
}

const SELECT_COLS = "id, estado, notas, empresa, dominio, sector, localidad, contacto_nombre, contacto_cargo, telefono, email, pre_call_brief";

// La tabla tiene un índice único sobre (lower(empresa), fuente): una empresa no
// puede repetirse dentro del mismo origen. Por eso, cuando el lead entrante ya
// existe, fusionamos en vez de insertar — nunca se pierde una consulta.
async function mergeIntoExisting(supabase: any, existing: any, normalized: any) {
  const updates: Record<string, unknown> = {
    estado: normalized.estado === "REUNION_AGENDADA" ? "REUNION_AGENDADA" : existing.estado,
    updated_at: new Date().toISOString(),
  };

  // Si escribe otra persona de la misma empresa, la registramos en las notas en
  // lugar de pisar al contacto original.
  const esOtraPersona = normalized.email && existing.email &&
    normalized.email.toLowerCase() !== existing.email.toLowerCase();
  const notaContacto = esOtraPersona
    ? `Otro contacto de la misma empresa: ${normalized.contacto_nombre || "sin nombre"} <${normalized.email}>`
    : null;

  updates.notas = [existing.notas, notaContacto, normalized.notas].filter(Boolean).join("\n---\n");

  // Solo completamos huecos; nunca pisamos un dato ya cargado.
  if (normalized.telefono && !existing.telefono) updates.telefono = normalized.telefono;
  if (normalized.contacto_nombre && !existing.contacto_nombre) {
    updates.contacto_nombre = normalized.contacto_nombre;
  }
  if (normalized.email && !existing.email) updates.email = normalized.email;
  if (normalized.dominio && !existing.dominio) updates.dominio = normalized.dominio;

  // Si lo guardado era el dominio (un relleno) y ahora llega el nombre real de la
  // empresa —típicamente de la pregunta personalizada de Cal.com—, lo mejoramos.
  const guardadoEsRelleno = !existing.empresa || existing.empresa === existing.dominio;
  const entranteEsReal = normalized.empresa && normalized.empresa !== normalized.dominio;
  if (guardadoEsRelleno && entranteEsReal) updates.empresa = normalized.empresa;

  return await supabase.from("leads_cuentas").update(updates).eq("id", existing.id).select().single();
}

async function findByEmpresaFuente(supabase: any, normalized: any) {
  if (!normalized.empresa) return null;
  const { data } = await supabase
    .from("leads_cuentas")
    .select(SELECT_COLS)
    .ilike("empresa", normalized.empresa)
    .eq("fuente", normalized.fuente)
    .limit(1)
    .maybeSingle();
  return data;
}

// ── Pre-Call Brief automático (Agente A5) ───────────────────────────────────
// Se dispara al entrar el lead, en segundo plano, para que Pedro lo encuentre
// listo al abrir la ficha. Si GEMINI_API_KEY no está configurada, se omite en
// silencio y la app lo genera igual al abrir el lead.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

async function callGemini(key: string, body: Record<string, unknown>) {
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((p: any) => p.text).filter(Boolean).join("");
  return { candidate, text };
}

function extractJson(raw: string): string {
  let s = raw.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  return a !== -1 && b > a ? s.slice(a, b + 1) : s;
}

async function generarBrief(supabase: any, lead: any) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return;

  try {
    // Paso 1 — investigación real. En lenguaje natural: con un prompt largo y
    // estructurado el modelo omite la búsqueda y responde de memoria.
    const p1 = `Investigá en la web la empresa argentina "${lead.empresa}"${lead.dominio ? ` (sitio ${lead.dominio})` : ""}.
Necesito: a qué se dedica, cuántos empleados tiene, dónde están sus plantas, desde cuándo opera y quiénes la dirigen, en qué cámaras industriales participa (ADIMRA, CADIEEL, UIPBA), novedades recientes y si tiene búsquedas laborales publicadas de perfiles administrativos, de costos o de calidad.
Respondé en prosa breve. Si algo no lo encontrás, decí explícitamente "no hay dato".`;

    const r1 = await callGemini(key, {
      contents: [{ parts: [{ text: p1 }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 3072 },
    });

    const fuentes: string[] = Array.from(new Set(
      (r1.candidate?.groundingMetadata?.groundingChunks || [])
        .map((c: any) => c?.web?.title || c?.web?.uri).filter(Boolean),
    ));

    // Paso 2 — estructurar el brief siguiendo el guion de la Radiografía.
    const p2 = `Sos el Agente A5 de IngentIA, consultora argentina de automatización e IA para PyMEs industriales del AMBA. Preparás a Pedro (CCO) para una "Radiografía Operativa": 30 minutos de descubrimiento puro.

REGLAS: no es demo ni presentación, Pedro habla máximo 6 minutos. Objetivo único: salir con un número de pérdida anual y vender el Diagnóstico Operativo (USD 1.200). Las preguntas deben obtener HORAS por semana, PERSONAS afectadas y COSTO por hora. Nunca hablar de tecnología ni stack.

INVESTIGACIÓN WEB YA REALIZADA (única fuente de datos duros):
${r1.text || "(la búsqueda no devolvió información)"}

DATOS EN NUESTRA BASE:
Empresa: ${lead.empresa} | Dominio: ${lead.dominio || "no provisto"} | Rubro: ${lead.sector || "no provisto"} | Localidad: ${lead.localidad || "no provista"}
Contacto: ${lead.contacto_nombre || "no provisto"} ${lead.contacto_cargo ? `(${lead.contacto_cargo})` : ""}

LO QUE EL PROSPECTO ESCRIBIÓ AL CONTACTARNOS (sus propias palabras, el dato más valioso):
${lead.notas || "(no dejó mensaje)"}

TAREA:
1. Usá SOLO la investigación de arriba para los datos duros. Si un dato no aparece ahí, escribí "sin dato". PROHIBIDO completarlo de memoria.
2. Señales de dolor clasificadas ALTA / MEDIA / BAJA.
3. "dolor_declarado": lo que él mismo dijo que le duele, o null si no dejó mensaje.
4. Preguntas ESPECÍFICAS para esta empresa por bloque: A (el mapa del proceso), B (el dolor, de donde salen horas/personas/costo), C (intento previo y urgencia).
5. "encuadre_sugerido": el texto EXACTO que Pedro dirá al abrir, en primera persona y tuteando, listo para leer. No instrucciones: sus palabras.

Respondé ÚNICAMENTE con JSON:
{"empresa_una_frase":"","perfil":{"empleados_estimado":"","plantas_ubicaciones":"","antiguedad":"","rubro":""},"senales":[{"nivel":"ALTA|MEDIA|BAJA","descripcion":""}],"camaras_redes":[],"interlocutor":{"nombre":"","cargo_estimado":"","es_decisor":"SI|PROBABLE|NO|DESCONOCIDO"},"dolor_declarado":null,"hipotesis_dolor":"","stack_probable":[],"preguntas":{"bloque_a_mapa":[],"bloque_b_dolor":[],"bloque_c_urgencia":[]},"encuadre_sugerido":""}`;

    const r2 = await callGemini(key, {
      contents: [{ parts: [{ text: p2 }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
    });

    const brief = JSON.parse(extractJson(r2.text));
    brief.fuentes = fuentes;
    brief.investigacion_verificada = fuentes.length > 0;

    await supabase
      .from("leads_cuentas")
      .update({
        pre_call_brief: brief,
        estado: lead.estado === "NUEVO" ? "ENRIQUECIDO" : lead.estado,
      })
      .eq("id", lead.id);

    console.log(`Brief generado para lead ${lead.id} (${fuentes.length} fuentes).`);
  } catch (err) {
    // Nunca romper el intake por un fallo del brief: el lead ya está guardado.
    console.error(`No se pudo generar el brief del lead ${lead.id}:`, err);
  }
}

/** Lanza el brief sin bloquear la respuesta al webhook. */
function dispararBrief(supabase: any, lead: any) {
  if (!lead?.id || !lead?.empresa) return;
  const tarea = generarBrief(supabase, lead);
  // @ts-ignore — EdgeRuntime existe en el runtime de Supabase.
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(tarea);
  }
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

  const rawBody = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isCalcom = typeof body?.triggerEvent === "string";

  if (isCalcom) {
    const validSig = await verifyCalcomSignature(rawBody, req.headers.get("x-cal-signature-256"));
    if (!validSig) {
      return new Response(JSON.stringify({ error: "Invalid Cal.com signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.triggerEvent !== "BOOKING_CREATED") {
      return new Response(JSON.stringify({ ok: true, skipped: body.triggerEvent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    const sharedSecret = Deno.env.get("LEAD_INTAKE_SECRET");
    const provided = req.headers.get("x-webhook-secret");
    if (sharedSecret && provided !== sharedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const normalized = isCalcom ? normalizeCalcomPayload(body) : normalizeFormPayload(body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Deduplicación en dos niveles: primero por persona (email), después por
  // empresa dentro del mismo origen (que es lo que exige el índice único).
  let existing: any = null;

  if (normalized.email) {
    const { data } = await supabase
      .from("leads_cuentas")
      .select(SELECT_COLS)
      .ilike("email", normalized.email)
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  if (!existing) {
    existing = await findByEmpresaFuente(supabase, normalized);
  }

  if (existing) {
    const { data: updated, error: updateError } = await mergeIntoExisting(supabase, existing, normalized);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Si el lead todavía no tenía brief, lo generamos ahora que llegó más contexto.
    if (!existing.pre_call_brief) dispararBrief(supabase, updated);
    return new Response(JSON.stringify({ ok: true, deduped: true, lead: updated }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("leads_cuentas")
    .insert([normalized])
    .select()
    .single();

  if (error) {
    // Red de seguridad: si otra request insertó la misma empresa en el intervalo
    // entre nuestra búsqueda y el insert, fusionamos en vez de perder el lead.
    if (error.code === "23505") {
      const collided = await findByEmpresaFuente(supabase, normalized);
      if (collided) {
        const { data: updated, error: mergeError } = await mergeIntoExisting(supabase, collided, normalized);
        if (!mergeError) {
          if (!collided.pre_call_brief) dispararBrief(supabase, updated);
          return new Response(JSON.stringify({ ok: true, deduped: true, lead: updated }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  dispararBrief(supabase, data);

  return new Response(JSON.stringify({ ok: true, deduped: false, lead: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
