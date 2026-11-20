import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { obtenerCvs, obtenerVistaPreviaCv } from '../services/cvsService';
import {
  avisar, misPostulaciones, pendientes, preparaciones, quitarPendiente,
  cancelarPreparacion, obtenerPreparacion, proponerCambios, aceptarCambios, descartarCambios,
  modificarConIA, enviarPreparacion, compararCvIA, aprobarCvIA, obtenerCvEnviado,
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
const primario = 'rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer';

function Esqueleto() { return <div className="space-y-4 animate-pulse">{[1, 2, 3].map((x) => <div key={x} className="h-32 rounded-2xl bg-slate-200"/>)}</div>; }
function ErrorConsulta({ mensaje, recargar }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{mensaje}</p><button onClick={recargar} className="mt-3 font-semibold underline cursor-pointer">Reintentar</button></div>; }

function HistorialPostulacion({ item }) {
  const eventos = Array.isArray(item.historial) ? item.historial : [];
  const mostrarFecha = (valor) => {
    if (!valor) return 'Sin fecha';
    const fechaEvento = new Date(valor);
    return Number.isNaN(fechaEvento.getTime())
      ? 'Fecha no disponible'
      : fechaEvento.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  };
  return <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
    <summary className="cursor-pointer font-semibold text-slate-800">
      Seguimiento e historial ({eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'})
    </summary>
    {eventos.length > 0 ? <ol className="mt-4 space-y-3 border-l-2 border-blue-200 pl-4">
      {eventos.map((evento, indice) => <li key={`${evento.estado}-${evento.fechaUtc}-${indice}`} className="relative">
        <span aria-hidden="true" className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
        <p className="font-semibold text-slate-900">{String(evento.estado || 'Sin estado')}</p>
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
      await refrescar();
    } catch (err) { setError(err.message); }
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
    <div><p className="text-sm font-semibold text-blue-700">{descripcionEstado(actual.estado)}</p><p className="mt-1 text-sm text-slate-500">Oferta: {actual.empleoId} · Versión de revisión: {version}</p></div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {requiereCv && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-semibold text-slate-900">La IA propuso cambios al CV</h3><p className="text-sm text-slate-700">Revisá la comparación antes de aprobarlos. Aprobar el CV no envía la postulación.</p>
      <button disabled={ocupado} onClick={verComparacion} className={btn}>Comparar cambios del CV</button>
      {comparacion && <div className="space-y-3"><p className="text-sm text-amber-800">{comparacion.originalDesactualizado ? 'El CV original cambió desde que se preparó esta propuesta.' : comparacion.crearNuevo ? 'La IA propone crear un CV nuevo.' : 'Comparación del contenido original y propuesto.'}</p><div className="grid gap-3 md:grid-cols-2"><div><p className="mb-1 text-sm font-semibold">Original</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{comparacion.textoOriginal || 'CV nuevo'}</pre></div><div><p className="mb-1 text-sm font-semibold">Propuesta</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{comparacion.textoPropuesto}</pre></div></div>
      <button disabled={ocupado || comparacion.originalDesactualizado} onClick={() => operar(() => aprobarCvIA(id, version), 'Cambios del CV aprobados.', true)} className={primario}>Aprobar cambios del CV</button></div>}
    </div>}
    {editable && <div className="space-y-4"><div><label htmlFor={`cv-${id}`} className="mb-1 block text-sm font-semibold">CV de la postulación</label><select id={`cv-${id}`} disabled={ocupado || cambios} value={cvId} onChange={(e) => setCvId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm"><option value="">Seleccioná un CV</option>{cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.titulo}{cv.esPrincipal ? ' (Principal)' : ''}</option>)}</select>{cvId && <button onClick={verCv} className="mt-2 text-sm text-blue-700 underline cursor-pointer">Ver CV</button>}</div>
      <div><label htmlFor={`texto-${id}`} className="mb-1 block text-sm font-semibold">Texto de presentación</label><textarea id={`texto-${id}`} disabled={ocupado || cambios} rows={5} maxLength={4000} value={texto} onChange={(e) => setTexto(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/></div>
      {cambios ? <div className="flex flex-wrap gap-2"><p className="w-full text-sm text-amber-800">Hay cambios propuestos que todavía no se aplicaron.</p><button disabled={ocupado} onClick={() => operar(() => aceptarCambios(id, version), 'Cambios aceptados.')} className={primario}>Aceptar cambios</button><button disabled={ocupado} onClick={() => operar(() => descartarCambios(id, version), 'Cambios descartados.')} className={btn}>Descartar cambios</button></div> : <button disabled={ocupado || (!cvId && !texto.trim()) || (cvId === (actual.cvId || '') && texto === (actual.textoPresentacion || ''))} onClick={() => operar(() => proponerCambios(id, { cvId: cvId || null, textoPresentacion: texto }), 'Cambios propuestos para revisión.')} className={btn}>Revisar cambios manuales</button>}
    </div>}
    {(editable || requiereCv) && <div><label htmlFor={`instrucciones-${id}`} className="mb-1 block text-sm font-semibold">Pedir cambios a la IA</label><textarea id={`instrucciones-${id}`} maxLength={1000} rows={3} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} disabled={ocupado || cambios} placeholder="Indicá qué querés modificar..." className="w-full rounded-xl border border-slate-200 p-3 text-sm"/><button disabled={ocupado || cambios || !instrucciones.trim()} onClick={() => operar(() => modificarConIA(id, version, instrucciones.trim()), 'Se solicitaron los cambios a la IA.')} className={`${btn} mt-2`}>Solicitar cambios con IA</button></div>}
    {editable && <button disabled={ocupado || cambios || !actual.cvId} onClick={() => operar(() => enviarPreparacion(id, version), 'Postulación enviada correctamente.', true)} className={primario}>Aprobar y enviar postulación</button>}
    {['Preparando', 'EnModificacion', 'PendienteAprobacion', 'PendienteAprobacionCv'].includes(actual.estado) && <button disabled={ocupado} onClick={() => operar(() => cancelarPreparacion(id), 'Se solicitó cancelar la preparación.', true)} className={`${btn} ml-2`}>Cancelar preparación</button>}
    {ocupado && <p role="status" className="flex items-center gap-2 text-sm text-blue-700"><LoaderCircle size={15} className="animate-spin"/>Procesando...</p>}
  </div>;
}

export default function Postulaciones() {
  const { seccion } = useParams();
  const pestaña = ['pendientes', 'aprobaciones', 'realizadas'].includes(seccion) ? seccion : 'pendientes';
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState(null);
  const [quitando, setQuitando] = useState(null);
  const [pendienteQuitar, setPendienteQuitar] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try {
      const respuesta = await ({ pendientes, aprobaciones: preparaciones, realizadas: misPostulaciones }[pestaña])();
      setDatos(Array.isArray(respuesta) ? respuesta : []);
    } catch (err) { setError(err.message); setDatos([]); }
    finally { setCargando(false); }
  }, [pestaña]);
  useEffect(() => { Promise.resolve().then(cargar); }, [cargar]);
  async function quitar(id) {
    setPendienteQuitar(id);
  }
  async function confirmarQuitar(id) {
    setPendienteQuitar(null);
    setQuitando(id);
    try { await quitarPendiente(id); avisar('Oferta eliminada de pendientes.'); await cargar(); }
    catch (err) { avisar(err.message, 'error'); }
    finally { setQuitando(null); }
  }
  async function descargar(id) {
    try { const archivo = await obtenerCvEnviado(id); const url = URL.createObjectURL(archivo); const a = document.createElement('a'); a.href = url; a.download = `cv-enviado-${id}.${archivo.type?.includes("wordprocessingml") ? "docx" : "pdf"}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    catch (err) { avisar(err.message, 'error'); }
  }
  const titulos = { pendientes: 'Pendientes de postulación', aprobaciones: 'Requieren tu aprobación', realizadas: 'Postulaciones realizadas' };
  const visibles = pestaña === 'aprobaciones' ? datos.filter((x) => !['Enviada', 'Cancelada', 'Fallida'].includes(x.estado)) : datos;
  return <main className="min-h-screen bg-slate-50 pb-20"><section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white"><div className="mx-auto max-w-6xl px-5 py-10"><h1 className="text-3xl font-extrabold">{titulos[pestaña]}</h1><p className="mt-2 text-blue-100">Gestioná tus postulaciones y revisá su evolución.</p></div></section>
    <div className="mx-auto max-w-6xl px-5 py-8">{pestaña === 'pendientes' && <ConfiguracionAgenteCompacta alGuardar={cargar}/>}<div className="mb-5 flex justify-end"><button onClick={cargar} className={`${btn} flex items-center gap-2`} disabled={cargando}><RefreshCw size={16}/>Actualizar</button></div>
      {cargando ? <Esqueleto/> : error ? <ErrorConsulta mensaje={error} recargar={cargar}/> : visibles.length === 0 ? <div className={`${tarjeta} text-center text-slate-600`}>No hay elementos en esta sección. <Link to="/empleos" className="font-semibold text-blue-700 underline">Buscar empleos</Link></div> : <div className="space-y-4">
        {visibles.map((item) => <article key={item.id || item.empleoId} className={tarjeta}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{item.titulo || <TituloPostulacion empleoId={item.empleoId}/>}</h2><p className="mt-1 text-sm text-slate-500">{pestaña === 'pendientes' ? `Guardada: ${fecha(item.fechaAgregado)}` : pestaña === 'realizadas' ? `Enviada: ${fecha(item.fechaPostulacion)}` : `Preparación: ${descripcionEstado(item.estado)}`}</p></div>
            {pestaña === 'pendientes' && <div className="text-sm"><p>Prioridad: <strong>{item.prioridad ?? 'No calculada'}</strong></p><p>Compatibilidad: <strong>{item.compatibilidad == null ? 'No calculada' : `${item.compatibilidad}%`}</strong></p><p>Cierre: {fecha(item.fechaCierre)}</p></div>}
            {pestaña === 'realizadas' && <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{({ Pendiente: 'Enviada Â· pendiente de revisión', EnRevision: 'En revisión', Entrevista: 'Entrevista', Aceptada: 'Aceptada', Rechazada: 'Rechazada', Retirada: 'Retirada' })[item.estado] || item.estado || 'Enviada'}</span>}
          </div>
          {pestaña === 'pendientes' && <div className="mt-4 space-y-3">{!item.disponible && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{item.motivoNoDisponible || 'Esta oferta no está disponible.'}</p>}
            <button type="button" onClick={() => setDetalle(item)} className={`${btn} mr-2`}>Ver detalles</button>{item.disponible && <AccionesPostulacion empleo={{ id: item.empleoId, titulo: item.titulo }}/>}<button disabled={quitando === item.empleoId} className={`${btn} mt-2`} onClick={() => quitar(item.empleoId)}>{quitando === item.empleoId ? 'Quitando...' : 'Quitar de pendientes'}</button>
          </div>}
          {pestaña === 'aprobaciones' && <div className="mt-4"><button className={btn} onClick={() => setSeleccion((x) => x === item.id ? null : item.id)}>{seleccion === item.id ? 'Ocultar revisión' : 'Ver preparación y revisar'}</button>{seleccion === item.id && <div className="mt-5 border-t border-slate-200 pt-5"><Revision preparacion={item} refrescar={cargar}/></div>}</div>}
          {pestaña === 'realizadas' && <div className="mt-4"><button onClick={() => descargar(item.id)} className={btn}>Descargar CV enviado</button><AccionesSeguimiento item={item} onActualizar={cargar}/><HistorialPostulacion item={item}/>{item.textoPresentacion && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">Texto de presentación enviado</summary><p className="mt-2 whitespace-pre-wrap text-slate-600">{item.textoPresentacion}</p></details>}</div>}
        </article>)}
      </div>}
      <ConfirmacionAccion abierto={!!pendienteQuitar} titulo="Quitar de pendientes" mensaje="¿Querés quitar esta oferta de tus postulaciones pendientes? Todavía no se envió ninguna postulación." confirmar="Quitar oferta" peligro ocupado={!!quitando} onConfirmar={() => confirmarQuitar(pendienteQuitar)} onCancelar={() => setPendienteQuitar(null)}/>
      {detalle && <DetalleOferta empleo={detalle} onCerrar={() => setDetalle(null)}/>}
</div>
  </main>;
}
