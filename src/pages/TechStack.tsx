import { useState } from "react";
import { Info, FileText, Code, Database, Zap, Server, ChevronRight, Cpu, Shuffle, Check, X, GitMerge } from "lucide-react";

const techData = [
  {
    id: 'context',
    name: 'NotebookLM',
    category: 'Cerebro de Contexto',
    icon: FileText,
    role: 'Analiza minutas, reglamentaciones y procesos del cliente para alimentar la IA.',
    limits: {
      processing: 'Hasta 50 fuentes por libreta.',
      storage: '500,000 palabras por fuente.',
      perk: 'Extracción semántica de "Puntos de Dolor".'
    },
    alternatives: [
      { name: 'Claude Projects', pros: 'Razonamiento lógico', cons: 'Poca capacidad de archivos' },
      { name: 'Custom RAG', pros: 'Propiedad total', cons: 'Costo de mantenimiento alto' }
    ]
  },
  {
    id: 'ide',
    name: 'Google Antigravity',
    category: 'Desarrollo / IDE',
    icon: Code,
    role: 'Vibe Coding en React. Orquestación total mediante protocolos MCP.',
    limits: {
      processing: 'Gemini 1.5 Pro (2M Tokens).',
      storage: 'Sincronización nativa con GitHub.',
      perk: 'Generación de UI a partir de diagramas.'
    },
    alternatives: [
      { name: 'Cursor', pros: 'Estándar de industria', cons: 'Menor integración Google Suite' },
      { name: 'v0.dev', pros: 'Excelente para UI', cons: 'Limitado en lógica funcional' }
    ]
  },
  {
    id: 'backend',
    name: 'Supabase',
    category: 'Persistencia & Auth',
    icon: Database,
    role: 'Base de datos PostgreSQL, Autenticación y Seguridad RLS.',
    limits: {
      processing: 'Latencia < 50ms.',
      storage: '500MB DB / 5GB Storage (Free).',
      perk: 'SQL nativo para ingenieros.'
    },
    alternatives: [
      { name: 'Firebase', pros: 'Tiempo real fluido', cons: 'NoSQL (No permite Joins complejos)' },
      { name: 'Pocketbase', pros: 'Extrema simplicidad', cons: 'Dificultad de escalado horizontal' }
    ]
  },
  {
    id: 'automation',
    name: 'n8n',
    category: 'Orquestación',
    icon: Zap,
    role: 'Automatización de flujos. Conexión entre IA y sistemas legados del cliente.',
    limits: {
      processing: 'Ilimitado (Self-hosted) / VPS dependiente.',
      storage: 'Logs internos en Postgres.',
      perk: 'Soporte nativo para AI Agents.'
    },
    alternatives: [
      { name: 'Make.com', pros: 'UI amigable', cons: 'Costo alto por operación' },
      { name: 'Zapier', pros: 'Muchas integraciones', cons: 'Precio prohibitivo para Pymes' }
    ]
  },
  {
    id: 'deploy',
    name: 'Dokploy / Vercel',
    category: 'Infraestructura',
    icon: Server,
    role: 'Despliegue de Apps React (Vercel) y Servicios Docker (Dokploy).',
    limits: {
      processing: 'Aislamiento en contenedores Docker.',
      storage: 'Según VPS (Hostinger/DigitalOcean).',
      perk: 'Costo fijo (Dokploy) vs Costo por tráfico.'
    },
    alternatives: [
      { name: 'Coolify', pros: 'Open Source puro', cons: 'Soporte limitado' },
      { name: 'Netlify', pros: 'Sencillez de uso', cons: 'Más caro que Vercel' }
    ]
  }
];

const workflowSteps = [
  { step: 1, title: 'Auditoría Funcional', tech: 'NotebookLM', desc: 'Analizamos la documentación del cliente y detectamos cuellos de botella mediante análisis semántico.' },
  { step: 2, title: 'Arquitectura de Datos', tech: 'Supabase', desc: 'Diseñamos el modelo relacional en Postgres y definimos las políticas de seguridad RLS por rol.' },
  { step: 3, title: 'Vibe Coding', tech: 'Antigravity / Stitch', desc: 'Construimos la UI reactiva y la lógica funcional en lenguaje natural, conectando con el backend.' },
  { step: 4, title: 'Orquestación IA', tech: 'n8n', desc: 'Configuramos agentes que procesan tareas asíncronas (lectura de facturas, envíos masivos).' },
  { step: 5, title: 'Contenerización', tech: 'Docker', desc: 'Empaquetamos el sistema para garantizar que sea portable a cualquier servidor (Local o Cloud).' },
  { step: 6, title: 'Lanzamiento & Escalado', tech: 'Dokploy / Vercel', desc: 'Despliegue final con monitoreo de impacto real y ROI mensual.' }
];

export default function TechStack() {
  const [activeTab, setActiveTab] = useState<'stack' | 'workflow'>('stack');
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);

  const selectedTech = techData.find(t => t.id === selectedTechId);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-[#1A1A1A]">
            INGENT<span className="text-[#008fcd]">IA</span>
            <span className="text-[#666666] font-light text-2xl ml-2 tracking-normal">TECH BLUEPRINT</span>
          </h1>
          <p className="text-[#4A4A4A] mt-1 font-medium italic">"Ingeniería de procesos materializada en tecnología."</p>
        </div>

        <div className="flex bg-white/40 p-1.5 rounded-full border border-white/50 backdrop-blur-md shadow-sm">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === 'stack'
                ? 'bg-[#222222] text-white shadow-md'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-white/50'
            }`}
          >
            STACK INTERACTIVO
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === 'workflow'
                ? 'bg-[#222222] text-white shadow-md'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-white/50'
            }`}
          >
            ENGINEERING PATH
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* SECTION: TECH STACK */}
        {activeTab === 'stack' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stack Map */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-xs font-bold tracking-[0.2em] text-[#008fcd] mb-4 uppercase">Capas de Infraestructura</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {techData.map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTechId(item.id)}
                      className={`bg-white/40 backdrop-blur-md p-5 rounded-[24px] cursor-pointer border transition-all group ${
                        selectedTechId === item.id ? 'border-[#008fcd] shadow-md' : 'border-white/50 hover:bg-white/60 hover:border-[#008fcd]/50 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl transition-colors ${
                          selectedTechId === item.id ? 'bg-[#008fcd] text-white' : 'bg-white/60 text-[#008fcd] group-hover:bg-[#008fcd] group-hover:text-white'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-colors ${
                          selectedTechId === item.id ? 'text-[#008fcd]' : 'text-[#666666] group-hover:text-[#008fcd]'
                        }`} />
                      </div>
                      <h3 className="font-bold text-[#1A1A1A] text-lg">{item.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#666666] mt-1 font-medium">{item.category}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-4">
              <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-lg p-6 sticky top-8 min-h-[500px] flex flex-col">
                {selectedTech ? (
                  <div className="w-full animate-in fade-in duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-[#008fcd] rounded-2xl text-white shadow-md">
                        <selectedTech.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#1A1A1A]">{selectedTech.name}</h2>
                        <p className="text-xs uppercase tracking-tighter text-[#008fcd] font-semibold">{selectedTech.category}</p>
                      </div>
                    </div>

                    <p className="text-[#4A4A4A] text-sm italic mb-8 border-l-2 border-[#008fcd] pl-4">{selectedTech.role}</p>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Cpu className="w-4 h-4" /> Límites de Procesamiento
                        </h4>
                        <div className="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                          <p className="font-mono text-sm text-[#008fcd] font-semibold">{selectedTech.limits.processing}</p>
                          <p className="font-mono text-xs text-[#666666] mt-1">{selectedTech.limits.storage}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Shuffle className="w-4 h-4" /> Análisis de Alternativa
                        </h4>
                        <div className="space-y-3">
                          {selectedTech.alternatives.map(alt => (
                            <div key={alt.name} className="bg-white/40 p-3 rounded-xl border border-white/50 shadow-sm">
                              <div className="flex justify-between font-bold text-xs mb-2 text-[#1A1A1A]">
                                <span>vs {alt.name}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2 text-[11px] font-medium">
                                <div className="text-emerald-600 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> PRO: {alt.pros}
                                </div>
                                <div className="text-rose-600 flex items-center gap-1">
                                  <X className="w-3 h-3" /> CON: {alt.cons}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <Info className="w-12 h-12 text-[#999999] mb-4" />
                    <p className="text-[#666666] font-medium">Selecciona un componente del stack para analizar límites y alternativas.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION: WORKFLOW */}
        {activeTab === 'workflow' && (
          <section>
            <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-lg p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Zap className="w-64 h-64 text-[#008fcd]" />
              </div>

              <h2 className="text-2xl font-bold mb-10 flex items-center gap-3 text-[#1A1A1A]">
                <GitMerge className="text-[#008fcd]" />
                Secuencia de Entrega Sistémica
              </h2>

              <div className="relative space-y-12 ml-4 md:ml-12">
                {/* Connector line */}
                <div className="absolute top-4 bottom-4 left-[20px] md:left-[20px] w-0.5 bg-gradient-to-b from-[#008fcd] to-transparent z-0"></div>
                
                {workflowSteps.map(w => (
                  <div key={w.step} className="flex flex-col md:flex-row gap-6 relative z-10">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#008fcd] text-white flex items-center justify-center font-black shadow-md relative">
                      {w.step}
                    </div>
                    <div className="flex-grow bg-white/80 backdrop-blur-md p-6 rounded-2xl border-l-4 border-[#008fcd] shadow-sm ml-6 md:ml-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-[#1A1A1A]">{w.title}</h3>
                        <span className="font-mono text-[10px] bg-white/60 px-3 py-1 rounded-full text-[#008fcd] border border-[#008fcd]/30 font-semibold">{w.tech}</span>
                      </div>
                      <p className="text-[#4A4A4A] text-sm leading-relaxed">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-black/5 flex flex-col justify-center items-center gap-4 text-[10px] uppercase tracking-widest text-[#666666] font-bold">
        <p>© 2025 INGENTIA ENGINEERING AI</p>
        <div className="flex gap-6">
            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> SQL NATIVE</span>
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> AI-DRIVEN OPS</span>
        </div>
      </footer>
    </div>
  );
}
