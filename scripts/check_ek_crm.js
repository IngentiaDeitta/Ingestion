const fs = require('fs');
const https = require('https');

const SUPABASE_URL = "https://gaawloviqgyzmqbtjsmd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXdsb3ZpcWd5em1xYnRqc21kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMDQwMiwiZXhwIjoyMDg4Nzc2NDAyfQ.bFDCYGlwGLfy50pxS1f0G4uyNOrZS3qBXcsG1wJSKqs";

function fetchSupabase(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const options = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const logLines = [];
  const log = (msg) => {
    logLines.push(msg);
    console.log(msg);
  };

  log("=== 1. BUSCANDO PROYECTOS ===");
  const projects = await fetchSupabase("projects?select=id,name,client_id,status,project_analysis");
  if (Array.isArray(projects)) {
    projects.forEach(p => {
      log(`- Proj ID: ${p.id} | Name: ${p.name} | Status: ${p.status}`);
      if (p.project_analysis) {
        log(`  Transcripts count: ${(p.project_analysis.transcripts || []).length}`);
      }
    });
  } else {
    log(`Error fetching projects: ${JSON.stringify(projects)}`);
  }

  log("\n=== 2. BUSCANDO CLIENTES ===");
  const clients = await fetchSupabase("clients?select=id,name,email,company");
  if (Array.isArray(clients)) {
    clients.forEach(c => {
      log(`- Client ID: ${c.id} | Name: ${c.name} | Email: ${c.email} | Company: ${c.company}`);
    });
  }

  log("\n=== 3. BUSCANDO LEADS ===");
  const leads = await fetchSupabase("leads_cuentas?select=id,empresa,contacto_nombre,email,transcript_text");
  if (Array.isArray(leads)) {
    leads.forEach(l => {
      if ((l.email && l.email.toLowerCase().includes('leandro')) || (l.contacto_nombre && l.contacto_nombre.toLowerCase().includes('leandro')) || (l.empresa && l.empresa.toLowerCase().includes('ek'))) {
        log(`- Lead ID: ${l.id} | Empresa: ${l.empresa} | Contacto: ${l.contacto_nombre} | Email: ${l.email}`);
        log(`  Transcript length: ${l.transcript_text ? l.transcript_text.length : 0}`);
        if (l.transcript_text) {
          log(`  Transcript preview: ${l.transcript_text.slice(0, 200)}...`);
        }
      }
    });
  }

  fs.mkdirSync('.tmp', { recursive: true });
  fs.writeFileSync('.tmp/check_ek_crm_result.json', JSON.stringify({ projects, clients, leads }, null, 2));
  fs.writeFileSync('.tmp/check_ek_crm_log.txt', logLines.join('\n'));
}

main().catch(console.error);
