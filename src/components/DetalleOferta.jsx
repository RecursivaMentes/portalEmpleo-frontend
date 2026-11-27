import { useEffect, useRef, useState } from 'react';
import { X, BriefcaseBusiness, MapPin, Banknote, CalendarDays, FileText, ClipboardList, CheckCircle2, Target } from 'lucide-react';
import { obtenerEmpleos } from '../services/empleosService';
import AccionesPostulacion from './AccionesPostulacion';

const moneda = (n) => n == null ? 'No informado' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const valor = (n) => n == null || n === '' ? 'No especificado' : String(n);
const texto = (n) => typeof n === 'string' ? n.trim() : '';
const tarjeta = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm';
const encabezado = 'mb-2 flex items-center gap-2 text-sm font-bold text-blue-700';

function IndicadorCompatibilidad({ porcentaje }) {
  const numero = Number(porcentaje);
  const valor = Number.isFinite(numero) ? Math.min(100, Math.max(0, numero)) : 0;
  const color = valor >= 80 ? '#059669' : valor >= 50 ? '#2563eb' : '#d97706';
  const etiqueta = valor >= 80 ? 'Excelente coincidencia' : valor >= 50 ? 'Buena compatibilidad' : 'Compatibilidad parcial';
  const circunferencia = 2 * Math.PI * 25;
  return <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
    <div className="relative h-11 w-11 shrink-0"><svg viewBox="0 0 60 60" className="h-full w-full"><circle cx="30" cy="30" r="25" fill="none" stroke="#e2e8f0" strokeWidth="4"/><circle cx="30" cy="30" r="25" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circunferencia} strokeDashoffset={circunferencia * (1 - valor / 100)} transform="rotate(-90 30 30)"/></svg><span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{Math.round(valor)}%</span></div>
    <div><p className="text-xs font-medium text-slate-500">Compatibilidad con tu perfil</p><p className="mt-1 text-xs font-bold" style={{ color }}>{etiqueta}</p></div>
  </div>;
}

export default function DetalleOferta({ empleo, onCerrar, onSolicitarLogin, mostrarAcciones = true }) {
  const cerrarRef = useRef(onCerrar);
  useEffect(() => { cerrarRef.current = onCerrar; }, [onCerrar]);
  const [completa, setCompleta] = useState(empleo);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const id = empleo?.empleoId || empleo?.id;
  useEffect(() => {
    if (!id) return;
    let activa = true;
    Promise.resolve().then(async () => {
      if (!activa) return;
      setCompleta(empleo); setError(''); setCargando(true);
      try {
        const ofertas = await obtenerEmpleos();
        if (!activa) return;
        const encontrada = Array.isArray(ofertas) ? ofertas.find((x) => x.id === id) : null;
        if (encontrada) setCompleta({ ...empleo, ...encontrada });
        else if (!texto(empleo?.descripcion)) setError('No se pudo recuperar el detalle completo de esta oferta. Puede que ya no esté publicada.');
      } catch {
        if (activa && !texto(empleo?.descripcion)) setError('No se pudieron consultar los detalles completos de la oferta.');
      } finally { if (activa) setCargando(false); }
    });
    const escapar = (e) => { if (e.key === 'Escape') cerrarRef.current(); };
    document.addEventListener('keydown', escapar);
    return () => { activa = false; document.removeEventListener('keydown', escapar); };
  }, [empleo, id]);
  if (!empleo) return null;
  const titulo = completa?.titulo || empleo?.titulo || 'Detalle de la oferta';
  const compatibilidad = empleo?.porcentajeCompatibilidad ?? empleo?.compatibilidad;
  const sinAcciones = empleo?.disponible === false;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-unificado" className="flex max-h-[85vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Detalle de la oferta</p><h2 id="titulo-detalle-unificado" className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{titulo}</h2></div><button type="button" onClick={onCerrar} aria-label="Cerrar detalle" className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X size={21}/></button></div>
      <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
        {cargando && <p role="status" className="mb-3 text-xs text-slate-500">Consultando información actualizada de la oferta...</p>}
        {error && <p role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{error}</p>}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-3">
            <section className={tarjeta}><h3 className={encabezado}><FileText size={17}/> Descripción de la oferta</h3><p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{texto(completa?.descripcion) || 'Descripción no disponible.'}</p></section>
            <section className={tarjeta}><h3 className={encabezado}><ClipboardList size={17}/> Requisitos de la oferta</h3><p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{texto(completa?.requisitos) || 'No se especificaron requisitos.'}</p></section>
            {Array.isArray(empleo?.coincidencias) && empleo.coincidencias.length > 0 && <section className={tarjeta}><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 size={17}/> Requisitos coincidentes</h3><div className="flex flex-wrap gap-1.5">{empleo.coincidencias.map((item, i) => <span key={i} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{String(item)}</span>)}</div></section>}
            {Array.isArray(empleo?.requisitosFaltantes) && empleo.requisitosFaltantes.length > 0 && <section className={tarjeta}><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700"><Target size={17}/> Requisitos no cumplidos</h3><div className="flex flex-wrap gap-1.5">{empleo.requisitosFaltantes.map((item, i) => <span key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{String(item)}</span>)}</div><p className="mt-2 text-xs text-slate-500">No cumplir un requisito de la oferta no significa que tu perfil esté incompleto.</p></section>}
            {compatibilidad != null && <IndicadorCompatibilidad porcentaje={compatibilidad}/>}          
          </div>
          <aside className="flex min-w-0 flex-col gap-3">
            <section className="order-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <h3 className={encabezado}>Condiciones de la oferta</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0 text-blue-600"/><div><p className="text-xs text-slate-500">Ubicación</p><p className="break-words text-sm font-medium text-slate-700">{valor(completa?.ubicacion)}</p></div></div>
                <div className="flex items-start gap-2"><BriefcaseBusiness size={17} className="mt-0.5 shrink-0 text-blue-600"/><div><p className="text-xs text-slate-500">Modalidad y contratación</p><p className="text-sm font-medium text-slate-700">{valor(completa?.modalidad)} · {valor(completa?.tipoContrato)}</p></div></div>
                <div className="flex items-start gap-2"><Banknote size={17} className="mt-0.5 shrink-0 text-blue-600"/><div><p className="text-xs text-slate-500">Remuneración</p><p className="text-sm font-medium text-slate-700">{moneda(completa?.salarioMin)} – {moneda(completa?.salarioMax)}</p></div></div>
                {completa?.fechaCierre && <div className="flex items-start gap-2"><CalendarDays size={17} className="mt-0.5 shrink-0 text-blue-600"/><div><p className="text-xs text-slate-500">Fecha de cierre</p><p className="text-sm font-medium text-slate-700">{new Date(completa.fechaCierre).toLocaleDateString('es-AR')}</p></div></div>}
              </div>
              {compatibilidad != null && <div className="mt-4 border-t border-blue-100 pt-3"></div>}
            </section>
            {(sinAcciones || mostrarAcciones) && <section className={`${tarjeta} order-1 relative z-20`}><h3 className="mb-2 text-sm font-bold text-slate-800">Gestionar postulación</h3>
              {sinAcciones && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{empleo.motivoNoDisponible || 'Esta oferta no está disponible para postularse.'}</p>}
              {mostrarAcciones && !sinAcciones && <div className="[&>div]:!mt-0 [&_button]:!py-2 [&_button]:!text-xs [&_[role=menu]]:!static [&_[role=menu]]:!min-w-0 [&_[role=menu]]:!shadow-sm"><AccionesPostulacion empleo={completa} onSolicitarLogin={onSolicitarLogin}/></div>}
            </section>}
          </aside>
        </div>
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3"><button type="button" onClick={onCerrar} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cerrar</button></div>
    </section>
  </div>;
}
