/**
 * Local Bridge Server — IngentIA AI Research Agent
 * Puerto: 3001
 * Endpoints:
 *   POST /api/run-agent/stream  → SSE stream del progreso del agente Python
 *   GET  /health                → Health check
 */

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const PYTHON_SCRIPT = path.join(__dirname, 'scripts', 'ai_research_agent.py');

// ── Classifica las líneas del agente en tipo semántico ──────────────────────
function classifyLine(line) {
  if (line.startsWith('[*]')) return { type: 'step',    text: line.replace('[*]', '').trim() };
  if (line.startsWith('[+]')) return { type: 'success', text: line.replace('[+]', '').trim() };
  if (line.startsWith('[-]')) return { type: 'error',   text: line.replace('[-]', '').trim() };
  return null; // ignorar líneas vacías o de debug
}

const server = http.createServer((req, res) => {
  // ── CORS ────────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // ── Health Check ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  // ── SSE: Stream del progreso del agente ─────────────────────────────────
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

      // Configurar SSE
      res.writeHead(200, {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      });

      const send = (type, text) => {
        res.write(`data: ${JSON.stringify({ type, text })}\n\n`);
      };

      send('step', `Iniciando investigación para "${clientName}"...`);
      console.log(`\n[bridge] 🚀 "${clientName}" / "${projectName}"`);

      const args = [PYTHON_SCRIPT, '--client', clientName, '--project', projectName];
      if (minutes) args.push('--minutes', minutes);

      let isFinished = false;

      const child = spawn('python', args, { 
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
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => {
          process.stdout.write(line + '\n');
          const classified = classifyLine(line);
          if (classified) send(classified.type, classified.text);
        });
      });

      child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => {
          // Solo reportar errores reales, no warnings de Python
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
          send('done', `✅ Análisis de "${clientName}" completado y guardado en Supabase.`);
        } else {
          const reason = code !== null ? `código ${code}` : `señal ${signal}`;
          send('fatal', `❌ El agente falló o fue interrumpido (${reason}).`);
        }
        res.end();
      });

      // Si el cliente corta la conexión, matar el proceso
      res.on('close', () => {
        if (!isFinished) {
          console.log('[bridge] ⚠️ Cliente cerró la conexión, cancelando agente...');
          isFinished = true;
          if (!child.killed) child.kill();
        }
      });
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n✅ IngentIA Local Bridge corriendo en http://localhost:${PORT}`);
  console.log(`   POST /api/run-agent/stream  → SSE stream del progreso`);
  console.log(`   GET  /health                → Estado del bridge\n`);
});
