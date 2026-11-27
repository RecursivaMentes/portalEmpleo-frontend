import { useEffect, useRef, useState } from 'react';
import { ChevronDown, BookmarkPlus, LoaderCircle, Sparkles, FilePenLine } from 'lucide-react';
import { agregarPendiente, avisar, estadoOfertas, limpiarCacheOfertas, solicitarPostulacionIA, descartarOferta, restaurarOferta } from '../services/postulacionesService';
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
  const [descartada, setDescartada] = useState(false);
  const [descartesVerificados, setDescartesVerificados] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  const [actualizandoDescarte, setActualizandoDescarte] = useState(false);
  const ref = useRef(null);
  const usuarioId = obtenerUsuarioIdActual();

  useEffect(() => {
    let activo = true;
    let consulta = 0;
    const actualizarEstado = () => {
      const numero = ++consulta;
      if (!usuarioId || !empleoId) {
        Promise.resolve().then(() => {
          if (!activo || numero !== consulta) return;
          setPostulado(false); setGuardado(false); setVerificado(false);
          setDescartada(false); setDescartesVerificados(false);
        });
        return;
      }
      estadoOfertas().then(({ realizadas, guardadas, completo, descartadas, descartesVerificados: verificados }) => {
        if (!activo || numero !== consulta) return;
        setPostulado(realizadas.some((p) => p.empleoId === empleoId && p.estado !== 'Retirada' && p.estado !== 5));
        setGuardado(guardadas.some((p) => p.empleoId === empleoId));
        setVerificado(completo);
        setDescartada(descartadas.includes(empleoId));
        setDescartesVerificados(verificados);
      }).catch(() => { if (activo && numero === consulta) { setVerificado(false); setDescartesVerificados(false); } });
    };
    actualizarEstado();
    window.addEventListener('recursiva:ofertas-actualizadas', actualizarEstado);
    return () => { activo = false; window.removeEventListener('recursiva:ofertas-actualizadas', actualizarEstado); };
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
    if (necesitaSesion() || guardando || guardado || postulado || actualizandoDescarte) return;
    setGuardando(true);
    try {
      await agregarPendiente(empleoId);
      setGuardado(true);
      setDescartada(false);
      avisar('Oferta agregada a tus postulaciones pendientes.');
    } catch (error) { avisar(error.message, 'error'); }
    finally { setGuardando(false); }
  }

  function ia() {
    setAbierto(false);
    if (necesitaSesion() || preparandoIA || actualizandoDescarte) return;
    setConfirmandoIA(true);
  }

  async function ejecutarIA() {
    setConfirmandoIA(false);
    setPreparandoIA(true);
    try { await solicitarPostulacionIA(empleoId); limpiarCacheOfertas(); avisar('La preparación con IA fue solicitada. Consultá Postulaciones para seguir su estado.'); }
    catch (error) { avisar(error.message, 'error'); }
    finally { setPreparandoIA(false); }
  }

  async function cambiarDescarte() {
    if (necesitaSesion() || actualizandoDescarte || guardando || preparandoIA || !descartesVerificados) return;
    setActualizandoDescarte(true);
    try {
      if (descartada) {
        await restaurarOferta(empleoId);
        setDescartada(false);
        avisar('La oferta vuelve a estar disponible para el agente.');
      } else {
        await descartarOferta(empleoId);
        setDescartada(true); setGuardado(false);
        avisar('El agente ya no seleccionará esta oferta automáticamente.');
      }
      setConfirmandoDescarte(false);
    } catch (error) { avisar(error.message, 'error'); }
    finally { setActualizandoDescarte(false); }
  }

  if (!empleoId) return null;
  return <div className="mt-2 space-y-2">
    {postulado ? <p className="flex w-full items-center justify-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Ya te postulaste</p> : <div className="relative" ref={ref}>
      <button type="button" disabled={guardando || preparandoIA || actualizandoDescarte} aria-expanded={abierto} aria-haspopup="menu" onClick={() => setAbierto((x) => !x)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 cursor-pointer">{preparandoIA ? <><LoaderCircle size={17} className="animate-spin"/>Preparando con IA...</> : <>Postular ahora <ChevronDown size={17}/></>}</button>
      {abierto && <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-full min-w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
        <button role="menuitem" onClick={() => { setAbierto(false); if (!necesitaSesion()) setManual(true);}} className="flex w-full items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-left text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors cursor-pointer"><FilePenLine size={16} />Postular manualmente</button>
        <button role="menuitem" onClick={ia} className="borde-ia flex w-full items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-left text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"><Sparkles size={16} />Postular con IA</button>
      </div>}
    </div>}
    {!postulado && <button type="button" disabled={guardando || guardado || preparandoIA || actualizandoDescarte} onClick={guardar} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer">{guardando ? <LoaderCircle size={16} className="animate-spin"/> : <BookmarkPlus size={16}/>} {guardado ? 'Pendiente de postulación' : 'Postularme después'}</button>}
    {usuarioId && !postulado && descartesVerificados && <div className="flex flex-wrap items-center justify-between gap-2">
      {descartada && <span className="text-xs text-slate-500">Excluida del agente</span>}
      <button type="button" disabled={actualizandoDescarte || guardando || preparandoIA} onClick={() => descartada ? cambiarDescarte() : setConfirmandoDescarte(true)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-primary-700 hover:underline disabled:opacity-50 cursor-pointer">{actualizandoDescarte && <LoaderCircle size={14} className="animate-spin"/>}{descartada ? 'Volver a incluir en el agente' : 'No me interesa'}</button>
    </div>}
    {usuarioId && !postulado && verificado && !descartesVerificados && <p className="text-xs text-slate-500">No se pudo consultar si la oferta está excluida del agente.</p>}
    <ConfirmacionAccion abierto={confirmandoDescarte} titulo="No me interesa esta oferta" mensaje="La oferta se quitará de pendientes si estaba guardada y el agente no volverá a seleccionarla. Podés revertirlo desde Postulaciones o desde esta oferta." confirmar="Excluir del agente" ocupado={actualizandoDescarte} onConfirmar={cambiarDescarte} onCancelar={() => setConfirmandoDescarte(false)}/>
    {preparandoIA && <p role="status" className="text-sm text-primary-700">Solicitando preparación de postulación con IA...</p>}
    {!verificado && usuarioId && <p className="text-xs text-slate-500">El estado previo de la oferta no se pudo verificar completamente.</p>}
    <ConfirmacionAccion abierto={confirmandoIA} titulo="Preparación con IA" mensaje="¿Querés que la IA prepare una postulación para esta oferta? Según el modo configurado, podría enviarse automáticamente." confirmar="Solicitar preparación" onConfirmar={ejecutarIA} onCancelar={() => setConfirmandoIA(false)}/>
    {manual && <ModalPostulacionManual empleo={empleo} onCerrar={() => setManual(false)} onExito={() => { setManual(false); setPostulado(true); setGuardado(false); limpiarCacheOfertas(); }}/>}</div>;
}
