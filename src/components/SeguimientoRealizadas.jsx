import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { obtenerEmpleos } from '../services/empleosService';
import { avisar, retirarPostulacion, eliminarPostulacionHistorial, limpiarCacheOfertas } from '../services/postulacionesService';
import ConfirmacionAccion from './ConfirmacionAccion';

let consultaOfertas = null;
function cargarOfertas() {
  if (!consultaOfertas) {
    consultaOfertas = obtenerEmpleos()
      .then((ofertas) => Array.isArray(ofertas) ? ofertas : [])
      .catch(() => {
        consultaOfertas = null;
        return [];
      });
  }
  return consultaOfertas;
}

export function TituloPostulacion({ empleoId }) {
  const [titulo, setTitulo] = useState('');
  useEffect(() => {
    let activo = true;
    cargarOfertas().then((ofertas) => {
      if (!activo) return;
      const oferta = ofertas.find((x) => x.id === empleoId);
      setTitulo(oferta?.titulo || 'Oferta no disponible en el catálogo');
    });
    return () => { activo = false; };
  }, [empleoId]);
  return titulo || 'Consultando título de la oferta...';
}

export function AccionesSeguimiento({ item, onActualizar }) {
  const [accion, setAccion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const puedeRetirar = ['Pendiente', 'EnRevision', 'Entrevista'].includes(String(item.estado));
  async function confirmar() {
    if (!accion || ocupado) return;
    const actual = accion;
    setAccion('');
    setOcupado(true);
    try {
      if (actual === 'retirar') {
        await retirarPostulacion(item.id);
        avisar('Postulación retirada. Su historial permanece disponible.');
      } else {
        await eliminarPostulacionHistorial(item.id);
        avisar('Postulación eliminada del historial personal.');
      }
      limpiarCacheOfertas();
      await onActualizar();
    } catch (error) {
      avisar(error.message || 'No se pudo completar la operación.', 'error');
    } finally {
      setOcupado(false);
    }
  }
  return <>
    {puedeRetirar && <button type="button" disabled={ocupado} onClick={() => setAccion('retirar')} className="ml-2 mt-2 rounded-xl border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Retirar postulación</button>}
    <button type="button" disabled={ocupado} onClick={() => setAccion('eliminar')} className="ml-2 mt-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{ocupado ? <LoaderCircle size={16} className="inline animate-spin"/> : null} Eliminar del historial</button>
    <ConfirmacionAccion abierto={!!accion} titulo={accion === 'retirar' ? 'Retirar postulación' : 'Eliminar del historial'} mensaje={accion === 'retirar' ? 'La postulación quedará retirada, pero se conservará en el historial.' : 'La postulación dejará de aparecer en tu historial, pero la empresa conservará el registro. Esto no permite volver a postularse a la misma oferta.'} confirmar={accion === 'retirar' ? 'Retirar' : 'Eliminar del historial'} peligro ocupado={ocupado} onConfirmar={confirmar} onCancelar={() => setAccion('')}/>
  </>;
}
