import { useEffect, useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { actualizarDatosPersonales, obtenerDatosPersonales, registrarse } from '../services/usuariosService';

const inicial = { nombre: '', apellido: '', email: '', telefono: '', password: '', confirmacion: '' };
const etiqueta = 'block text-sm font-semibold text-slate-700 mb-2';
const entrada = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const patronNombre = /^[\p{L}][\p{L}\p{M}]*(?:[ '’-][\p{L}][\p{L}\p{M}]*)*$/u;
const patronTelefono = /^\+?(?:[0-9]+|\([0-9]+\))(?:[ -]?(?:[0-9]+|\([0-9]+\)))*$/;

function validar(datos, editar) {
  const errores = {};
  for (const campo of ['nombre', 'apellido']) {
    const valor = datos[campo].trim();
    if (!valor) errores[campo] = 'Este campo es obligatorio.';
    else if (valor.length > 100 || !patronNombre.test(valor)) errores[campo] = 'Ingresá hasta 100 caracteres: letras, espacios, guiones o apóstrofes.';
  }
  if (editar) {
    const telefono = datos.telefono.trim();
    const digitos = telefono.replace(/\D/g, '').length;
    if (telefono && (telefono.length > 30 || digitos < 8 || digitos > 15 || !patronTelefono.test(telefono))) errores.telefono = 'Ingresá un teléfono válido de 8 a 15 dígitos.';
  } else {
    if (!datos.email.trim() || datos.email.length > 256 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Ingresá un correo electrónico válido.';
    if (datos.password.length < 8 || datos.password.length > 128) errores.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
    if (datos.password !== datos.confirmacion) errores.confirmacion = 'Las contraseñas no coinciden.';
  }
  return errores;
}

export default function FormDatosPersonales({ actualizar = false, onRegistrado, onCancelar }) {
  const [datos, setDatos] = useState(inicial);
  const [original, setOriginal] = useState(null);
  const [cargando, setCargando] = useState(actualizar);
  const [recarga, setRecarga] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [errores, setErrores] = useState({});
  const [mostrarClave, setMostrarClave] = useState(false);

  useEffect(() => {
    if (!actualizar) return;
    let activo = true;
    obtenerDatosPersonales().then((perfil) => {
      if (!activo) return;
      const valores = { ...inicial, nombre: perfil.nombre ?? '', apellido: perfil.apellido ?? '', email: perfil.email ?? '', telefono: perfil.telefono ?? '' };
      setDatos(valores);
      setOriginal(valores);
    }).catch((err) => { if (activo) setError(err.message); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [actualizar, recarga]);

  const cambio = (e) => {
    const { name, value } = e.target;
    setDatos((anterior) => ({ ...anterior, [name]: value }));
    setErrores((anterior) => ({ ...anterior, [name]: undefined }));
    setExito('');
  };

  const modificado = original && ['nombre', 'apellido', 'telefono'].some((k) => datos[k] !== original[k]);
  useEffect(() => {
    if (!actualizar || !modificado) return;
    const avisar = (evento) => { evento.preventDefault(); evento.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [actualizar, modificado]);

  async function enviar(e) {
    e.preventDefault();
    const erroresCampos = validar(datos, actualizar);
    setErrores(erroresCampos);
    setError('');
    setExito('');
    if (Object.keys(erroresCampos).length) return;
    if (actualizar && !modificado) return;
    setGuardando(true);
    try {
      if (actualizar) {
        const cambios = {};
        for (const campo of ['nombre', 'apellido', 'telefono']) if (datos[campo] !== original[campo]) cambios[campo] = datos[campo].trim();
        await actualizarDatosPersonales(cambios);
        const siguiente = { ...datos, ...cambios };
        setDatos(siguiente);
        setOriginal(siguiente);
        setExito('Datos personales actualizados correctamente.');
      } else {
        await registrarse({ nombre: datos.nombre.trim(), apellido: datos.apellido.trim(), email: datos.email.trim(), password: datos.password });
        if (onRegistrado) onRegistrado();
        else setExito('Cuenta creada correctamente. Ya podés iniciar sesión.');
      }
    } catch (err) {
      setError(err.message);
      setErrores((prev) => ({ ...prev, ...err.campos }));
    } finally { setGuardando(false); }
  }

  const campos = actualizar
    ? [['nombre', 'Nombre'], ['apellido', 'Apellido'], ['email', 'Correo electrónico'], ['telefono', 'Teléfono']]
    : [['nombre', 'Nombre'], ['apellido', 'Apellido'], ['email', 'Correo electrónico'], ['password', 'Contraseña'], ['confirmacion', 'Confirmar contraseña']];

  return (
    <section className={actualizar ? 'min-h-screen bg-slate-50 px-5 py-10' : ''}>
      <div className={actualizar ? 'mx-auto max-w-xl bg-white rounded-2xl border border-slate-200 p-7 shadow-sm' : ''}>
        <h2 className="text-xl font-bold text-slate-900">{actualizar ? 'Datos personales' : 'Creá tu cuenta'}</h2>
        <p className="mt-1 text-sm text-slate-500">{actualizar ? 'Consultá y actualizá tus datos de contacto.' : 'Completá tus datos para registrarte.'}</p>
        {!cargando && actualizar && !original ? <div role="alert" className="mt-6"><p className="text-red-700 text-sm">{error || 'No se pudieron cargar los datos.'}</p><button className="mt-3 rounded-xl bg-blue-600 px-5 py-3 text-white cursor-pointer" type="button" onClick={() => { setError(''); setCargando(true); setRecarga((v) => v + 1); }}>Reintentar</button></div> : cargando ? <div role="status" aria-label="Cargando datos personales" className="mt-7 space-y-5 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i}><div className="h-4 w-28 bg-slate-200 rounded mb-2"/><div className="h-11 bg-slate-200 rounded-xl"/></div>)}</div> : (
          <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
            {campos.map(([campo, titulo]) => (
              <div key={campo}>
                <label htmlFor={`datos-${campo}`} className={etiqueta}>{titulo}</label>
                <div className="relative">
                  <input id={`datos-${campo}`} name={campo} value={datos[campo]} onChange={cambio} disabled={guardando || (actualizar && campo === 'email')} required={!actualizar || campo === 'nombre' || campo === 'apellido'} type={campo === 'email' ? 'email' : campo === 'password' || campo === 'confirmacion' ? (mostrarClave ? 'text' : 'password') : campo === 'telefono' ? 'tel' : 'text'} autoComplete={campo === 'email' ? 'email' : campo === 'nombre' ? 'given-name' : campo === 'apellido' ? 'family-name' : campo === 'telefono' ? 'tel' : 'new-password'} aria-invalid={!!errores[campo]} aria-describedby={errores[campo] ? `error-${campo}` : undefined} className={`${entrada} ${errores[campo] ? 'border-red-400' : ''} ${actualizar && campo === 'email' ? 'bg-slate-100' : ''}`} />
                  {(campo === 'password' || campo === 'confirmacion') && campo === 'password' && <button type="button" className="absolute right-3 top-3 text-slate-500 cursor-pointer" aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setMostrarClave((v) => !v)}>{mostrarClave ? <EyeOff size={20} /> : <Eye size={20} />}</button>}
                </div>
                {errores[campo] && <p id={`error-${campo}`} role="alert" className="text-sm text-red-700 mt-1">{errores[campo]}</p>}
                {actualizar && campo === 'email' && <p className="mt-1 text-xs text-slate-500">El correo no se puede modificar desde esta sección.</p>}
              </div>
            ))}
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {exito && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{exito}</div>}
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={guardando || (actualizar && !modificado)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{guardando && <LoaderCircle size={18} className="animate-spin" />}{actualizar ? 'Guardar cambios' : 'Registrarme'}</button>
              {actualizar && <button type="button" disabled={!modificado || guardando} onClick={() => { setDatos({ ...original }); setErrores({}); setError(''); }} className="rounded-xl bg-slate-100 px-5 py-3 text-slate-700 disabled:opacity-50 cursor-pointer">Descartar</button>}
              {onCancelar && <button type="button" disabled={guardando} onClick={onCancelar} className="px-4 py-3 text-sm text-slate-600 cursor-pointer">Volver a iniciar sesión</button>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
