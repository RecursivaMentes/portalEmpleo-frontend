import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {obtenerNotificaciones,contarNotificacionesNoLeidas,marcarNotificacionComoLeida,marcarTodasComoLeidas} from '../services/notificacionesService';

export default function Notificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const menuRef = useRef(null);

  // cerrar al hacer clic afuera o apretar Escape 
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (!menuRef.current?.contains(e.target)) setAbierto(false); };
    const escapar = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escapar);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escapar);
    };
  }, [abierto]);

  //traer el numerito al montar y cada 30 segundos
  useEffect(() => {
    const actualizarContador = () => {
      contarNotificacionesNoLeidas()
        .then(setNoLeidas)
        .catch(() => {});
    };

    actualizarContador();
    const intervalo = setInterval(actualizarContador, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // cargar la lista recien cuando se abre la campana
  const abrirMenu = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);
    if (nuevoEstado) {
      setCargando(true);
      try {
        const datos = await obtenerNotificaciones();
        setLista(datos);
      } catch {
        // Manejar error si querés
      } finally {
        setCargando(false);
      }
    }
  };

    const handleLeerUna = async (notif) => {
    if (notif.leido) return;
    try {
      await marcarNotificacionComoLeida(notif.id);
      setLista((prev) => {
        const actualizada = prev.map((n) =>
          n.id === notif.id ? { ...n, leido: true } : n
        );
        //sincroniza el contador con las que quedan sin leer
        setNoLeidas(actualizada.filter((n) => !n.leido).length);
        return actualizada;
      });
    } catch {}
  };


  const handleLeerTodas = async () => {
    try {
        await marcarTodasComoLeidas();
        setLista(lista.map(n=>n.leido===false?{...n, leido:true}:n));
        setNoLeidas(0);
    } catch {}
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={abrirMenu}
        className="relative inline-flex items-center p-2.5 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        <Bell size={21} />
        {noLeidas > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-800">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={handleLeerTodas}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <CheckCheck size={14} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {cargando ? (
              <p className="p-4 text-center text-xs text-slate-500">Cargando...</p>
            ) : lista.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-500">No tenés notificaciones.</p>
            ) : (
              lista.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleLeerUna(n)}
                  className={`px-4 py-3 text-sm transition-colors cursor-pointer ${
                    n.leido ? 'bg-white text-slate-500' : 'bg-blue-50/60 font-medium text-slate-800 hover:bg-blue-50'
                  }`}
                >
                  <p>{n.mensaje}</p>
                  {n.fecha && (
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {new Date(n.fecha).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
