import React from 'react';
import { AnalysisResult } from '../pages/SmartQuoter';

interface BudgetPDFTemplateProps {
    results: AnalysisResult;
    clientName: string;
    projectName: string;
}

export const BudgetPDFTemplate = React.forwardRef<HTMLDivElement, BudgetPDFTemplateProps>((props, ref) => {
    const { results, clientName, projectName } = props;
    const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);
    const validUntilStr = validUntil.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div ref={ref} className="bg-white p-0 m-0 font-['DM_Sans',_sans-serif] text-[#111111]" style={{ width: '860px', minHeight: '1100px' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        
        .pdf-page {
          width: 860px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .pdf-header {
          display: grid;
          grid-template-columns: 6px 1fr auto;
          align-items: stretch;
          background: #111111;
          position: relative;
        }

        .pdf-header-accent {
          background: #ed382d;
          width: 6px;
        }

        .pdf-header-content {
          padding: 36px 44px;
        }

        .pdf-logo-block {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pdf-logo-bar {
          width: 5px;
          height: 36px;
          background: #ed382d;
          border-radius: 1px;
        }

        .pdf-logo-text {
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          font-size: 22px;
          color: #ffffff;
          letter-spacing: 1px;
        }

        .pdf-logo-sub {
          font-size: 8px;
          letter-spacing: 3.5px;
          color: #888;
          text-transform: uppercase;
          display: block;
          margin-top: 1px;
        }

        .pdf-doc-type {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 54px;
          color: #ffffff;
          letter-spacing: 3px;
          line-height: 1;
        }

        .pdf-doc-type span {
          color: #ed382d;
        }

        .pdf-header-meta {
          background: #ed382d;
          min-width: 200px;
          padding: 36px 36px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 12px;
        }

        .pdf-meta-item label {
          display: block;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 3px;
        }

        .pdf-meta-item value {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
        }

        .pdf-recipient-band {
          background: #f7fbfc;
          border-bottom: 1px solid #e8e8e8;
          padding: 22px 50px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          align-items: center;
        }

        .pdf-recipient-band .field label {
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
          display: block;
          margin-bottom: 4px;
        }

        .pdf-recipient-band .field value {
          font-size: 14px;
          font-weight: 500;
          color: #111111;
          display: block;
        }

        .pdf-recipient-band .field.primary value {
          font-size: 17px;
          font-weight: 600;
        }

        .pdf-section-title {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 28px 50px 10px;
        }

        .pdf-section-title .line {
          width: 28px;
          height: 3px;
          background: #ed382d;
          flex-shrink: 0;
        }

        .pdf-section-title h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 3px;
          color: #111111;
        }

        .pdf-modules {
          padding: 0 50px 10px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pdf-module-card {
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          overflow: hidden;
        }

        .pdf-module-header {
          display: grid;
          grid-template-columns: 4px auto 1fr auto;
          align-items: center;
          gap: 0;
          background: #f7fbfc;
          border-bottom: 1px solid #e8e8e8;
        }

        .pdf-module-stripe {
          height: 100%;
          min-height: 48px;
          background: #ed382d;
          width: 4px;
        }

        .pdf-module-badge {
          background: #111111;
          color: #ffffff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 5px 12px;
          margin: 10px 16px;
          border-radius: 2px;
        }

        .pdf-module-title-block {
          padding: 12px 10px;
        }

        .pdf-module-title-block h3 {
          font-size: 15px;
          font-weight: 600;
          color: #111111;
          line-height: 1.2;
        }

        .pdf-module-title-block p {
          font-size: 11px;
          color: #888;
          margin-top: 2px;
        }

        .pdf-module-type-tag {
          margin-right: 18px;
          background: #ed382d;
          color: #ffffff;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .pdf-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pdf-items-table thead tr {
          background: #2a2a2a;
          color: #ffffff;
        }

        .pdf-items-table thead th {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 9px 18px;
          text-align: left;
        }

        .pdf-items-table td {
          padding: 12px 18px;
          font-size: 12.5px;
          color: #2a2a2a;
          vertical-align: top;
          border-bottom: 1px solid #e8e8e8;
        }

        .pdf-subtotal-row td {
          background: #f7fbfc;
          font-weight: 600;
          color: #111111;
          border-top: 2px solid #e8e8e8;
        }

        .pdf-totals-section {
          padding: 24px 50px 10px;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 30px;
          align-items: end;
        }

        .pdf-notes-box {
          background: #f7fbfc;
          border-left: 3px solid #ed382d;
          padding: 16px 20px;
          border-radius: 0 4px 4px 0;
        }

        .pdf-notes-box h4 {
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 8px;
        }

        .pdf-notes-box p {
          font-size: 12px;
          color: #2a2a2a;
          line-height: 1.6;
        }

        .pdf-totals-table {
          width: 100%;
        }

        .pdf-totals-table tr td {
          padding: 5px 0;
          font-size: 13px;
          color: #2a2a2a;
        }

        .pdf-totals-table tr.grand td {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          letter-spacing: 2px;
          color: #111111;
          padding-top: 8px;
        }

        .pdf-totals-table tr.grand td:last-child {
          color: #ed382d;
          font-size: 26px;
        }

        .pdf-validity-row {
          padding: 18px 50px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          border-top: 1px solid #e8e8e8;
          margin-top: 20px;
        }

        .pdf-validity-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .pdf-validity-icon {
          width: 32px;
          height: 32px;
          background: #ed382d;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
        }

        .pdf-validity-text label {
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
          display: block;
          margin-bottom: 2px;
        }

        .pdf-validity-text span {
          font-size: 13px;
          font-weight: 500;
          color: #111111;
        }

        .pdf-signature-section {
          padding: 20px 50px 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          border-top: 1px solid #e8e8e8;
        }

        .pdf-sig-block label {
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #888;
          display: block;
          margin-bottom: 32px;
        }

        .pdf-sig-line {
          border-top: 1px solid #2a2a2a;
          padding-top: 8px;
        }

        .pdf-footer {
          background: #111111;
          padding: 16px 50px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 3px solid #ed382d;
        }

        .pdf-footer-brand {
          font-size: 13px;
          color: #fff;
          font-weight: 300;
          letter-spacing: 1px;
        }
      `}</style>

            <div className="pdf-page">
                {/* HEADER */}
                <div className="pdf-header">
                    <div className="pdf-header-accent"></div>
                    <div className="pdf-header-content">
                        <div className="pdf-logo-block">
                            <div className="pdf-logo-bar"></div>
                            <div>
                                <span className="pdf-logo-text">ingentIA</span>
                                <span className="pdf-logo-sub">ingeniería y tecnología</span>
                            </div>
                        </div>
                        <div className="pdf-doc-type">PRESU<span>PUESTO</span></div>
                    </div>
                    <div className="pdf-header-meta">
                        <div className="pdf-meta-item">
                            <label>N.º Propuesta</label>
                            <value>ING-2025-041</value>
                        </div>
                        <div className="pdf-meta-item">
                            <label>Fecha de emisión</label>
                            <value>{date}</value>
                        </div>
                        <div className="pdf-meta-item">
                            <label>Válido hasta</label>
                            <value>{validUntilStr}</value>
                        </div>
                    </div>
                </div>

                {/* RECIPIENT */}
                <div className="pdf-recipient-band">
                    <div className="pdf-field pdf-primary">
                        <label>Preparado para</label>
                        <value>{clientName}</value>
                    </div>
                    <div className="pdf-field">
                        <label>Proyecto</label>
                        <value>{projectName}</value>
                    </div>
                    <div className="pdf-field">
                        <label>Contacto</label>
                        <value>Representante Legal</value>
                    </div>
                </div>

                <div className="pdf-section-title">
                    <div className="pdf-line"></div>
                    <h2>Detalle de Servicios</h2>
                </div>

                <div className="pdf-modules">
                    {/* Module 1 */}
                    <div className="pdf-module-card">
                        <div className="pdf-module-header">
                            <div className="pdf-module-stripe"></div>
                            <div className="pdf-module-badge">Módulo 1</div>
                            <div className="pdf-module-title-block">
                                <h3>{results.labelStage1}</h3>
                                <p>Análisis, diagnóstico y hoja de ruta operativa</p>
                            </div>
                            <div className="pdf-module-type-tag">Por hora</div>
                        </div>
                        <table className="pdf-items-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '36%' }}>Concepto</th>
                                    <th>Descripción</th>
                                    <th style={{ width: '80px', textAlign: 'right' }}>Horas</th>
                                    <th style={{ width: '90px', textAlign: 'right' }}>Tarifa/h</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Servicios de Consultoría</strong></td>
                                    <td style={{ fontSize: '11px', color: '#666' }}>{results.pricing.module1.description}</td>
                                    <td style={{ textAlign: 'right' }}>{results.hoursStage1}</td>
                                    <td style={{ textAlign: 'right' }}>$85</td>
                                    <td style={{ textAlign: 'right' }}>${results.pricing.module1.price}</td>
                                </tr>
                                <tr className="pdf-subtotal-row">
                                    <td colSpan={2}></td>
                                    <td style={{ textAlign: 'right' }}><strong>{results.hoursStage1} hs.</strong></td>
                                    <td></td>
                                    <td style={{ textAlign: 'right', color: '#ed382d' }}><strong>${results.pricing.module1.price}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Module 2 */}
                    {results.pricing.module2.price > 0 && (
                        <div className="pdf-module-card">
                            <div className="pdf-module-header">
                                <div className="pdf-module-stripe"></div>
                                <div className="pdf-module-badge">Módulo 2</div>
                                <div className="pdf-module-title-block">
                                    <h3>Implementación & Automatización</h3>
                                    <p>Desarrollo de software SaaS and flujos automatizados</p>
                                </div>
                                <div className="pdf-module-type-tag">Precio cerrado</div>
                            </div>
                            <table className="pdf-items-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '36%' }}>Entregable</th>
                                        <th>Alcance</th>
                                        <th style={{ width: '80px', textAlign: 'right' }}>Unidad</th>
                                        <th style={{ width: '90px', textAlign: 'right' }}>Cant.</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Desarrollo Técnico</strong></td>
                                        <td style={{ fontSize: '11px', color: '#666' }}>{results.pricing.module2.description}</td>
                                        <td style={{ textAlign: 'right' }}>Proyecto</td>
                                        <td style={{ textAlign: 'right' }}>1</td>
                                        <td style={{ textAlign: 'right' }}>${results.pricing.module2.price}</td>
                                    </tr>
                                    <tr className="pdf-subtotal-row">
                                        <td colSpan={4}></td>
                                        <td style={{ textAlign: 'right', color: '#ed382d' }}><strong>${results.pricing.module2.price}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Module 3 */}
                    {results.pricing.module3.monthlyPrice > 0 && (
                        <div className="pdf-module-card">
                            <div className="pdf-module-header">
                                <div className="pdf-module-stripe"></div>
                                <div className="pdf-module-badge">Módulo 3</div>
                                <div className="pdf-module-title-block">
                                    <h3>Evolución & Soporte</h3>
                                    <p>Mantenimiento continuo y mejora de la solución</p>
                                </div>
                                <div className="pdf-module-type-tag">Fee mensual</div>
                            </div>
                            <table className="pdf-items-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '36%' }}>Servicio</th>
                                        <th>Descripción</th>
                                        <th style={{ width: '80px', textAlign: 'right' }}>Período</th>
                                        <th style={{ width: '90px', textAlign: 'right' }}>Fee/mes</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Soporte Técnico y Evolución</strong></td>
                                        <td style={{ fontSize: '11px', color: '#666' }}>{results.pricing.module3.description}</td>
                                        <td style={{ textAlign: 'right' }}>Anual</td>
                                        <td style={{ textAlign: 'right' }}>${results.pricing.module3.monthlyPrice}</td>
                                        <td style={{ textAlign: 'right' }}>${results.pricing.module3.monthlyPrice * 12}</td>
                                    </tr>
                                    <tr className="pdf-subtotal-row">
                                        <td colSpan={2}></td>
                                        <td style={{ textAlign: 'right' }}>Anual</td>
                                        <td style={{ textAlign: 'right' }}><strong>${results.pricing.module3.monthlyPrice}/mes</strong></td>
                                        <td style={{ textAlign: 'right', color: '#ed382d' }}><strong>${results.pricing.module3.monthlyPrice * 12}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* TOTALS */}
                <div className="pdf-totals-section">
                    <div className="pdf-notes-box">
                        <h4>Notas & condiciones</h4>
                        <p style={{ fontSize: '10px' }}>
                            • Los precios están expresados en USD y no incluyen impuestos.<br />
                            • El Módulo 1 se factura quincenalmente contra reporte de horas.<br />
                            • El Módulo 2 se abona 50% al inicio y 50% contra entrega final.<br />
                            • El Módulo 3 se factura mensualmente por adelantado.<br />
                            • Cualquier alcance fuera de lo detallado será presupuestado por separado.
                        </p>
                    </div>
                    <table className="pdf-totals-table">
                        <tbody>
                            <tr>
                                <td>Módulo 1 – Consultoría</td>
                                <td style={{ textAlign: 'right' }}>${results.pricing.module1.price}</td>
                            </tr>
                            {results.pricing.module2.price > 0 && (
                                <tr>
                                    <td>Módulo 2 – Implementación</td>
                                    <td style={{ textAlign: 'right' }}>${results.pricing.module2.price}</td>
                                </tr>
                            )}
                            {results.pricing.module3.monthlyPrice > 0 && (
                                <tr>
                                    <td>Módulo 3 – Soporte (anual)</td>
                                    <td style={{ textAlign: 'right' }}>${results.pricing.module3.monthlyPrice * 12}</td>
                                </tr>
                            )}
                            <tr style={{ borderTop: '1px solid #e8e8e8' }}>
                                <td style={{ color: '#888', fontSize: '11px', paddingTop: '10px' }}>Subtotal</td>
                                <td style={{ textAlign: 'right', color: '#888', fontSize: '11px', paddingTop: '10px' }}>
                                    ${results.pricing.totalInitialInvestment + (results.pricing.module3.monthlyPrice * 12)}
                                </td>
                            </tr>
                            <tr className="pdf-grand">
                                <td style={{ fontFamily: 'Bebas Neue', fontSize: '22px' }}>TOTAL INVERSIÓN</td>
                                <td style={{ textAlign: 'right', color: '#ed382d', fontSize: '26px' }}>
                                    ${results.pricing.totalInitialInvestment + (results.pricing.module3.monthlyPrice * 12)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* VALIDITY */}
                <div className="pdf-validity-row">
                    <div className="pdf-validity-item">
                        <div className="pdf-validity-icon">📅</div>
                        <div className="pdf-validity-text">
                            <label>Validez</label>
                            <span>30 días corridos</span>
                        </div>
                    </div>
                    <div className="pdf-validity-item">
                        <div className="pdf-validity-icon">💳</div>
                        <div className="pdf-validity-text">
                            <label>Moneda</label>
                            <span>USD</span>
                        </div>
                    </div>
                    <div className="pdf-validity-item">
                        <div className="pdf-validity-icon">🌐</div>
                        <div className="pdf-validity-text">
                            <label>Modalidad</label>
                            <span>Remota</span>
                        </div>
                    </div>
                </div>

                {/* SIGNATURE */}
                <div className="pdf-signature-section">
                    <div className="pdf-sig-block">
                        <label>Firma del cliente – Aceptación</label>
                        <div className="pdf-sig-line">
                            <span style={{ fontSize: '10px' }}>Nombre y cargo | Fecha</span>
                        </div>
                    </div>
                    <div className="pdf-sig-block">
                        <label>Firma IngentIA – Representante</label>
                        <div className="pdf-sig-line">
                            <span style={{ fontSize: '10px' }}>ingentIA — Ingeniería y Tecnología</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="pdf-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '3px', height: '20px', background: '#ed382d' }}></div>
                        <span className="pdf-footer-brand"><strong>ingentIA</strong> · ingeniería y tecnología</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>
                        ingentia.tech@gmail.com · www.ingentia.tech<br />
                        Propuesta N.º ING-2025-041
                    </div>
                </div>
            </div>
        </div>
    );
});

BudgetPDFTemplate.displayName = 'BudgetPDFTemplate';
