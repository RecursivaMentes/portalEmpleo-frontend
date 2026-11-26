import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, LoaderCircle } from 'lucide-react';
import { preparacionActiva } from '../services/postulacionesService';

const estadosEnCurso = {
  Preparando: 'La IA está preparando una postulación',
  EnModificacion: 'La IA está ajustando una postulación',
  AplicandoCv: 'La IA está aplicando cambios al CV',
  Enviando: 'La IA está enviando una postulación',
  CancelacionSolicitada: 'Se está deteniendo una postulación automática',
};

export default function ActividadPostulacionesIA() {
  const [preparacion, setPreparacion] = useState(null);

  useEffect(() => {
    let vigente = true;
    let consultando = false;
    const consultar = async () => {
      if (!vigente || consultando || document.visibilityState === 'hidden') return;
      consultando = true;
      try {
        const respuesta = await preparacionActiva();
        if (vigente) setPreparacion(respuesta?.preparacion ?? null);
      } catch {
        // Un fallo de red no se interpreta como una postulación terminada.
      } finally {
        consultando = false;
      }
    };

    consultar();
    const intervalo = window.setInterval(consultar, 10000);
    document.addEventListener('visibilitychange', consultar);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', consultar);
    };
  }, []);

  const estado = preparacion?.estado;
  const origen = preparacion?.origen;
  if (origen !== 'IniciativaIA' || !estadosEnCurso[estado]) return null;

  return (
    <div role="status" aria-live="polite" className="border-b border-primary-200 bg-primary-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <Bot size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-900">
            <LoaderCircle size={15} className="shrink-0 animate-spin" aria-hidden="true" />
            {estadosEnCurso[estado]}
          </p>
          <p className="text-xs text-primary-700">El estado se actualiza automáticamente cada 10 segundos.</p>
        </div>
        <Link to="/postulaciones/aprobaciones" className="rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100">
          Ver seguimiento
        </Link>
      </div>
    </div>
  );
}