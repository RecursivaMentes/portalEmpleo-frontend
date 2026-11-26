import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { cambiarContrasena, cerrarSesionUsuario } from '../services/usuariosService';

const campo = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function CambiarContrasena() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ actual: '', nueva: '', confirmar: '' });
  const [mostrar, setMostrar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const actualizar = (campoNombre, valor) => { setDatos((v) => ({ ...v, [campoNombre]: valor })); setError(''); };
  async function enviar(e) {
    e.preventDefault();
    if (ocupado) return;
    if (!datos.actual || !datos.nueva || !datos.confirmar) { setError('Completá los tres campos.'); return; }
    if ((datos.nueva.length < 8 || datos.nueva.length > 128)) { setError('La contraseña nueva debe tener entre 8 y 128 caracteres.'); return; }
    if (datos.nueva !== datos.confirmar) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (datos.actual === datos.nueva) { setError('La nueva contraseña debe ser diferente de la actual.'); return; }
    setOcupado(true);
    try {
      await cambiarContrasena({ currentPassword: datos.actual, newPassword: datos.nueva, confirmPassword: datos.confirmar });
      await cerrarSesionUsuario();
      navigate('/iniciarSesion', { replace: true, state: { contrasenaActualizada: true } });
    } catch (err) { setError(err.message); } finally { setOcupado(false); }
  }
  return <main className="min-h-screen bg-slate-50 pb-20"><section className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-10 text-white"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-extrabold">Cambiar contraseña</h1><p className="mt-2 text-blue-100">Protegé el acceso a tu cuenta.</p></div></section>
    <div className="mx-auto max-w-2xl px-5 pt-8"><form onSubmit={enviar} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900"><LockKeyhole size={20} className="text-blue-600"/> Seguridad de cuenta</div>
      <label className="block text-sm font-semibold text-slate-700">Contraseña actual<input type={mostrar ? 'text' : 'password'} autoComplete="current-password" value={datos.actual} onChange={(e) => actualizar('actual', e.target.value)} className={campo} disabled={ocupado} required/></label>
      <label className="block text-sm font-semibold text-slate-700">Contraseña nueva<input type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={datos.nueva} onChange={(e) => actualizar('nueva', e.target.value)} className={campo} disabled={ocupado} minLength={8} maxLength={128} required/><span className="mt-1 block text-xs font-normal text-slate-500">Entre 8 y 128 caracteres; evitá reutilizar contraseñas.</span></label>
      <label className="block text-sm font-semibold text-slate-700">Confirmar contraseña nueva<input type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={datos.confirmar} onChange={(e) => actualizar('confirmar', e.target.value)} className={campo} disabled={ocupado} required/></label>
      <button type="button" onClick={() => setMostrar((v) => !v)} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-700">{mostrar ? <EyeOff size={17}/> : <Eye size={17}/>} {mostrar ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}</button>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/perfil/datos" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Volver a Mi cuenta</Link><button disabled={ocupado} className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{ocupado && <LoaderCircle size={17} className="animate-spin"/>}Guardar contraseña</button></div>
    </form></div>
  </main>;
}
