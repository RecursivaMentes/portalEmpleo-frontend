import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;
const api = axios.create({ baseURL: API_URL });

function interpretarError(error, mensaje) {
  if (!error.response) return new Error('No se pudo conectar con el servidor. Revisá la conexión e intentá nuevamente.');
  const data = error.response.data;
  const detalle = data?.errors;
  const campos = detalle && typeof detalle === 'object'
    ? Object.fromEntries(Object.entries(detalle).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(' ') : String(v)]))
    : {};
  const resultado = new Error(data?.message || data?.mensaje || data?.title || mensaje);
  resultado.campos = campos;
  resultado.status = error.response.status;
  return resultado;
}

export const obtenerUsuarioIdActual = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length !== 3 || partes.some((parte) => !parte)) return null;
    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64));
    const patronGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof payload?.sub !== 'string' || !patronGuid.test(payload.sub)) return null;
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
};

export const iniciarSesion = async (usuario) => {
  try {
    const { data } = await api.post('/api/auth/login', usuario);
    if (!data?.accessToken) throw new Error('El servidor no devolvió una sesión válida.');
    localStorage.setItem('accessToken', data.accessToken);
    window.dispatchEvent(new Event('auth-changed'));
    window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Iniciaste sesión correctamente.' } }));
    return data;
  } catch (error) {
    if (error.response) throw interpretarError(error, 'No se pudo iniciar sesión.');
    if (error.message === 'El servidor no devolvió una sesión válida.') throw error;
    throw interpretarError(error, 'No se pudo iniciar sesión.');
  }
};

export const cerrarSesionUsuario = () => {
  localStorage.removeItem('accessToken');
  window.dispatchEvent(new Event('auth-changed'));
  window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Cerraste sesión correctamente.' } }));
};

export const registrarse = async (datos) => {
  try {
    const { data } = await api.post('/api/auth/register', datos);
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudo completar el registro.');
  }
};

const configAutorizada = () => {
  const token = localStorage.getItem('accessToken');
  if (!obtenerUsuarioIdActual() || !token) throw new Error('La sesión venció. Volvé a iniciar sesión.');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const obtenerDatosPersonales = async () => {
  try {
    const { data } = await api.get('/api/auth/profile', configAutorizada());
    return data;
  } catch (error) {
    if (!error.response && error.message === 'La sesión venció. Volvé a iniciar sesión.') throw error;
    throw interpretarError(error, 'No se pudieron obtener tus datos personales.');
  }
};

export const actualizarDatosPersonales = async (datos) => {
  try {
    const { data } = await api.put('/api/auth/profile', datos, configAutorizada());
    return data;
  } catch (error) {
    if (!error.response && error.message === 'La sesión venció. Volvé a iniciar sesión.') throw error;
    throw interpretarError(error, 'No se pudieron guardar los cambios.');
  }
};
