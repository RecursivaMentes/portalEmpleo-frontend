import { useEffect, useState } from 'react';
import { Link, useMatch } from 'react-router-dom';
import { Bot, LoaderCircle } from 'lucide-react';
import { preparacionActiva } from '../services/postulacionesService';

const estadosEnCurso = {
  Preparando: 'La IA está preparando una postulación',
  EnModificacion: 'La IA está ajustando una postulación',
  AplicandoCv: 'La IA está aplicando cambios al CV',
  Enviando: 'La IA está enviando una postulación',
  CancelacionSolicitada: 'Se está deteniendo una preparación con IA',
};

export default function ActividadPostulacionesIA() {
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState(false);
  const enPostulaciones = !!useMatch('/postulaciones/*');

  useEffect(() => {
    let vigente = true;
    let consultando = false;
    const consultar = async () => {
      if (!vigente || consultando || document.visibilityState === 'hidden') return;
      consultando = true;
      try {
        const respuesta = await preparacionActiva();
        if (vigente) {
          setConsulta(respuesta);
          setError(false);
        }
      } catch {
        // Un fallo de red no se interpreta como una postulación terminada.
        if (vigente) setError(true);
      } finally {
        consultando = false;
      }
    };

    consultar();
    const intervalo = window.setInterval(consultar, 5000);
    document.addEventListener('visibilitychange', consultar);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, []);

  const preparacion = consulta?.preparacion;
  const estado = preparacion?.estado;
  const origen = preparacion?.origen;
  const enCurso = ['IniciativaIA', 'SolicitudUsuario'].includes(origen) && !!estadosEnCurso[estado];
  // El estado en reposo sólo se muestra en Postulaciones, no en toda la aplicación.
  if (!enCurso && !enPostulaciones) return null;

  let titulo = 'Consultando estado de la IA…';
  let detalle = 'Esperá la respuesta del servicio de postulaciones.';
  if (error) {
    titulo = 'No se pudo verificar el estado actual de la IA';
    detalle = enCurso ? 'La última consulta indicaba una preparación activa; su estado actual no está confirmado.' : 'La consulta se reintentará automáticamente.';
  } else if (enCurso) {
    titulo = estadosEnCurso[estado];
    const nombre = consulta?.oferta?.titulo || 'Oferta sin título disponible';
    detalle = `${origen === 'IniciativaIA' ? 'Iniciativa autónoma' : 'Solicitud del usuario'} · ${nombre}`;
  } else if (consulta) {
    titulo = 'No hay una preparación de IA en curso';
    detalle = consulta.integracionHabilitada === false
      ? 'La integración con Chatbot está deshabilitada en el servidor.'
      : consulta.procesamientoHabilitado === false
        ? 'El ciclo autónomo está deshabilitado en el servidor.'
        : consulta.procesamientoHabilitado === true
          ? 'Ciclo autónomo habilitado en el servidor. La selección depende del modo, las ofertas elegibles y el cupo de tu cuenta.'
          : 'No se pudo determinar si el ciclo autónomo está habilitado.';
  }

  return (
    <div role="status" aria-live="polite" className="border-b border-primary-200 bg-primary-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <Bot size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-900">
            {!error && (enCurso || !consulta) && <LoaderCircle size={15} className="shrink-0 animate-spin" aria-hidden="true" />}
            {titulo}
          </p>
          <p className="text-xs text-primary-700">{detalle}</p>
        </div>
        {enCurso && <Link to="/postulaciones/aprobaciones" className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100">
          Ver seguimiento
        </Link>}
      </div>
    </div>
  );
}