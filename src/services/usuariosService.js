import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;

let usuarioIdEnMemoria = null;

export const obtenerUsuarioIdActual = () => usuarioIdEnMemoria;

// Todas las peticiones con `api` incluirán las cookies automáticamente
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function interpretarError(error, mensaje) {
  if (!error.response) {
    return new Error('No se pudo conectar con el servidor. Revisá la conexión e intentá nuevamente.');
  }
  const data = error.response.data;
  const detalle = data?.errors;
  const campos = detalle && typeof detalle === 'object'
    ? Object.fromEntries(
        Object.entries(detalle).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(' ') : String(v)])
      )
    : {};
  const resultado = new Error(data?.message || data?.mensaje || data?.title || mensaje);
  resultado.campos = campos;
  resultado.status = error.response.status;
  return resultado;
}

export const iniciarSesion = async (usuario) => {
  try {
    const { data } = await api.post('/api/auth/login', usuario);
    //ID en memoria antes de disparar 'auth-changed'
    await obtenerDatosPersonales();
    window.dispatchEvent(new Event('auth-changed'));
    window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Iniciaste sesión correctamente.' } }));
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudo iniciar sesión.');
  }
};

export const cerrarSesion = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Si la cookie ya había expirado en el backend, igual limpiamos el estado en el front
  } finally {
    usuarioIdEnMemoria = null; // limpia el ID de memoria
    window.dispatchEvent(new Event('auth-changed'));
    window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Cerraste sesión correctamente.' } }));
  }
};

// Alias por si algún componente nuevo de main importa este nombre
export const cerrarSesionUsuario = cerrarSesion;

export const registrarse = async (datos) => {
  try {
    const { data } = await api.post('/api/auth/register', datos);
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudo completar el registro.');
  }
};

export const obtenerDatosPersonales = async () => {
  try {
    const { data } = await api.get('/api/auth/profile');
    usuarioIdEnMemoria = data?.id ?? null;
    return data;
  } catch (error) {
    usuarioIdEnMemoria = null;
    if (error.response?.status === 401) {
      throw new Error('La sesión venció. Volvé a iniciar sesión.');
    }
    throw interpretarError(error, 'No se pudieron obtener tus datos personales.');
  }
};

export const actualizarDatosPersonales = async (datos) => {
  try {
    const { data } = await api.put('/api/auth/profile', datos);
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('La sesión venció. Volvé a iniciar sesión.');
    }
    throw interpretarError(error, 'No se pudieron guardar los cambios.');
  }
};

export async function cambiarContrasena(datos) {
  try {
    const { data } = await api.put('/api/auth/change-password', datos);
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('La sesión venció. Volvé a iniciar sesión.');
    }
    if (error.response) throw interpretarError(error, 'No se pudo cambiar la contraseña.');
    throw new Error(error.message || 'No se pudo conectar con el servidor.');
  }
}

export async function solicitarRecuperacion(email) {
  try {
    const { data } = await api.post('/api/auth/forgot-password', { email });
    return data;
  } catch (error) {
    if (error.response) throw interpretarError(error, 'No se pudo solicitar la recuperación.');
    throw new Error('No se pudo conectar con el servidor.');
  }
}

export async function restablecerContrasena(datos) {
  try {
    const { data } = await api.post('/api/auth/reset-password', datos);
    return data;
  } catch (error) {
    if (error.response) throw interpretarError(error, 'No se pudo restablecer la contraseña.');
    throw new Error('No se pudo conectar con el servidor.');
  }
}
