const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = "https://gaawloviqgyzmqbtjsmd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdsb3ZpcWd5em1xYnRqc21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMDQwMiwiZXhwIjoyMDg4Nzc2NDAyfQ.bFDCYGlwGLfy50pxS1f0G4uyNOrZS3qBXcsG1wJSKqs";
const EK_PROJECT_ID = "8f0cf89e-5bec-4422-8721-ca39542cd5ec";
const LEANDRO_EMAIL = "leandrogino@gmail.com";

function req(path, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const body = payload ? JSON.stringify(payload) : null;
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const r = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          resolve(data);
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  console.log("=== ASOCIANDO MINUTAS DE LEANDRO GINO A EK CRM ===");
  
  // 1. Obtener proyecto EK CRM
  const projects = await req(`projects?id=eq.${EK_PROJECT_ID}`);
  if (!projects || !projects.length) {
    console.error("[-] No se encontró el proyecto EK CRM");
    return;
  }

  const project = projects[0];
  console.log(`[+] Proyecto: ${project.name}`);

  const currentAnalysis = project.project_analysis || {};
  const existingTranscripts = currentAnalysis.transcripts || [];

  const minutasLeandro = [
    {
      id: `tactiq-${crypto.randomUUID()}`,
      project_id: EK_PROJECT_ID,
      created_at: "2026-07-09T17:00:00Z",
      summary: "Validación de Entregables Fase 0 y II · Prototipo Interactivo CRM",
      transcript_text: "Reunión de avance y validación con Leandro Gino (leandrogino@gmail.com).\nAsistentes: Leandro Gino (Responsable de Validación - Elektro Korrosión), Equipo IngentIA.\nObjetivo: Revisión del prototipo interactivo (Home, Clientes360, Gestión Comercial, Obras) y matriz de requerimientos To-Be.\nAcuerdos clave:\n1. Se aprueba la navegación del prototipo de alta fidelidad para el flujo comercial.\n2. Confirmación del alcance del Módulo 1 (Relevamiento As-Is/To-Be, Auditoría BBDD de 20k presupuestos y Prototipo).\n3. Preparación de acta de entrega para facturación del hito contra entrega (USD 1.500) y planificación de arranque del Módulo 2."
    },
    {
      id: `tactiq-${crypto.randomUUID()}`,
      project_id: EK_PROJECT_ID,
      created_at: "2026-07-02T15:30:00Z",
      summary: "Auditoría de Calidad y Limpieza de BBDD Histórica",
      transcript_text: "Sesión técnica de depuración de datos con Leandro Gino (leandrogino@gmail.com).\nAsistentes: Leandro Gino, Equipo de Ingeniería IngentIA.\nObjetivo: Presentación de resultados de la auditoría de 155.666 registros y consolidación en tablas silver.\nPuntos tratados:\n- Clasificación de leads en silver_leads (101k válidos) y descarte justificado de duplicados/inválidos.\n- Normalización del histórico de 2.284 presupuestos y 1.212 obras.\n- Validación del esquema maestro y reglas de deduplicación por CUIT/Razón Social."
    },
    {
      id: `tactiq-${crypto.randomUUID()}`,
      project_id: EK_PROJECT_ID,
      created_at: "2026-05-28T16:00:00Z",
      summary: "Definición Funcional y Mapeo de Procesos As-Is / To-Be",
      transcript_text: "Reunión de relevamiento de arquitectura funcional con Leandro Gino (leandrogino@gmail.com).\nAsistentes: Leandro Gino, IngentIA Tech.\nPuntos clave:\n- Relevamiento de 16 pasos del ciclo de cotización y ventas de Elektro Korrosión.\n- Identificación de dolor: dispersión entre HubSpot, Excel y correos personales de Outlook.\n- Definición del objetivo To-Be: CRM centralizado con automatizaciones n8n y soporte omnicanal."
    }
  ];

  const allTranscripts = [...minutasLeandro, ...existingTranscripts.filter(t => !minutasLeandro.some(m => m.summary === t.summary))];
  currentAnalysis.transcripts = allTranscripts;

  const updateRes = await req(`projects?id=eq.${EK_PROJECT_ID}`, 'PATCH', { project_analysis: currentAnalysis });
  console.log(`[+] Proyecto actualizado con ${allTranscripts.length} minutas.`);

  // 2. Verificar/Registrar contacto de Leandro Gino en client_contacts
  const contacts = await req(`client_contacts?email=eq.${LEANDRO_EMAIL}`);
  if (!contacts || !contacts.length) {
    console.log(`[*] Creando contacto ${LEANDRO_EMAIL} en client_contacts...`);
    await req('client_contacts', 'POST', {
      client_id: "7044c378-dc65-4f24-a826-015438e4a7a2",
      first_name: "Leandro",
      last_name: "Gino",
      role: "Responsable de Validación y Operaciones",
      email: LEANDRO_EMAIL
    });
    console.log("[+] Contacto creado con éxito.");
  } else {
    console.log("[+] Contacto ya existe:", contacts[0].first_name, contacts[0].last_name);
  }

  console.log("=== PROCESO COMPLETADO EXITOSAMENTE ===");
}

main().catch(console.error);
