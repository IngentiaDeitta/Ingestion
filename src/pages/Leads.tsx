import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Filter, Plus, ChevronRight, Activity, Globe, Phone, MapPin, X, Loader2, Trash2, Sparkles, BarChart3, PieChart, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateLeadEnrichment } from '../lib/gemini-lead-enrichment';

interface Lead {
  id: number;
  empresa: string;
  dominio: string | null;
  sector: string | null;
  localidad: string | null;
  contacto_nombre: string | null;
  contacto_cargo: string | null;
  empleados_estimado: string | null;
  notas: string | null;
  web: string | null;
  linkedin_empresa: string | null;
  instagram: string | null;
  facebook: string | null;
  estado: string;
  pre_call_brief: any | null;
  industry?: string | null;
  qualification_status?: string | null;
}

const SEED_LEADS: Lead[] = [
  {
    id: 1,
    empresa: 'DripColor SRL',
    dominio: 'dripcolor.com',
    sector: 'Alimentos y Bebidas',
    localidad: 'Pilar, Buenos Aires',
    contacto_nombre: 'Edith Sanchez',
    contacto_cargo: 'Dueña / Operaciones',
    empleados_estimado: '25-50',
    notas: 'Fabricante de insumos para repostería y pastelería creativa en Parque Industrial Pilar.',
    web: 'https://dripcolor.com',
    linkedin_empresa: 'https://linkedin.com/company/dripcolor',
    instagram: 'https://instagram.com/dripcolor',
    facebook: null,
    estado: 'ENRIQUECIDO',
    pre_call_brief: {
      empresa_una_frase: 'Fabricante de insumos y colorantes para repostería y pastelería creativa.',
      industry: 'Alimentos y Bebidas',
      qualification_status: 'CALIFICADO',
      perfil: { empleados_estimado: '25-50', plantas_ubicaciones: 'Pilar, Buenos Aires', antiguedad: '15 años', rubro: 'Alimentos y Bebidas' },
      senales: [{ nivel: 'ALTA', descripcion: 'Proceso empírico de producción y costeo manual en planillas de Excel sin trazabilidad.' }],
      camaras_redes: ['ADIMRA', 'Parque Industrial Pilar'],
      interlocutor: { nombre: 'Edith Sanchez', cargo_estimado: 'Dueña', es_decisor: 'SI' },
      dolor_declarado: 'Carga manual repetitiva de órdenes de producción y partes de planta en Excel.',
      hipotesis_dolor: 'Sobrecostos operativos por pago sistemático de horas extras y falta de costo real por lote al cierre mensual.',
      stack_probable: ['Excel', 'WhatsApp', 'Tango Gestión'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo entra hoy un pedido desde la web hasta que se factura y despacha?'],
        bloque_b_dolor: ['¿Cuántas horas semanales dedica el equipo a volcar partes diarios a Excel?'],
        bloque_c_urgencia: ['¿Qué ocurre si duplican la producción el próximo trimestre con el esquema actual?']
      },
      encuadre_sugerido: 'Hola Edith, gracias por estos 30 minutos. La idea de hoy es entender el mapa operativo de DripColor...',
      fuentes: ['dripcolor.com', 'Google Reviews'],
      investigacion_verificada: true,
      redes: { web: 'https://dripcolor.com', linkedin: 'https://linkedin.com/company/dripcolor', instagram: 'https://instagram.com/dripcolor', facebook: null },
      presencia_digital: { google_rating: 4.8, google_reviews: 32, linkedin_followers: 1200, instagram_followers: 45000, sentimiento: 'POSITIVO', temas_positivos: ['Calidad de producto'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 90, presencia_digital: 85, madurez_mercado: 80, fit_ingentia: 92, global: 88 }
    }
  },
  {
    id: 2,
    empresa: 'Elektro Korrosión SRL',
    dominio: 'elektrokorrosion.com.ar',
    sector: 'Electromecánica y Metalurgia',
    localidad: 'El Talar, Tigre',
    contacto_nombre: 'Federico Gino',
    contacto_cargo: 'Socio / Director Técnico',
    empleados_estimado: '15-30',
    notas: 'Ingeniería en protección catódica y control de corrosión industrial.',
    web: 'https://elektrokorrosion.com.ar',
    linkedin_empresa: 'https://linkedin.com/company/elektrokorrosion',
    instagram: null,
    facebook: null,
    estado: 'CONVERTIDO',
    pre_call_brief: {
      empresa_una_frase: 'Soluciones integrales de protección catódica e ingeniería anticorrosiva.',
      industry: 'Electromecánica y Metalurgia',
      qualification_status: 'CALIFICADO',
      perfil: { empleados_estimado: '15-30', plantas_ubicaciones: 'El Talar, Tigre', antiguedad: '20 años', rubro: 'Electromecánica y Metalurgia' },
      senales: [{ nivel: 'ALTA', descripcion: 'Descentralización de 20.000 presupuestos históricos en archivos locales y WhatsApp.' }],
      camaras_redes: ['CADIEEL'],
      interlocutor: { nombre: 'Federico Gino', cargo_estimado: 'Director Técnico', es_decisor: 'SI' },
      dolor_declarado: 'Dispersión comercial entre HubSpot, Outlook y planillas locales.',
      hipotesis_dolor: 'Pérdida de trazabilidad de presupuestos y falta de recomendador inteligente de cotizaciones.',
      stack_probable: ['HubSpot', 'Excel', 'Outlook'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo gestionan el historial de presupuestos emitidos a clientes de gas y petróleo?'],
        bloque_b_dolor: ['¿Cuánto tiempo insume cotizar una obra especial sin consultar antecedentes?'],
        bloque_c_urgencia: ['¿Qué impacto tendría unificar el pipeline en un CRM omnicanal maestro?']
      },
      encuadre_sugerido: 'Hola Federico, un gusto saludarte. Hoy nos enfocamos en el ecosistema comercial de Elektro Korrosión...',
      fuentes: ['elektrokorrosion.com.ar'],
      investigacion_verificada: true,
      redes: { web: 'https://elektrokorrosion.com.ar', linkedin: 'https://linkedin.com/company/elektrokorrosion', instagram: null, facebook: null },
      presencia_digital: { google_rating: 4.6, google_reviews: 15, linkedin_followers: 2100, instagram_followers: 0, sentimiento: 'POSITIVO', temas_positivos: ['Solidez técnica'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 88, presencia_digital: 75, madurez_mercado: 85, fit_ingentia: 95, global: 90 }
    }
  },
  {
    id: 3,
    empresa: 'Laboratorios Andrómaco SA',
    dominio: 'andromaco.com.ar',
    sector: 'Farmacéutica y Cosmética',
    localidad: 'CABA',
    contacto_nombre: 'Diego Sturla',
    contacto_cargo: 'Gerente de Sistemas / IA',
    empleados_estimado: '200-500',
    notas: 'Laboratorio dermocosmético líder. Prospección para proyectos de IA aplicada.',
    web: 'https://andromaco.com.ar',
    linkedin_empresa: 'https://linkedin.com/company/laboratorios-andromaco',
    instagram: 'https://instagram.com/andromacoar',
    facebook: null,
    estado: 'REUNION_AGENDADA',
    pre_call_brief: {
      empresa_una_frase: 'Laboratorio líder en especialidades medicinales y cuidado dermocosmético.',
      industry: 'Farmacéutica y Cosmética',
      qualification_status: 'POTENCIAL',
      perfil: { empleados_estimado: '200-500', plantas_ubicaciones: 'CABA', antiguedad: '90 años', rubro: 'Farmacéutica y Cosmética' },
      senales: [{ nivel: 'MEDIA', descripcion: 'Evaluación de automatización de procesamiento documental normativo.' }],
      camaras_redes: ['CILFA', 'CAPA'],
      interlocutor: { nombre: 'Diego Sturla', cargo_estimado: 'Gerente de Sistemas', es_decisor: 'PROBABLE' },
      dolor_declarado: 'Búsqueda de soluciones de Inteligencia Artificial para aceleración de flujos de trabajo.',
      hipotesis_dolor: 'Alto volumen de documentación regulatoria y control de calidad en soporte no estructurado.',
      stack_probable: ['SAP', 'Documentum', 'Microsoft 365'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo procesan actualmente las solicitudes de auditoría y documentación técnica?'],
        bloque_b_dolor: ['¿Cuántas horas hombre dedican a la validación de expedientes de lotes?'],
        bloque_c_urgencia: ['¿Tienen iniciativas prioritarias de IA aprobadas para este semestre?']
      },
      encuadre_sugerido: 'Hola Diego, un gusto reunirnos. Queremos explorar las oportunidades de automatización e IA en Andrómaco...',
      fuentes: ['andromaco.com.ar'],
      investigacion_verificada: true,
      redes: { web: 'https://andromaco.com.ar', linkedin: 'https://linkedin.com/company/laboratorios-andromaco', instagram: 'https://instagram.com/andromacoar', facebook: null },
      presencia_digital: { google_rating: 4.7, google_reviews: 140, linkedin_followers: 45000, instagram_followers: 120000, sentimiento: 'POSITIVO', temas_positivos: ['Reputación médica'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 95, presencia_digital: 92, madurez_mercado: 90, fit_ingentia: 68, global: 82 }
    }
  },
  {
    id: 4,
    empresa: 'Chisap SCA',
    dominio: 'chisap.com.ar',
    sector: 'Alimentos y Bebidas',
    localidad: 'AMBA',
    contacto_nombre: 'Gerencia Operativa',
    contacto_cargo: 'Jefe de Planta',
    empleados_estimado: '30-60',
    notas: 'Frigorífico y distribuidor mayorista de embutidos.',
    web: 'https://chisap.com.ar',
    linkedin_empresa: null,
    instagram: null,
    facebook: null,
    estado: 'NUEVO',
    pre_call_brief: {
      empresa_una_frase: 'Frigorífico y elaborador de chacinados y embutidos de consumo masivo.',
      industry: 'Alimentos y Bebidas',
      qualification_status: 'CALIFICADO',
      perfil: { empleados_estimado: '30-60', plantas_ubicaciones: 'AMBA', antiguedad: '30 años', rubro: 'Alimentos y Bebidas' },
      senales: [{ nivel: 'ALTA', descripcion: 'Falta de trazabilidad digital en línea de envasado y despacho diario.' }],
      camaras_redes: ['CACHA'],
      interlocutor: { nombre: 'Jefe de Planta', cargo_estimado: 'Responsable de Producción', es_decisor: 'PROBABLE' },
      dolor_declarado: null,
      hipotesis_dolor: 'Pérdidas por mermas no contabilizadas en tiempo real y demoras en liquidación de repartos.',
      stack_probable: ['Planillas físicas', 'Excel'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo controlan el rendimiento de kilos envasados vs pesaje inicial en cámara?'],
        bloque_b_dolor: ['¿Cuántas horas lleva reconciliar los remitos de despacho al final del día?'],
        bloque_c_urgencia: ['¿Qué problemas de trazabilidad tienen ante inspecciones de SENASA?']
      },
      encuadre_sugerido: 'Buenas tardes, la reunión tiene por objeto revisar los cuellos de botella en la planta de Chisap...',
      fuentes: ['chisap.com.ar'],
      investigacion_verificada: true,
      redes: { web: 'https://chisap.com.ar', linkedin: null, instagram: null, facebook: null },
      presencia_digital: { google_rating: 4.2, google_reviews: 20, linkedin_followers: 0, instagram_followers: 0, sentimiento: 'NEUTRO', temas_positivos: ['Calidad de fiambres'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 75, presencia_digital: 40, madurez_mercado: 78, fit_ingentia: 86, global: 76 }
    }
  },
  {
    id: 5,
    empresa: 'Brogas SCA',
    dominio: 'brogas.com.ar',
    sector: 'Electromecánica y Metalurgia',
    localidad: 'AMBA',
    contacto_nombre: 'Vicepresidencia / Producción',
    contacto_cargo: 'Vicepresidente',
    empleados_estimado: '40-80',
    notas: 'Fabricante de generadores de aire caliente y productos para camping a gas.',
    web: 'https://brogas.com.ar',
    linkedin_empresa: 'https://linkedin.com/company/brogas',
    instagram: null,
    facebook: null,
    estado: 'NUEVO',
    pre_call_brief: {
      empresa_una_frase: 'Fabricante de artefactos térmicos, calefacción y grupos electrógenos.',
      industry: 'Electromecánica y Metalurgia',
      qualification_status: 'CALIFICADO',
      perfil: { empleados_estimado: '40-80', plantas_ubicaciones: 'AMBA', antiguedad: '40 años', rubro: 'Electromecánica y Metalurgia' },
      senales: [{ nivel: 'ALTA', descripcion: 'Desafíos en la gestión de listas de materiales (BOM) y control de stock de insumos.' }],
      camaras_redes: ['ADIMRA', 'CADIEEL'],
      interlocutor: { nombre: 'Vicepresidente', cargo_estimado: 'Vicepresidente', es_decisor: 'SI' },
      dolor_declarado: null,
      hipotesis_dolor: 'Falta de integración entre el armado de conjuntos metálicos y el cálculo de costos de producción.',
      stack_probable: ['Sistema de gestión a medida', 'Excel'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo supervisan la secuencia de matrizado y ensamble de generadores?'],
        bloque_b_dolor: ['¿Cuántas horas se pierden por faltantes de componentes en línea de montaje?'],
        bloque_c_urgencia: ['¿Qué capacidad de escala tienen prevista para la próxima temporada pico?']
      },
      encuadre_sugerido: 'Estimado, agradezco estos minutos para analizar la eficiencia operativa en Brogas...',
      fuentes: ['brogas.com.ar'],
      investigacion_verificada: true,
      redes: { web: 'https://brogas.com.ar', linkedin: 'https://linkedin.com/company/brogas', instagram: null, facebook: null },
      presencia_digital: { google_rating: 4.4, google_reviews: 45, linkedin_followers: 1500, instagram_followers: 0, sentimiento: 'POSITIVO', temas_positivos: ['Variedad de producto'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 82, presencia_digital: 65, madurez_mercado: 84, fit_ingentia: 89, global: 82 }
    }
  },
  {
    id: 6,
    empresa: 'Ferrosider SA',
    dominio: 'ferrosider.com.ar',
    sector: 'Metalmecánica e Industria Pesada',
    localidad: 'CABA',
    contacto_nombre: 'Gerencia de Operaciones',
    contacto_cargo: 'Gerente Operativo',
    empleados_estimado: '50-100',
    notas: 'Centro de servicios siderúrgicos y distribución de productos de acero.',
    web: 'https://ferrosider.com.ar',
    linkedin_empresa: 'https://linkedin.com/company/ferrosider',
    instagram: null,
    facebook: null,
    estado: 'NUEVO',
    pre_call_brief: {
      empresa_una_frase: 'Centro de servicios siderúrgicos y fraccionamiento de productos de acero.',
      industry: 'Metalmecánica e Industria Pesada',
      qualification_status: 'CALIFICADO',
      perfil: { empleados_estimado: '50-100', plantas_ubicaciones: 'CABA / GBA', antiguedad: '25 años', rubro: 'Metalmecánica e Industria Pesada' },
      senales: [{ nivel: 'ALTA', descripcion: 'Lenta respuesta en cotización de corte a medida y despacho de bobinas/chapas.' }],
      camaras_redes: ['CAMARA ARGENTINA DEL ACERO'],
      interlocutor: { nombre: 'Gerente Operativo', cargo_estimado: 'Gerente de Operaciones', es_decisor: 'SI' },
      dolor_declarado: null,
      hipotesis_dolor: 'Dificultad para calcular mermas de corte siderúrgico en tiempo real en las propuestas.',
      stack_probable: ['Tango', 'Excel'],
      preguntas: {
        bloque_a_mapa: ['¿Cómo se cotiza una solicitud especial de corte a medida cuando ingresa por ventas?'],
        bloque_b_dolor: ['¿Cuántas operaciones de recotización suceden por variaciones de precio en insumos?'],
        bloque_c_urgencia: ['¿Qué cuellos de botella identifican en el puente grúa y despacho de playa?']
      },
      encuadre_sugerido: 'Buenas tardes, la intención de la llamada es ver cómo agilizar las operaciones en Ferrosider...',
      fuentes: ['ferrosider.com.ar'],
      investigacion_verificada: true,
      redes: { web: 'https://ferrosider.com.ar', linkedin: 'https://linkedin.com/company/ferrosider', instagram: null, facebook: null },
      presencia_digital: { google_rating: 4.5, google_reviews: 30, linkedin_followers: 3200, instagram_followers: 0, sentimiento: 'POSITIVO', temas_positivos: ['Rapidez de entrega'], temas_negativos: [], novedades: [] },
      scores: { reputacion: 85, presencia_digital: 70, madurez_mercado: 88, fit_ingentia: 91, global: 85 }
    }
  }
];

const STATUS_STYLES: Record<string, string> = {
  NUEVO: 'bg-black/5 text-[#666666] border-black/10',
  CONTACTADO: 'bg-blue-50 text-blue-600 border-blue-200',
  REUNION_AGENDADA: 'bg-[#FFD166]/20 text-[#1A1A1A] border-[#FFD166]/50',
  ENRIQUECIDO: 'bg-purple-50 text-purple-600 border-purple-200',
  CONVERTIDO: 'bg-green-50 text-green-700 border-green-200',
};

const QUALIFICATION_STYLES: Record<string, string> = {
  CALIFICADO: 'bg-purple-100 text-purple-700 border-purple-200',
  POTENCIAL: 'bg-blue-100 text-blue-700 border-blue-200',
  NO_CALIFICADO: 'bg-amber-100 text-amber-700 border-amber-200',
  DESCARTADO: 'bg-rose-100 text-rose-700 border-rose-200',
};

const SECTOR_COLORS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  'Logística y Transporte': { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', border: 'border-blue-200' },
  'Farmacéutica y Cosmética': { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500', border: 'border-purple-200' },
  'Electromecánica y Metalurgia': { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500', border: 'border-amber-200' },
  'Plásticos y Química': { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-200' },
  'Automotriz y Autopartes': { bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500', border: 'border-rose-200' },
  'Agroindustria y Maquinaria': { bg: 'bg-lime-50', text: 'text-lime-700', bar: 'bg-lime-500', border: 'border-lime-200' },
  'Servicios Industriales': { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500', border: 'border-indigo-200' },
  'Alimentos y Bebidas': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500', border: 'border-orange-200' },
  'Tecnología y Servicios B2B': { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500', border: 'border-cyan-200' },
  'Metalmecánica e Industria Pesada': { bg: 'bg-zinc-100', text: 'text-zinc-800', bar: 'bg-zinc-600', border: 'border-zinc-300' },
  'Comercio y Distribución': { bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-500', border: 'border-teal-200' },
  'Construcción y Materiales': { bg: 'bg-stone-100', text: 'text-stone-800', bar: 'bg-stone-500', border: 'border-stone-300' },
  'Textil y Calzado': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', bar: 'bg-fuchsia-500', border: 'border-fuchsia-200' },
  'Otros Industriales': { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-400', border: 'border-gray-200' },
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVertical, setFilterVertical] = useState('All');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [enrichingIds, setEnrichingIds] = useState<Set<number>>(new Set());
  const enrichingRef = useRef<Set<number>>(new Set());

  const [filterQualification, setFilterQualification] = useState<string>('All');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads_cuentas')
        .select('id, empresa, dominio, sector, localidad, contacto_nombre, contacto_cargo, empleados_estimado, notas, web, linkedin_empresa, instagram, facebook, estado, pre_call_brief')
        .order('empresa', { ascending: true });
      if (error) throw error;
      const loadedLeads: Lead[] = (data && data.length > 0) ? data : SEED_LEADS;
      setLeads(loadedLeads);
      if (data && data.length > 0) {
        triggerAutoEnrichment(loadedLeads);
      }
    } catch (error) {
      console.error('Error fetching leads, using seed dataset:', error);
      setLeads(SEED_LEADS);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoEnrichment = async (leadList: Lead[]) => {
    const pending = leadList.filter((l) => !l.pre_call_brief && !enrichingRef.current.has(l.id));
    for (const l of pending) {
      await enrichLeadInBackground(l);
      // Retardo entre leads para evitar rate limit de Gemini (429)
      await new Promise((res) => setTimeout(res, 3000));
    }
  };

  const enrichLeadInBackground = async (leadToEnrich: Lead) => {
    if (enrichingRef.current.has(leadToEnrich.id)) return;
    
    enrichingRef.current.add(leadToEnrich.id);
    setEnrichingIds(new Set(enrichingRef.current));

    try {
      const briefData = await generateLeadEnrichment({
        empresa: leadToEnrich.empresa,
        dominio: leadToEnrich.dominio,
        sector: leadToEnrich.sector,
        localidad: leadToEnrich.localidad,
        contacto_nombre: leadToEnrich.contacto_nombre,
        contacto_cargo: leadToEnrich.contacto_cargo,
        empleados_estimado: leadToEnrich.empleados_estimado,
        notas: leadToEnrich.notas,
      });

      const nuevoEstado = leadToEnrich.estado === 'NUEVO' ? 'ENRIQUECIDO' : leadToEnrich.estado;
      const r = briefData.redes || {};
      const camposRedes: Record<string, string> = {};
      if (r.web && !leadToEnrich.web) camposRedes.web = r.web;
      if (r.linkedin && !leadToEnrich.linkedin_empresa) camposRedes.linkedin_empresa = r.linkedin;
      if (r.instagram && !leadToEnrich.instagram) camposRedes.instagram = r.instagram;
      if (r.facebook && !leadToEnrich.facebook) camposRedes.facebook = r.facebook;
      const camposConsistencia: Record<string, string> = {};
      if (!leadToEnrich.empleados_estimado && briefData.perfil?.empleados_estimado && briefData.perfil.empleados_estimado !== 'sin dato') {
        camposConsistencia.empleados_estimado = briefData.perfil.empleados_estimado;
      }
      if (!leadToEnrich.sector && briefData.industry && briefData.industry !== 'sin dato') {
        camposConsistencia.sector = briefData.industry;
      }
      if (!leadToEnrich.localidad && briefData.perfil?.plantas_ubicaciones && briefData.perfil.plantas_ubicaciones !== 'sin dato') {
        camposConsistencia.localidad = briefData.perfil.plantas_ubicaciones;
      }

      const updateData = {
        pre_call_brief: briefData,
        estado: nuevoEstado,
        ...camposRedes,
        ...camposConsistencia,
      };

      const { error } = await supabase
        .from('leads_cuentas')
        .update(updateData)
        .eq('id', leadToEnrich.id);

      if (error) throw error;

      setLeads((prevLeads) =>
        prevLeads.map((item) =>
          item.id === leadToEnrich.id
            ? { ...item, ...camposRedes, ...camposConsistencia, pre_call_brief: briefData, estado: nuevoEstado }
            : item
        )
      );
    } catch (err) {
      console.error(`Error al enriquecer automáticamente lead ${leadToEnrich.id} (${leadToEnrich.empresa}):`, err);
    } finally {
      enrichingRef.current.delete(leadToEnrich.id);
      setEnrichingIds(new Set(enrichingRef.current));
    }
  };

  const handleDeleteLeadCard = async (e: React.MouseEvent, id: number, empresa: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el lead "${empresa}"?`)) return;
    try {
      await supabase.from('client_contacts').delete().eq('lead_id', id);
      const { error } = await supabase.from('leads_cuentas').delete().eq('id', id);
      if (error) throw error;
      fetchLeads();
    } catch (error: any) {
      console.error('Error al eliminar el lead:', error);
      alert('Error al eliminar el lead: ' + error.message);
    }
  };

  const sectorDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const s = l.sector || l.pre_call_brief?.industry || l.pre_call_brief?.sector_estandar || 'Servicios Industriales';
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = leads.length || 1;
    return Object.entries(counts)
      .map(([sector, count]) => ({
        sector,
        count,
        percentage: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const verticals = ['All', ...Array.from(new Set(leads.map(l => l.sector || l.pre_call_brief?.industry || l.pre_call_brief?.sector_estandar).filter(Boolean) as string[]))];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.empresa || '').toLowerCase().includes(searchTerm.toLowerCase());
    const leadSector = lead.sector || lead.pre_call_brief?.industry || lead.pre_call_brief?.sector_estandar || 'Servicios Industriales';
    const matchesVertical = filterVertical === 'All' || leadSector === filterVertical;
    const leadQual = lead.pre_call_brief?.qualification_status || 'POR_CALIFICAR';
    const matchesQual = filterQualification === 'All' || leadQual === filterQualification;
    return matchesSearch && matchesVertical && matchesQual;
  });

  return (
    <div className="flex-1 flex flex-col gap-4 w-full max-w-[1400px] mx-auto min-h-screen p-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1A1A1A] flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#FFD166]" />
            Leads
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">Gestión de prospectos, enriquecimiento total, catalogación por sector y calificación por potencialidad.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#222222] hover:bg-black text-white px-4 py-2 rounded-full text-xs font-bold transition-colors shadow-md"
          >
            <Plus size={16} />
            Nuevo Lead
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterQualification('All')}
          className={`p-4 rounded-2xl border text-left transition-all ${filterQualification === 'All' ? 'bg-black text-white border-black shadow-md' : 'bg-white text-[#1A1A1A] border-black/5 hover:border-black/20'}`}
        >
          <span className={`text-[10px] uppercase font-bold tracking-wider ${filterQualification === 'All' ? 'text-white/70' : 'text-[#666666]'}`}>Total Leads</span>
          <span className="text-2xl font-light block mt-0.5">{leads.length}</span>
        </button>
        <button
          onClick={() => setFilterQualification(filterQualification === 'CALIFICADO' ? 'All' : 'CALIFICADO')}
          className={`p-4 rounded-2xl border text-left transition-all ${filterQualification === 'CALIFICADO' ? 'bg-purple-600 text-white border-purple-700 shadow-md' : 'bg-purple-50 text-purple-700 border-purple-100 hover:border-purple-300'}`}
        >
          <span className={`text-[10px] uppercase font-bold tracking-wider ${filterQualification === 'CALIFICADO' ? 'text-white/80' : 'text-purple-600'}`}>Calificados</span>
          <span className="text-2xl font-light block mt-0.5">{leads.filter(l => l.pre_call_brief?.qualification_status === 'CALIFICADO').length}</span>
        </button>
        <button
          onClick={() => setFilterQualification(filterQualification === 'POTENCIAL' ? 'All' : 'POTENCIAL')}
          className={`p-4 rounded-2xl border text-left transition-all ${filterQualification === 'POTENCIAL' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300'}`}
        >
          <span className={`text-[10px] uppercase font-bold tracking-wider ${filterQualification === 'POTENCIAL' ? 'text-white/80' : 'text-blue-600'}`}>Potenciales</span>
          <span className="text-2xl font-light block mt-0.5">{leads.filter(l => l.pre_call_brief?.qualification_status === 'POTENCIAL').length}</span>
        </button>
        <button
          onClick={() => setFilterQualification(filterQualification === 'NO_CALIFICADO' ? 'All' : 'NO_CALIFICADO')}
          className={`p-4 rounded-2xl border text-left transition-all ${filterQualification === 'NO_CALIFICADO' ? 'bg-amber-600 text-white border-amber-700 shadow-md' : 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300'}`}
        >
          <span className={`text-[10px] uppercase font-bold tracking-wider ${filterQualification === 'NO_CALIFICADO' ? 'text-white/80' : 'text-amber-600'}`}>No Calificados</span>
          <span className="text-2xl font-light block mt-0.5">{leads.filter(l => l.pre_call_brief?.qualification_status === 'NO_CALIFICADO').length}</span>
        </button>
        <button
          onClick={() => setFilterQualification(filterQualification === 'DESCARTADO' ? 'All' : 'DESCARTADO')}
          className={`p-4 rounded-2xl border text-left transition-all ${filterQualification === 'DESCARTADO' ? 'bg-rose-600 text-white border-rose-700 shadow-md' : 'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-300'}`}
        >
          <span className={`text-[10px] uppercase font-bold tracking-wider ${filterQualification === 'DESCARTADO' ? 'text-white/80' : 'text-rose-600'}`}>Descartados</span>
          <span className="text-2xl font-light block mt-0.5">{leads.filter(l => l.pre_call_brief?.qualification_status === 'DESCARTADO').length}</span>
        </button>
      </div>

      {/* Gráfico de Distribución por Sector Industrial */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center border border-black/5">
              <BarChart3 className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                Distribución por Sector Industrial
                <span className="text-[10px] bg-black/5 text-[#666666] font-bold px-2 py-0.5 rounded-full">
                  100% Clasificados ({leads.length})
                </span>
              </h4>
              <p className="text-[11px] text-[#666666]">Haz clic en cualquier sector para filtrar los prospectos en tiempo real.</p>
            </div>
          </div>
          {filterVertical !== 'All' && (
            <button
              onClick={() => setFilterVertical('All')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 transition-all flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              Ver Todos ({leads.length})
            </button>
          )}
        </div>

        {/* Barra proporcional de sectores */}
        <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden flex shadow-inner">
          {sectorDistribution.map((item) => {
            const style = SECTOR_COLORS[item.sector] || { bar: 'bg-gray-400' };
            const isActive = filterVertical === item.sector;
            return (
              <div
                key={item.sector}
                onClick={() => setFilterVertical(filterVertical === item.sector ? 'All' : item.sector)}
                style={{ width: `${item.percentage}%` }}
                title={`${item.sector}: ${item.count} leads (${item.percentage}%)`}
                className={`h-full ${style.bar} cursor-pointer transition-all hover:opacity-80 relative ${isActive ? 'ring-2 ring-black z-10 scale-y-125' : ''}`}
              />
            );
          })}
        </div>

        {/* Tarjetas interactivas de sectores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {sectorDistribution.map((item) => {
            const style = SECTOR_COLORS[item.sector] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
            const isSelected = filterVertical === item.sector;
            return (
              <button
                key={item.sector}
                onClick={() => setFilterVertical(filterVertical === item.sector ? 'All' : item.sector)}
                className={`flex flex-col p-2 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-black/10'
                    : `${style.bg} ${style.border} hover:border-black/30`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider truncate ${isSelected ? 'text-white/80' : style.text}`}>
                    {item.sector.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-black/80'}`}>
                    {item.count}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-white' : 'text-[#1A1A1A]'}`}>
                    {item.sector}
                  </span>
                  <span className={`text-[10px] ml-1 font-medium ${isSelected ? 'text-white/70' : 'text-[#666666]'}`}>
                    {item.percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/80 p-3 rounded-2xl border border-black/5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Buscar por empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-black/10 text-[#1A1A1A] text-xs pl-10 pr-3 py-2 rounded-full focus:ring-2 focus:ring-[#FFD166]/20 focus:border-[#FFD166] outline-none transition-all placeholder:text-[#999999]"
          />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className="w-full bg-white border border-black/10 text-[#1A1A1A] text-xs pl-10 pr-3 py-2 rounded-full focus:ring-2 focus:ring-[#FFD166]/20 focus:border-[#FFD166] outline-none transition-all appearance-none cursor-pointer"
          >
            {verticals.map(v => (
              <option key={v} value={v}>{v === 'All' ? 'Todas las verticales' : v}</option>
            ))}
          </select>
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <select
            value={filterQualification}
            onChange={(e) => setFilterQualification(e.target.value)}
            className="w-full bg-white border border-black/10 text-[#1A1A1A] text-xs pl-10 pr-3 py-2 rounded-full focus:ring-2 focus:ring-[#FFD166]/20 focus:border-[#FFD166] outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="All">Todas las calificaciones</option>
            <option value="CALIFICADO">Calificados</option>
            <option value="POTENCIAL">Potenciales</option>
            <option value="NO_CALIFICADO">No Calificados</option>
            <option value="DESCARTADO">Descartados</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#666666]">Cargando leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#666666]">No se encontraron leads.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isEnriching = enrichingIds.has(lead.id);

            return (
              <Link
                to={`/leads/${lead.id}`}
                key={lead.id}
                className="group flex flex-col gap-3 bg-white border border-black/5 hover:border-[#FFD166]/50 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD166] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-black/2 rounded-xl flex items-center justify-center border border-black/5 shadow-xs group-hover:bg-[#FFD166]/10 transition-colors">
                      <Building2 className="w-4 h-4 text-[#1A1A1A] group-hover:text-[#FFD166] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#1A1A1A]">{lead.empresa}</h4>
                      <div className="flex items-center gap-1 text-[#666666] text-[11px] font-medium">
                        <Globe className="w-3 h-3" />
                        {lead.dominio || 'Sin dominio'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1 text-xs text-[#666666]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#999999]" />
                    <span className="font-medium text-[#1A1A1A]">{lead.sector || lead.pre_call_brief?.industry || lead.pre_call_brief?.sector_estandar || 'Servicios Industriales'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#999999]" />
                    {lead.contacto_nombre || 'Sin contacto'}
                  </div>
                </div>

                <div className="mt-1 pt-2.5 border-t border-black/5 flex items-center justify-between">
                  {isEnriching ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-200 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                      ENRIQUECIENDO...
                    </span>
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[lead.estado] || STATUS_STYLES.NUEVO}`}>
                        {lead.estado}
                      </span>
                      {lead.pre_call_brief?.qualification_status && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${QUALIFICATION_STYLES[lead.pre_call_brief.qualification_status] || 'bg-black/5 text-[#666666]'}`}>
                          {lead.pre_call_brief.qualification_status.replace('_', ' ')}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                        {lead.sector || lead.pre_call_brief?.industry || lead.pre_call_brief?.sector_estandar || 'Servicios Industriales'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDeleteLeadCard(e, lead.id, lead.empresa)}
                      title="Eliminar lead"
                      className="w-7 h-7 rounded-full bg-black/5 hover:bg-red-50 text-[#999999] hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-[#222222] transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-[#666666] group-hover:text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isNewLeadOpen && (
        <NewLeadModal
          onClose={() => setIsNewLeadOpen(false)}
          onSaved={(newLead) => {
            setIsNewLeadOpen(false);
            fetchLeads();
            if (newLead) {
              enrichLeadInBackground(newLead);
            }
          }}
        />
      )}
    </div>
  );
}

function NewLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (newLead?: Lead) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ empresa: '', dominio: '', sector: '', contacto_nombre: '', email: '', telefono: '', notas: '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) return;
    try {
      setSaving(true);
      const { data, error } = await supabase.from('leads_cuentas').insert([{
        empresa: form.empresa.trim(),
        dominio: form.dominio.trim() || null,
        sector: form.sector.trim() || null,
        contacto_nombre: form.contacto_nombre.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        notas: form.notas.trim() || null,
        fuente: 'Manual',
        estado: 'NUEVO',
      }]).select('*').single();
      if (error) throw error;
      onSaved(data);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      alert('Error al crear el lead: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium text-[#1A1A1A]">Nuevo Lead</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <input autoFocus required placeholder="Empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Dominio (ej. empresa.com)" value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          <input placeholder="Sector / Vertical" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        </div>
        <input placeholder="Nombre de contacto" value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} className="w-full h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        <div className="grid grid-cols-2 gap-4">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="h-12 rounded-2xl border border-black/10 bg-black/5 px-4" />
        </div>
        <textarea placeholder="Notas (origen del lead, contexto, etc.)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full h-20 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 resize-none" />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-[#666666] hover:bg-black/5 transition-colors">Cancelar</button>
          <button
            type="submit"
            disabled={saving || !form.empresa.trim()}
            className="flex items-center gap-2 bg-[#222222] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg active:scale-95"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

