import React, { forwardRef } from 'react';
import logoBlanco from '../assets/logo-blanco.png';
import type { InformeRadiografia } from '../lib/gemini-informe';
import type { RadiografiaResult } from '../lib/gemini-radiografia';

interface Props {
  informe: InformeRadiografia;
  radiografia: RadiografiaResult;
  empresa: string;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;

/** Branding IngentIA: negro, acentos cyan, Satoshi. Espejo del formato de minutas. */
const CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap');

@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { background: #000 !important; margin: 0; padding: 0; }
  .ig-report { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 210mm; }
  /* El contenido fluye libre entre páginas: forzar saltos por sección dejaba
     medias hojas en blanco. Solo protegemos las unidades chicas para que no se
     partan al medio (una tarjeta, una fila de tabla, un paso del camino). */
  .ig-card, .ig-row, .ig-table tr, .ig-kpi { break-inside: avoid; page-break-inside: avoid; }
  .ig-label { break-after: avoid; page-break-after: avoid; }
  .ig-h2, .ig-big { break-after: avoid; }
  .ig-table { break-inside: auto; }
  .ig-table thead { display: table-header-group; }
  .ig-foot { break-inside: avoid; }
}

.ig-report {
  --cyan: #00E5FF;
  --border: rgba(255,255,255,0.10);
  --faint: rgba(255,255,255,0.06);
  background: #000;
  color: #fff;
  font-family: 'Satoshi','Helvetica Neue',Arial,sans-serif;
  font-size: 13px;
  line-height: 1.65;
  width: 210mm;
}
.ig-cover {
  padding: 64px 52px 48px;
  background: #000 radial-gradient(circle at 78% 12%, #002c34 0%, #000 68%);
  border-bottom: 1px solid var(--border);
}
.ig-cover h1 { font-size: 30px; font-weight: 700; line-height: 1.2; margin: 26px 0 12px; letter-spacing: -0.02em; }
.ig-kicker { font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--cyan); }
.ig-section { padding: 26px 52px; border-bottom: 1px solid var(--faint); }
.ig-label {
  font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
  color: var(--cyan); margin-bottom: 14px; display: flex; align-items: center; gap: 12px;
}
.ig-label::after { content:''; flex:1; height:1px; background: var(--faint); }
.ig-h2 { font-size: 17px; font-weight: 700; margin: 0 0 10px; letter-spacing: -0.01em; }
.ig-p { font-size: 12.5px; color: rgba(255,255,255,0.70); line-height: 1.68; margin: 0 0 10px; }
.ig-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; }
.ig-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ig-chip {
  display: inline-block; background: rgba(255,255,255,0.04); border: 1px solid var(--border);
  border-radius: 100px; padding: 5px 13px; font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.72);
  margin: 0 6px 6px 0;
}
.ig-num {
  width: 24px; height: 24px; border-radius: 50%; background: rgba(0,229,255,0.10);
  border: 1px solid rgba(0,229,255,0.26); display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--cyan); flex-shrink: 0;
}
.ig-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.ig-big { font-size: 38px; font-weight: 700; color: var(--cyan); letter-spacing: -0.03em; line-height: 1; }
.ig-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
.ig-table th {
  text-align: left; font-size: 8.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: rgba(255,255,255,0.40); padding: 8px 10px; border-bottom: 1px solid var(--border);
}
.ig-table td { padding: 9px 10px; border-bottom: 1px solid var(--faint); color: rgba(255,255,255,0.78); vertical-align: top; }
.ig-sev { font-size: 8.5px; font-weight: 700; letter-spacing: .08em; padding: 2px 8px; border-radius: 100px; }
.ig-foot { padding: 22px 52px 40px; color: rgba(255,255,255,0.35); font-size: 9.5px; }
`;

/** Las 4 etapas del modelo de trabajo. Son fijas: van escritas, no las genera la IA. */
const FASES = [
  {
    nombre: 'Radiografía Operativa',
    duracion: '30 minutos',
    costo: 'Sin costo',
    detalle: 'La conversación que ya tuvimos. Entendemos cómo funciona hoy la operación y ponemos un primer número sobre la mesa.',
    destacado: false,
  },
  {
    nombre: 'Diagnóstico Operativo',
    duracion: '1 a 2 sesiones de inmersión',
    costo: 'USD 1.200',
    detalle: 'Relevamos el proceso en profundidad, lo documentamos como funciona hoy y como debería funcionar, y entregamos el cálculo firme de lo recuperable con su hoja de ruta.',
    destacado: true,
  },
  {
    nombre: 'Desarrollo e Implementación',
    duracion: 'Según alcance',
    costo: 'A definir en el Diagnóstico',
    detalle: 'Construcción de la solución definida. El alcance y el precio salen del Diagnóstico, no de una estimación a ciegas.',
    destacado: false,
  },
  {
    nombre: 'Mantenimiento y Evolución',
    duracion: 'Continuo',
    costo: 'Abono mensual',
    detalle: 'Soporte, mejoras y evolución de la herramienta una vez en producción. Opcional y cancelable.',
    destacado: false,
  },
];

const SEV: Record<string, React.CSSProperties> = {
  ALTA: { background: 'rgba(255,68,68,.12)', color: '#ff6b6b', border: '1px solid rgba(255,68,68,.3)' },
  MEDIA: { background: 'rgba(255,180,0,.12)', color: '#ffb400', border: '1px solid rgba(255,180,0,.3)' },
  BAJA: { background: 'rgba(59,158,255,.12)', color: '#3b9eff', border: '1px solid rgba(59,158,255,.3)' },
};

const RadiografiaReportTemplate = forwardRef<HTMLDivElement, Props>(({ informe, radiografia, empresa }, ref) => {
  const incluidos = radiografia.waste_breakdown.filter((l) => l.incluido !== false);
  const fecha = new Date(informe.generado_el).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div ref={ref} className="ig-report">
      <style>{CSS}</style>

      {/* Portada */}
      <div className="ig-cover">
        <img src={logoBlanco} alt="IngentIA" style={{ height: 34, width: 'auto', display: 'block' }} />
        <div className="ig-kicker" style={{ marginTop: 30 }}>Radiografía Operativa</div>
        <h1>{informe.titulo}</h1>
        <p className="ig-p" style={{ maxWidth: '78%' }}>{informe.introduccion}</p>
        <div style={{ marginTop: 22, display: 'flex', gap: 28 }}>
          <div>
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)' }}>Preparado para</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{empresa}</div>
          </div>
          <div>
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)' }}>Fecha</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{fecha}</div>
          </div>
        </div>
      </div>

      {/* Contexto */}
      <div className="ig-section">
        <div className="ig-label">01 · Contexto</div>
        <p className="ig-p">{informe.contexto_empresa}</p>
      </div>

      {/* Industria */}
      <div className="ig-section">
        <div className="ig-label">02 · El sector</div>
        <p className="ig-p">{informe.industria.panorama}</p>

        {informe.industria.benchmarks.length > 0 && (
          <table className="ig-table" style={{ marginTop: 12 }}>
            <thead>
              <tr><th>Indicador</th><th>Referencia del sector</th><th>Fuente</th></tr>
            </thead>
            <tbody>
              {informe.industria.benchmarks.map((b, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{b.indicador}</td>
                  <td>{b.referencia}</td>
                  <td style={{ color: 'rgba(255,255,255,0.42)' }}>{b.fuente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {informe.industria.buenas_practicas.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
              Prácticas del sector aún no adoptadas
            </div>
            {informe.industria.buenas_practicas.map((p, i) => <span key={i} className="ig-chip">{p}</span>)}
          </div>
        )}
      </div>

      {/* Requerimiento */}
      <div className="ig-section">
        <div className="ig-label">03 · Lo que nos plantearon</div>
        <p className="ig-p">{informe.requerimiento.planteo}</p>
        {informe.requerimiento.indicios.length > 0 && (
          <div className="ig-card" style={{ marginTop: 10 }}>
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
              Indicios detectados en la conversación
            </div>
            {informe.requerimiento.indicios.map((s, i) => (
              <div key={i} className="ig-row">
                <span style={{ color: '#00E5FF', fontWeight: 700, fontSize: 12 }}>›</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnóstico */}
      <div className="ig-section">
        <div className="ig-label">04 · Diagnóstico</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {informe.diagnostico.hallazgos.map((h, i) => (
            <div key={i} className="ig-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="ig-sev" style={SEV[h.severidad] || SEV.MEDIA}>{h.severidad}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{h.titulo}</span>
              </div>
              <p className="ig-p" style={{ margin: 0 }}>{h.detalle}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deuda operativa */}
      <div className="ig-section">
        <div className="ig-label">05 · Lo que cuesta hoy</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span className="ig-big">{fmt(radiografia.annual_waste_usd)}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>USD por año</span>
        </div>
        <p className="ig-p" style={{ marginBottom: 14 }}>{radiografia.summary}</p>

        <table className="ig-table">
          <thead>
            <tr><th>Concepto</th><th>Base de cálculo</th><th style={{ textAlign: 'right' }}>Anual</th></tr>
          </thead>
          <tbody>
            {incluidos.map((l, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{l.concepto}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10.5 }}>
                  {l.personas} pers · {l.horas_semana} hs/sem · USD {l.costo_hora_usd}/h · {l.semanas_anio} sem
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>{fmt(l.costo_anual)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Solución */}
      <div className="ig-section">
        <div className="ig-label">06 · El camino</div>
        <div className="ig-card" style={{ marginBottom: 14, borderColor: 'rgba(0,229,255,0.25)' }}>
          <div className="ig-kicker" style={{ marginBottom: 6 }}>Meta</div>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.45 }}>{informe.solucion.meta}</p>
        </div>

        {informe.solucion.camino.map((f, i) => (
          <div key={i} className="ig-row">
            <span className="ig-num">{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{f.fase}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.duracion}</span>
              </div>
              <p className="ig-p" style={{ margin: '2px 0 2px' }}>{f.objetivo}</p>
              <p style={{ fontSize: 11, color: '#00E5FF', margin: 0 }}>Entregable: {f.entregable}</p>
            </div>
          </div>
        ))}

        {informe.solucion.quick_wins.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
              Mejoras visibles en las primeras semanas
            </div>
            {informe.solucion.quick_wins.map((q, i) => <span key={i} className="ig-chip">{q}</span>)}
          </div>
        )}
      </div>

      {/* Beneficios */}
      <div className="ig-section">
        <div className="ig-label">07 · Lo que se recupera</div>
        <p className="ig-p">{informe.beneficios.resumen}</p>

        <div className="ig-grid2" style={{ margin: '14px 0' }}>
          <div className="ig-card">
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)' }}>Recupero anual estimado</div>
            <div className="ig-big" style={{ fontSize: 30, marginTop: 6 }}>{fmt(informe.beneficios.impacto_total_anual_usd)}</div>
          </div>
          <div className="ig-card">
            <div className="ig-kicker" style={{ color: 'rgba(255,255,255,0.35)' }}>Retorno de la inversión</div>
            <div className="ig-big" style={{ fontSize: 30, marginTop: 6 }}>{informe.beneficios.payback_meses} meses</div>
          </div>
        </div>

        <table className="ig-table">
          <thead>
            <tr><th>Concepto</th><th>Cómo se logra</th><th style={{ textAlign: 'right' }}>Anual</th></tr>
          </thead>
          <tbody>
            {informe.beneficios.items.map((b, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{b.concepto}</td>
                <td>{b.como_se_logra}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#00ff80' }}>{fmt(b.impacto_anual_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cómo trabajamos */}
      <div className="ig-section">
        <div className="ig-label">08 · Cómo trabajamos</div>
        <p className="ig-p">
          Trabajamos por etapas, y cada una se decide al terminar la anterior. Nunca se compromete
          la siguiente sin haber visto el resultado de la que está en curso.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0' }}>
          {FASES.map((f, i) => (
            <div key={i} className="ig-card" style={{ padding: '13px 16px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span className="ig-num">{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{f.nombre}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>{f.duracion}</span>
                    <span
                      className="ig-chip"
                      style={{
                        margin: 0, padding: '3px 10px', fontSize: 10,
                        ...(f.destacado
                          ? { background: 'rgba(0,229,255,0.10)', borderColor: 'rgba(0,229,255,0.30)', color: '#00E5FF' }
                          : {}),
                      }}
                    >
                      {f.costo}
                    </span>
                  </div>
                  <p className="ig-p" style={{ margin: '3px 0 0', fontSize: 12 }}>{f.detalle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ig-card" style={{ borderColor: 'rgba(0,229,255,0.28)', background: 'rgba(0,229,255,0.05)' }}>
          <div className="ig-kicker" style={{ marginBottom: 8 }}>La regla del Diagnóstico</div>
          <p className="ig-p" style={{ margin: 0, color: 'rgba(255,255,255,0.82)' }}>
            El <strong style={{ color: '#fff' }}>Diagnóstico Operativo cuesta USD 1.200</strong> y es tuyo:
            te llevás el mapa completo de tus procesos, el cálculo firme de lo que estás perdiendo y la
            hoja de ruta para resolverlo — lo uses con nosotros o con quien quieras.
            {' '}Si después del Diagnóstico decidís avanzar con la
            {' '}<strong style={{ color: '#fff' }}>Etapa 3 (Desarrollo e Implementación)</strong>, ese monto
            {' '}<strong style={{ color: '#00E5FF' }}>se descuenta al 100% de la implementación</strong>.
            {' '}En la práctica: si seguís, el Diagnóstico te salió cero.
          </p>
          <p className="ig-p" style={{ margin: '10px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
            Lo cobramos porque sin relevar no se puede cotizar en serio: cualquier número sería inventado.
            Preferimos cobrarte una semana de ingeniería y darte una cifra real.
          </p>
        </div>
      </div>

      {/* Próximo paso */}
      <div className="ig-section" style={{ background: 'rgba(0,229,255,0.04)' }}>
        <div className="ig-label">09 · Próximo paso</div>
        <p className="ig-p" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{informe.proximo_paso}</p>
      </div>

      <div className="ig-foot">
        {informe.fuentes.length > 0 && (
          <>
            <div style={{ marginBottom: 6, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 8.5 }}>
              Fuentes consultadas
            </div>
            <div style={{ marginBottom: 14 }}>{informe.fuentes.slice(0, 10).join(' · ')}</div>
          </>
        )}
        <div>IngentIA · www.ingentia.com.ar — Documento preparado para {empresa}. Las cifras son una estimación
          basada en la información disponible al {fecha} y se validan en el Diagnóstico Operativo.</div>
      </div>
    </div>
  );
});

RadiografiaReportTemplate.displayName = 'RadiografiaReportTemplate';
export default RadiografiaReportTemplate;
