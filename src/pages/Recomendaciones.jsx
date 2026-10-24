import { useEffect, useState } from "react";
import { obtenerRecomendaciones } from "../services/recomendacionesService";

const porcentajeDe = (empleo) =>
  Number(
    empleo.porcentajeCompatibilidad ??
    empleo.compatibilidad ??
    0
  );

const coincidentesDe = (empleo) =>
  empleo.habilidadesCoincidentes ??
  empleo.requisitosCoincidentes ??
  [];

const faltantesDe = (empleo) =>
  empleo.requisitosFaltantes ?? [];

const formatoPorcentaje = (valor) =>
  valor.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  }) + "%";

function Etiqueta({ children, tipo = "coincidente" }) {
  const estilos = {
    coincidente:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    faltante:
      "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${estilos[tipo]}`}
    >
      {children}
    </span>
  );
}

export default function Recomendaciones({ usuarioId }) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [compatibilidadMinima, setCompatibilidadMinima] = useState(0);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const datos = await obtenerRecomendaciones(usuarioId);

        if (activo) {
          setRecomendaciones(Array.isArray(datos) ? datos : []);
        }
      } catch {
        if (activo) {
          setError("No se pudieron obtener las recomendaciones laborales");
          setRecomendaciones([]);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const filtradas = recomendaciones
    .filter(
      (empleo) =>
        porcentajeDe(empleo) >= compatibilidadMinima
    )
    .sort(
      (a, b) => porcentajeDe(b) - porcentajeDe(a)
    );

  return (
    <main className="min-h-screen bg-slate-50 pb-20">

      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-medium mb-5">
            Oportunidades pensadas para tu perfil
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Encontrá el empleo ideal para vos.
          </h1>

          <p className="text-blue-100 mt-4 text-lg max-w-2xl">
            Descubrí ofertas compatibles con tus habilidades
            y conocé qué requisitos cumplís y cuáles podés mejorar.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5">

        <div className="-mt-5 relative z-10 bg-white rounded-2xl shadow-md border border-slate-100 p-4 md:p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Descubrí tus mejores oportunidades
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Filtrá las ofertas según su compatibilidad con tu perfil.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="compatibilidad"
                className="text-sm font-medium text-slate-600"
              >
                Compatibilidad mínima
              </label>

              <select
                id="compatibilidad"
                value={compatibilidadMinima}
                onChange={(e) =>
                  setCompatibilidadMinima(Number(e.target.value))
                }
                className="h-11 px-3 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={0}>Todas</option>
                <option value={25}>Desde 25%</option>
                <option value={50}>Desde 50%</option>
                <option value={75}>Desde 75%</option>
              </select>
            </div>
          </div>
        </div>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Oportunidades recomendadas
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {cargando
                  ? "Analizando oportunidades..."
                  : `${filtradas.length} ${
                      filtradas.length === 1
                        ? "oferta encontrada"
                        : "ofertas encontradas"
                    }`}
              </p>
            </div>

            {!cargando && !error && (
              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-medium">
                {filtradas.length} resultados
              </span>
            )}
          </div>

          {cargando && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
              Analizando ofertas compatibles con tu perfil...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
              {error}
            </div>
          )}

          {!cargando && !error && filtradas.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No encontramos recomendaciones con ese porcentaje
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Probá seleccionando una compatibilidad mínima menor.
              </p>
            </div>
          )}

          {!cargando && !error && (
            <div className="space-y-4">
              {filtradas.map((empleo, indice) => {
                const porcentaje = porcentajeDe(empleo);
                const coincidentes = coincidentesDe(empleo);
                const faltantes = faltantesDe(empleo);

                const colorPorcentaje =
                  porcentaje >= 70
                    ? "text-emerald-600"
                    : porcentaje >= 40
                      ? "text-blue-600"
                      : "text-amber-600";

                const colorBarra =
                  porcentaje >= 70
                    ? "bg-emerald-500"
                    : porcentaje >= 40
                      ? "bg-blue-500"
                      : "bg-amber-500";

                return (
                  <article
                    key={empleo.empleoId ?? empleo.id ?? indice}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">

                      <div className="flex-1 min-w-0">
                        <div className="mb-3">
                          <span className="inline-flex rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 text-xs font-semibold">
                            Recomendado para vos
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {empleo.titulo}
                        </h3>

                        <p className="text-sm text-slate-500 mt-2">
                          Coincidís con {coincidentes.length} de{" "}
                          {coincidentes.length + faltantes.length} requisitos.
                        </p>

                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
                          <div
                            className={`h-full rounded-full ${colorBarra}`}
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, porcentaje)
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              Habilidades coincidentes
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {coincidentes.length > 0 ? (
                                coincidentes.map((habilidad, i) => (
                                  <Etiqueta key={i}>
                                    ✓ {habilidad}
                                  </Etiqueta>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Sin coincidencias
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2">
                              Requisitos faltantes
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {faltantes.length > 0 ? (
                                faltantes.map((requisito, i) => (
                                  <Etiqueta key={i} tipo="faltante">
                                    {requisito}
                                  </Etiqueta>
                                ))
                              ) : (
                                <span className="text-xs text-emerald-600">
                                  Cumplís todos los requisitos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-60 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between gap-5">
                        <div>
                          <p className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-2">
                            Compatibilidad
                          </p>

                          <p className={`text-3xl font-extrabold ${colorPorcentaje}`}>
                            {formatoPorcentaje(porcentaje)}
                          </p>

                          <p className="text-xs text-slate-500 mt-2">
                            Según tus habilidades profesionales
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setOfertaSeleccionada(empleo)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-sm font-semibold cursor-pointer transition-colors"
                        >
                          Ver oferta →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {ofertaSeleccionada && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          onClick={() => setOfertaSeleccionada(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-oferta"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h2
                id="titulo-oferta"
                className="text-2xl font-bold text-slate-900"
              >
                {ofertaSeleccionada.titulo}
              </h2>

              <button
                type="button"
                onClick={() => setOfertaSeleccionada(null)}
                aria-label="Cerrar"
                className="text-2xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-400">
                Compatibilidad con tu perfil
              </p>

              <p className="text-3xl font-extrabold text-blue-600 mt-2">
                {formatoPorcentaje(
                  porcentajeDe(ofertaSeleccionada)
                )}
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Habilidades coincidentes
                </h3>

                <div className="flex flex-wrap gap-2">
                  {coincidentesDe(ofertaSeleccionada).length > 0 ? (
                    coincidentesDe(ofertaSeleccionada).map((h, i) => (
                      <Etiqueta key={i}>✓ {h}</Etiqueta>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Sin coincidencias
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Requisitos faltantes
                </h3>

                <div className="flex flex-wrap gap-2">
                  {faltantesDe(ofertaSeleccionada).length > 0 ? (
                    faltantesDe(ofertaSeleccionada).map((r, i) => (
                      <Etiqueta key={i} tipo="faltante">
                        {r}
                      </Etiqueta>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-600">
                      Cumplís todos los requisitos
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOfertaSeleccionada(null)}
              className="mt-8 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}