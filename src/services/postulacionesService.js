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
export const retirarPostulacion = (id) => actualizarOferta('post', '/' + encodeURIComponent(id) + '/estado', { estado: 'Retirada' }, 'retirar');
export const eliminarPostulacionHistorial = (id) => actualizarOferta('delete', '/' + encodeURIComponent(id), undefined, 'eliminar');
export const validarDisponibilidadManual = (empleoId) => ejecutar('get', `/ofertas/${encodeURIComponent(empleoId)}/disponibilidad-manual`);
export const postularManualmente = (empleoId, cvId, textoPresentacion) => actualizarOferta('post', '/', {
  usuarioId: obtenerUsuarioIdActual(), empleoId, cvId, textoPresentacion: textoPresentacion.trim() || null,
}, 'enviar');
export const pendientes = () => ejecutar('get', '/pendientes/me');
export const agregarPendiente = (empleoId) => actualizarOferta('post', '/pendientes', { empleoId }, 'guardar');
export const quitarPendiente = (empleoId) => actualizarOferta('delete', `/pendientes/${encodeURIComponent(empleoId)}`, undefined, 'quitar');
export const ofertasDescartadas = () => ejecutar('get', '/descartadas/me');
export const descartarOferta = (empleoId) => actualizarOferta('put', `/descartadas/${encodeURIComponent(empleoId)}`, undefined, 'descartar');
export const restaurarOferta = (empleoId) => actualizarOferta('delete', `/descartadas/${encodeURIComponent(empleoId)}`, undefined, 'restaurar');

export function notificarCambioOfertas(accion = 'actualizar') {
  limpiarCacheOfertas();
  window.dispatchEvent(new CustomEvent('recursiva:ofertas-actualizadas', { detail: { accion } }));
}

export function verSeguimientoIA(preparacionId = null) {
  window.dispatchEvent(new CustomEvent('recursiva:ver-seguimiento-ia', { detail: { preparacionId } }));
}

async function actualizarOferta(metodo, ruta, datos, accion) {
  try {
    return await ejecutar(metodo, ruta, datos);
  } finally {
    // Incluso un conflicto puede indicar que otro proceso cambió la oferta.
    notificarCambioOfertas(accion);
  }
}
export const solicitarPostulacionIA = (empleoId) => actualizarOferta('post', '/preparaciones/solicitar-con-ia', { empleoId }, 'solicitar-ia');
export const preparaciones = () => ejecutar('get', '/preparaciones/me');
export const preparacionActiva = () => ejecutar('get', '/preparaciones/activa/me');
export const obtenerPreparacion = (id) => ejecutar('get', `/preparaciones/${encodeURIComponent(id)}`);
export const compararCvIA = (id) => ejecutar('get', `/preparaciones/${encodeURIComponent(id)}/comparacion-cv-ia`);
export const aprobarCvIA = (id, versionEdicion) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/aprobar-cv-ia`, { versionEdicion }, 'aprobar-cv');
export const proponerCambios = (id, propuesta) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/proponer-cambios`, propuesta, 'proponer');
export const aceptarCambios = (id, versionEdicion) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/aceptar-cambios`, { versionEdicion }, 'aceptar');
export const descartarCambios = (id, versionEdicion) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/descartar-cambios`, { versionEdicion }, 'descartar-cambios');
export const modificarConIA = (id, versionEdicion, instrucciones) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/solicitar-cambios-ia`, { versionEdicion, instrucciones }, 'modificar-ia');
export const enviarPreparacion = (id, versionEdicion) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/enviar`, { versionEdicion }, 'enviar');
export const cancelarPreparacion = (id) => actualizarOferta('post', `/preparaciones/${encodeURIComponent(id)}/cancelar`, undefined, 'cancelar-ia');
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
    cacheOfertas = Promise.allSettled([misPostulaciones(), pendientes(), ofertasDescartadas(), preparaciones()]).then(([r, p, d, t]) => ({
      realizadas: r.status === 'fulfilled' && Array.isArray(r.value) ? r.value.filter((p) => p.estado !== 'Retirada' && p.estado !== 5) : [],
      guardadas: p.status === 'fulfilled' && Array.isArray(p.value) ? p.value : [],
      descartadas: d.status === 'fulfilled' && Array.isArray(d.value) ? d.value : [],
      descartesVerificados: d.status === 'fulfilled' && Array.isArray(d.value),
      trabajos: t.status === 'fulfilled' && Array.isArray(t.value) ? t.value.filter((x) => !['Enviada', 'Cancelada', 'Fallida'].includes(x.estado)) : [],
      trabajosVerificados: t.status === 'fulfilled' && Array.isArray(t.value),
      realizadasVerificadas: r.status === 'fulfilled' && Array.isArray(r.value),
      guardadasVerificadas: p.status === 'fulfilled' && Array.isArray(p.value),
      completo: r.status === 'fulfilled' && p.status === 'fulfilled' && t.status === 'fulfilled',
    }));
  }
  return cacheOfertas;
}
