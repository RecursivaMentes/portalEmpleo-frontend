import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function AvisosGlobales() {
  const [avisos, setAvisos] = useState([]);
  const proximo = useRef(0);
  const timers = useRef(new Map());
  useEffect(() => {
    const activos = timers.current;
    function mostrar(evento) {
      const mensaje = evento.detail?.mensaje;
      if (typeof mensaje !== 'string' || !mensaje.trim()) return;
      const tipo = evento.detail?.tipo === 'error' ? 'error' : 'exito';
      const id = ++proximo.current;
      setAvisos((a) => [...a.slice(-2), { id, mensaje, tipo }]);
      const timer = window.setTimeout(() => { setAvisos((a) => a.filter((v) => v.id !== id)); activos.delete(id); }, tipo === 'error' ? 8500 : 4500);
      activos.set(id, timer);
    }
    window.addEventListener('recursiva:aviso', mostrar);
    return () => { window.removeEventListener('recursiva:aviso', mostrar); for (const timer of activos.values()) clearTimeout(timer); activos.clear(); };
  }, []);
  function cerrar(id) { setAvisos((a) => a.filter((v) => v.id !== id)); if (timers.current.has(id)) { clearTimeout(timers.current.get(id)); timers.current.delete(id); } }
  if (!avisos.length) return null;
  return <div aria-label="Avisos" className="pointer-events-none fixed right-3 top-20 z-[200] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-5">
    {avisos.map((aviso) => <div key={aviso.id} role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 text-sm text-slate-800 shadow-lg ${aviso.tipo === 'error' ? 'border-red-300' : 'border-emerald-200'}`}>
      {aviso.tipo === 'error' ? <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600"/> : <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600"/>}
      <p className="flex-1 font-medium">{aviso.mensaje}</p><button type="button" aria-label="Cerrar aviso" className="cursor-pointer text-slate-500 hover:text-slate-800" onClick={() => cerrar(aviso.id)}><X size={18}/></button>
    </div>)}
  </div>;
}
