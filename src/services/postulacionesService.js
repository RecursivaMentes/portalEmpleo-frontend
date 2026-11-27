import axios from 'axios';
import { obtenerUsuarioIdActual } from './usuariosService';

const api = axios.create({
  baseURL: '/api/postulaciones',
  withCredentials: true,
});

const verificarSesion = () => {
  const usuarioId = obtenerUsuarioIdActual();
  if (!usuarioId) throw new Error('Iniciá sesión para gestionar tus postulaciones.');
};

function errorLegible(error) {
  if (!error.response) return error instanceof Error && !error.isAxiosError ? error : new Error('No pudimos conectarnos con el servidor. Intentá nuevamente.');
  if (error.response.status === 401) return new Error('Tu sesión venció. Volvé a iniciar sesión.');
  if (error.response.status === 403) return new Error('No tenés permiso para realizar esta operación.');
  const dato = error.response.data;
  if (error.response.status === 503) return new Error(dato?.message || dato?.mensaje || dato?.detail || 'El servicio de postulaciones con IA no está disponible en este momento. Volvé a intentarlo.');
  return new Error(dato?.message || dato?.mensaje || dato?.detail || dato?.title ||
    (error.response.status === 409 ? 'La operación no está disponible o ya fue realizada.' : 'Error de la API (HTTP ' + error.response.status + '). Verifica que el servicio de Postulaciones este ejecutandose y revisa la consola del backend.'));
}

async function ejecutar(metodo, ruta, datos, config = {}) {
  try {
    verificarSesion();
    const respuesta = await api.request({ method: metodo, url: ruta, data: datos, ...config });
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
export const agregarPendiente = (empleoId) => actualizarOferta('post', '/pendientes', { empleoId }, 'guardar');
export const quitarPendiente = (empleoId) => actualizarOferta('delete', `/pendientes/${encodeURIComponent(empleoId)}`, undefined, 'quitar');
export const ofertasDescartadas = () => ejecutar('get', '/descartadas/me');
export const descartarOferta = (empleoId) => actualizarOferta('put', `/descartadas/${encodeURIComponent(empleoId)}`, undefined, 'descartar');
export const restaurarOferta = (empleoId) => actualizarOferta('delete', `/descartadas/${encodeURIComponent(empleoId)}`, undefined, 'restaurar');

async function actualizarOferta(metodo, ruta, datos, accion) {
  const resultado = await ejecutar(metodo, ruta, datos);
  limpiarCacheOfertas();
  window.dispatchEvent(new CustomEvent('recursiva:ofertas-actualizadas', { detail: { accion } }));
  return resultado;
}
export const solicitarPostulacionIA = (empleoId) => ejecutar('post', '/preparaciones/solicitar-con-ia', { empleoId });
export const preparaciones = () => ejecutar('get', '/preparaciones/me');
export const preparacionActiva = () => ejecutar('get', '/preparaciones/activa/me');
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
let cacheUsuario = null;
export function limpiarCacheOfertas() { cacheOfertas = null; cacheHasta = 0; cacheUsuario = null; }
export function estadoOfertas() {
  const usuarioId = obtenerUsuarioIdActual();
  if (!cacheOfertas || usuarioId !== cacheUsuario || Date.now() > cacheHasta) {
    cacheUsuario = usuarioId;
    cacheHasta = Date.now() + 3000;
    cacheOfertas = Promise.allSettled([misPostulaciones(), pendientes(), ofertasDescartadas()]).then(([r, p, d]) => ({
      realizadas: r.status === 'fulfilled' && Array.isArray(r.value) ? r.value.filter((p) => p.estado !== 'Retirada' && p.estado !== 5) : [],
      guardadas: p.status === 'fulfilled' && Array.isArray(p.value) ? p.value : [],
      descartadas: d.status === 'fulfilled' && Array.isArray(d.value) ? d.value : [],
      descartesVerificados: d.status === 'fulfilled' && Array.isArray(d.value),
      completo: r.status === 'fulfilled' && p.status === 'fulfilled',
    }));
  }
  return cacheOfertas;
}
