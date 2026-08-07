import { Fragment } from 'react';
import { CheckCircle2, Circle, Flag, DollarSign, AlertTriangle } from 'lucide-react';
import { ENGINEERING_PATH_PHASES } from '../lib/gemini-task-breakdown';

interface Hito {
  id: string;
  title: string;
  description?: string;
  type: 'delivery' | 'billing' | 'both';
  estimated_date: string;
  real_date?: string | null;
  completed: boolean;
  amount?: number | null;
  billing_confirmed?: boolean;
}

interface Props {
  hitos: Hito[];
  tareas: any[];
  fechaInicio?: string | null;
  fechaFin?: string | null;
}

const COLOR_FASE: Record<string, string> = {
  'Auditoría': '#94a3b8',
  'Arquitectura & Prototipo': '#3b9eff',
  'Construcción & IA': '#FFB020',
  'Lanzamiento': '#00b37e',
};

const dia = 86400000;
const aFecha = (s?: string | null) => (s ? new Date(s).getTime() : null);

/**
 * Cronograma visual del proyecto: una barra por fase con su carga de trabajo,
 * y los hitos ubicados en la línea de tiempo según su fecha comprometida.
 */
export default function CronogramaProyecto({ hitos, tareas, fechaInicio, fechaFin }: Props) {
  const conFecha = hitos.filter((h) => h.estimated_date).sort(
    (a, b) => aFecha(a.estimated_date)! - aFecha(b.estimated_date)!,
  );

  // Ventana temporal: desde el inicio del proyecto (o el primer dato) hasta el
  // último compromiso, con un margen para que nada quede pegado al borde.
  const fechasTareas = tareas.map((t) => aFecha(t.due_date)).filter(Boolean) as number[];
  const fechasHitos = conFecha.map((h) => aFecha(h.estimated_date)!) as number[];
  const todas = [...fechasTareas, ...fechasHitos, aFecha(fechaInicio), aFecha(fechaFin)].filter(Boolean) as number[];

  if (todas.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-[#666666] italic bg-black/2 rounded-2xl border border-dashed border-black/10">
        Cargá hitos con fecha para ver el cronograma.
      </div>
    );
  }

  const inicio = Math.min(...todas) - dia * 3;
  const fin = Math.max(...todas) + dia * 3;
  const total = Math.max(fin - inicio, dia);
  // Posición insettada (6% a 94%) para garantizar que tarjetas centradas quepan al 100% sin scroll horizontal
  const pos = (t: number) => 6 + ((t - inicio) / total) * 88;

  const hoy = Date.now();
  const hoyVisible = hoy >= inicio && hoy <= fin;

  // Cada fase ocupa desde su primera tarea hasta la última.
  const fases = ENGINEERING_PATH_PHASES.map((fase) => {
    const delFase = tareas.filter((t) => t.phase === fase);
    const fechas = delFase.map((t) => aFecha(t.due_date)).filter(Boolean) as number[];
    const horas = delFase.reduce((a, t) => a + Number(t.hours || 0), 0);
    const hechas = delFase.filter((t) => t.status === 'done').length;
    return {
      fase,
      tareas: delFase.length,
      horas,
      hechas,
      desde: fechas.length ? Math.min(...fechas) : null,
      hasta: fechas.length ? Math.max(...fechas) : null,
    };
  }).filter((f) => f.tareas > 0);

  const meses: { label: string; pos: number }[] = [];
  const cursor = new Date(inicio);
  cursor.setDate(1);
  while (cursor.getTime() <= fin) {
    const t = cursor.getTime();
    if (t >= inicio) meses.push({ label: cursor.toLocaleDateString('es-AR', { month: 'short' }), pos: pos(t) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Algoritmo de escalonamiento de hitos (staggering) para evitar solapamientos horizontales.
  // Asigna un nivel de fila (0, 1, 2...) a cada hito según la proximidad de porcentaje.
  const MIN_GAP_PERCENT = 11;
  const lastPosByRow: number[] = [];

  const hitosConFila = conFecha.map((h) => {
    const t = aFecha(h.estimated_date)!;
    const p = pos(t);
    let assignedRow = 0;

    for (let r = 0; r < lastPosByRow.length; r++) {
      if (p - lastPosByRow[r] >= MIN_GAP_PERCENT) {
        assignedRow = r;
        break;
      }
      assignedRow = r + 1;
    }

    lastPosByRow[assignedRow] = p;
    return { ...h, t, p, row: assignedRow };
  });

  const maxRow = hitosConFila.length > 0 ? Math.max(...hitosConFila.map((h) => h.row)) : 0;
  const hitoContainerHeight = Math.max(80, (maxRow + 1) * 60 + 20);

  return (
    <div className="flex flex-col gap-4 w-full overflow-hidden pb-2">
      <div className="flex flex-col gap-3.5 w-full">
        {/* Regla de meses */}
        <div className="flex items-center gap-3">
          <div className="w-[110px] md:w-[130px] shrink-0" />
          <div className="relative flex-1 h-5 border-b border-black/10">
            {meses.map((m, i) => (
              <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: `${m.pos}%` }}>
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#999999] -translate-x-1/2">{m.label}</span>
              </div>
            ))}
            {hoyVisible && (
              <div className="absolute -top-1 bottom-0 w-px bg-rose-400 z-10" style={{ left: `${pos(hoy)}%` }}>
                <span className="absolute -top-3.5 -translate-x-1/2 text-[7.5px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-rose-200">
                  hoy
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Barras por fase */}
        <div className="flex flex-col gap-2">
          {fases.map((f) => {
            const izq = f.desde !== null ? pos(f.desde) : 0;
            const der = f.hasta !== null ? pos(f.hasta) : 0;
            const ancho = Math.max(der - izq, 2);
            const avance = f.tareas > 0 ? (f.hechas / f.tareas) * 100 : 0;
            const color = COLOR_FASE[f.fase] || '#999';

            return (
              <div key={f.fase} className="flex items-center gap-3">
                <div className="w-[110px] md:w-[130px] shrink-0 text-right">
                  <p className="text-[10px] font-bold text-[#1A1A1A] leading-tight truncate">{f.fase}</p>
                  <p className="text-[8px] text-[#999999]">{f.tareas} tareas · {f.horas} h</p>
                </div>
                <div className="relative flex-1 h-6 bg-black/[0.03] rounded-md">
                  <div
                    className="absolute top-0.5 bottom-0.5 rounded-md flex items-center px-1.5 overflow-hidden transition-all"
                    style={{ left: `${izq}%`, width: `${ancho}%`, backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
                    title={`${f.fase}: ${f.hechas}/${f.tareas} tareas completadas`}
                  >
                    <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-300" style={{ width: `${avance}%`, backgroundColor: `${color}44` }} />
                    <span className="relative text-[8.5px] font-bold whitespace-nowrap" style={{ color }}>
                      {f.hechas}/{f.tareas}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hitos sobre la línea de tiempo */}
        <div className="flex items-start gap-3 pt-2 border-t border-black/5">
          <div className="w-[110px] md:w-[130px] shrink-0 text-right pt-0.5">
            <p className="text-[10px] font-bold text-[#1A1A1A] flex items-center justify-end gap-1">
              <Flag size={10} className="text-[#FFB020]" /> Hitos
            </p>
          </div>
          <div className="relative flex-1" style={{ height: `${hitoContainerHeight}px` }}>
            {/* Eje principal de hitos */}
            <div className="absolute top-2.5 left-0 right-0 h-0.5 bg-black/10 rounded-full" />
            
            {hitosConFila.map((h) => {
              const cobra = h.type === 'billing' || h.type === 'both';
              const atrasado = !h.completed && h.t < hoy;
              const topPos = 2 + h.row * 58;

              return (
                <div
                  key={h.id}
                  className="absolute flex flex-col items-center z-10 transition-all duration-200"
                  style={{ left: `${h.p}%`, top: `${topPos}px`, transform: 'translateX(-50%)' }}
                >
                  {/* Tallo o línea conectora vertical si el hito está escalonado */}
                  {h.row > 0 && (
                    <div
                      className="absolute w-0.5 bg-black/15 -z-10 rounded-full"
                      style={{ top: `-${h.row * 58 - 8}px`, height: `${h.row * 58}px` }}
                    />
                  )}

                  {/* Icono indicador del Hito */}
                  <div className="p-0.5 bg-white rounded-full shadow-sm">
                    {h.completed ? (
                      <CheckCircle2 size={14} className="text-emerald-500 fill-emerald-50" />
                    ) : atrasado ? (
                      <AlertTriangle size={14} className="text-rose-500 fill-rose-50" />
                    ) : (
                      <Circle size={14} className={cobra ? 'text-[#FFB020] fill-amber-50' : 'text-[#999999] fill-gray-50'} />
                    )}
                  </div>

                  {/* Tarjeta del Hito */}
                  <div className="mt-1 w-[98px] bg-white/95 backdrop-blur-sm border border-black/10 rounded-lg p-1.5 shadow-sm text-center flex flex-col items-center gap-0.5 hover:shadow-md hover:border-[#FFD166] transition-all group">
                    <p className="text-[9px] font-bold text-[#1A1A1A] leading-tight line-clamp-2" title={h.title}>
                      {h.title}
                    </p>
                    <p className="text-[7.5px] font-medium text-[#777777] bg-black/5 px-1 py-0.5 rounded">
                      {new Date(h.t).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    {cobra && h.amount ? (
                      <p className={`text-[8px] font-bold flex items-center justify-center gap-0.5 mt-0.5 px-1 py-0.5 rounded-full ${
                        h.billing_confirmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-[#D97706] border border-amber-200'
                      }`}>
                        <DollarSign size={7} />{Number(h.amount).toLocaleString('es-AR')}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referencias */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-3 border-t border-black/5">
          {ENGINEERING_PATH_PHASES.map((f) => (
            <Fragment key={f}>
              <span className="flex items-center gap-1.5 text-[9px] text-[#666666]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `${COLOR_FASE[f]}55` }} />
                {f}
              </span>
            </Fragment>
          ))}
          <span className="flex items-center gap-1 text-[9px] text-[#666666]">
            <Circle size={9} className="text-[#FFB020]" /> hito facturable
          </span>
          <span className="flex items-center gap-1 text-[9px] text-[#666666]">
            <AlertTriangle size={9} className="text-rose-500" /> vencido
          </span>
        </div>
      </div>
    </div>
  );
}
