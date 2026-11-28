import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmacionAccion({ abierto, titulo = 'Confirmar acción', mensaje, confirmar = 'Confirmar', peligro = false, ocupado = false, onConfirmar, onCancelar }) {
  const boton = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!abierto) return;
    boton.current?.focus();
    const escape = (e) => { if (e.key === 'Escape' && !ocupado) onCancelar(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [abierto, ocupado, onCancelar]);
  if (!abierto) return null;
  return createPortal(<div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !ocupado) onCancelar(); }}>
    <div role="alertdialog" aria-modal="true" aria-labelledby={`${id}-titulo`} aria-describedby={`${id}-texto`} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start gap-3"><AlertTriangle size={22} className={peligro ? 'shrink-0 text-red-600' : 'shrink-0 text-amber-600'}/><div className="flex-1"><h2 id={`${id}-titulo`} className="text-lg font-bold text-slate-900">{titulo}</h2><p id={`${id}-texto`} className="mt-2 text-sm leading-relaxed text-slate-600">{mensaje}</p></div><button type="button" aria-label="Cerrar" onClick={onCancelar} disabled={ocupado} className="cursor-pointer text-slate-400"><X size={20}/></button></div>
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button ref={boton} type="button" disabled={ocupado} onClick={onCancelar} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 cursor-pointer">Volver</button><button type="button" disabled={ocupado} onClick={onConfirmar} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer ${peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}>{ocupado ? 'Procesando...' : confirmar}</button></div>
    </div>
  </div>, document.body);
}
