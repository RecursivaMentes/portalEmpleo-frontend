import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Bot, LoaderCircle, ChevronDown, ChevronUp, MessageCircle, ArrowRight } from 'lucide-react';
import { preparacionActiva, obtenerPreparacion, notificarCambioOfertas } from '../services/postulacionesService';

const estadosEnCurso = {
  Preparando: 'La IA está preparando una postulación',
  EnModificacion: 'La IA está ajustando una postulación',
  AplicandoCv: 'La IA está aplicando cambios al CV',
  Enviando: 'La IA está enviando una postulación',
  CancelacionSolicitada: 'Se está deteniendo una preparación con IA',
};

const estados = {
  ...estadosEnCurso,
  PendienteAprobacion: 'La propuesta requiere tu aprobación',
  PendienteAprobacionCv: 'Los cambios del CV requieren aprobación',
  Enviada: 'Postulación enviada',
  Fallida: 'No se pudo completar la preparación',
  Cancelada: 'Preparación cancelada',
};
const requiereAprobacion = (p) => ['PendienteAprobacion', 'PendienteAprobacionCv'].includes(p?.estado);
const firma = (p) => p ? `${p.id}:${p.estado}:${p.versionEdicion}` : '';

export default function ActividadPostulacionesIA() {
  const { pathname } = useLocation();
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState(false);
  const [expandida, setExpandida] = useState(false);

  const [objetivo, setObjetivo] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [errorDetalle, setErrorDetalle] = useState('');
  const firmaAnterior = useRef(null);
  const trabajoAnterior = useRef(null);
  const ultimaSincronizacion = useRef(0);

  useEffect(() => {
    let vigente = true;
    let consultando = false;
    const consultar = async () => {
      if (!vigente || consultando || document.visibilityState === 'hidden') return;
      consultando = true;
      try {
        const respuesta = await preparacionActiva();
        if (!vigente) return;
        setConsulta(respuesta); setError(false);
        const idActivo = respuesta?.preparacion?.id || null;
        if (idActivo && idActivo !== trabajoAnterior.current) {
          // Una nueva preparación sustituye automáticamente el seguimiento anterior.
          setObjetivo(null); setDetalle(null); setErrorDetalle('');
        }
        trabajoAnterior.current = idActivo;
        const nuevaFirma = `${firma(respuesta?.preparacion)}|${firma(respuesta?.ultimaPreparacion)}`;
        const cambio = firmaAnterior.current !== null && firmaAnterior.current !== nuevaFirma;
        const ahora = Date.now();
        if (cambio || (firmaAnterior.current !== null && ahora - ultimaSincronizacion.current >= 15000)) {
          ultimaSincronizacion.current = ahora;
          notificarCambioOfertas('sincronizar-ia');
        }
        if (firmaAnterior.current === null) ultimaSincronizacion.current = ahora;
        firmaAnterior.current = nuevaFirma;
      } catch { if (vigente) setError(true); }
      finally { consultando = false; }
    };
    const seguir = (evento) => {
      setObjetivo(evento.detail?.preparacionId || null);
      setDetalle(null); setErrorDetalle(''); setExpandida(true);
      consultar();
    };
    consultar();
    const intervalo = window.setInterval(consultar, 2000);
    window.addEventListener('focus', consultar);
    window.addEventListener('recursiva:ofertas-actualizadas', consultar);
    window.addEventListener('recursiva:ver-seguimiento-ia', seguir);
    document.addEventListener('visibilitychange', consultar);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
      window.removeEventListener('focus', consultar);
      window.removeEventListener('recursiva:ofertas-actualizadas', consultar);
      window.removeEventListener('recursiva:ver-seguimiento-ia', seguir);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, []);

  useEffect(() => {
    if (!expandida || !objetivo) return;
    let vigente = true;
    let consultando = false;
    const consultar = async () => {
      if (!vigente || consultando) return;
      consultando = true;
      try {
        const p = await obtenerPreparacion(objetivo);
        if (vigente) { setDetalle(p); setErrorDetalle(''); }
      } catch (e) { if (vigente) setErrorDetalle(e.message); }
      finally { consultando = false; }
    };
    consultar();
    const reloj = window.setInterval(consultar, 2000);
    return () => { vigente = false; window.clearInterval(reloj); };
  }, [expandida, objetivo]);

  const activa = consulta?.preparacion;
  const ultima = consulta?.ultimaPreparacion;
  const enCurso = !!estadosEnCurso[activa?.estado];
  const seguimiento = activa || (objetivo ? (ultima?.id === objetivo ? ultima : detalle?.id === objetivo ? detalle : null) : ultima);
  const nombre = seguimiento?.id === activa?.id ? consulta?.oferta?.titulo : seguimiento?.id === ultima?.id ? ultima?.titulo : null;
  const estadoVisible = error ? 'Estado sin confirmar' : !consulta ? 'Consultando actividad…' : enCurso ? estadosEnCurso[activa.estado] : ultima ? estados[ultima.estado] || 'Agente disponible' : 'Agente disponible';
  const motivo = error ? 'No se pudo consultar el estado. Se reintentará automáticamente.'
    : !consulta ? 'Consultando el servicio.'
    : consulta.integracionHabilitada === false ? 'La integración con Chatbot está deshabilitada.'
    : consulta.procesamientoHabilitado === false ? 'El ciclo autónomo está deshabilitado.'
    : consulta.modo === 'Desactivada' ? 'El agente está desactivado para tu cuenta.'
    : consulta.evaluacion?.mensaje || 'Aún no se registró una evaluación autónoma para esta cuenta.';
  const cupo = consulta?.cupoDiario;
  const enlace = (p) => requiereAprobacion(p) ? `/postulaciones/aprobaciones?preparacion=${encodeURIComponent(p.id)}`
    : p?.estado === 'Enviada' && p.postulacionId ? `/postulaciones/realizadas?postulacion=${encodeURIComponent(p.postulacionId)}` : null;
  // No enlazar un resultado de una ejecucion anterior mientras hay otra en curso.
  const destino = !error && !activa && !enCurso ? enlace(seguimiento) : null;
  const estadoBreve = error ? 'Sin conexión' : !consulta ? 'Consultando…' : enCurso ? 'Trabajando…'
    : requiereAprobacion(seguimiento) ? 'Requiere aprobación' : seguimiento?.estado === 'Enviada' ? 'Postulación enviada'
    : seguimiento?.estado === 'Fallida' ? 'Preparación fallida' : consulta.modo === 'Desactivada' ? 'Agente desactivado' : ['Error', 'ErrorPreparacion'].includes(consulta.evaluacion?.estado) ? 'Revisar actividad' : consulta.evaluacion?.estado === 'SinCandidatos' ? 'Sin ofertas elegibles' : 'Disponible';
  const abrirChat = (contextual = true) => {
    const contextos = [
      ['/empleos', 'Ayudame a buscar ofertas de empleo adecuadas para mi perfil.'],
      ['/recomendaciones', 'Ayudame a interpretar mis recomendaciones laborales.'],
      ['/postulaciones/pendientes', 'Ayudame a organizar mis ofertas pendientes de postulación.'],
      ['/postulaciones/aprobaciones', 'Ayudame a revisar mis preparaciones pendientes de aprobación.'],
      ['/postulaciones/realizadas', 'Ayudame a consultar mis postulaciones realizadas.'],
      ['/cvs', 'Ayudame a revisar y mejorar mis CV.'],
      ['/perfil/laboral', 'Ayudame a revisar mi perfil laboral.'],
    ];
    const mensaje = contextual ? contextos.find(([ruta]) => pathname === ruta)?.[1] || '' : '';
    window.dispatchEvent(new CustomEvent('abrir-chatbot', { detail: { mensaje } }));
  };

  return createPortal(<aside aria-label="Chatbot y actividad de postulaciones" className="fixed bottom-3 left-3 z-40 max-w-[calc(100vw-1.5rem)] sm:bottom-4 sm:left-4">
    <div className={`${expandida ? 'w-[300px]' : 'w-[218px]'} max-w-full overflow-hidden rounded-xl border border-indigo-300 bg-white shadow-xl ring-1 ring-indigo-900/10`}>
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-primary-700 to-indigo-700 px-2.5 py-2 text-white">
        <button type="button" onClick={() => abrirChat()} className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer" title="Abrir Chatbot según la sección">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20"><Bot size={17}/></span>
          <span className="min-w-0"><span className="block text-xs font-bold">Chatbot</span><span role="status" aria-live="polite" className="flex items-center gap-1 truncate text-[10px] text-indigo-100">{enCurso && !error && <LoaderCircle size={11} className="shrink-0 animate-spin"/>}{estadoBreve}</span></span>
        </button>
        <button type="button" onClick={() => abrirChat(false)} aria-label="Abrir chat a la derecha" title="Abrir chat" className="rounded p-1 hover:bg-white/20 cursor-pointer"><MessageCircle size={15}/></button>
        <button type="button" onClick={() => { setExpandida((v) => !v); setObjetivo(null); }} aria-expanded={expandida} aria-label={expandida ? 'Contraer seguimiento' : 'Ampliar seguimiento'} className="rounded p-1 hover:bg-white/20 cursor-pointer">{expandida ? <ChevronDown size={17}/> : <ChevronUp size={17}/>}</button>
      </div>
      {!expandida && <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] text-slate-600"><span>Cupo diario</span><strong className="tabular-nums text-primary-700">{!error && cupo ? `${cupo.consumidas}/${cupo.limite}` : '—'}</strong>{destino && <Link to={destino} aria-label="Ver postulación" title="Ver postulación" className="flex items-center gap-1 font-semibold text-primary-700 hover:underline">Ver postulación <ArrowRight size={12}/></Link>}</div>}
      {expandida && <div className="space-y-2 px-3 py-3 text-xs">
        <div role="status" aria-live="polite" className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5">
          <p className={`font-semibold ${error ? 'text-red-700' : enCurso ? 'text-violet-700' : seguimiento?.estado === 'Enviada' ? 'text-emerald-700' : requiereAprobacion(seguimiento) ? 'text-amber-700' : 'text-slate-800'}`}>{error ? estadoVisible : seguimiento ? estados[seguimiento.estado] || estadoVisible : estadoVisible}</p>
          {!error && nombre && <p className="mt-1 break-words text-slate-700">{nombre}</p>}
          {!enCurso && !error && consulta?.evaluacion?.estado !== 'EvaluacionFinalizada' && <p className="mt-1 text-slate-600">{motivo}</p>}
          {error && <p className="mt-1 text-slate-600">No se pudo consultar el estado. Reintentando…</p>}
          {objetivo && !seguimiento && !errorDetalle && <p className="mt-1 text-slate-600">Consultando preparación…</p>}
          {errorDetalle && <p role="alert" className="mt-1 text-red-700">{errorDetalle}</p>}
        </div>
        <div className="flex items-center justify-between"><span className="text-slate-600">Cupo diario del agente</span><strong className="tabular-nums text-primary-700">{!error && cupo ? `${cupo.consumidas}/${cupo.limite}` : '—'}</strong></div>
        {!error && cupo && <div role="progressbar" aria-label="Cupo diario consumido" aria-valuemin={0} aria-valuemax={cupo.limite} aria-valuenow={Math.min(cupo.consumidas, cupo.limite)} className="h-1.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, cupo.consumidas / Math.max(1, cupo.limite) * 100)}%` }}/></div>}
        {destino && <Link to={destino} onClick={() => { setExpandida(false); setObjetivo(null); }} className="flex items-center justify-between rounded-lg bg-primary-600 px-3 py-2 font-semibold text-white hover:bg-primary-700">Ver postulación <ArrowRight size={14}/></Link>}
      </div>}
    </div>
  </aside>, document.body);
}
