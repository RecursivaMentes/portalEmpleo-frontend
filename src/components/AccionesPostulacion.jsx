import { useEffect, useRef, useState } from 'react';
import { ChevronDown, BookmarkPlus, LoaderCircle } from 'lucide-react';
import { agregarPendiente, avisar, estadoOfertas, limpiarCacheOfertas, solicitarPostulacionIA } from '../services/postulacionesService';
import { obtenerUsuarioIdActual } from '../services/usuariosService';
import ModalPostulacionManual from './ModalPostulacionManual';
import ConfirmacionAccion from './ConfirmacionAccion';

export default function AccionesPostulacion({ empleo, onSolicitarLogin }) {
  const empleoId = empleo?.empleoId || empleo?.id;
  const [abierto, setAbierto] = useState(false);
  const [manual, setManual] = useState(false);
  const [confirmandoIA, setConfirmandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [preparandoIA, setPreparandoIA] = useState(false);
  const [postulado, setPostulado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const ref = useRef(null);
  const usuarioId = obtenerUsuarioIdActual();

  useEffect(() => {
    if (!usuarioId || !empleoId) return;
    let activo = true;
    estadoOfertas().then(({ realizadas, guardadas, completo }) => {
      if (!activo) return;
      setPostulado(realizadas.some((p) => p.empleoId === empleoId && p.estado !== 'Retirada' && p.estado !== 5));
      setGuardado(guardadas.some((p) => p.empleoId === empleoId));
      setVerificado(completo);
    }).catch(() => { if (activo) setVerificado(false); });
    return () => { activo = false; };
  }, [empleoId, usuarioId]);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (evento) => { if (!ref.current?.contains(evento.target)) setAbierto(false); };
    const escapar = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', cerrar);
    document.addEventListener('keydown', escapar);
    return () => { document.removeEventListener('pointerdown', cerrar); document.removeEventListener('keydown', escapar); };
  }, [abierto]);

  function necesitaSesion() {
    if (obtenerUsuarioIdActual()) return false;
    onSolicitarLogin?.('Iniciá sesión para gestionar esta postulación.');
    return true;
  }

  async function guardar() {
    if (necesitaSesion() || guardando || guardado || postulado) return;
    setGuardando(true);
    try {
      await agregarPendiente(empleoId);
      setGuardado(true);
      limpiarCacheOfertas();
      avisar('Oferta agregada a tus postulaciones pendientes.');
    } catch (error) { avisar(error.message, 'error'); }
    finally { setGuardando(false); }
  }

  function ia() {
    setAbierto(false);
    if (necesitaSesion() || preparandoIA) return;
    setConfirmandoIA(true);
  }

  async function ejecutarIA() {
    setConfirmandoIA(false);
    setPreparandoIA(true);
    try { await solicitarPostulacionIA(empleoId); limpiarCacheOfertas(); avisar('La preparación con IA fue solicitada. Consultá Postulaciones para seguir su estado.'); }
    catch (error) { avisar(error.message, 'error'); }
    finally { setPreparandoIA(false); }
  }

  if (!empleoId) return null;
  return <div className="mt-4 space-y-2">
    {postulado ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Ya te postulaste</p> : <div className="relative" ref={ref}>
      <button type="button" disabled={guardando || preparandoIA} aria-expanded={abierto} aria-haspopup="menu" onClick={() => setAbierto((x) => !x)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 cursor-pointer">{preparandoIA ? <><LoaderCircle size={17} className="animate-spin"/>Preparando con IA...</> : <>Postular ahora <ChevronDown size={17}/></>}</button>
      {abierto && <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-full min-w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
        <button role="menuitem" onClick={() => { setAbierto(false); if (!necesitaSesion()) setManual(true); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-primary-50 cursor-pointer">Postular manualmente</button>
        <button role="menuitem" onClick={ia} className="borde-ia mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-violet-700 cursor-pointer">Postular con IA</button>
      </div>}
    </div>}
    {!postulado && <button type="button" disabled={guardando || guardado || preparandoIA} onClick={guardar} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer">{guardando ? <LoaderCircle size={16} className="animate-spin"/> : <BookmarkPlus size={16}/>} {guardado ? 'Pendiente de postulación' : 'Postularme después'}</button>}
    {preparandoIA && <p role="status" className="text-sm text-primary-700">Solicitando preparación de postulación con IA...</p>}
    {!verificado && usuarioId && <p className="text-xs text-slate-500">El estado previo de la oferta no se pudo verificar completamente.</p>}
    <ConfirmacionAccion abierto={confirmandoIA} titulo="Preparación con IA" mensaje="¿Querés que la IA prepare una postulación para esta oferta? Según el modo configurado, podría enviarse automáticamente." confirmar="Solicitar preparación" onConfirmar={ejecutarIA} onCancelar={() => setConfirmandoIA(false)}/>
    {manual && <ModalPostulacionManual empleo={empleo} onCerrar={() => setManual(false)} onExito={() => { setManual(false); setPostulado(true); setGuardado(false); limpiarCacheOfertas(); }}/>}</div>;
}
