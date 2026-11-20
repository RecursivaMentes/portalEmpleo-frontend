import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_USUARIOS_API_URL });

function token() {
  const actual = localStorage.getItem('accessToken');
  if (!actual) throw new Error('Necesitás iniciar sesión para acceder a tu perfil laboral.');
  return { headers: { Authorization: `Bearer ${actual}` } };
}
function errorLegible(error, predeterminado) {
  if (!error.response) return new Error('No pudimos conectarnos con el servidor. Revisá la conexión y volvé a intentar.');
  const { status, data } = error.response;
  if (status === 401) return new Error('Tu sesión venció. Iniciá sesión nuevamente.');
  if (status === 403) return new Error('No tenés permiso para realizar esta operación.');
  return new Error(data?.message || data?.mensaje || data?.title || predeterminado);
}
export async function obtenerPerfilLaboral() {
  try {
    const respuesta = await api.get('/api/perfil-laboral/me', token());
    return respuesta.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw errorLegible(error, 'No pudimos consultar tu perfil laboral.');
  }
}
export async function guardarPerfilLaboral(perfil) {
  try {
    const respuesta = await api.put('/api/perfil-laboral/me', perfil, token());
    return respuesta.data;
  } catch (error) {
    throw errorLegible(error, 'No pudimos guardar tu perfil laboral.');
  }
}
