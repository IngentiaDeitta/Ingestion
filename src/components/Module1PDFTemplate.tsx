import React, { forwardRef } from 'react';
import logoNegro from '../assets/logo-negro.png';

interface Module1PDFTemplateProps {
  leadId: string;
  result: {
    annual_waste_usd: number;
    summary: string;
    waste_breakdown: { concept: string; cost: number }[];
  };
}

const CSS = `
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body {
    background: #ffffff !important;
    color: #1A1A1A !important;
    width: 210mm;
    height: 297mm;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
  }
  .mod1-pdf {
    padding: 20mm;
    width: 210mm;
    height: 297mm;
    box-sizing: border-box;
  }
}
.mod1-pdf {
  background: white;
  color: #1A1A1A;
  font-family: 'Inter', sans-serif;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}
`;

const Module1PDFTemplate = forwardRef<HTMLDivElement, Module1PDFTemplateProps>(
  ({ leadId, result }, ref) => {
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const fmt = (n: number) => `$${n.toLocaleString()}`;

    return (
      <div ref={ref} className="mod1-pdf">
        <style>{CSS}</style>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px', marginBottom: '40px' }}>
          <img src={logoNegro} alt="Ingentia" style={{ height: '40px' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Propuesta de Diagnóstico</p>
            <p style={{ fontSize: '12px', color: '#1A1A1A', fontWeight: 600 }}>Ref: #LD-{leadId}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>{today}</p>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Módulo 1: Radiografía Operativa
          </h1>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            Inmersión profunda en sus procesos para detectar ineficiencias, levantar la arquitectura actual y trazar el mapa de ruta hacia la eficiencia.
          </p>
        </div>

        {/* Dolor Encontrado (Resumen) */}
        <div style={{ background: '#fff0f0', border: '1px solid #ffd6d6', borderRadius: '16px', padding: '24px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#d32f2f', fontWeight: 800, letterSpacing: '1px', marginBottom: '16px' }}>
            Hipótesis Inicial de Deuda Operativa
          </h3>
          <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.6, marginBottom: '20px' }}>
            {result.summary}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>Fuga Anual Estimada:</div>
             <div style={{ fontSize: '32px', color: '#d32f2f', fontWeight: 800, letterSpacing: '-0.03em' }}>{fmt(result.annual_waste_usd)} USD</div>
          </div>
        </div>

        {/* Alcance del Diagnóstico */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            Entregables del Diagnóstico
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              "Auditoría completa de flujos de trabajo actuales.",
              "Mapeo de arquitectura tecnológica y silos de información.",
              "Cuantificación precisa de la deuda operativa y tiempos muertos.",
              "Roadmap estratégico de implementación (Módulos sugeridos).",
              "Cotización Value-Based con tiempos de repago (ROI)."
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#444' }}>
                <span style={{ color: '#FFD166', fontWeight: 900 }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Inversión */}
        <div style={{ background: '#FAFAFA', border: '1px solid #EAEAEA', borderRadius: '16px', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', fontWeight: 800, letterSpacing: '1px', marginBottom: '8px' }}>
                Inversión Fija (Módulo 1)
              </h3>
              <p style={{ fontSize: '12px', color: '#666' }}>
                * Este valor se bonificará al 100% si se avanza al Módulo 2 (Implementación).
              </p>
           </div>
           <div style={{ fontSize: '36px', fontWeight: 800, color: '#1A1A1A' }}>
              $1,200 <span style={{ fontSize: '16px', color: '#666', fontWeight: 600 }}>USD</span>
           </div>
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
           <p style={{ fontSize: '10px', color: '#999' }}>
              Documento confidencial generado por el Motor de Pricing IngentIA.
           </p>
        </div>

      </div>
    );
  }
);

export default Module1PDFTemplate;
