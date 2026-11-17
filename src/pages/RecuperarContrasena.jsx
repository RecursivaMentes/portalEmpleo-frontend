import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoaderCircle, Mail, LockKeyhole } from 'lucide-react';
import { solicitarRecuperacion, restablecerContrasena } from '../services/usuariosService';

const campo = 'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
export default function RecuperarContrasena() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const emailEnlace = params.get('email') || '';
  const [email, setEmail] = useState(emailEnlace);
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  async function enviar(e) {
    e.preventDefault(); if (ocupado) return;
    if (token && (clave.length < 12 || clave !== confirmacion)) { setError(clave.length < 12 ? 'La contraseña debe tener al menos 12 caracteres.' : 'Las contraseñas no coinciden.'); return; }
    setOcupado(true); setError(''); setExito('');
    try {
      if (token) {
        await restablecerContrasena({ email: email.trim(), token, nuevaContrasena: clave, confirmarContrasena: confirmacion });
        setClave(''); setConfirmacion(''); setExito('Tu contraseña se actualizó. Ya podés iniciar sesión.');
      } else {
        await solicitarRecuperacion(email.trim());
        setExito('Si el correo está registrado, vas a recibir un enlace para recuperar tu cuenta. Revisá también el correo no deseado.');
      }
    } catch (err) { setError(err.message); } finally { setOcupado(false); }
  }
  return <main className="min-h-screen bg-slate-50 pb-16"><section className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 pb-28 pt-14 text-white"><div className="mx-auto max-w-xl"><h1 className="text-3xl font-extrabold">{token ? 'Crear nueva contraseña' : 'Recuperar contraseña'}</h1><p className="mt-2 text-blue-100">{token ? 'Ingresá una nueva contraseña para tu cuenta.' : 'Te enviaremos un enlace temporal a tu correo.'}</p></div></section>
    <div className="relative mx-auto -mt-16 max-w-xl px-5"><form onSubmit={enviar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-lg"><div className="flex items-center gap-2 text-sm font-semibold text-blue-700">{token ? <LockKeyhole size={18}/> : <Mail size={18}/>} Seguridad de cuenta</div>
      <label className="block text-sm font-semibold text-slate-700">Correo electrónico<input autoComplete="email" type="email" className={campo} value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} required disabled={ocupado}/></label>
      {token && <><label className="block text-sm font-semibold text-slate-700">Contraseña nueva<input autoComplete="new-password" type="password" className={campo} minLength={12} maxLength={128} value={clave} onChange={(e) => setClave(e.target.value)} required disabled={ocupado}/></label><label className="block text-sm font-semibold text-slate-700">Confirmar contraseña<input autoComplete="new-password" type="password" className={campo} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required disabled={ocupado}/></label></>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {exito && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{exito}</p>}
      <button disabled={ocupado || !!exito} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{ocupado && <LoaderCircle size={18} className="animate-spin"/>}{token ? 'Actualizar contraseña' : 'Enviar enlace'}</button>
      <Link to="/iniciarSesion" className="block text-center text-sm font-semibold text-blue-700 hover:underline">Volver a iniciar sesión</Link>
    </form></div>
  </main>;
}
