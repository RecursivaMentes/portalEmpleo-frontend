import { useEffect, useState } from 'react';
import axios from 'axios';
import { LoaderCircle, Save } from 'lucide-react';

const url = '/api/postulaciones/configuracion/me';
const opciones = [['Desactivada', 'Desactivada'], ['Asistida', 'Asistida (requiere aprobación)'], ['Automatica', 'Automática']];
const ordenes = [['Prioridad', 'Prioridad'], ['Compatibilidad', 'Compatibilidad'], ['FechaCierre', 'Fecha de cierre'], ['Antiguos', 'Más antiguas'], ['Recientes', 'Más recientes']];
const campo = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const errorLegible = (e) => e.response?.data?.message || e.response?.data?.mensaje || 'No se pudo completar la operación. Comprobá que las APIs estén disponibles.';

export default function ConfiguracionPostulaciones() {
  const [datos, setDatos] = useState(null);
  const [original, setOriginal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem('accessToken');
    axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (activo) { setDatos(data); setOriginal(JSON.stringify(data)); } })
      .catch((e) => { if (activo) setError(errorLegible(e)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);
  function editar(nombre, valor) { setDatos((v) => ({ ...v, [nombre]: valor })); setError(''); setExito(''); }
  async function guardar(e) {
    e.preventDefault(); if (guardando || !datos) return;
    if (datos.compatibilidadMinima < 1 || datos.compatibilidadMinima > 100) { setError('La compatibilidad debe estar entre 1 y 100 %.'); return; }
    if (datos.limiteDiario < 1 || datos.limiteDiario > 10) { setError('El límite diario debe estar entre 1 y 10.'); return; }
    setGuardando(true); setError(''); setExito('');
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.put(url, datos, { headers: { Authorization: `Bearer ${token}` } });
      setDatos(data); setOriginal(JSON.stringify(data)); setExito('Configuración guardada correctamente.');
      window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Configuración guardada correctamente.' } }));
    } catch (e) { setError(errorLegible(e)); }
    finally { setGuardando(false); }
  }
  return <main className="min-h-screen bg-slate-50 pb-20">
    <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-5 py-10 text-white"><div className="mx-auto max-w-4xl"><p className="text-sm font-medium text-blue-100">Mi cuenta</p><h1 className="mt-2 text-3xl font-extrabold">Configuración de postulaciones</h1><p className="mt-2 text-blue-100">Definí cómo puede actuar el agente de postulaciones.</p></div></section>
    <div className="mx-auto max-w-4xl px-5 pt-8">{cargando ? <div role="status" className="flex gap-2"><LoaderCircle className="animate-spin"/>Cargando configuración...</div> : !datos ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error || 'No se pudo cargar la configuración.'}</div> :
      <form onSubmit={guardar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-800">Modo del agente<select className={campo} value={datos.modo || 'Desactivada'} onChange={(e) => editar('modo', e.target.value)}>{opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{datos.modo === 'Automatica' ? 'El agente podrá enviar postulaciones automáticamente según los límites configurados.' : datos.modo === 'Asistida' ? 'El agente prepara propuestas que requieren tu aprobación.' : 'El procesamiento autónomo está desactivado. Podés seguir postulándote manualmente.'}</p>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-800">Compatibilidad mínima (%)<input type="number" min="1" max="100" value={datos.compatibilidadMinima} onChange={(e) => editar('compatibilidadMinima', Number(e.target.value))} className={campo}/></label>
        <label className="block text-sm font-semibold text-slate-800">Límite diario (1 a 10)<input type="number" min="1" max="10" value={datos.limiteDiario} onChange={(e) => editar('limiteDiario', Number(e.target.value))} className={campo}/></label></div>
        <label className="block text-sm font-semibold text-slate-800">Orden de pendientes<select className={campo} value={datos.ordenPendientes || 'Prioridad'} onChange={(e) => editar('ordenPendientes', e.target.value)}>{ordenes.map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <p className="text-xs text-slate-500">Las preferencias laborales y la zona horaria existentes se conservarán al guardar.</p>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {exito && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{exito}</p>}
        <div className="flex justify-end"><button type="submit" disabled={guardando || JSON.stringify(datos) === original} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{guardando ? <LoaderCircle size={17} className="animate-spin"/> : <Save size={17}/>}Guardar configuración</button></div>
      </form>}</div>
  </main>;
}
