/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef } from 'react';

interface BudgetPDFTemplateProps {
  formData: any;
  result: any;
}

const BudgetPDFTemplate = forwardRef<HTMLDivElement, BudgetPDFTemplateProps>(
  ({ formData, result }, ref) => {
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formatCurrency = (amount: number) => {
      const formatted = new Intl.NumberFormat('de-DE').format(amount);
      return `U$S ${formatted}`;
    };

    if (!result) return null;

    const { selectedModules = ['module1'] } = result;
    
    // Filter modules based on selection
    const modulesToRender = [];
    if (selectedModules.includes('module1')) {
      modulesToRender.push({
        id: 'Módulo 1',
        title: 'DIAGNÓSTICO RÁPIDO',
        label: 'Consultoría',
        desc: 'Análisis, diagnóstico y hoja de ruta operativa',
        fullDesc: result.pricing.module1.description,
        hours: result.hoursStage1,
        price: result.pricing.module1.price,
        type: 'one-time'
      });
    }
    if (selectedModules.includes('module2') && result.pricing.module2.price > 0) {
      modulesToRender.push({
        id: 'Módulo 2',
        title: 'IMPLEMENTACIÓN',
        label: result.pricing.module2.pricingModel,
        desc: 'Ejecución técnica e integración de soluciones',
        fullDesc: result.pricing.module2.description,
        hours: result.hoursStage2,
        price: result.pricing.module2.price,
        type: 'one-time'
      });
    }
    if (selectedModules.includes('module3') && result.pricing.module3.monthlyPrice > 0) {
      modulesToRender.push({
        id: 'Módulo 3',
        title: 'EVOLUCIÓN & SOPORTE',
        label: 'Recurrente',
        desc: 'Mantenimiento preventivo y mejora continua',
        fullDesc: result.pricing.module3.description,
        hours: '-',
        price: result.pricing.module3.monthlyPrice,
        type: 'monthly'
      });
    }

    const totalOneTime = modulesToRender
      .filter(m => m.type === 'one-time')
      .reduce((sum, m) => sum + m.price, 0);

    return (
      <div ref={ref} className="bg-white text-[#333333] font-sans overflow-hidden" style={{ width: '794px', height: '1122px', margin: '0 auto', boxSizing: 'border-box', position: 'relative', border: '1px solid #f0f0f0' }}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap');
            
            .pdf-container {
              font-family: 'Inter', sans-serif;
              color: #333333;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .header-pattern {
              background-color: #008CA4;
              height: 160px;
              width: 100%;
              position: relative;
              color: white;
              padding: 25px 45px;
              overflow: hidden;
            }
            .pattern-circles {
              position: absolute;
              top: -20px;
              left: -20px;
              width: 100px;
              height: 100px;
              background-image: radial-gradient(circle, white 1px, transparent 1px);
              background-size: 10px 10px;
              opacity: 0.2;
              transform: rotate(45deg);
            }
            .header-title {
              font-family: 'Montserrat', sans-serif;
              font-size: 48px;
              letter-spacing: 10px;
              text-transform: uppercase;
              margin-top: 25px;
            }
            .logo-area {
              position: absolute;
              top: 30px;
              right: 45px;
              text-align: right;
            }
            .logo-text {
              font-weight: 800;
              font-size: 22px;
              display: flex;
              align-items: center;
              justify-content: flex-end;
              gap: 8px;
              color: white;
            }
            .logo-rect {
              width: 6px;
              height: 28px;
              background-color: white;
              order: -1;
            }
            .logo-subtitle {
              font-size: 9px;
              margin-top: 2px;
              opacity: 0.9;
              font-weight: 600;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              padding: 20px 45px;
              font-size: 11px;
              line-height: 1.4;
            }
            .module-block {
              margin-bottom: 20px;
            }
            .module-pill {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 0 45px;
              margin-bottom: 10px;
            }
            .pill-black {
              background: black;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              white-space: nowrap;
            }
            .module-title {
              font-weight: 700;
              font-size: 12px;
              color: #111;
            }
            .module-desc {
              font-size: 10px;
              color: #888;
            }
            .budget-table {
              width: calc(100% - 90px);
              margin: 0 45px 15px;
              border-collapse: collapse;
            }
            .budget-table th {
              background-color: #008CA4;
              color: white;
              text-align: left;
              padding: 8px 12px;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .budget-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #eeeeee;
              font-size: 10px;
              vertical-align: top;
            }
            .summary-area {
              margin-top: auto;
              padding: 15px 45px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 5px;
            }
            .summary-row {
              display: flex;
              justify-content: flex-end;
              gap: 30px;
              width: 350px;
            }
            .summary-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              text-align: right;
            }
            .summary-value {
              width: 110px;
              text-align: right;
              font-weight: 700;
              font-size: 12px;
            }
            .red-text {
              color: #D0021B;
            }
            .footer-notes {
              padding: 20px 45px 50px;
              border-top: 1px solid #eee;
            }
            .notes-title {
              font-weight: 700;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .notes-list {
              font-size: 9px;
              color: #666;
              padding-left: 15px;
              max-width: 500px;
            }
            .notes-list li {
              margin-bottom: 3px;
            }
            .signature-area {
              position: absolute;
              bottom: 40px;
              right: 45px;
              text-align: center;
              width: 180px;
            }
            .signature-img {
              max-height: 40px;
              margin: 0 auto 5px;
              mix-blend-mode: multiply;
            }
            .signature-name {
              font-weight: 700;
              font-size: 11px;
              color: #111;
            }
            .signature-role {
              font-size: 9px;
              color: #D0021B;
            }
            .bottom-pattern {
               position: absolute;
               bottom: 0;
               right: 0;
               width: 80px;
               height: 80px;
               background-image: radial-gradient(circle, #333 1px, transparent 1px);
               background-size: 10px 10px;
               opacity: 0.1;
               transform: rotate(-45deg);
            }
            
            @media print {
              body { margin: 0; padding: 0; }
              .bg-white { border: none !important; }
            }
          `}
        </style>

        <div className="pdf-container">
          {/* Header */}
          <div className="header-pattern">
            <div className="pattern-circles"></div>
            <div className="logo-area">
              <div className="logo-text">
                INGENTIA
                <div className="logo-rect"></div>
              </div>
              <p className="logo-subtitle">Ingeniería y Tech</p>
            </div>
            <h1 className="header-title">Presupuesto</h1>
          </div>

          {/* Client Info */}
          <div className="info-section">
            <div>
              <p><strong>Para:</strong></p>
              <p className="font-bold">{formData.clientName}</p>
              <p className="text-[#666]">contacto@{formData.clientName.toLowerCase().replace(/\s/g, '')}.com</p>
              <p className="text-[#666]">www.{formData.clientName.toLowerCase().replace(/\s/g, '')}.com</p>
            </div>
            <div className="text-right">
              <p><strong>No :</strong> ING-{new Date().getFullYear()}-012</p>
              <p><strong>Fecha :</strong> {today}</p>
              <p><strong>Email :</strong> ingentia.tech@gmail.com</p>
              <p><strong>Phone :</strong> +1 16 129 8057</p>
            </div>
          </div>

          {modulesToRender.map((module, idx) => (
            <div key={idx} className="module-block">
              {/* Module Pill */}
              <div className="module-pill">
                <div className="pill-black">{module.id}</div>
                <div>
                    <div className="module-title">{module.title}</div>
                    <div className="module-desc">{module.desc}</div>
                </div>
              </div>

              {/* Table */}
              <table className="budget-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Concepto</th>
                    <th style={{ width: '45%' }}>Descripción</th>
                    <th style={{ width: '15%' }}>Horas</th>
                    <th style={{ width: '15%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">{module.label}</td>
                    <td className="text-[#666] leading-tight">
                      {module.fullDesc}
                    </td>
                    <td className="font-medium">{module.hours} {module.hours !== '-' ? 'hs' : ''}</td>
                    <td className="font-semibold">{formatCurrency(module.price)} {module.type === 'monthly' ? '/mes' : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          {/* Totals */}
          <div className="summary-area">
            {selectedModules.length > 0 && (
              <>
                <div className="summary-row">
                  <div className="summary-label">Subtotal Inversión Inicial</div>
                  <div className="summary-value">{formatCurrency(totalOneTime)}</div>
                </div>
                <div className="summary-row">
                  <div className="summary-label red-text">Impuestos (No incl.)</div>
                  <div className="summary-value red-text">{formatCurrency(0)}</div>
                </div>
                <div className="summary-row mt-1">
                  <div className="summary-label" style={{ fontSize: '14px' }}>Total Estimado</div>
                  <div className="summary-value" style={{ fontSize: '16px' }}>{formatCurrency(totalOneTime)}</div>
                </div>
              </>
            )}
            <p className="text-[9px] text-[#888] mt-2 italic">¡Gracias por la oportunidad de trabajar juntos!</p>
          </div>

          {/* Notes */}
          <div className="footer-notes">
             <h4 className="notes-title">Notas y condiciones</h4>
             <ul className="notes-list">
                <li>Los precios están expresados en USD. Se tomará el TC oficial correspondiente al día de pago.</li>
                <li>Forma de pago: 30% anticipo, 70% contra entrega de hitos.</li>
                <li>La validez de esta propuesta es de 30 días corridos a partir de la fecha de emisión.</li>
             </ul>

             <div className="mt-4 flex items-center gap-3">
                <div className="p-1.5 bg-orange-50 rounded-lg">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div>
                   <p className="font-bold text-[10px]">Validez de Oferta</p>
                   <p className="text-[9px] text-[#888]">30 días desde {today}</p>
                </div>
             </div>
          </div>

          {/* Signature */}
          <div className="signature-area">
             <img 
               src="/signature.png" 
               alt="Firma" 
               className="signature-img"
             />
             <p className="signature-name">Fernando Miceli</p>
             <p className="signature-role">Socio Fundador</p>
          </div>

          <div className="bottom-pattern"></div>
        </div>
      </div>
    );
  }
);

BudgetPDFTemplate.displayName = 'BudgetPDFTemplate';

export default BudgetPDFTemplate;
