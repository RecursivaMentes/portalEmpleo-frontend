import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, X } from 'lucide-react';
import { iniciarSesion } from '../services/usuariosService';
import FormDatosPersonales from './FormDatosPersonales';

export function FormularioAutenticacion({ inicial = 'login', onExito }) {
  const [modo, setModo] = useState(inicial);
  const [input, setInput] = useState({ email: '', password: '' });
  const [cargando, setCargando] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  async function enviar(evento) {
    evento.preventDefault();
    if (cargando) return;
    if (!input.email.trim() || !input.password) { setError('Completá el correo y la contraseña.'); return; }
    setError(''); setCargando(true);
    try {
      await iniciarSesion({ email: input.email.trim(), password: input.password });
      onExito?.();
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  if (modo === 'registro') return <FormDatosPersonales onRegistrado={() => { setModo('login'); setAviso('Cuenta creada correctamente. Iniciá sesión para continuar.'); }} onCancelar={() => setModo('login')} />;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">Iniciá sesión</h2>
      <p className="mt-1 text-sm text-slate-500">Ingresá a tu cuenta para continuar.</p>
      <form onSubmit={enviar} className="mt-6 space-y-5">
        <div><label htmlFor="auth-email" className="block mb-2 text-sm font-semibold text-slate-700">Correo electrónico</label><input id="auth-email" autoComplete="email" type="email" required value={input.email} onChange={(e) => setInput((v) => ({ ...v, email: e.target.value }))} disabled={cargando} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
        <div><label htmlFor="auth-password" className="block mb-2 text-sm font-semibold text-slate-700">Contraseña</label><div className="relative"><input id="auth-password" autoComplete="current-password" type={mostrarClave ? 'text' : 'password'} required value={input.password} onChange={(e) => setInput((v) => ({ ...v, password: e.target.value }))} disabled={cargando} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><button type="button" aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-3 text-slate-500 cursor-pointer" onClick={() => setMostrarClave(!mostrarClave)}>{mostrarClave ? <EyeOff size={20} /> : <Eye size={20}/>}</button></div></div>
        
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {aviso && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{aviso}</div>}
        <button type="submit" disabled={cargando} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{cargando && <LoaderCircle size={18} className="animate-spin" />}Iniciar sesión</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">¿Todavía no tenés cuenta? <button type="button" className="text-blue-700 font-semibold cursor-pointer" onClick={() => { setModo('registro'); setError(''); }}>Registrate</button></p>
    </div>
  );
}

export default function ModalAutenticacion({ abierto, onCerrar, motivo = '', onExito }) {
  const referencia = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement;
    const viejoOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const enfocar = setTimeout(() => referencia.current?.focus(), 0);
    function teclado(evento) {
      if (evento.key === 'Escape') onCerrar();
      if (evento.key === 'Tab' && referencia.current) {
        const botones = [...referencia.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')];
        if (!botones.length) return;
        const primero = botones[0], ultimo = botones[botones.length - 1];
        if (evento?.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
        else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
      }
    }
    document.addEventListener('keydown', teclado);
    return () => { clearTimeout(enfocar); document.removeEventListener('keydown', teclado); document.body.style.overflow = viejoOverflow; anterior?.focus?.(); };
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}><div ref={referencia} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Iniciar sesión o registrarse" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-7 md:p-8 outline-none"><button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 cursor-pointer"><X size={20}/></button>{motivo && <p className="mr-6 mb-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{motivo}</p>}<FormularioAutenticacion onExito={onExito} /></div></div>;
}
