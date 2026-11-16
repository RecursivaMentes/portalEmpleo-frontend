import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function AvisosGlobales() {
  const [avisos, setAvisos] = useState([]);
  const siguienteId = useRef(0);
  const temporizadores = useRef(new Map());

  useEffect(() => {
    const activos = temporizadores.current;
    function mostrar(evento) {
      const mensaje = evento.detail?.mensaje;
      if (typeof mensaje !== 'string' || !mensaje.trim()) return;
      const id = ++siguienteId.current;
      setAvisos((prev) => [...prev.slice(-2), { id, mensaje }]);
      const timer = window.setTimeout(() => {
        setAvisos((prev) => prev.filter((aviso) => aviso.id !== id));
        activos.delete(id);
      }, 4500);
      activos.set(id, timer);
    }
    window.addEventListener('recursiva:aviso', mostrar);
    return () => {
      window.removeEventListener('recursiva:aviso', mostrar);
      for (const timer of activos.values()) window.clearTimeout(timer);
      activos.clear();
    };
  }, []);

  function cerrar(id) {
    setAvisos((prev) => prev.filter((aviso) => aviso.id !== id));
    if (temporizadores.current.has(id)) {
      window.clearTimeout(temporizadores.current.get(id));
      temporizadores.current.delete(id);
    }
  }

  if (!avisos.length) return null;
  return (
    <div aria-label="Confirmaciones" className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-2 p-4 pointer-events-none">
      {avisos.map((aviso) => (
        <div key={aviso.id} role="status" className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-slate-800 shadow-lg">
          <CheckCircle2 aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="flex-1 font-medium">{aviso.mensaje}</p>
          <button type="button" aria-label="Cerrar mensaje" onClick={() => cerrar(aviso.id)} className="text-slate-500 hover:text-slate-800 cursor-pointer"><X size={18}/></button>
        </div>
      ))}
    </div>
  );
}