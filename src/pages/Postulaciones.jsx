import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LoaderCircle, RefreshCw, CodeXml, ArrowRight, FileCheck, BriefcaseBusiness, X } from 'lucide-react';
import { obtenerCvs, obtenerVistaPreviaCv } from '../services/cvsService';
import {
  avisar, misPostulaciones, pendientes, preparaciones, quitarPendiente,
  cancelarPreparacion, obtenerPreparacion, proponerCambios, aceptarCambios, descartarCambios,
  modificarConIA, enviarPreparacion, compararCvIA, aprobarCvIA, obtenerCvEnviado,
  ofertasDescartadas, restaurarOferta, verSeguimientoIA,
} from '../services/postulacionesService';
import AccionesPostulacion from '../components/AccionesPostulacion';
import ConfirmacionAccion from '../components/ConfirmacionAccion';
import DetalleOferta from '../components/DetalleOferta';
import ConfiguracionAgenteCompacta from '../components/ConfiguracionAgenteCompacta';
import { TituloPostulacion, AccionesSeguimiento } from '../components/SeguimientoRealizadas';

const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-AR') : 'Sin fecha';
const descripcionEstado = (v) => ({
  Preparando: 'Preparando con IA', EnModificacion: 'Modificando con IA', PendienteAprobacionCv: 'Aprobar cambios del CV',
  AplicandoCv: 'Aplicando cambios del CV', PendienteAprobacion: 'Requiere aprobación', Enviando: 'Enviando',
  CancelacionSolicitada: 'Cancelación solicitada', Enviada: 'Enviada', Cancelada: 'Cancelada', Fallida: 'Fallida',
})[String(v)] || String(v || 'Sin estado');
const tarjeta = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const btn = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer';
const primario = 'rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 cursor-pointer';

function Esqueleto() { return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((x) => <div key={x} className="h-32 rounded-2xl bg-slate-200"/>)}</div>; }
function ErrorConsulta({ mensaje, recargar }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{mensaje}</p><button onClick={recargar} className="mt-3 font-semibold underline cursor-pointer">Reintentar</button></div>; }

function OfertasDescartadas() {
  const [ids, setIds] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ocupada, setOcupada] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let activo = true;
    let consulta = 0;
    const cargar = () => {
      const numero = ++consulta;
      Promise.resolve().then(() => {
        if (!activo || numero !== consulta) return;
        setCargando(true); setError('');
        return ofertasDescartadas().then((respuesta) => {
          if (activo && numero === consulta) setIds(Array.isArray(respuesta) ? respuesta : []);
        }).catch((err) => { if (activo && numero === consulta) setError(err.message); })
          .finally(() => { if (activo && numero === consulta) setCargando(false); });
      });
    };
    cargar();
    window.addEventListener('recursiva:ofertas-actualizadas', cargar);
    return () => { activo = false; window.removeEventListener('recursiva:ofertas-actualizadas', cargar); };
  }, [revision]);
  async function restaurar(id) {
    if (ocupada) return;
    setOcupada(id);
    try {
      await restaurarOferta(id);
      setIds((actual) => actual.filter((x) => x !== id));
      avisar('La oferta vuelve a estar disponible para el agente.');
    } catch (err) { avisar(err.message, 'error'); }
    finally { setOcupada(null); }
  }
  return <details className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
    <summary className="cursor-pointer font-semibold text-slate-800">Ofertas que la IA no volverá a seleccionar {!cargando && !error && `(${ids.length})`}</summary>
    <p className="mt-2 text-xs text-slate-500">Aquí aparecen las ofertas marcadas con «No me interesa» o retiradas. La IA no se postulará automáticamente a ellas. Podés volver a incluirlas sin agregarlas a pendientes.</p>
    {cargando ? <p role="status" className="mt-3 flex items-center gap-2 text-slate-500"><LoaderCircle size={16} className="animate-spin"/>Consultando ofertas...</p> : error ? <ErrorConsulta mensaje={error} recargar={() => setRevision((x) => x + 1)}/> : ids.length === 0 ? <p className="mt-3 text-slate-500">No hay ofertas excluidas.</p> :
      <ul className="mt-3 divide-y divide-slate-100">{ids.map((id) => <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium text-slate-800"><TituloPostulacion empleoId={id}/></p><p className="text-xs text-slate-500">Referencia: {id.slice(0, 8)}</p></div><button type="button" disabled={!!ocupada} onClick={() => restaurar(id)} className={btn}>{ocupada === id ? 'Restaurando...' : 'Volver a incluir'}</button></li>)}</ul>}
  </details>;
}

function HistorialPostulacion({ item }) {
  const eventos = Array.isArray(item.historial) ? item.historial : [];
  const mostrarFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fechaEvento = new Date(valor);
    return Number.isNaN(fechaEvento.getTime())
      ? 'Fecha no disponible'
      : fechaEvento.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  };
  return <details open className="mt-3 rounded-xl border border-primary-100 bg-primary-50/60 p-4 text-sm">
    <summary className="cursor-pointer font-semibold text-slate-800">
      Seguimiento e historial ({eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'})
    </summary>
    {eventos.length > 0 ? <ol className="mt-4 space-y-3 border-l-2 border-primary-200 pl-4">
      {eventos.map((evento, indice) => <li key={`${evento.estado}-${evento.fechaUtc}-${indice}`} className="relative">
        <span aria-hidden="true" className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary-600" />
        <p className="font-semibold text-slate-900">{estadosRealizadas[evento.estado]?.[0] || String(evento.estado || 'Sin estado')}</p>
        <time className="text-slate-600" dateTime={evento.fechaUtc || undefined}>{mostrarFecha(evento.fechaUtc)}</time>
      </li>)}
    </ol> : <p className="mt-3 text-slate-600">No se registraron eventos de seguimiento.</p>}
  </details>;
}
function Revision({ preparacion, refrescar }) {
  const [actual, setActual] = useState(preparacion);
  const [cvs, setCvs] = useState([]);
  const [cvId, setCvId] = useState(preparacion.cvId || '');
  const [texto, setTexto] = useState(preparacion.textoPresentacion || '');
  const [instrucciones, setInstrucciones] = useState('');
  const [comparacion, setComparacion] = useState(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    let activo = true;
    Promise.all([obtenerPreparacion(preparacion.id), obtenerCvs()]).then(([p, disponibles]) => {
      if (!activo) return;
      setActual(p); setCvId(p.cvId || ''); setTexto(p.textoPresentacion || '');
      setCvs(Array.isArray(disponibles) ? disponibles : []);
    }).catch((err) => { if (activo) setError(err.message || 'No se pudo consultar la preparación.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [preparacion.id]);
  const id = actual.id;
  async function operar(accion, mensaje, confirmar = false) {
    if (confirmar) { setConfirmacion({ accion, mensaje }); return; }
    setOcupado(true); setError('');
    try {
      const resultado = await accion();
      if (resultado?.id === id) { setActual(resultado); setCvId(resultado.cvId || ''); setTexto(resultado.textoPresentacion || ''); }
      setComparacion(null);
      if (mensaje) avisar(mensaje);
      await refrescar(true);
    } catch (err) { setError(err.message); avisar(err.message, 'error'); }
    finally { setOcupado(false); }
  }
  async function verComparacion() {
    setOcupado(true); setError('');
    try { setComparacion(await compararCvIA(id)); }
    catch (err) { setError(err.message); }
    finally { setOcupado(false); }
  }
  async function verCv() {
    if (!cvId) return;
    try { const url = await obtenerVistaPreviaCv(cvId); window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch { setError('No se pudo abrir el CV.'); }
  }
  if (cargando) return <Esqueleto/>;
  const editable = actual.estado === 'PendienteAprobacion';
  const requiereCv = actual.estado === 'PendienteAprobacionCv';
  const cambios = !!actual.cambiosPendientes;
  const version = actual.versionEdicion;
  return <div className="space-y-5">
    <ConfirmacionAccion abierto={!!confirmacion} titulo="Confirmar operación" mensaje="¿Querés continuar con esta operación sobre la preparación?" confirmar="Confirmar" ocupado={ocupado} onConfirmar={() => { const pendiente = confirmacion; setConfirmacion(null); if (pendiente) operar(pendiente.accion, pendiente.mensaje); }} onCancelar={() => setConfirmacion(null)}/>
    <div><p className="text-sm font-semibold text-primary-700">{descripcionEstado(actual.estado)}</p><p className="mt-1 text-sm text-slate-500">Oferta: {actual.empleoId} · Versión de revisión: {version}</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {requiereCv && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-slate-900">La IA propuso cambios al CV</h3><p className="text-sm text-slate-700">Revisá la comparación antes de aprobarlos. Aprobar el CV no envía la postulación.</p>
      <button disabled={ocupado} onClick={verComparacion} className={btn}>Comparar cambios del CV</button>
      {comparacion && <div className="space-y-3"><p className="text-sm text-amber-800">{comparacion.originalDesactualizado ? 'El CV original cambió desde que se preparó esta propuesta.' : comparacion.crearNuevo ? 'La IA propone crear un CV nuevo.' : 'Comparación del contenido original y propuesto.'}</p><div className="grid gap-3 md:grid-cols-2"><div><p className="mb-1 text-sm font-semibold">Original</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{comparacion.textoOriginal || 'CV nuevo'}</pre></div><div><p className="mb-1 text-sm font-semibold">Propuesta</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{comparacion.textoPropuesto}</pre></div></div>
      <button disabled={ocupado || comparacion.originalDesactualizado} onClick={() => operar(() => aprobarCvIA(id, version), 'Cambios del CV aprobados.', true)} className={primario}>Aprobar cambios del CV</button></div>}
    </div>}
    {editable && <div className="space-y-4"><div><label htmlFor={`cv-${id}`} className="mb-1 block text-sm font-semibold">CV de la postulación</label><select id={`cv-${id}`} disabled={ocupado || cambios} value={cvId} onChange={(e) => setCvId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="">Seleccioná un CV</option>{cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.titulo}{cv.esPrincipal ? ' (Principal)' : ''}</option>)}</select>{cvId && <button onClick={verCv} className="mt-2 text-sm text-primary-700 underline cursor-pointer">Ver CV</button>}</div>
      <div><label htmlFor={`texto-${id}`} className="mb-1 block text-sm font-semibold">Texto de presentación</label><textarea id={`texto-${id}`} disabled={ocupado || cambios} rows={5} maxLength={4000} value={texto} onChange={(e) => setTexto(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/></div>
      {cambios ? <div className="flex flex-wrap gap-2"><p className="w-full text-sm text-amber-800">Hay cambios propuestos que todavía no se aplicaron.</p><button disabled={ocupado} onClick={() => operar(() => aceptarCambios(id, version), 'Cambios aceptados.')} className={primario}>Aceptar cambios</button><button disabled={ocupado} onClick={() => operar(() => descartarCambios(id, version), 'Cambios descartados.')} className={btn}>Descartar cambios</button></div> : <button disabled={ocupado || (!cvId && !texto.trim()) || (cvId === (actual.cvId || '') && texto === (actual.textoPresentacion || ''))} onClick={() => operar(() => proponerCambios(id, { cvId: cvId || null, textoPresentacion: texto }), 'Cambios propuestos para revisión.')} className={btn}>Revisar cambios manuales</button>}
    </div>}
    {(editable || requiereCv) && <div><label htmlFor={`instrucciones-${id}`} className="mb-1 block text-sm font-semibold">Pedir cambios a la IA</label><textarea id={`instrucciones-${id}`} maxLength={1000} rows={3} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} disabled={ocupado || cambios} placeholder="Indicá qué querés modificar..." className="w-full rounded-xl border border-slate-200 p-3 text-sm"/><button disabled={ocupado || cambios || !instrucciones.trim()} onClick={() => operar(() => modificarConIA(id, version, instrucciones.trim()), 'Se solicitaron los cambios a la IA.')} className={`${btn} borde-ia mt-2`}>Solicitar cambios con IA</button></div>}
    {editable && <button disabled={ocupado || cambios || !actual.cvId} onClick={() => operar(() => enviarPreparacion(id, version), 'Postulación enviada correctamente.', true)} className={primario}>Aprobar y enviar postulación</button>}
    {['Preparando', 'EnModificacion', 'PendienteAprobacion', 'PendienteAprobacionCv'].includes(actual.estado) && <button disabled={ocupado} onClick={() => operar(() => cancelarPreparacion(id), 'Se solicitó cancelar la preparación.', true)} className={`${btn} ml-2`}>Cancelar preparación</button>}
    {ocupado && <p role="status" className="flex items-center gap-2 text-sm text-primary-700"><LoaderCircle size={15} className="animate-spin"/>Procesando...</p>}
  </div>;
}

const grillaPostulaciones = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch';
const botonOferta = 'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary-500';
const botonTarjeta = 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
const estadosRealizadas = {
  Pendiente: ['Enviada · pendiente de revisión', 'text-primary-700', 'border-t-primary-500'],
  EnRevision: ['En revisión', 'text-primary-700', 'border-t-primary-500'],
  Entrevista: ['Entrevista', 'text-violet-700', 'border-t-violet-500'],
  Aceptada: ['Aceptada', 'text-emerald-700', 'border-t-emerald-500'],
  Rechazada: ['Rechazada', 'text-red-700', 'border-t-red-500'],
  Retirada: ['Retirada', 'text-slate-600', 'border-t-slate-400'],
};
const estadosAprobaciones = {
  PendienteAprobacion: ['text-amber-700', 'border-t-amber-500'],
  PendienteAprobacionCv: ['text-amber-700', 'border-t-amber-500'],
  Preparando: ['text-violet-700', 'border-t-violet-500'],
  EnModificacion: ['text-violet-700', 'border-t-violet-500'],
  AplicandoCv: ['text-violet-700', 'border-t-violet-500'],
  Enviando: ['text-primary-700', 'border-t-primary-500'],
  CancelacionSolicitada: ['text-slate-600', 'border-t-slate-400'],
};
const enCurso = ['Preparando', 'EnModificacion', 'AplicandoCv', 'Enviando', 'CancelacionSolicitada'];
const origenes = { Manual: 'Manual', Automatica: 'Automática', Asistida: 'Asistida', SolicitudUsuario: 'Solicitada por vos', IniciativaIA: 'Iniciativa de IA' };
const fuentes = { Pendientes: 'Pendientes', Recomendaciones: 'Recomendaciones' };

function estiloCompatibilidad(valor) {
  if (valor == null || !Number.isFinite(Number(valor))) return { texto: 'text-slate-500', borde: 'border-t-slate-300', color: '#94a3b8', etiqueta: 'Compatibilidad sin calcular' };
  if (Number(valor) >= 80) return { texto: 'text-emerald-600', borde: 'border-t-emerald-500', color: '#059669', etiqueta: 'Excelente coincidencia' };
  if (Number(valor) >= 50) return { texto: 'text-primary-600', borde: 'border-t-primary-500', color: '#2563eb', etiqueta: 'Buena compatibilidad' };
  return { texto: 'text-amber-600', borde: 'border-t-amber-500', color: '#d97706', etiqueta: 'Compatibilidad parcial' };
}

// Mismo indicador y escala que Recomendaciones; no representa como 0 un dato ausente.
function IndicadorCompatibilidad({ porcentaje }) {
  const informado = porcentaje != null && Number.isFinite(Number(porcentaje));
  const valor = informado ? Math.max(0, Math.min(100, Number(porcentaje))) : 0;
  const estilo = estiloCompatibilidad(informado ? valor : null);
  const radio = 25;
  const circunferencia = 2 * Math.PI * radio;
  const etiqueta = informado ? `${valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%` : 'Sin calcular';
  return <div className="relative h-12 w-12 shrink-0" role="img" aria-label={`Compatibilidad: ${etiqueta}`} title={etiqueta}>
    <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="30" cy="30" r={radio} fill="none" stroke="#e2e8f0" strokeWidth="4"/>
      {informado && <circle cx="30" cy="30" r={radio} fill="none" stroke={estilo.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circunferencia} strokeDashoffset={circunferencia * (1 - valor / 100)} className="transition-all duration-700 ease-out"/>}
    </svg>
    <span className={`absolute inset-0 flex items-center justify-center text-[12px] font-bold tabular-nums ${estilo.texto}`}>{informado ? `${Math.round(valor)}%` : '—'}</span>
  </div>;
}

function EsqueletoTarjetas() {
  return <div role="status" aria-label="Cargando postulaciones" className={grillaPostulaciones}>
    {Array.from({ length: 8 }, (_, i) => <div key={i} aria-hidden="true" className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex justify-between"><div className="h-10 w-10 rounded-xl bg-slate-200"/><div className="h-12 w-12 rounded-full bg-slate-200"/></div>
      <div className="mb-2 h-4 w-4/5 rounded bg-slate-200"/><div className="mb-5 h-3 w-3/5 rounded bg-slate-100"/>
      <div className="mb-2 h-3 w-2/3 rounded bg-slate-100"/><div className="mb-5 h-3 w-1/2 rounded bg-slate-100"/>
      <div className="mb-2 h-8 rounded-lg bg-slate-200"/><div className="h-8 rounded-lg bg-slate-100"/>
    </div>)}
  </div>;
}

function TarjetaPostulacion({ item, seccion, quitando, onOferta, onQuitar, onRevisar }) {
  const esPendiente = seccion === 'pendientes';
  const esAprobacion = seccion === 'aprobaciones';
  const compatibilidad = estiloCompatibilidad(item.compatibilidad);
  const [etiquetaRealizada, colorRealizada, bordeRealizada] = estadosRealizadas[item.estado] || [String(item.estado || 'Estado no informado'), 'text-slate-600', 'border-t-slate-300'];
  const [colorAprobacion, bordeAprobacion] = estadosAprobaciones[item.estado] || ['text-slate-600', 'border-t-slate-300'];
  const borde = esPendiente ? (item.disponible === false ? 'border-t-slate-400' : compatibilidad.borde) : esAprobacion ? bordeAprobacion : bordeRealizada;
  const color = esPendiente ? compatibilidad.texto : esAprobacion ? colorAprobacion : colorRealizada;
  const fondo = borde.includes('emerald') ? 'bg-emerald-50 border-emerald-100' : borde.includes('amber') ? 'bg-amber-50 border-amber-100' : borde.includes('violet') ? 'bg-violet-50 border-violet-100' : borde.includes('red') ? 'bg-red-50 border-red-100' : borde.includes('primary') ? 'bg-primary-50 border-primary-100' : 'bg-slate-100 border-slate-200';
  const etiqueta = esPendiente ? (item.disponible === false ? 'Oferta no disponible' : compatibilidad.etiqueta) : esAprobacion ? descripcionEstado(item.estado) : etiquetaRealizada;
  const estadoTrabajo = esPendiente ? item.estadoPreparacion : esAprobacion ? item.estado : null;
  const trabajando = enCurso.includes(estadoTrabajo);
  const tienePreparacion = esPendiente && !!item.preparacionId;
  return <article className={`group relative flex min-w-0 flex-col rounded-xl border border-slate-200 border-t-[3px] ${borde} bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-within:z-20`}>
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${fondo} ${color}`}><CodeXml size={22} strokeWidth={2}/></div>
      {esPendiente ? <IndicadorCompatibilidad porcentaje={item.compatibilidad}/> : <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${fondo} ${color}`}>{trabajando ? <LoaderCircle size={20} className="animate-spin" aria-label="IA trabajando"/> : esAprobacion ? <FileCheck size={21} aria-hidden="true"/> : <BriefcaseBusiness size={21} aria-hidden="true"/>}</span>}
    </div>
    <div className="mb-2">
      <h3 className="break-words text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-primary-700">{item.titulo || <TituloPostulacion empleoId={item.empleoId}/>}</h3>
      <p className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${fondo} ${color}`}>{etiqueta}</p>
      {esPendiente && <p className="mt-1 text-[11px] text-slate-500">Guardada: {fecha(item.fechaAgregado)}</p>}
      {esAprobacion && <p className="mt-1 text-[11px] text-slate-500">Creada: {fecha(item.fechaCreacion)}</p>}
      {!esPendiente && !esAprobacion && <p className="mt-1 text-[11px] text-slate-500">Enviada: {fecha(item.fechaPostulacion)}</p>}
    </div>
    <div className="mb-2 border-t border-slate-100"/>
    <div className="flex flex-1 flex-col gap-2 text-xs text-slate-600">
      {esPendiente && <><p>Prioridad: <strong className="text-slate-800">{item.prioridad ?? 'Sin calcular'}</strong></p><p>Cierre: <strong className="text-slate-800">{fecha(item.fechaCierre)}</strong></p>{item.disponible === false && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">{item.motivoNoDisponible || 'Esta oferta no está disponible.'}</p>}{tienePreparacion && <button type="button" onClick={() => verSeguimientoIA(item.preparacionId)} className="flex items-center gap-1 rounded-lg bg-violet-50 p-2 font-medium text-violet-700 hover:bg-violet-100 cursor-pointer">{trabajando && <LoaderCircle size={14} className="shrink-0 animate-spin"/>}{descripcionEstado(estadoTrabajo)}</button>}</>}
      {!esPendiente && <><p>Origen: <strong className="text-slate-800">{origenes[item.origen] || 'No informado'}</strong></p>{item.fuenteOferta && <p>Seleccionada desde: <strong className="text-slate-800">{fuentes[item.fuenteOferta] || item.fuenteOferta}</strong></p>}</>}
      {esAprobacion && item.estado === 'PendienteAprobacionCv' && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">Revisá los cambios propuestos al CV.</p>}
      {esAprobacion && item.estado === 'PendienteAprobacion' && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">La propuesta requiere tu revisión antes de enviarse.</p>}
      {esAprobacion && item.ultimoError && <p className="break-words rounded-lg bg-amber-50 p-2 text-amber-800">La preparación necesita revisión.</p>}
      {!esPendiente && !esAprobacion && <p>Historial: <strong className="text-slate-800">{Array.isArray(item.historial) ? item.historial.length : 0} eventos</strong></p>}
    </div>
    <div className="mt-auto flex flex-col gap-1 pt-2">
      <button type="button" onClick={() => onOferta(item)} className={botonOferta}>Ver oferta <ArrowRight size={14}/></button>
      {esPendiente ? <>
        {item.disponible && <div className="text-[12px] [&_button]:!text-[12px] [&_button]:!py-1.5 [&_button]:!px-2 [&_button]:!min-h-0 [&_button]:!h-auto"><AccionesPostulacion empleo={{ id: item.empleoId, titulo: item.titulo }}/></div>}
        <button type="button" disabled={quitando === item.empleoId} onClick={() => onQuitar(item.empleoId)} className={botonTarjeta}>{quitando === item.empleoId ? 'Quitando...' : 'Quitar de pendientes'}</button>
      </> : <button type="button" onClick={() => onRevisar(item.id)} className="w-full rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 cursor-pointer">{esAprobacion ? 'Ver preparación y revisar' : 'Ver postulación e historial'}</button>}
    </div>
  </article>;
}

// La revisión y el historial conservan sus acciones en una ventana de ancho completo.
function VentanaPostulacion({ item, seccion, onCerrar, refrescar, descargar }) {
  const cerrarRef = useRef(onCerrar);
  const panel = useRef(null);
  const cierre = useRef(null);
  useEffect(() => { cerrarRef.current = onCerrar; }, [onCerrar]);
  useEffect(() => {
    const previo = document.activeElement;
    cierre.current?.focus();
    const teclado = (e) => {
      if (document.querySelector('[role="alertdialog"]')) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrarRef.current(); }
      if (e.key !== 'Tab') return;
      const elementos = [...(panel.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]') || [])].filter((x) => x.getClientRects().length > 0);
      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus(); }
    };
    document.addEventListener('keydown', teclado);
    return () => { document.removeEventListener('keydown', teclado); if (previo?.isConnected) previo.focus(); };
  }, []);
  const aprobacion = seccion === 'aprobaciones';
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
    <section ref={panel} role="dialog" aria-modal="true" aria-labelledby="titulo-ventana-postulacion" className="flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className={`flex shrink-0 items-start justify-between gap-4 border-b px-5 py-5 sm:px-8 ${aprobacion ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-white' : 'border-primary-200 bg-gradient-to-r from-primary-50 to-white'}`}><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{aprobacion ? 'Revisión de preparación' : 'Detalle de postulación'}</p><h2 id="titulo-ventana-postulacion" className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-2xl">{item.titulo || <TituloPostulacion empleoId={item.empleoId}/>}</h2></div><button type="button" ref={cierre} onClick={onCerrar} aria-label="Cerrar ventana" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"><X size={23}/></button></header>
      <div className="overflow-y-auto px-5 py-6 sm:px-8">
        {aprobacion ? <Revision preparacion={item} refrescar={refrescar}/> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary-800"><FileCheck size={17}/> Estado de la postulación</h3>
              <div className={`rounded-lg border-l-4 bg-slate-50 p-3 ${item.estado === 'Aceptada' ? 'border-emerald-500' : item.estado === 'Rechazada' ? 'border-red-500' : item.estado === 'Retirada' ? 'border-slate-400' : item.estado === 'Entrevista' ? 'border-violet-500' : 'border-primary-500'}`}><p className={`text-base font-bold ${estadosRealizadas[item.estado]?.[1] || 'text-slate-700'}`}>{estadosRealizadas[item.estado]?.[0] || item.estado}</p><p className="mt-1 text-xs text-slate-600">Enviada: {fecha(item.fechaPostulacion)}</p></div>
              <HistorialPostulacion item={item}/>
            </section>
            {item.textoPresentacion && <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="mb-3 text-sm font-bold text-primary-800">Texto de presentación enviado</h3><p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{item.textoPresentacion}</p></section>}
          </div>
          <aside className="space-y-3">
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"><h3 className="mb-3 text-sm font-bold text-indigo-900">Datos del envío</h3><dl className="space-y-2 text-xs"><div><dt className="text-slate-500">Origen</dt><dd className="mt-0.5 font-semibold text-slate-800">{origenes[item.origen] || 'No informado'}</dd></div>{item.fuenteOferta && <div><dt className="text-slate-500">Seleccionada desde</dt><dd className="mt-0.5 font-semibold text-slate-800">{fuentes[item.fuenteOferta] || item.fuenteOferta}</dd></div>}</dl><button type="button" onClick={() => descargar(item.id)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-primary-700 cursor-pointer">Descargar CV enviado</button></section>
            <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-bold text-slate-800">Gestionar postulación</h3><div className="mt-2 flex flex-col items-stretch gap-2 [&_button]:!m-0 [&_button]:w-full"><AccionesSeguimiento item={item} onActualizar={refrescar}/></div></section>
          </aside>
        </div>}
      </div>
      <footer className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-3 sm:px-8"><button type="button" onClick={onCerrar} className={btn}>Cerrar</button></footer>
    </section>
  </div>;
}

export default function Postulaciones() {
  const { seccion } = useParams();
  const [parametros, setParametros] = useSearchParams();
  const idSolicitado = parametros.get('preparacion') || parametros.get('postulacion');
  const consultaRef = useRef({ numero: 0 });
  const pestaña = ['pendientes', 'aprobaciones', 'realizadas'].includes(seccion) ? seccion : 'pendientes';
  const [datos, setDatos] = useState([]);
  const [paginas, setPaginas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [quitando, setQuitando] = useState(null);
  const [pendienteQuitar, setPendienteQuitar] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const cargar = useCallback(async (silenciosa = false) => {
    const numero = ++consultaRef.current.numero;
    if (silenciosa !== true) { setCargando(true); setError(''); }
    try {
      const respuesta = await ({ pendientes, aprobaciones: preparaciones, realizadas: misPostulaciones }[pestaña])();
      if (numero !== consultaRef.current.numero) return;
      const lista = Array.isArray(respuesta) ? respuesta : [];
      setDatos(lista); setError('');
      const cantidad = pestaña === 'aprobaciones'
        ? lista.filter((x) => ['PendienteAprobacion', 'PendienteAprobacionCv'].includes(x.estado)).length
        : lista.length;
      const maximo = Math.max(1, Math.ceil(cantidad / 16));
      setPaginas((actual) => ({ ...actual, [pestaña]: Math.min(actual[pestaña] ?? 1, maximo) }));
    } catch (err) { if (numero === consultaRef.current.numero) { if (silenciosa !== true) setDatos([]); setError(err.message); } }
    finally { if (numero === consultaRef.current.numero) setCargando(false); }
  }, [pestaña]);
  useEffect(() => {
    let activo = true;
    Promise.resolve().then(() => { if (activo) cargar(); });
    const control = consultaRef.current;
    const actualizar = () => cargar(true);
    window.addEventListener('recursiva:ofertas-actualizadas', actualizar);
    return () => { activo = false; control.numero++; window.removeEventListener('recursiva:ofertas-actualizadas', actualizar); };
  }, [cargar]);
  useEffect(() => {
    if (!['aprobaciones', 'realizadas'].includes(pestaña) || !idSolicitado || cargando) return;
    const lista = pestaña === 'aprobaciones' ? datos.filter((x) => ['PendienteAprobacion', 'PendienteAprobacionCv'].includes(x.estado)) : datos;
    const index = lista.findIndex((x) => x.id === idSolicitado);
    if (index < 0) return;
    Promise.resolve().then(() => {
      setSeleccion({ id: idSolicitado, seccion: pestaña });
      setPaginas((actual) => ({ ...actual, [pestaña]: Math.floor(index / 16) + 1 }));
      setParametros((actual) => { const siguientes = new URLSearchParams(actual); siguientes.delete('preparacion'); siguientes.delete('postulacion'); return siguientes; }, { replace: true });
    });
  }, [datos, idSolicitado, cargando, pestaña, setParametros]);
  async function quitar(id) {
    if (quitando) return;
    setQuitando(id);
    try {
      const lista = await pendientes();
      const oferta = Array.isArray(lista) ? lista.find((x) => x.empleoId === id) : null;
      if (!oferta) { avisar('La oferta ya no está en pendientes.', 'error'); await cargar(true); return; }
      if (oferta.preparacionId && oferta.estadoPreparacion) {
        avisar('La IA está trabajando en esta oferta o tiene una propuesta pendiente de revisión. Cancelá la preparación antes de quitarla.', 'error');
        await cargar(true);
        return;
      }
      setPendienteQuitar(id);
    } catch (err) { avisar(err.message || 'No se pudo verificar el estado de la oferta.', 'error'); }
    finally { setQuitando(null); }
  }
  async function confirmarQuitar(id) {
    setPendienteQuitar(null);
    setQuitando(id);
    try { await quitarPendiente(id); avisar('Oferta eliminada de pendientes.'); }
    catch (err) { avisar(err.message, 'error'); }
    finally { setQuitando(null); }
  }
  async function descargar(id) {
    try { const archivo = await obtenerCvEnviado(id); const url = URL.createObjectURL(archivo); const a = document.createElement('a'); a.href = url; a.download = `cv-enviado-${id}.${archivo.type?.includes("wordprocessingml") ? "docx" : "pdf"}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (err) { avisar(err.message, 'error'); }
  }
  const titulos = { pendientes: 'Pendientes de postulación', aprobaciones: 'Requieren tu aprobación', realizadas: 'Postulaciones realizadas' };
  // Conservar los filtros de cada sección y paginar después de aplicarlos.
  const filtradas = pestaña === 'aprobaciones' ? datos.filter((x) => ['PendienteAprobacion', 'PendienteAprobacionCv'].includes(x.estado)) : datos;
  const porPagina = 16;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaActual = Math.min(paginas[pestaña] ?? 1, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
  const seleccionado = seleccion?.seccion === pestaña ? filtradas.find((item) => item.id === seleccion.id) : null;
  return <main className="min-h-screen bg-slate-50 pb-6">
    <section className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 text-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{titulos[pestaña]}</h1>
        <p className="mt-1 text-sm text-primary-100">Gestioná tus postulaciones y revisá su evolución.</p>
      </div>
    </section>
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 sm:px-6">
      {pestaña === 'pendientes' && <><ConfiguracionAgenteCompacta alGuardar={cargar}/><OfertasDescartadas/></>}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-xl font-bold tracking-tight text-slate-900">{titulos[pestaña]}</h2><p className="mt-1 text-xs text-slate-500">{cargando ? 'Consultando postulaciones...' : error ? 'No se pudo consultar el listado.' : `${filtradas.length} ${filtradas.length === 1 ? 'oferta' : 'ofertas'}`}</p></div>
        <button type="button" onClick={cargar} className={`${btn} flex items-center gap-2`} disabled={cargando}><RefreshCw size={16} className={cargando ? 'animate-spin' : ''}/>Actualizar</button>
      </div>
      {cargando ? <EsqueletoTarjetas/> : error ? <ErrorConsulta mensaje={error} recargar={cargar}/> : visibles.length === 0 ? <div className={`${tarjeta} text-center text-slate-600`}>No hay elementos en esta sección. <Link to="/empleos" className="font-semibold text-primary-700 underline">Buscar empleos</Link></div> : <div className={grillaPostulaciones}>
        {visibles.map((item) => <TarjetaPostulacion key={item.id || item.empleoId} item={item} seccion={pestaña} quitando={quitando} onOferta={setDetalle} onQuitar={quitar} onRevisar={(id) => setSeleccion({ id, seccion: pestaña })}/>)}
      </div>}
      {!cargando && !error && totalPaginas > 1 && (
        <nav aria-label={`Paginación de ${titulos[pestaña]}`} className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={paginaActual === 1} onClick={() => { setSeleccion(null); setPaginas((actual) => ({ ...actual, [pestaña]: paginaActual - 1 })); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Anterior</button>
          <span className="text-slate-600" aria-live="polite">Página {paginaActual} de {totalPaginas}</span>
          <button type="button" disabled={paginaActual === totalPaginas} onClick={() => { setSeleccion(null); setPaginas((actual) => ({ ...actual, [pestaña]: paginaActual + 1 })); }} className="rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">Siguiente</button>
        </nav>
      )}
      <ConfirmacionAccion abierto={!!pendienteQuitar} titulo="Quitar de pendientes" mensaje="¿Querés quitar esta oferta de tus pendientes? El agente todavía podrá seleccionarla desde recomendaciones si alcanza la compatibilidad mínima. Para excluirla, usá «No me interesa»." confirmar="Quitar oferta" peligro ocupado={!!quitando} onConfirmar={() => confirmarQuitar(pendienteQuitar)} onCancelar={() => setPendienteQuitar(null)}/>
      {detalle && <DetalleOferta empleo={detalle} mostrarAcciones={pestaña === 'pendientes'} onCerrar={() => setDetalle(null)}/>}
      {seleccionado && <VentanaPostulacion key={seleccionado.id} item={seleccionado} seccion={pestaña} onCerrar={() => setSeleccion(null)} refrescar={cargar} descargar={descargar}/>}
</div>
  </main>;
}
