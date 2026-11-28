import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { obtenerCvs, obtenerVistaPreviaCv } from '../services/cvsService';
import { avisar, postularManualmente } from '../services/postulacionesService';
import ConfirmacionAccion from './ConfirmacionAccion';

export default function ModalPostulacionManual({ empleo, onCerrar, onExito }) {
  const [cvs, setCvs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cvId, setCvId] = useState('');
  const [presentacion, setPresentacion] = useState('');
  const [errorCv, setErrorCv] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const botonCerrar = useRef(null);
  useEffect(() => {
    let activo = true;
    obtenerCvs().then((data) => {
      if (!activo) return;
      const listado = Array.isArray(data) ? data : [];
      setCvs(listado);
      setCvId(listado.find((cv) => cv.esPrincipal)?.id || '');
    }).catch((err) => { if (activo) setError(err.response?.data?.message || 'No pudimos cargar tus CV.'); })
      .finally(() => { if (activo) setCargando(false); });
    botonCerrar.current?.focus();
    return () => { activo = false; };
  }, []);
  useEffect(() => {
    const escapar = (evento) => { if (evento.key === 'Escape' && !enviando && !document.querySelector('[role="alertdialog"]')) onCerrar(); };
    document.addEventListener('keydown', escapar);
    return () => document.removeEventListener('keydown', escapar);
  }, [enviando, onCerrar]);

  async function vistaPrevia() {
    if (!cvId) return;
    try {
      const url = await obtenerVistaPreviaCv(cvId);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { avisar('No se pudo abrir la vista previa del CV.', 'error'); }
  }
  async function enviar(evento) {
    evento.preventDefault();
    if (!cvId) { setErrorCv('Seleccioná un CV para esta postulación.'); return; }
    if (presentacion.length > 4000) { setError('La presentación no puede superar los 4000 caracteres.'); return; }
    setConfirmando(true);
  }
  async function confirmarEnvio() {
    setConfirmando(false);
    setEnviando(true); setError('');
    try {
      await postularManualmente(empleo.empleoId || empleo.id, cvId, presentacion);
      avisar('Tu postulación se envió correctamente.');
      onExito();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="titulo-postular" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-3"><div><h2 id="titulo-postular" className="text-xl font-bold text-slate-900">Postulación manual</h2><p className="mt-1 text-sm text-slate-600">{empleo.titulo}</p></div><button ref={botonCerrar} type="button" disabled={enviando} onClick={onCerrar} aria-label="Cerrar" className="cursor-pointer text-slate-500"><X size={21}/></button></div>
      <form onSubmit={enviar} className="mt-6 space-y-5">
        {cargando ? <div className="animate-pulse space-y-3"><div className="h-4 w-28 rounded bg-slate-200"/><div className="h-12 rounded-lg bg-slate-200"/></div> : <div>
          <label htmlFor="cv-postular" className="mb-2 block text-sm font-semibold text-slate-700">CV a enviar *</label>
          <select id="cv-postular" value={cvId} disabled={enviando} onChange={(e) => { setCvId(e.target.value); setErrorCv(''); }} aria-invalid={!!errorCv} className={`w-full rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary-100 ${errorCv ? 'border-red-400' : 'border-slate-200'}`}>
            <option value="">Seleccioná un CV</option>{cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.titulo || 'CV sin título'}{cv.esPrincipal ? ' (Principal)' : ''}</option>)}
          </select>
          {errorCv && <p role="alert" className="mt-1 text-sm text-red-600">{errorCv}</p>}
          {cvs.length === 0 && <p className="mt-2 text-sm text-amber-700">Todavía no tenés CV disponibles. <Link to="/cvs" onClick={onCerrar} className="font-semibold underline">Ir a Mis CV</Link></p>}
          {cvId && <button type="button" onClick={vistaPrevia} className="mt-2 text-sm font-semibold text-primary-700 underline cursor-pointer">Ver el CV seleccionado</button>}
        </div>}
        <div><label htmlFor="texto-presentacion" className="mb-2 block text-sm font-semibold text-slate-700">Texto de presentación (opcional)</label><textarea id="texto-presentacion" value={presentacion} onChange={(e) => setPresentacion(e.target.value)} disabled={enviando} rows={5} maxLength={4000} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="Presentate brevemente ante la empresa..."/></div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={enviando} onClick={onCerrar} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold cursor-pointer">Cancelar</button><button type="submit" disabled={enviando || cargando || cvs.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer">{enviando && <LoaderCircle size={16} className="animate-spin"/>}Confirmar postulación</button></div>
      </form>
      <ConfirmacionAccion abierto={confirmando} titulo="Confirmar postulación" mensaje={`¿Querés enviar tu postulación a «${empleo.titulo || 'esta oferta'}» con el CV seleccionado? Esta acción no se puede deshacer.`} confirmar="Enviar postulación" onConfirmar={confirmarEnvio} onCancelar={() => setConfirmando(false)}/>
    </section>
  </div>, document.body);
}
