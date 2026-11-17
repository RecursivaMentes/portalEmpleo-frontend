import { useEffect, useRef, useState } from 'react';
import { X, BriefcaseBusiness, MapPin, Banknote, CalendarDays } from 'lucide-react';
import { obtenerEmpleos } from '../services/empleosService';
import AccionesPostulacion from './AccionesPostulacion';

const moneda = (n) => n == null ? 'No informado' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const valor = (n) => n == null || n === '' ? 'No especificado' : String(n);
const texto = (n) => typeof n === 'string' ? n.trim() : '';

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
    // Pendientes y Recomendaciones no incluyen siempre la descripción y los requisitos.
    // Consultamos el listado real del backend y completamos los datos sin inventarlos.
    Promise.resolve().then(async () => {
      if (!activa) return;
      setCargando(true);
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
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-unificado" className="flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Detalle de la oferta</p><h2 id="titulo-detalle-unificado" className="mt-1 text-xl font-bold text-slate-900 sm:text-3xl">{titulo}</h2></div><button type="button" onClick={onCerrar} aria-label="Cerrar detalle" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"><X size={23}/></button></div>
      <div className="overflow-y-auto px-5 py-6 sm:px-8">
        {cargando && <p role="status" className="mb-4 text-sm text-slate-500">Consultando información actualizada de la oferta...</p>}
        {error && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-7">
            <section><h3 className="mb-3 text-lg font-bold text-slate-900">Descripción</h3><p className="whitespace-pre-wrap leading-relaxed text-slate-700">{texto(completa?.descripcion) || 'Descripción no disponible.'}</p></section>
            <section><h3 className="mb-3 text-lg font-bold text-slate-900">Requisitos</h3><p className="whitespace-pre-wrap leading-relaxed text-slate-700">{texto(completa?.requisitos) || 'No se especificaron requisitos.'}</p></section>
            {Array.isArray(empleo?.coincidencias) && empleo.coincidencias.length > 0 && <section><h3 className="mb-3 font-bold text-slate-900">Requisitos coincidentes</h3><div className="flex flex-wrap gap-2">{empleo.coincidencias.map((item, i) => <span key={i} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{String(item)}</span>)}</div></section>}
            {Array.isArray(empleo?.requisitosFaltantes) && empleo.requisitosFaltantes.length > 0 && <section><h3 className="mb-3 font-bold text-slate-900">Requisitos no cumplidos</h3><div className="flex flex-wrap gap-2">{empleo.requisitosFaltantes.map((item, i) => <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">{String(item)}</span>)}</div><p className="mt-2 text-xs text-slate-500">No cumplir un requisito de la oferta no significa que tu perfil esté incompleto.</p></section>}
          </div>
          <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 h-fit">
            <h3 className="font-bold text-slate-900">Condiciones de la oferta</h3>
            <p className="flex items-start gap-2 text-sm text-slate-700"><MapPin size={17} className="shrink-0 text-blue-600"/> {valor(completa?.ubicacion)}</p>
            <p className="flex items-start gap-2 text-sm text-slate-700"><BriefcaseBusiness size={17} className="shrink-0 text-blue-600"/> {valor(completa?.modalidad)} · {valor(completa?.tipoContrato)}</p>
            <p className="flex items-start gap-2 text-sm text-slate-700"><Banknote size={17} className="shrink-0 text-blue-600"/> {moneda(completa?.salarioMin)} – {moneda(completa?.salarioMax)}</p>
            {completa?.fechaCierre && <p className="flex items-start gap-2 text-sm text-slate-700"><CalendarDays size={17} className="shrink-0 text-blue-600"/> Cierre: {new Date(completa.fechaCierre).toLocaleDateString('es-AR')}</p>}
            {compatibilidad != null && <p className="rounded-lg bg-blue-50 p-3 text-sm font-semibold text-blue-700">Compatibilidad: {compatibilidad}%</p>}
            {sinAcciones && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{empleo.motivoNoDisponible || 'Esta oferta no está disponible para postularse.'}</p>}
            {mostrarAcciones && !sinAcciones && <AccionesPostulacion empleo={completa} onSolicitarLogin={onSolicitarLogin}/>}
          </aside>
        </div>
      </div>
      <div className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-5 py-3 sm:px-8"><button type="button" onClick={onCerrar} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Cerrar</button></div>
    </section>
  </div>;
}
