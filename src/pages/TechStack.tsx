import { useState, useEffect } from 'react';
import {
  Info, ChevronRight, Check, X, Loader2, Copy, Download, Sparkles, Search,
  BookOpen, Boxes, Layers, Wand2, ClipboardList, CircleDot, AlertTriangle, Save,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  diseniarArquitectura, planMaestroAMarkdown,
  type PlanMaestro, type HerramientaCatalogo, type ArquitecturaReferencia,
} from '../lib/gemini-arquitectura';

type Tab = 'metodologia' | 'catalogo' | 'arquitecturas' | 'disenador' | 'runbooks';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'metodologia', label: 'Metodología', icon: BookOpen },
  { id: 'catalogo', label: 'Catálogo', icon: Boxes },
  { id: 'arquitecturas', label: 'Arquitecturas', icon: Layers },
  { id: 'disenador', label: 'Diseñador', icon: Wand2 },
  { id: 'runbooks', label: 'Runbooks', icon: ClipboardList },
];

interface Fase {
  id: string;
  orden: number;
  nombre: string;
  herramienta: string;
  proposito: string;
  entregable: string;
  detalle: string;
  prompts: { titulo: string; texto: string }[] | null;
}

interface Herramienta extends HerramientaCatalogo {
  id: string;
  alternativas: { nombre: string; pros: string; contras: string }[] | null;
  tags: string[] | null;
}

interface Arquitectura extends ArquitecturaReferencia {
  id: string;
  diagrama: string;
  tags: string[] | null;
}

interface Runbook {
  id: string;
  titulo: string;
  categoria: string;
  resumen: string;
  pasos: { titulo: string; detalle: string }[] | null;
  fuente: string;
}

const ESTADO_STYLE: Record<string, string> = {
  estandar: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  evaluacion: 'bg-amber-50 text-amber-700 border-amber-200',
  descartada: 'bg-rose-50 text-rose-700 border-rose-200',
};
const ESTADO_LABEL: Record<string, string> = {
  estandar: 'Estándar',
  evaluacion: 'En evaluación',
  descartada: 'Descartada',
};

export default function TechStack() {
  const [activeTab, setActiveTab] = useState<Tab>('metodologia');

  const [fases, setFases] = useState<Fase[]>([]);
  const [herramientas, setHerramientas] = useState<Herramienta[]>([]);
  const [arquitecturas, setArquitecturas] = useState<Arquitectura[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    const [f, h, a, r] = await Promise.all([
      supabase.from('stack_fases').select('*').order('orden'),
      supabase.from('stack_herramientas').select('*').order('orden'),
      supabase.from('stack_arquitecturas').select('*').order('orden'),
      supabase.from('stack_runbooks').select('*').order('orden'),
    ]);
    setFases((f.data as Fase[]) || []);
    setHerramientas((h.data as Herramienta[]) || []);
    setArquitecturas((a.data as Arquitectura[]) || []);
    setRunbooks((r.data as Runbook[]) || []);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1400px] mx-auto pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A]">Stack Tecnológico</h1>
          <p className="text-[#666666] mt-1">
            Cómo trabajamos, con qué, y cómo se define la arquitectura de un proyecto nuevo.
          </p>
        </div>
        <div className="flex flex-wrap bg-white/40 p-1.5 rounded-full border border-white/50 backdrop-blur-md shadow-sm">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? 'bg-[#222222] text-white shadow-md'
                    : 'text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center text-[#666666] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Cargando el stack...
        </div>
      ) : (
        <main>
          {activeTab === 'metodologia' && <Metodologia fases={fases} />}
          {activeTab === 'catalogo' && <Catalogo herramientas={herramientas} />}
          {activeTab === 'arquitecturas' && <Arquitecturas arquitecturas={arquitecturas} />}
          {activeTab === 'disenador' && (
            <Disenador herramientas={herramientas} arquitecturas={arquitecturas} />
          )}
          {activeTab === 'runbooks' && <Runbooks runbooks={runbooks} />}
        </main>
      )}
    </div>
  );
}

/* ─────────────────────────── MÓDULO 1 · METODOLOGÍA ─────────────────────────── */

function Metodologia({ fases }: { fases: Fase[] }) {
  const [abierta, setAbierta] = useState<string | null>(fases[0]?.id || null);

  return (
    <section className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">El camino de un proyecto, fase por fase</h2>
        <p className="text-sm text-[#666666] mt-1">
          Cada fase tiene una herramienta, un propósito y un entregable concreto. No se pasa a la siguiente
          sin el entregable de la anterior.
        </p>
      </div>

      <div className="relative">
        <div className="absolute top-2 bottom-2 left-[19px] w-px bg-gradient-to-b from-[#008fcd] via-[#008fcd]/40 to-transparent" />
        <div className="space-y-3">
          {fases.map((f) => {
            const open = abierta === f.id;
            return (
              <div key={f.id} className="relative pl-14">
                <div
                  className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    open
                      ? 'bg-[#008fcd] text-white border-[#008fcd]'
                      : 'bg-white text-[#008fcd] border-[#008fcd]/30'
                  }`}
                >
                  {f.orden}
                </div>
                <button
                  onClick={() => setAbierta(open ? null : f.id)}
                  className={`w-full text-left rounded-2xl border transition-all p-5 ${
                    open
                      ? 'bg-white border-[#008fcd]/40 shadow-md'
                      : 'bg-white/50 border-white/60 hover:bg-white/80 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-semibold text-[#1A1A1A]">{f.nombre}</h3>
                    <span className="shrink-0 text-[11px] font-mono px-3 py-1 rounded-full bg-[#008fcd]/10 text-[#008fcd] border border-[#008fcd]/20">
                      {f.herramienta}
                    </span>
                  </div>
                  <p className="text-sm text-[#4A4A4A] mt-2">{f.proposito}</p>

                  {open && (
                    <div className="mt-5 space-y-5 border-t border-black/5 pt-5">
                      {f.detalle && (
                        <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-line">{f.detalle}</p>
                      )}

                      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1">
                          Entregable
                        </p>
                        <p className="text-sm text-[#1A1A1A]">{f.entregable}</p>
                      </div>

                      {f.prompts?.length ? (
                        <div className="space-y-3">
                          <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">
                            Prompts maestros
                          </p>
                          {f.prompts.map((p, i) => (
                            <PromptBox key={i} titulo={p.titulo} texto={p.texto} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PromptBox({ titulo, texto }: { titulo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="bg-[#1A1A1A] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5">
        <span className="text-xs font-medium text-white/70">{titulo}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          }}
          className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors"
        >
          {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="px-4 py-3 text-[12px] leading-relaxed text-white/85 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto custom-scrollbar">
        {texto}
      </pre>
    </div>
  );
}

/* ─────────────────────────── MÓDULO 2 · CATÁLOGO ─────────────────────────── */

function Catalogo({ herramientas }: { herramientas: Herramienta[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [seleccionada, setSeleccionada] = useState<Herramienta | null>(null);

  const filtradas = herramientas.filter((h) => {
    const coincide =
      !busqueda ||
      [h.nombre, h.categoria, h.que_es, h.cuando_usar, ...(h.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(busqueda.toLowerCase());
    const estadoOk = filtroEstado === 'todos' || h.estado === filtroEstado;
    return coincide && estadoOk;
  });

  const porCategoria = filtradas.reduce<Record<string, Herramienta[]>>((acc, h) => {
    (acc[h.categoria] ||= []).push(h);
    return acc;
  }, {});

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por herramienta, uso o tag..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-black/10 bg-white/60 text-sm outline-none focus:border-[#008fcd] focus:ring-2 focus:ring-[#008fcd]/15 transition-all"
            />
          </div>
          <div className="flex bg-white/50 p-1 rounded-full border border-black/10">
            {['todos', 'estandar', 'evaluacion'].map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  filtroEstado === e ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                {e === 'todos' ? 'Todas' : ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(porCategoria).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#008fcd] mb-3 uppercase">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSeleccionada(h)}
                  className={`text-left bg-white/50 backdrop-blur-md p-4 rounded-xl border transition-all group ${
                    seleccionada?.id === h.id
                      ? 'border-[#008fcd] shadow-md bg-white'
                      : 'border-white/60 hover:bg-white/80 hover:border-[#008fcd]/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-[#1A1A1A] text-sm">{h.nombre}</h4>
                    <span
                      className={`shrink-0 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${
                        ESTADO_STYLE[h.estado] || ESTADO_STYLE.estandar
                      }`}
                    >
                      {ESTADO_LABEL[h.estado] || h.estado}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] line-clamp-2">{h.que_es}</p>
                  <div className="flex items-center gap-1 mt-3 text-[11px] text-[#008fcd] opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalle <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filtradas.length === 0 && (
          <p className="text-center text-[#666666] py-16">Ninguna herramienta coincide con la búsqueda.</p>
        )}
      </div>

      <div className="lg:col-span-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 sticky top-8 min-h-[420px] flex flex-col">
          {seleccionada ? (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-xl font-bold text-[#1A1A1A]">{seleccionada.nombre}</h2>
                <button onClick={() => setSeleccionada(null)} className="text-[#999999] hover:text-[#1A1A1A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#008fcd] font-semibold mb-5">
                {seleccionada.categoria}
              </p>

              <p className="text-sm text-[#4A4A4A] leading-relaxed mb-5">{seleccionada.que_es}</p>

              <div className="space-y-4">
                <Campo titulo="Cuándo usarla" valor={seleccionada.cuando_usar} />
                <Campo titulo="Costo" valor={seleccionada.costo} mono />

                {seleccionada.alternativas?.length ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-2">
                      Alternativas evaluadas
                    </p>
                    <div className="space-y-2">
                      {seleccionada.alternativas.map((alt) => (
                        <div key={alt.nombre} className="bg-white/60 p-3 rounded-xl border border-white/70">
                          <p className="font-semibold text-xs text-[#1A1A1A] mb-1.5">vs {alt.nombre}</p>
                          <p className="text-[11px] text-emerald-600 flex items-start gap-1">
                            <Check className="w-3 h-3 mt-0.5 shrink-0" /> {alt.pros}
                          </p>
                          <p className="text-[11px] text-rose-600 flex items-start gap-1 mt-1">
                            <X className="w-3 h-3 mt-0.5 shrink-0" /> {alt.contras}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {seleccionada.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {seleccionada.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-[#666666] font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <Info className="w-10 h-10 text-[#CCCCCC] mb-3" />
              <p className="text-sm text-[#666666]">
                Elegí una herramienta para ver cuándo usarla, qué cuesta y contra qué se evaluó.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Campo({ titulo, valor, mono }: { titulo: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-1.5">{titulo}</p>
      <p className={`text-sm text-[#1A1A1A] ${mono ? 'font-mono text-[#008fcd]' : ''}`}>{valor}</p>
    </div>
  );
}

/* ─────────────────────────── MÓDULO 3 · ARQUITECTURAS ─────────────────────────── */

function Arquitecturas({ arquitecturas }: { arquitecturas: Arquitectura[] }) {
  const [abierta, setAbierta] = useState<string | null>(arquitecturas[0]?.id || null);

  return (
    <section className="space-y-4">
      {arquitecturas.map((a) => {
        const open = abierta === a.id;
        return (
          <div
            key={a.id}
            className={`bg-white/60 backdrop-blur-xl rounded-2xl border transition-all overflow-hidden ${
              open ? 'border-[#008fcd]/40 shadow-md' : 'border-white/60 shadow-sm'
            }`}
          >
            <button
              onClick={() => setAbierta(open ? null : a.id)}
              className="w-full text-left p-6 hover:bg-white/40 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] text-lg">{a.nombre}</h3>
                  <p className="text-sm text-[#666666] mt-0.5">{a.caso_uso}</p>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-[#008fcd] shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                />
              </div>
            </button>

            {open && (
              <div className="px-6 pb-6 space-y-5 border-t border-black/5 pt-5">
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1">
                    Cuándo aplica
                  </p>
                  <p className="text-sm text-[#1A1A1A]">{a.cuando_aplica}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-2">
                      Componentes
                    </p>
                    <div className="space-y-1.5">
                      {(a.componentes || []).map((c, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-white/60 rounded-lg px-3 py-2 border border-white/70"
                        >
                          <span className="text-[10px] uppercase tracking-wider text-[#008fcd] font-bold w-28 shrink-0 pt-0.5">
                            {c.capa}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A]">{c.herramienta}</p>
                            <p className="text-xs text-[#666666]">{c.detalle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-2">
                      Diagrama
                    </p>
                    <pre className="bg-[#1A1A1A] text-white/85 rounded-xl p-4 text-[11px] leading-relaxed font-mono overflow-x-auto custom-scrollbar">
                      {a.diagrama}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo titulo="Costo estimado" valor={a.costo_estimado} mono />
                  <Campo titulo="Por qué esta combinación" valor={a.justificacion} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ─────────────────────────── MÓDULO 4 · DISEÑADOR ─────────────────────────── */

function Disenador({
  herramientas,
  arquitecturas,
}: {
  herramientas: Herramienta[];
  arquitecturas: Arquitectura[];
}) {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [proyectoId, setProyectoId] = useState('');
  const [form, setForm] = useState({
    proyecto: '',
    cliente: '',
    requerimiento: '',
    contexto: '',
    usuarios: '',
  });
  const [canales, setCanales] = useState<string[]>([]);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanMaestro | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const CANALES = ['Web', 'WhatsApp', 'Email', 'Voz / Teléfono', 'Interno (staff)'];

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name, client, description, arquitectura_plan, arquitectura_md')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProyectos(data || []));
  }, []);

  const elegirProyecto = (id: string) => {
    setProyectoId(id);
    const p = proyectos.find((x) => x.id === id);
    if (!p) return;
    setForm({
      proyecto: p.name || '',
      cliente: p.client || '',
      requerimiento: p.description || '',
      contexto: '',
      usuarios: '',
    });
    // Si ese proyecto ya tiene un plan generado, lo traemos en vez de arrancar de cero.
    if (p.arquitectura_plan) {
      setPlan(p.arquitectura_plan as PlanMaestro);
      setMarkdown(p.arquitectura_md || '');
    } else {
      setPlan(null);
      setMarkdown('');
    }
    setGuardado(false);
  };

  const generar = async () => {
    if (!form.proyecto.trim() || !form.requerimiento.trim()) {
      setError('Necesito al menos el nombre del proyecto y el requerimiento.');
      return;
    }
    setGenerando(true);
    setError(null);
    setGuardado(false);
    try {
      const resultado = await diseniarArquitectura({
        proyecto: form.proyecto,
        cliente: form.cliente || 'Sin especificar',
        requerimiento: form.requerimiento,
        contexto: form.contexto || undefined,
        usuarios: form.usuarios || undefined,
        canales,
        catalogo: herramientas,
        referencias: arquitecturas,
      });
      setPlan(resultado);
      setMarkdown(planMaestroAMarkdown(resultado, { proyecto: form.proyecto, cliente: form.cliente }));
    } catch (e: any) {
      setError(e.message || 'No se pudo generar la arquitectura.');
    } finally {
      setGenerando(false);
    }
  };

  const guardarEnProyecto = async () => {
    if (!proyectoId || !plan) return;
    const { error: err } = await supabase
      .from('projects')
      .update({ arquitectura_plan: plan, arquitectura_md: markdown })
      .eq('id', proyectoId);
    if (err) {
      setError('No se pudo guardar en el proyecto: ' + err.message);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const descargar = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-maestro-${form.proyecto.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-5">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6 sticky top-8">
          <h2 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#008fcd]" /> Definir la arquitectura
          </h2>
          <p className="text-xs text-[#666666] mt-1 mb-5">
            El resultado es el Plan Maestro que se pega en Antigravity antes de escribir código.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">
                Partir de un proyecto existente
              </label>
              <select
                value={proyectoId}
                onChange={(e) => elegirProyecto(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm outline-none focus:border-[#008fcd]"
              >
                <option value="">— Cargar manualmente —</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.arquitectura_plan ? '· ya tiene plan' : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Proyecto"
              value={form.proyecto}
              onChange={(v) => setForm({ ...form, proyecto: v })}
              placeholder="CRM conversacional para DripColor"
            />
            <Input
              label="Cliente"
              value={form.cliente}
              onChange={(v) => setForm({ ...form, cliente: v })}
              placeholder="DripColor SA"
            />
            <Textarea
              label="Requerimiento"
              value={form.requerimiento}
              onChange={(v) => setForm({ ...form, requerimiento: v })}
              placeholder="Qué pidió el cliente, en sus propios términos."
              rows={4}
            />
            <Textarea
              label="Contexto adicional (opcional)"
              value={form.contexto}
              onChange={(v) => setForm({ ...form, contexto: v })}
              placeholder="Radiografía, transcripción de la reunión, sistemas que ya usa."
              rows={3}
            />
            <Input
              label="Usuarios estimados"
              value={form.usuarios}
              onChange={(v) => setForm({ ...form, usuarios: v })}
              placeholder="8 internos + 300 clientes finales"
            />

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">
                Canales de interacción
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CANALES.map((c) => {
                  const on = canales.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setCanales(on ? canales.filter((x) => x !== c) : [...canales, c])}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        on
                          ? 'bg-[#008fcd] text-white border-[#008fcd]'
                          : 'bg-white/60 text-[#666666] border-black/10 hover:border-[#008fcd]/50'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              onClick={generar}
              disabled={generando}
              className="w-full flex items-center justify-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors shadow-lg shadow-black/10"
            >
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Diseñando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generar Plan Maestro
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="lg:col-span-7">
        {!plan ? (
          <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-dashed border-black/10 p-16 text-center">
            <Wand2 className="w-10 h-10 text-[#CCCCCC] mx-auto mb-4" />
            <p className="text-sm text-[#666666] max-w-md mx-auto">
              Completá el requerimiento y generá la arquitectura. El diseñador solo usa herramientas del
              catálogo y arranca siempre desde una de las arquitecturas de referencia de la casa.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#008fcd] font-bold">
                    Arquitectura base
                  </p>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">{plan.arquitectura_base}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(markdown);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 1800);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#222222] text-white text-xs font-medium hover:bg-black transition-colors"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiado ? 'Copiado' : 'Copiar .md'}
                  </button>
                  <button
                    onClick={descargar}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 border border-black/10 text-[#1A1A1A] text-xs font-medium hover:bg-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                  {proyectoId && (
                    <button
                      onClick={guardarEnProyecto}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {guardado ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      {guardado ? 'Guardado' : 'Guardar'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#4A4A4A] leading-relaxed">{plan.resumen_ejecutivo}</p>
            </div>

            <Bloque titulo="Decisiones de stack">
              <div className="space-y-2">
                {plan.decisiones.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white/60 rounded-xl px-4 py-3 border border-white/70"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-[#008fcd] font-bold w-32 shrink-0 pt-0.5">
                      {d.capa}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
                        {d.herramienta}
                        {d.fuera_de_catalogo && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                            fuera de catálogo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[#666666] mt-0.5">{d.justificacion}</p>
                      {d.alternativa_descartada && (
                        <p className="text-[11px] text-[#999999] mt-1">
                          Se descartó: {d.alternativa_descartada}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Bloque>

            <Bloque titulo="Esquema de datos propuesto">
              <div className="space-y-4">
                {plan.esquema_datos.map((t) => (
                  <div key={t.tabla}>
                    <p className="font-mono text-sm text-[#008fcd] font-semibold">{t.tabla}</p>
                    <p className="text-xs text-[#666666] mb-2">{t.proposito}</p>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs min-w-[420px]">
                        <thead>
                          <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider text-[#666666]">
                            <th className="py-1.5 pr-4">Campo</th>
                            <th className="py-1.5 pr-4">Tipo</th>
                            <th className="py-1.5">Detalle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {t.campos.map((c) => (
                            <tr key={c.nombre}>
                              <td className="py-1.5 pr-4 font-mono text-[#1A1A1A]">{c.nombre}</td>
                              <td className="py-1.5 pr-4 font-mono text-[#666666]">{c.tipo}</td>
                              <td className="py-1.5 text-[#666666]">{c.detalle}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </Bloque>

            <Bloque titulo="Flujos funcionales">
              <div className="space-y-4">
                {plan.flujos.map((f, i) => (
                  <div key={i} className="bg-white/60 rounded-xl p-4 border border-white/70">
                    <p className="font-medium text-sm text-[#1A1A1A]">{f.nombre}</p>
                    <p className="text-xs text-[#008fcd] mt-0.5 mb-2">Disparador: {f.disparador}</p>
                    <ol className="space-y-1">
                      {f.pasos.map((p, j) => (
                        <li key={j} className="text-xs text-[#4A4A4A] flex gap-2">
                          <span className="text-[#999999] font-mono shrink-0">{j + 1}.</span> {p}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </Bloque>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.riesgos.length > 0 && (
                <Bloque titulo="Riesgos">
                  <ul className="space-y-1.5">
                    {plan.riesgos.map((r, i) => (
                      <li key={i} className="text-xs text-[#4A4A4A] flex gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </Bloque>
              )}
              {plan.fuera_de_alcance.length > 0 && (
                <Bloque titulo="Fuera de alcance">
                  <ul className="space-y-1.5">
                    {plan.fuera_de_alcance.map((r, i) => (
                      <li key={i} className="text-xs text-[#4A4A4A] flex gap-2">
                        <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" /> {r}
                      </li>
                    ))}
                  </ul>
                </Bloque>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
                <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-1.5">
                  Costo de infraestructura
                </p>
                <p className="text-sm text-[#1A1A1A]">{plan.costo_infraestructura}</p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1.5">
                  Primer paso
                </p>
                <p className="text-sm text-[#1A1A1A]">{plan.primer_paso}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-6">
      <h3 className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-4">{titulo}</h3>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm outline-none focus:border-[#008fcd] focus:ring-2 focus:ring-[#008fcd]/15 transition-all"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white/70 text-sm outline-none focus:border-[#008fcd] focus:ring-2 focus:ring-[#008fcd]/15 transition-all resize-none"
      />
    </div>
  );
}

/* ─────────────────────────── MÓDULO 5 · RUNBOOKS ─────────────────────────── */

function Runbooks({ runbooks }: { runbooks: Runbook[] }) {
  const [abierto, setAbierto] = useState<string | null>(runbooks[0]?.id || null);

  const porCategoria = runbooks.reduce<Record<string, Runbook[]>>((acc, r) => {
    (acc[r.categoria] ||= []).push(r);
    return acc;
  }, {});

  return (
    <section className="space-y-8">
      {Object.entries(porCategoria).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#008fcd] mb-3 uppercase">{cat}</h3>
          <div className="space-y-3">
            {items.map((r) => {
              const open = abierto === r.id;
              return (
                <div
                  key={r.id}
                  className={`bg-white/60 backdrop-blur-xl rounded-2xl border transition-all overflow-hidden ${
                    open ? 'border-[#008fcd]/40 shadow-md' : 'border-white/60 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setAbierto(open ? null : r.id)}
                    className="w-full text-left p-5 hover:bg-white/40 transition-colors flex items-start justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-[#1A1A1A]">{r.titulo}</h4>
                      <p className="text-sm text-[#666666] mt-0.5">{r.resumen}</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-[#008fcd] shrink-0 mt-1 transition-transform ${
                        open ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {open && (
                    <div className="px-5 pb-5 border-t border-black/5 pt-5">
                      <ol className="space-y-4">
                        {(r.pasos || []).map((p, i) => (
                          <li key={i} className="flex gap-4">
                            <div className="shrink-0 w-6 h-6 rounded-full bg-[#008fcd]/10 text-[#008fcd] flex items-center justify-center text-xs font-bold mt-0.5">
                              {i + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-[#1A1A1A]">{p.titulo}</p>
                              <p className="text-sm text-[#4A4A4A] leading-relaxed mt-1">{p.detalle}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                      {r.fuente && (
                        <p className="text-[11px] text-[#999999] mt-5 pt-4 border-t border-black/5 flex items-center gap-1.5">
                          <CircleDot className="w-3 h-3" /> Fuente: {r.fuente}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
