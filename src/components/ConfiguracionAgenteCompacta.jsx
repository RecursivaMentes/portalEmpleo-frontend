import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp, LoaderCircle, Save, Settings2 } from 'lucide-react';

const url = '/api/postulaciones/configuracion/me';
const modos = [['Desactivada', 'Desactivada'], ['Asistida', 'Asistida'], ['Automatica', 'Automática']];
const ordenes = [['Prioridad', 'Prioridad'], ['Compatibilidad', 'Compatibilidad'], ['FechaCierre', 'Fecha de cierre'], ['Antiguos', 'Más antiguas'], ['Recientes', 'Más recientes']];
const campo = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';
const errorApi = (err) => err.response?.data?.message || err.response?.data?.mensaje || 'No se pudo completar la operación. Revisá la conexión con las APIs.';

export default function ConfiguracionAgenteCompacta({ alGuardar }) {
  const [expandida, setExpandida] = useState(false);
  const [datos, setDatos] = useState(null);
  const [original, setOriginal] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    axios.get(url, { withCredentials: true })
      .then(({ data }) => {
        if (!activo) return;
        setDatos(data); setOriginal(JSON.stringify(data));
      })
      .catch((err) => { if (activo) setError(errorApi(err)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  function cambiar(campoNombre, valor) {
    setDatos((actual) => ({ ...actual, [campoNombre]: valor }));
    setError('');
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (guardando || !datos) return;
    if (datos.compatibilidadMinima < 1 || datos.compatibilidadMinima > 100) {
      setError('La compatibilidad mínima debe estar entre 1 y 100 %.'); return;
    }
    if (datos.limiteDiario < 1 || datos.limiteDiario > 10) {
      setError('El límite diario debe estar entre 1 y 10.'); return;
    }
    setGuardando(true); setError('');
    try {
        const { data } = await axios.put(url, datos, { withCredentials: true });
      setDatos(data); setOriginal(JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Configuración de postulaciones guardada.' } }));
      await alGuardar?.();
    } catch (err) { setError(errorApi(err)); }
    finally { setGuardando(false); }
  }

  return <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <button type="button" aria-expanded={expandida} aria-controls="configuracion-agente-contenido" onClick={() => setExpandida((v) => !v)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900"><Settings2 size={18} className="shrink-0 text-primary-600" />Configuración de postulaciones <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{cargando ? 'Cargando...' : datos?.modo === 'Automatica' ? 'Automática' : datos?.modo || 'No disponible'}</span></span>
      {expandida ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
    {expandida && <div id="configuracion-agente-contenido" className="border-t border-slate-200 px-4 py-4">
      {cargando ? <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle size={17} className="animate-spin"/>Cargando configuración...</p> : !datos ? <p role="alert" className="text-sm text-red-700">{error || 'No se pudo consultar la configuración.'}</p> :
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-slate-700">Modo del agente<select value={datos.modo || 'Desactivada'} onChange={(e) => cambiar('modo', e.target.value)} className={campo}>{modos.map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-700">Compatibilidad mínima (%)<input type="number" min="1" max="100" value={datos.compatibilidadMinima} onChange={(e) => cambiar('compatibilidadMinima', Number(e.target.value))} className={campo}/></label>
          <label className="text-xs font-semibold text-slate-700">Límite diario (1–10)<input type="number" min="1" max="10" value={datos.limiteDiario} onChange={(e) => cambiar('limiteDiario', Number(e.target.value))} className={campo}/></label>
          <label className="text-xs font-semibold text-slate-700">Orden de pendientes<select value={datos.ordenPendientes || 'Prioridad'} onChange={(e) => cambiar('ordenPendientes', e.target.value)} className={campo}>{ordenes.map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        </div>
        <p className="text-xs text-slate-500">En modo asistido las propuestas requieren tu aprobación. En automático pueden enviarse según la configuración y las validaciones del backend.</p>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end"><button type="submit" disabled={guardando || JSON.stringify(datos) === original} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">{guardando ? <LoaderCircle size={16} className="animate-spin"/> : <Save size={16}/>}Guardar cambios</button></div>
      </form>}
    </div>}
  </section>;
}
