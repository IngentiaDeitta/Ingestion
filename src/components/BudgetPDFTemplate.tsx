/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, forwardRef } from 'react';
import { mockClients, mockProjects } from '../data/mockData';

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

    const client = mockClients.find(c => c.id === formData.clientId) || {
      name: formData.clientName || 'Cliente Potencial',
      company: formData.clientName || 'Empresa',
      email: 'contacto@cliente.com',
      logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=100&h=100&fit=crop'
    };

    const project = mockProjects.find(p => p.id === formData.projectId) || {
      name: formData.projectName || 'Proyecto de Consultoría IA',
    };

    // Cálculos de presupuesto
    const getBasePrice = () => {
        if (!result) return 0;
        return result.module1.total;
    };

    const getImplementationPrice = () => {
        if (!result) return 0;
        return result.module2.total;
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    };

    return (
      <div ref={ref} className="bg-white text-[#111111] font-sans selection:bg-red-500 selection:text-white" style={{ width: '860px', minHeight: '1100px', margin: '0 auto', boxSizing: 'border-box' }}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
            
            .pdf-page {
              font-family: 'DM Sans', sans-serif;
              color: #111111;
              line-height: 1.5;
            }
            .bebas { font-family: 'Bebas+Neue', cursive; }
            h1, h2, h3 { font-family: 'Bebas+Neue', cursive; letter-spacing: 0.05em; }
            .red-text { color: #ed382d; }
            .bg-red { background: #ed382d; color: white; }
            .border-red { border-color: #ed382d; }
          `}
        </style>

        <div className="pdf-page p-12 flex flex-col gap-10">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg"></div>
                <h1 className="text-4xl font-bold tracking-tighter">INGENT<span className="red-text">IA</span></h1>
              </div>
              <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Smart Business Solutions</p>
            </div>
            
            <div className="text-right">
              <h2 className="text-5xl font-bold text-gray-100/10 -mt-4 bebas">PROPOSAL</h2>
              <div className="mt-2 text-[11px] font-medium text-gray-500 uppercase tracking-widest">
                Ref: PR-{new Date().getFullYear()}-042
              </div>
            </div>
          </div>

          {/* Main Info Box */}
          <div className="grid grid-cols-2 gap-8 border-y-2 border-black/5 py-10">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Preparado para:</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-black/5">
                  <span className="text-xl font-bold text-black">{client.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black m-0 leading-none">{client.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{client.company}</p>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fecha de Emisión</p>
              <p className="text-lg font-bold text-black">{today}</p>
              <p className="text-[11px] text-gray-400 mt-1">Válido por 30 días</p>
            </div>
          </div>

          {/* Project Title */}
          <div className="bg-black text-white p-10 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[80px] -mr-32 -mt-32"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 relative z-10">Propuesta de Proyecto</p>
            <h2 className="text-4xl italic font-bold tracking-tight mb-4 relative z-10">{project.name}</h2>
            <div className="flex gap-4 relative z-10">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Transformación Digital</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">IA Generativa</span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-10 pt-4">
            {/* Left Column: Pricing */}
            <div className="col-span-12">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-sm">01</span>
                Desglose de la Inversión
              </h3>

              <div className="space-y-4">
                {/* Module 1 */}
                <div className="bg-gray-50 rounded-[24px] p-6 border border-black/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-lg text-black">Módulo 1: Análisis y Consultoría Estratégica</h4>
                            <p className="text-sm text-gray-500 mt-1">Auditoría de procesos, detección de cuellos de botella y Roadmap de IA.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-black">{result ? formatCurrency(result.module1.total) : '€0,00'}</span>
                        </div>
                    </div>
                </div>

                {/* Totals Box */}
                <div className="bg-red-600 rounded-[32px] p-8 text-white mt-10 shadow-xl shadow-red-600/20 flex justify-between items-center">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1">Inversión Total Estimada</p>
                        <h2 className="text-5xl font-bold m-0 bebas tracking-normal">{result ? formatCurrency(result.module1.total) : '€0,00'}</h2>
                        <p className="text-[10px] mt-2 opacity-60">* Los precios no incluyen impuestos (IVA 21%)</p>
                    </div>
                    <div className="text-right border-l border-white/20 pl-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-3">Términos de Pago</p>
                        <div className="space-y-1">
                            <p className="text-xs font-bold">50% al inicio del proyecto</p>
                            <p className="text-xs font-bold">50% a la entrega del informe final</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-auto border-t border-black/5 pt-8 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <div className="flex gap-6">
                <span>ingentia.com</span>
                <span>hola@ingentia.com</span>
            </div>
            <div className="flex gap-6">
                 <span>Madrid, España</span>
                 <span>+34 912 345 678</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BudgetPDFTemplate.displayName = 'BudgetPDFTemplate';

export default BudgetPDFTemplate;
