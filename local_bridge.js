/**
 * Local Bridge Server — IngentIA AI Research Agent
 * Puerto: 3001
 * Endpoints:
 *   POST /api/run-agent/stream         → SSE stream del progreso del agente Cliente (Python)
 *   POST /api/run-project-agent/stream → SSE stream del agente de Proyectos (Python)
 *   GET  /health                       → Health check
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const PYTHON_SCRIPT         = path.join(__dirname, 'scripts', 'ai_research_agent.py');
const PROJECT_PYTHON_SCRIPT = path.join(__dirname, 'scripts', 'ai_project_agent.py');

// ── Clasifica las líneas del agente en tipo semántico ─────────────────────────
function classifyLine(line) {
  if (line.startsWith('[*]')) return { type: 'step',    text: line.replace('[*]', '').trim() };
  if (line.startsWith('[+]')) return { type: 'success', text: line.replace('[+]', '').trim() };
  if (line.startsWith('[-]')) return { type: 'error',   text: line.replace('[-]', '').trim() };
  return null;
}

// ── Helper: lanza un script Python y lo streamea por SSE ─────────────────────
function spawnAndStream(res, scriptPath, args, label) {
  const send = (type, text) => res.write(`data: ${JSON.stringify({ type, text })}\n\n`);

  send('step', `Iniciando ${label}...`);
  console.log(`\n[bridge] 🚀 ${label}`);

  let isFinished = false;

  const child = spawn('python', [scriptPath, ...args], {
    timeout: 5 * 60 * 1000,
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  child.on('error', (err) => {
    console.error('[bridge] Error spawning python:', err);
    if (!isFinished) {
      send('fatal', `❌ Error al iniciar Python: ${err.message}`);
      isFinished = true;
      res.end();
    }
  });

  child.stdout.on('data', (data) => {
    data.toString().split('\n').filter(l => l.trim()).forEach(line => {
      process.stdout.write(line + '\n');
      const classified = classifyLine(line);
      if (classified) send(classified.type, classified.text);
    });
  });

  child.stderr.on('data', (data) => {
    data.toString().split('\n').filter(l => l.trim()).forEach(line => {
      if (line.includes('Error') || line.includes('Traceback') || line.includes('Exception')) {
        send('error', line.trim());
      }
      process.stderr.write(line + '\n');
    });
  });

  child.on('close', (code, signal) => {
    if (isFinished) return;
    isFinished = true;
    if (code === 0) {
      send('done', `✅ ${label} completado y guardado en Supabase.`);
    } else {
      const reason = code !== null ? `código ${code}` : `señal ${signal}`;
      send('fatal', `❌ El agente falló o fue interrumpido (${reason}).`);
    }
    res.end();
  });

  res.on('close', () => {
    if (!isFinished) {
      console.log('[bridge] ⚠️ Cliente cerró la conexión, cancelando agente...');
      isFinished = true;
      if (!child.killed) child.kill();
    }
  });
}

// ── Servidor ──────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── Health Check ──────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  // ── SSE: Agente de Cliente (Research Agent) ───────────────────────────────
  if (req.method === 'POST' && req.url === '/api/run-agent/stream') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); }
      catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Payload JSON inválido.' }));
      }

      const { clientName, projectName, minutes } = payload;
      if (!clientName || !projectName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'clientName y projectName son requeridos.' }));
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const args = ['--client', clientName, '--project', projectName];
      if (minutes) args.push('--minutes', minutes);

      spawnAndStream(res, PYTHON_SCRIPT, args, `Investigación cliente "${clientName}"`);
    });
    return;
  }

  // ── SSE: Agente de Proyecto (Project Agent) ───────────────────────────────
  if (req.method === 'POST' && req.url === '/api/run-project-agent/stream') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(body); }
      catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Payload JSON inválido.' }));
      }

      const { projectId } = payload;
      if (!projectId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'projectId es requerido.' }));
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      spawnAndStream(res, PROJECT_PYTHON_SCRIPT, ['--project_id', projectId], `Análisis de proyecto "${projectId}"`);
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✅ IngentIA Local Bridge corriendo en http://localhost:${PORT}`);
  console.log(`   POST /api/run-agent/stream         → SSE stream de Client Agent`);
  console.log(`   POST /api/run-project-agent/stream → SSE stream de Project Agent`);
  console.log(`   GET  /health                       → Estado del bridge\n`);
});
