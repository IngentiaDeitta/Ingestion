/**
 * ProposalPDFTemplate.tsx
 * Template PDF de 2 páginas con arquitectura conductual completa (Ariely Engine).
 *
 * Página 1 — El Valor: Anclaje financiero → Prioridades IKEA → Narrativa comercial
 * Página 2 — El Precio: Tabla 3 paquetes (Anzuelo) → Ítems bonificados ($0) → Cierre
 */
import { forwardRef } from 'react';
import type { AnalysisResult } from '../pages/SmartQuoter';
import type { ArielyResult } from '../lib/ariely-engine';

interface ProposalPDFTemplateProps {
  formData: {
    clientName: string;
    projectName: string;
  };
  result: AnalysisResult & { selectedModules?: string[] };
  arielyResult: ArielyResult;
}

// ─── Estilos inline del PDF ────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap');

  .proposal-pdf-wrapper { box-sizing: border-box; margin: 0; padding: 0; }
  .proposal-pdf-wrapper * { box-sizing: border-box; }
  .proposal-pdf-wrapper p, .proposal-pdf-wrapper h1, .proposal-pdf-wrapper h2, .proposal-pdf-wrapper h3, .proposal-pdf-wrapper h4, .proposal-pdf-wrapper h5, .proposal-pdf-wrapper h6, .proposal-pdf-wrapper ul, .proposal-pdf-wrapper li { margin: 0; padding: 0; }

  .pdf-page {
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    width: 794px;
    min-height: 1122px;
    background: #ffffff;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  /* ── HEADER ── */
  .pdf-header {
    background: #0a0a0a;
    padding: 28px 45px 22px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: relative;
    overflow: hidden;
  }
  .pdf-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #008CA4, #FFD166, #008CA4);
  }
  .header-brand { color: #ffffff; }
  .brand-logo {
    font-family: 'Montserrat', sans-serif;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 3px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-bar { width: 4px; height: 24px; background: #FFD166; border-radius: 2px; }
  .brand-sub { font-size: 8px; color: rgba(255,255,255,0.5); letter-spacing: 2px; margin-top: 3px; text-transform: uppercase; }
  .header-meta { text-align: right; }
  .meta-doc-type {
    font-family: 'Montserrat', sans-serif;
    font-size: 9px;
    font-weight: 700;
    color: #FFD166;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .meta-client { font-size: 18px; font-weight: 600; color: #ffffff; }
  .meta-details { font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 2px; }

  /* ── SECTION TITLES ── */
  .section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .section-number {
    width: 22px; height: 22px;
    background: #008CA4;
    color: white;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #008CA4;
  }

  /* ── BLOQUE 1: ANCLAJE ── */
  .anchor-block {
    background: #f8f9fa;
    border-left: 3px solid #008CA4;
    padding: 18px 22px;
    border-radius: 0 8px 8px 0;
    margin: 0 45px 22px;
  }
  .anchor-kpis {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }
  .kpi-item { text-align: center; }
  .kpi-value {
    font-size: 20px;
    font-weight: 700;
    color: #0a0a0a;
    line-height: 1;
  }
  .kpi-value.danger { color: #c0392b; }
  .kpi-label { font-size: 8px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .kpi-divider { width: 1px; background: #e0e0e0; }
  .anchor-narrative {
    font-size: 9.5px;
    color: #444;
    line-height: 1.6;
    font-style: italic;
    border-top: 1px solid #e8e8e8;
    padding-top: 12px;
  }
  .anchor-highlight { color: #c0392b; font-weight: 700; font-style: normal; }

  /* ── BLOQUE 2: IKEA ── */
  .ikea-block {
    margin: 0 45px 22px;
  }
  .ikea-table { width: 100%; border-collapse: collapse; }
  .ikea-table td { padding: 7px 10px; font-size: 9.5px; border-bottom: 1px solid #f0f0f0; }
  .ikea-check { width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ikea-check.checked { background: #008CA4; }
  .ikea-check.unchecked { background: #e8e8e8; }
  .ikea-check-icon { font-size: 10px; color: white; }
  .priority-badge {
    font-size: 7px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    padding: 2px 7px; border-radius: 10px;
  }
  .priority-alta { background: #fef3f2; color: #c0392b; }
  .priority-media { background: #fef9eb; color: #b7791f; }
  .priority-baja { background: #f0f9ff; color: #0369a1; }

  /* ── BLOQUE 3: NARRATIVA ── */
  .narrative-block {
    margin: 0 45px 18px;
    background: #ffffff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 16px 20px;
  }
  .narrative-text { font-size: 9.5px; color: #444; line-height: 1.7; }

  /* ── PÁGINA 2 ── */

  /* ── BLOQUE 4: ANZUELO (tabla 3 paquetes) ── */
  .packages-grid {
    display: grid;
    grid-template-columns: 1fr 1.1fr 1fr;
    gap: 10px;
    margin: 0 45px 20px;
  }
  .package-card {
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 14px 14px 16px;
    position: relative;
    background: #fff;
  }
  .package-card.recommended {
    border: 2px solid #008CA4;
    background: #f0f9fa;
    box-shadow: 0 4px 16px rgba(0,140,164,0.12);
  }
  .recommended-badge {
    position: absolute;
    top: -10px; left: 50%; transform: translateX(-50%);
    background: #008CA4;
    color: white;
    font-size: 7px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .package-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; }
  .package-price { font-size: 22px; font-weight: 700; color: #0a0a0a; margin: 6px 0 2px; }
  .package-price span { font-size: 12px; font-weight: 400; color: #888; }
  .package-card.recommended .package-price { color: #008CA4; }
  .package-tagline { font-size: 8.5px; color: #666; margin-bottom: 10px; line-height: 1.4; }
  .package-features { list-style: none; }
  .package-features li {
    font-size: 8px; color: #555;
    padding: 3px 0;
    padding-left: 12px;
    position: relative;
    line-height: 1.4;
  }
  .package-features li::before { content: '✓'; position: absolute; left: 0; color: #008CA4; font-weight: 700; }
  .package-features li.extra::before { content: '+'; color: #e67e22; }
  .package-features li.missing { color: #bbb; }
  .package-features li.missing::before { content: '—'; color: #ddd; }

  /* ── BLOQUE 5: PODER DEL GRATIS ── */
  .bonified-block {
    margin: 0 45px 20px;
    background: #f8fbf8;
    border: 1px solid #d4edda;
    border-radius: 8px;
    padding: 14px 18px;
  }
  .bonified-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px;
  }
  .bonified-total-label { font-size: 8px; color: #2d6a4f; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .bonified-total-value { font-size: 13px; font-weight: 700; color: #2d6a4f; }
  .bonified-table { width: 100%; border-collapse: collapse; }
  .bonified-table td { padding: 5px 8px; font-size: 8.5px; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .bonified-table td:last-child { text-align: right; white-space: nowrap; }
  .price-strikethrough { color: #999; text-decoration: line-through; margin-right: 6px; }
  .price-free { color: #2d6a4f; font-weight: 700; font-size: 9px; background: #d4edda; padding: 1px 6px; border-radius: 4px; }

  /* ── BLOQUE 6: CIERRE ── */
  .closing-block {
    margin: 0 45px 16px;
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }
  .investment-box {
    background: #0a0a0a;
    color: white;
    border-radius: 10px;
    padding: 16px 22px;
    flex: 1;
  }
  .investment-label { font-size: 8px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .investment-amount { font-size: 28px; font-weight: 300; color: #FFD166; }
  .investment-currency { font-size: 12px; color: rgba(255,255,255,0.4); margin-left: 4px; }
  .investment-package { font-size: 9px; color: rgba(255,255,255,0.6); margin-top: 4px; }
  .conditions-box {
    flex: 1;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    padding: 16px 18px;
  }
  .condition-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
  .condition-icon { font-size: 12px; }
  .condition-text { font-size: 8.5px; color: #555; line-height: 1.4; }
  .condition-bold { font-weight: 700; color: #1a1a1a; }

  /* ── FOOTER ── */
  .pdf-footer {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: #f8f9fa;
    border-top: 1px solid #e8e8e8;
    padding: 12px 45px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left { font-size: 8px; color: #aaa; }
  .footer-center { font-size: 8px; color: #888; font-style: italic; }
  .footer-signature { text-align: right; }
  .sig-name { font-size: 9px; font-weight: 700; color: #1a1a1a; }
  .sig-role { font-size: 8px; color: #008CA4; }

  .page-content { padding-bottom: 60px; }

  @media print {
    body { margin: 0; padding: 0; }
    .pdf-page { page-break-after: always; }
  }
`;

// ─── Componente ────────────────────────────────────────────────────────────────

const ProposalPDFTemplate = forwardRef<HTMLDivElement, ProposalPDFTemplateProps>(
  ({ formData, result, arielyResult }, ref) => {
    const { anchor, packages, bonifiedItems, totalBonified, ikeaPriorities, targetPackage } = arielyResult;

    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const docNumber = `ING-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const fmt = (n: number) => `U$S ${new Intl.NumberFormat('de-DE').format(n)}`;

    return (
      <div ref={ref} className="proposal-pdf-wrapper" style={{ background: '#e8e8e8', padding: '0' }}>
        <style>{CSS}</style>

        {/* ═══════════════════════════════════════════════════════════════
            PÁGINA 1 — EL VALOR
        ════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page">
          <div className="page-content">
            {/* Header */}
            <div className="pdf-header">
              <div className="header-brand">
                <div className="brand-logo">
                  <div className="brand-bar" />
                  INGENTIA
                </div>
                <div className="brand-sub">Ingeniería &amp; Tecnología</div>
              </div>
              <div className="header-meta">
                <div className="meta-doc-type">Propuesta Comercial</div>
                <div className="meta-client">{formData.clientName}</div>
                <div className="meta-details">{docNumber} · {today} · {formData.projectName}</div>
              </div>
            </div>

            {/* Spacer */}
            <div style={{ height: '22px' }} />

            {/* ── Bloque 1: ANCLAJE ── */}
            <div style={{ padding: '0 45px', marginBottom: '8px' }}>
              <div className="section-label">
                <div className="section-number">1</div>
                <div className="section-title">Diagnóstico de Impacto Financiero</div>
              </div>
            </div>

            <div className="anchor-block">
              <div className="anchor-kpis">
                <div className="kpi-item">
                  <div className="kpi-value danger">${anchor.annualInefficencyCost.toLocaleString('de-DE')}</div>
                  <div className="kpi-label">Costo anual estimado de ineficiencias (USD)</div>
                </div>
                <div className="kpi-divider" />
                <div className="kpi-item">
                  <div className="kpi-value">${anchor.revenueAtRisk.toLocaleString('de-DE')}</div>
                  <div className="kpi-label">Facturación anual en riesgo operativo (USD)</div>
                </div>
                <div className="kpi-divider" />
                <div className="kpi-item">
                  <div className="kpi-value">{anchor.investmentVsWasteRatio}</div>
                  <div className="kpi-label">Inversión propuesta / costo de ineficiencia</div>
                </div>
              </div>
              <div className="anchor-narrative">
                {anchor.narrativeText.split(anchor.investmentVsWasteRatio).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="anchor-highlight">{anchor.investmentVsWasteRatio}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Bloque 2: IKEA ── */}
            <div style={{ padding: '0 45px', marginBottom: '8px' }}>
              <div className="section-label">
                <div className="section-number">2</div>
                <div className="section-title">Prioridades Co-definidas con {formData.clientName}</div>
              </div>
            </div>

            <div className="ikea-block">
              <table className="ikea-table">
                <tbody>
                  {ikeaPriorities.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ width: '28px' }}>
                        <div className={`ikea-check ${item.checked ? 'checked' : 'unchecked'}`}>
                          {item.checked && <span className="ikea-check-icon">✓</span>}
                        </div>
                      </td>
                      <td style={{ color: item.checked ? '#1a1a1a' : '#888' }}>
                        {item.description}
                      </td>
                      <td style={{ width: '70px', textAlign: 'right' }}>
                        <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                          {item.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Bloque 3: NARRATIVA ── */}
            <div style={{ padding: '0 45px', marginBottom: '8px' }}>
              <div className="section-label">
                <div className="section-number">3</div>
                <div className="section-title">Nuestra Solución para {formData.clientName}</div>
              </div>
            </div>

            <div className="narrative-block">
              <p className="narrative-text">{result.commercialNarrative}</p>
            </div>

            {/* ROI quick stat */}
            <div style={{ margin: '0 45px', padding: '12px 18px', background: '#fffbea', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>Retorno de Inversión Estimado</div>
                <div style={{ fontSize: '9.5px', color: '#78350f', marginTop: '2px' }}>{result.roiEstimate}</div>
              </div>
            </div>
          </div>

          {/* Footer Pág 1 */}
          <div className="pdf-footer">
            <div className="footer-left">ingentia.tech@gmail.com · +1 16 129 8057</div>
            <div className="footer-center">Propuesta Confidencial — Página 1 de 2</div>
            <div className="footer-signature">
              <div className="sig-name">Fernando Miceli</div>
              <div className="sig-role">Socio Fundador · Ingentia</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            PÁGINA 2 — EL PRECIO
        ════════════════════════════════════════════════════════════════ */}
        <div className="pdf-page" style={{ pageBreakBefore: 'always' }}>
          <div className="page-content">
            {/* Header Pág 2 */}
            <div className="pdf-header">
              <div className="header-brand">
                <div className="brand-logo">
                  <div className="brand-bar" />
                  INGENTIA
                </div>
                <div className="brand-sub">Ingeniería &amp; Tecnología</div>
              </div>
              <div className="header-meta">
                <div className="meta-doc-type">Opciones de Inversión</div>
                <div className="meta-client">{formData.clientName}</div>
                <div className="meta-details">{docNumber} · {today}</div>
              </div>
            </div>

            <div style={{ height: '22px' }} />

            {/* ── Bloque 4: EFECTO ANZUELO ── */}
            <div style={{ padding: '0 45px', marginBottom: '18px' }}>
              <div className="section-label">
                <div className="section-number">4</div>
                <div className="section-title">Comparativo de Opciones de Inversión</div>
              </div>
              <div className="packages-grid">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`package-card ${pkg.isRecommended ? 'recommended' : ''}`}
                    style={{ marginTop: pkg.isRecommended ? '10px' : '0' }}
                  >
                    {pkg.isRecommended && (
                      <div className="recommended-badge">⭐ MÁS ELEGIDO</div>
                    )}
                    <div className="package-label">{pkg.label}</div>
                    <div className="package-price">
                      {fmt(pkg.price)}
                    </div>
                    <div className="package-tagline">{pkg.tagline}</div>
                    <ul className="package-features">
                      {pkg.features.map((f, i) => (
                        <li
                          key={i}
                          className={pkg.premiumExtras?.includes(f) ? 'extra' : ''}
                        >
                          {f}
                        </li>
                      ))}
                      {/* El paquete Esencial no tiene implementación */}
                      {pkg.id === 'essential' && result.pricing.module2.price > 0 && (
                        <li className="missing">Sin implementación técnica</li>
                      )}
                      {pkg.id === 'essential' && result.pricing.module3.monthlyPrice > 0 && (
                        <li className="missing">Sin soporte mensual incluido</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Bloque 5: PODER DEL GRATIS ── */}
            <div style={{ padding: '0 45px', marginBottom: '8px' }}>
              <div className="section-label">
                <div className="section-number">5</div>
                <div className="section-title">Servicios Incluidos Sin Cargo Adicional</div>
              </div>
            </div>

            <div className="bonified-block">
              <div className="bonified-header">
                <div className="bonified-total-label">Total incluido sin cargo</div>
                <div className="bonified-total-value">{fmt(totalBonified)}</div>
              </div>
              <table className="bonified-table">
                <tbody>
                  {bonifiedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#2d6a4f' }}>✓</td>
                      <td>{item.concept}</td>
                      <td>
                        <span className="price-strikethrough">{fmt(item.realValue)}</span>
                        <span className="price-free">BONIFICADO $0</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Bloque 6: CIERRE DE PRECIO ── */}
            <div style={{ padding: '0 45px', marginBottom: '8px' }}>
              <div className="section-label">
                <div className="section-number">6</div>
                <div className="section-title">Tu Inversión · Paquete {targetPackage.label}</div>
              </div>
            </div>

            <div className="closing-block">
              <div className="investment-box">
                <div className="investment-label">Inversión Total Estimada</div>
                <div>
                  <span className="investment-amount">{fmt(targetPackage.price)}</span>
                  <span className="investment-currency">USD</span>
                </div>
                <div className="investment-package">Paquete {targetPackage.label} · {formData.projectName}</div>
                {result.pricing.module3.monthlyPrice > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>
                    + {fmt(result.pricing.module3.monthlyPrice)} USD/mes (Evolución &amp; Soporte, opcional)
                  </div>
                )}
              </div>
              <div className="conditions-box">
                <div className="condition-row">
                  <div className="condition-icon">💳</div>
                  <div className="condition-text">
                    <span className="condition-bold">Forma de pago: </span>
                    30% anticipo al inicio · 70% contra entrega de hitos acordados
                  </div>
                </div>
                <div className="condition-row">
                  <div className="condition-icon">📅</div>
                  <div className="condition-text">
                    <span className="condition-bold">Validez de la oferta: </span>
                    30 días corridos desde {today}
                  </div>
                </div>
                <div className="condition-row">
                  <div className="condition-icon">💱</div>
                  <div className="condition-text">
                    <span className="condition-bold">Moneda: </span>
                    USD. TC oficial del día de pago para pagos en moneda local.
                  </div>
                </div>
                <div className="condition-row">
                  <div className="condition-icon">📋</div>
                  <div className="condition-text">
                    <span className="condition-bold">Impuestos: </span>
                    No incluidos en la presente propuesta.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Pág 2 */}
          <div className="pdf-footer">
            <div className="footer-left">ingentia.tech@gmail.com · +1 16 129 8057</div>
            <div className="footer-center">¡Gracias por la oportunidad de trabajar juntos! — Página 2 de 2</div>
            <div className="footer-signature">
              <div className="sig-name">Fernando Miceli</div>
              <div className="sig-role">Socio Fundador · Ingentia</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProposalPDFTemplate.displayName = 'ProposalPDFTemplate';
export default ProposalPDFTemplate;
