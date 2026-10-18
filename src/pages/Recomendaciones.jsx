import { useEffect, useState } from "react";
import { obtenerRecomendaciones } from "../services/recomendacionesService";

export default function Recomendaciones({ usuarioId }) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [compatibilidadMinima, setCompatibilidadMinima] = useState(0);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  useEffect(() => {
    if (!usuarioId) {
      setCargando(false);
      setError("No se identificó al usuario.");
      return;
    }

    let activo = true;

    async function cargarRecomendaciones() {
      setCargando(true);
      setError("");

      try {
        const datos = await obtenerRecomendaciones(usuarioId);

        if (activo) {
          setRecomendaciones(datos);
        }
      } catch (err) {
        if (activo) {
          setError(err.message);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarRecomendaciones();

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const recomendacionesFiltradas = recomendaciones.filter(
    (empleo) =>
      empleo.porcentajeCompatibilidad >= compatibilidadMinima
  );

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Empleos recomendados
          </h1>

          <p className="mt-2 text-gray-600">
            Descubrí ofertas laborales compatibles con tu perfil.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <label
              htmlFor="compatibilidad"
              className="font-medium text-gray-800"
            >
              Compatibilidad mínima
            </label>

            <p className="text-sm text-gray-500">
              Filtrá las ofertas según su coincidencia con tu perfil.
            </p>
          </div>

          <select
            id="compatibilidad"
            value={compatibilidadMinima}
            onChange={(e) =>
              setCompatibilidadMinima(Number(e.target.value))
            }
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800"
          >
            <option value={0}>Todas las ofertas</option>
            <option value={25}>25% o más</option>
            <option value={50}>50% o más</option>
            <option value={75}>75% o más</option>
          </select>
        </div>

        {!cargando && !error && (
          <p className="text-sm text-gray-600">
            {recomendacionesFiltradas.length}{" "}
            {recomendacionesFiltradas.length === 1
              ? "oferta encontrada"
              : "ofertas encontradas"}
          </p>
        )}

        {cargando && (
          <p className="text-gray-600">
            Cargando recomendaciones...
          </p>
        )}

        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}

        {!cargando &&
          !error &&
          recomendacionesFiltradas.length === 0 && (
            <p className="py-8 text-center text-gray-600">
              No se encontraron empleos con el porcentaje
              de compatibilidad seleccionado.
            </p>
          )}

        {!cargando &&
          !error &&
          recomendacionesFiltradas.map((empleo) => (
            <article
              key={empleo.empleoId}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {empleo.titulo}
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">
                    {empleo.motivo}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-green-700">
                    {empleo.porcentajeCompatibilidad}%
                  </span>

                  <p className="text-xs text-gray-500">
                    Compatibilidad
                  </p>
                </div>
              </div>

              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label={`Compatibilidad con ${empleo.titulo}`}
                aria-valuenow={empleo.porcentajeCompatibilidad}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-green-600"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, empleo.porcentajeCompatibilidad)
                    )}%`
                  }}
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                <div>
                  <h3 className="mb-2 font-medium text-gray-800">
                    Habilidades coincidentes
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {empleo.coincidencias.map((habilidad) => (
                      <span
                        key={habilidad}
                        className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        ✓ {habilidad}
                      </span>
                    ))}

                    {empleo.coincidencias.length === 0 && (
                      <span className="text-sm text-gray-500">
                        Sin coincidencias.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-gray-800">
                    Requisitos faltantes
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {empleo.requisitosFaltantes.map((requisito) => (
                      <span
                        key={requisito}
                        className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800"
                      >
                        {requisito}
                      </span>
                    ))}

                    {empleo.requisitosFaltantes.length === 0 && (
                      <span className="text-sm text-green-700">
                        Cumplís todos los requisitos.
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                    </div>
                    <div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => setOfertaSeleccionada(empleo)}
                        className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
                    >
                        Ver oferta
                    </button>
                </div>
              </div>
            </article>
          ))}
        {ofertaSeleccionada && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setOfertaSeleccionada(null)}
        >
            <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-oferta"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-4">
                <h2
                id="titulo-oferta"
                className="text-2xl font-bold text-gray-900"
                >
                {ofertaSeleccionada.titulo}
                </h2>

                <button
                type="button"
                onClick={() => setOfertaSeleccionada(null)}
                aria-label="Cerrar detalle"
                className="cursor-pointer text-2xl text-gray-500 hover:text-gray-900"
                >
                ×
                </button>
            </div>

            <p className="mt-4 text-gray-600">
                {ofertaSeleccionada.motivo}
            </p>

            <div className="mt-5 rounded-lg bg-green-50 p-4">
                <p className="text-sm text-gray-600">
                Compatibilidad con tu perfil
                </p>
                <p className="text-3xl font-bold text-green-700">
                {ofertaSeleccionada.porcentajeCompatibilidad}%
                </p>
            </div>

            <h3 className="mt-6 font-semibold text-gray-900">
                Habilidades coincidentes
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
                {ofertaSeleccionada.coincidencias.length > 0
                ? ofertaSeleccionada.coincidencias.map((habilidad) => (
                    <span
                        key={habilidad}
                        className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                    >
                        ✓ {habilidad}
                    </span>
                    ))
                : (
                    <p className="text-sm text-gray-500">
                        Sin coincidencias.
                    </p>
                    )}
            </div>

            <h3 className="mt-6 font-semibold text-gray-900">
                Requisitos faltantes
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
                {ofertaSeleccionada.requisitosFaltantes.length > 0
                ? ofertaSeleccionada.requisitosFaltantes.map((requisito) => (
                    <span
                        key={requisito}
                        className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800"
                    >
                        {requisito}
                    </span>
                    ))
                : (
                    <p className="text-sm text-green-700">
                        Cumplís todos los requisitos.
                    </p>
                    )}
            </div>

            <p className="mt-6 text-sm text-gray-500">
                La descripción completa y la opción de postulación
                estarán disponibles cuando se integre el servicio de Empleos.
            </p>

            <div className="mt-6 flex justify-end">
                <button
                type="button"
                onClick={() => setOfertaSeleccionada(null)}
                className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-100"
                >
                Cerrar
                </button>
            </div>
            </div>
        </div>
        )}
      </div>
    </main>
  );
}