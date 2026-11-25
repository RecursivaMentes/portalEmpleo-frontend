import { api, interpretarError } from './usuariosService';

// traer lista de notificaciones 
export const obtenerNotificaciones = async (soloNoLeidas = false) => {
  try {
    const { data } = await api.get('/api/notificaciones', {
      params: { soloNoLeidas }, // soloNoLeidas=true o false
    });
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudieron obtener las notificaciones.');
  }
};

// cant de no leidas
export const contarNotificacionesNoLeidas = async () => {
  try {
    const { data } = await api.get('/api/notificaciones/no-leidas/count');
    return data.cantidad; //directamente el número
  } catch (error) {
    throw interpretarError(error, 'No se pudo obtener el contador de notificaciones.');
  }
};

//marcar como leida
export const marcarNotificacionComoLeida = async (id) => {
  try {
    const { data } = await api.patch(`/api/notificaciones/${id}/leer`);
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudo marcar la notificación como leída.');
  }
};

//marcar todas como leídas
export const marcarTodasComoLeidas = async () => {
  try {
    const { data } = await api.patch('/api/notificaciones/leer-todas');
    return data;
  } catch (error) {
    throw interpretarError(error, 'No se pudieron marcar todas como leídas.');
  }
};
