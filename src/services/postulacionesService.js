import axios from 'axios';
import { obtenerUsuarioIdActual } from './usuariosService';

const api = axios.create({ baseURL: '/api/postulaciones' });
const autorizacion = () => {
  const usuarioId = obtenerUsuarioIdActual();
  const token = localStorage.getItem('accessToken');
  if (!usuarioId || !token) throw new Error('Iniciá sesión para gestionar tus postulaciones.');
  return { headers: { Authorization: `Bearer ${token}` } };
};

function errorLegible(error) {
  if (!error.response) return error instanceof Error && !error.isAxiosError ? error : new Error('No pudimos conectarnos con el servidor. Intentá nuevamente.');
  if (error.response.status === 401) return new Error('Tu sesión venció. Volvé a iniciar sesión.');
  if (error.response.status === 403) return new Error('No tenés permiso para realizar esta operación.');
  const dato = error.response.data;
  return new Error(dato?.message || dato?.mensaje || dato?.detail || dato?.title ||
    (error.response.status === 409 ? 'La operación no está disponible o ya fue realizada.' : 'Error de la API (HTTP ' + error.response.status + '). Verifica que el servicio de Postulaciones este ejecutandose y revisa la consola del backend.'));
}
async function ejecutar(metodo, ruta, datos, config = {}) {
  try {
    const respuesta = await api.request({ method: metodo, url: ruta, data: datos, ...autorizacion(), ...config });
    return respuesta.data;
  } catch (error) { throw errorLegible(error); }
}

export const misPostulaciones = () => ejecutar('get', '/me');
export const retirarPostulacion = (id) => ejecutar('post', '/' + encodeURIComponent(id) + '/estado', { estado: 'Retirada' });
export const eliminarPostulacionHistorial = (id) => ejecutar('delete', '/' + encodeURIComponent(id));
export const postularManualmente = (empleoId, cvId, textoPresentacion) => ejecutar('post', '/', {
  usuarioId: obtenerUsuarioIdActual(), empleoId, cvId, textoPresentacion: textoPresentacion.trim() || null,
});
export const pendientes = () => ejecutar('get', '/pendientes/me');
export const agregarPendiente = (empleoId) => ejecutar('post', '/pendientes', { empleoId });
export const quitarPendiente = (empleoId) => ejecutar('delete', `/pendientes/${encodeURIComponent(empleoId)}`);
export const solicitarPostulacionIA = (empleoId) => ejecutar('post', '/preparaciones/solicitar-con-ia', { empleoId });
export const preparaciones = () => ejecutar('get', '/preparaciones/me');
export const obtenerPreparacion = (id) => ejecutar('get', `/preparaciones/${encodeURIComponent(id)}`);
export const compararCvIA = (id) => ejecutar('get', `/preparaciones/${encodeURIComponent(id)}/comparacion-cv-ia`);
export const aprobarCvIA = (id, versionEdicion) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/aprobar-cv-ia`, { versionEdicion });
export const proponerCambios = (id, propuesta) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/proponer-cambios`, propuesta);
export const aceptarCambios = (id, versionEdicion) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/aceptar-cambios`, { versionEdicion });
export const descartarCambios = (id, versionEdicion) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/descartar-cambios`, { versionEdicion });
export const modificarConIA = (id, versionEdicion, instrucciones) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/solicitar-cambios-ia`, { versionEdicion, instrucciones });
export const enviarPreparacion = (id, versionEdicion) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/enviar`, { versionEdicion });
export const cancelarPreparacion = (id) => ejecutar('post', `/preparaciones/${encodeURIComponent(id)}/cancelar`);
export const obtenerCvEnviado = (id) => ejecutar('get', `/${encodeURIComponent(id)}/cv-enviado`, undefined, { responseType: 'blob' });
export function avisar(mensaje, tipo = 'exito') {
  window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje, tipo } }));
}

let cacheOfertas = null;
let cacheHasta = 0;
export function limpiarCacheOfertas() { cacheOfertas = null; cacheHasta = 0; }
export function estadoOfertas() {
  if (!cacheOfertas || Date.now() > cacheHasta) {
    cacheHasta = Date.now() + 3000;
    cacheOfertas = Promise.allSettled([misPostulaciones(), pendientes()]).then(([r, p]) => ({
      realizadas: r.status === 'fulfilled' && Array.isArray(r.value) ? r.value.filter((p) => p.estado !== 'Retirada' && p.estado !== 5) : [],
      guardadas: p.status === 'fulfilled' && Array.isArray(p.value) ? p.value : [],
      completo: r.status === 'fulfilled' && p.status === 'fulfilled',
    }));
  }
  return cacheOfertas;
}
