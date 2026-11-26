import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Target,
  TrendingUp,
  CodeXml,
  SlidersHorizontal,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

import { obtenerRecomendaciones } from "../services/recomendacionesService";
import DetalleOferta from "../components/DetalleOferta";
import AccionesPostulacion from "../components/AccionesPostulacion";


// ==================================================
// FUNCIONES AUXILIARES
// ==================================================

const porcentajeDe = (empleo) =>
  Number(
    empleo.porcentajeCompatibilidad ??
    empleo.compatibilidad ??
    0
  );

const coincidentesDe = (empleo) =>
  empleo.coincidencias ??
  empleo.habilidadesCoincidentes ??
  empleo.requisitosCoincidentes ??
  [];

const faltantesDe = (empleo) =>
  empleo.requisitosFaltantes ?? [];

const formatoPorcentaje = (valor) =>
  valor.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  }) + "%";


// ==================================================
// ESTILOS SEGUN COMPATIBILIDAD
// ==================================================

function obtenerEstiloCompatibilidad(porcentaje) {
  if (porcentaje >= 80) {
    return {
      texto: "text-emerald-600",
      borde: "border-t-emerald-500",
      color: "#059669",
      etiqueta: "Excelente coincidencia"
    };
  }

  if (porcentaje >= 50) {
    return {
      texto: "text-blue-600",
      borde: "border-t-blue-500",
      color: "#2563eb",
      etiqueta: "Buena compatibilidad"
    };
  }

  return {
    texto: "text-amber-600",
    borde: "border-t-amber-500",
    color: "#d97706",
    etiqueta: "Compatibilidad parcial"
  };
}


// ==================================================
// ETIQUETAS DE HABILIDADES
// ==================================================

function Etiqueta({ children, tipo = "coincidente" }) {
  const estilos = {
    coincidente:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
    faltante:
      "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg
        border px-2 py-0.5 text-[11px] font-medium
        ${estilos[tipo]}`}
    >
      {children}
    </span>
  );
}


// ==================================================
// INDICADOR CIRCULAR DE COMPATIBILIDAD
// ==================================================

function IndicadorCompatibilidad({ porcentaje }) {
  const valor = Math.max(0, Math.min(100, porcentaje));

  const estilo = obtenerEstiloCompatibilidad(valor);

  const radio = 25;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <div
      className="relative h-12 w-12 shrink-0"
      role="img"
      aria-label={`Compatibilidad: ${formatoPorcentaje(valor)}`}
      title={formatoPorcentaje(valor)}
    >
      <svg
        viewBox="0 0 60 60"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        {/* Fondo del indicador */}

        <circle
          cx="30"
          cy="30"
          r={radio}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />

        {/* Progreso de compatibilidad */}

        <circle
          cx="30"
          cy="30"
          r={radio}
          fill="none"
          stroke={estilo.color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={
            circunferencia * (1 - valor / 100)
          }
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <span
        className={`absolute inset-0 flex items-center
          justify-center text-[12px] font-bold
          tabular-nums ${estilo.texto}`}
      >
        {Math.round(valor)}%
      </span>
    </div>
  );
}


// ==================================================
// TARJETAS DE ESTADISTICAS
// ==================================================

function IndicadorResumen({
  icono: Icono,
  valor,
  titulo,
  color,
  fondo
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl
        border border-slate-200 bg-white px-3 py-2
        shadow-sm hover:shadow-md transition-shadow
        duration-200"
    >
      <div
        className={`flex h-9 w-9 shrink-0
          items-center justify-center rounded-xl
          ${fondo} ${color}`}
      >
        <Icono size={21} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <p
          className={`text-xl font-semibold leading-tight
            tabular-nums ${color}`}
        >
          {valor}
        </p>

        <p className="text-xs text-slate-500">
          {titulo}
        </p>
      </div>
    </div>
  );
}


// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export default function Recomendaciones({
  usuarioId,
  onSolicitarLogin
}) {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [
    compatibilidadMinima,
    setCompatibilidadMinima
  ] = useState(0);

  const [pagina, setPagina] = useState(1);

  const [
    ofertaSeleccionada,
    setOfertaSeleccionada
  ] = useState(null);


  // ==================================================
  // CARGAR RECOMENDACIONES
  // ==================================================

  useEffect(() => {
    if (!usuarioId) {
      Promise.resolve().then(() => {
        setRecomendaciones([]);

        setError(
          "No se pudo identificar al usuario autenticado."
        );

        setCargando(false);
      });

      return;
    }

    let activo = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        const datos =
          await obtenerRecomendaciones(usuarioId);

        if (activo) {
          setRecomendaciones(
            Array.isArray(datos) ? datos : []
          );
        }

      } catch {
        if (activo) {
          setError(
            "No se pudieron obtener las recomendaciones laborales"
          );

          setRecomendaciones([]);
        }

      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (activo) cargar();
    });

    return () => {
      activo = false;
    };

  }, [usuarioId]);


  // ==================================================
  // ESTADISTICAS
  // ==================================================

  const totalOportunidades = recomendaciones.length;

  const mejorCoincidencia = recomendaciones.reduce(
    (maximo, empleo) =>
      Math.max(maximo, porcentajeDe(empleo)),
    0
  );

  const altaCompatibilidad = recomendaciones.filter(
    (empleo) => porcentajeDe(empleo) >= 80
  ).length;


  // ==================================================
  // FILTRADO Y ORDENAMIENTO
  // ==================================================

  const filtradas = recomendaciones
    .filter(
      (empleo) =>
        porcentajeDe(empleo) >= compatibilidadMinima
    )
    .sort(
      (a, b) => porcentajeDe(b) - porcentajeDe(a)
    );


  // ==================================================
  // PAGINACION
  // ==================================================

  const porPagina = 16;

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtradas.length / porPagina)
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas
  );

  const visibles = filtradas.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-6">

      {/* ENCABEZADO PRINCIPAL */}

      <section
        className="bg-gradient-to-r from-blue-700
          via-blue-600 to-indigo-700 text-white"
      >
        <div
          className="w-full max-w-[1440px]
            mx-auto px-4 sm:px-6 py-5"
        >
          <h1
            className="text-3xl leading-tight
              font-bold tracking-tight"
          >
            Encontrá el empleo ideal para vos.
          </h1>

          <p
            className="text-blue-100 mt-1
              text-sm max-w-3xl"
          >
            Descubrí ofertas compatibles con tus habilidades
            y conocé qué requisitos cumplís y cuáles podés mejorar.
          </p>
        </div>
      </section>


      <div
        className="w-full max-w-[1440px]
          mx-auto px-4 sm:px-6"
      >

        {/* INDICADORES SUPERIORES */}

        {!cargando && !error && (
          <div
            className="grid grid-cols-1 sm:grid-cols-3
              gap-3 mt-4 mb-3"
          >

            <IndicadorResumen
              icono={BriefcaseBusiness}
              valor={totalOportunidades}
              titulo="Oportunidades"
              color="text-blue-600"
              fondo="bg-blue-50"
            />

            <IndicadorResumen
              icono={Target}
              valor={
                totalOportunidades > 0
                  ? formatoPorcentaje(mejorCoincidencia)
                  : "—"
              }
              titulo="Mejor coincidencia"
              color="text-emerald-600"
              fondo="bg-emerald-50"
            />

            <IndicadorResumen
              icono={TrendingUp}
              valor={altaCompatibilidad}
              titulo="Alta compatibilidad"
              color="text-violet-600"
              fondo="bg-violet-50"
            />

          </div>
        )}


        {/* FILTRO DE COMPATIBILIDAD */}

        <div
          className="my-3 bg-white rounded-xl
            border border-slate-200 px-4 py-2"
        >
          <div
            className="flex flex-wrap items-center
              justify-between gap-2"
          >
            <h2
              className="flex items-center gap-2
                text-sm font-semibold text-slate-900"
            >
              <SlidersHorizontal
                size={17}
                className="text-blue-600"
              />

              Filtrar recomendaciones
            </h2>

            <div className="flex items-center gap-3">

              <label
                htmlFor="compatibilidad"
                className="text-[12px] font-medium
                  text-slate-600"
              >
                Compatibilidad mínima
              </label>

              <select
                id="compatibilidad"
                value={compatibilidadMinima}
                onChange={(e) => {
                  setCompatibilidadMinima(
                    Number(e.target.value)
                  );

                  setPagina(1);
                }}
                className="h-8 px-2 border
                  border-slate-200 rounded-lg bg-white
                  text-sm text-slate-700 outline-none
                  focus:border-blue-500
                  focus:ring-2 focus:ring-blue-100
                  cursor-pointer"
              >
                <option value={0}>Todas</option>
                <option value={25}>Desde 25%</option>
                <option value={50}>Desde 50%</option>
                <option value={75}>Desde 75%</option>
              </select>

            </div>
          </div>
        </div>


        {/* LISTADO DE RECOMENDACIONES */}

        <section>

          <div
            className="flex flex-col sm:flex-row
              sm:items-center sm:justify-between
              gap-2 mb-3"
          >
            <div>
              <h2
                className="text-xl font-bold
                  tracking-tight text-slate-900"
              >
                Oportunidades para vos
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                {cargando
                  ? "Analizando oportunidades..."
                  : `${filtradas.length} ${
                      filtradas.length === 1
                        ? "oferta encontrada"
                        : "ofertas encontradas"
                    } · Ordenadas por compatibilidad`}
              </p>
            </div>
          </div>


          {/* ESTADO DE CARGA */}

          {cargando && (
            <div
              className="bg-white border border-slate-200
                rounded-xl p-10 text-center text-slate-500"
            >
              Analizando ofertas compatibles con tu perfil...
            </div>
          )}


          {/* ERROR */}

          {error && (
            <div
              className="bg-red-50 border border-red-200
                text-red-700 rounded-xl p-6"
            >
              {error}
            </div>
          )}


          {/* SIN RESULTADOS */}

          {!cargando && !error && filtradas.length === 0 && (
            <div
              className="bg-white border border-slate-200
                rounded-xl p-10 text-center"
            >
              <h3
                className="text-lg font-semibold
                  text-slate-900"
              >
                No encontramos recomendaciones con ese porcentaje
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Probá seleccionando una compatibilidad mínima menor.
              </p>
            </div>
          )}


          {/* GRILLA DE TARJETAS */}

          {!cargando && !error && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2
                lg:grid-cols-3 xl:grid-cols-4
                gap-3 items-stretch"
            >

              {visibles.map((empleo, indice) => {

                const porcentaje = porcentajeDe(empleo);
                const coincidentes = coincidentesDe(empleo);
                const faltantes = faltantesDe(empleo);

                const estilo =
                  obtenerEstiloCompatibilidad(porcentaje);

                return (
                  <article
                    key={
                      empleo.empleoId ??
                      empleo.id ??
                      indice
                    }
                    className={`group relative flex flex-col
                      min-w-0 bg-white rounded-xl
                      border border-slate-200 border-t-[3px]
                      ${estilo.borde}
                      p-3 shadow-sm hover:shadow-lg
                      hover:-translate-y-0.5
                      focus-within:z-20
                      transition-all duration-300`}
                  >

                    {/* ICONO Y COMPATIBILIDAD */}

                    <div
                      className="flex items-center
                        justify-between mb-2"
                    >

                      <div
                        className="flex h-10 w-10
                          items-center justify-center
                          rounded-xl bg-blue-50
                          text-blue-600"
                      >
                        <CodeXml
                          size={22}
                          strokeWidth={2}
                        />
                      </div>

                      <IndicadorCompatibilidad
                        porcentaje={porcentaje}
                      />

                    </div>


                    {/* TITULO DEL EMPLEO */}

                    <div className="mb-2">

                      <h3
                        className="text-base font-semibold
                          leading-tight text-slate-900
                          break-words
                          group-hover:text-blue-700
                          transition-colors"
                      >
                        {empleo.titulo}
                      </h3>

                      <p
                        className={`mt-1 text-xs
                          font-semibold ${estilo.texto}`}
                      >
                        {estilo.etiqueta}
                      </p>

                      <p
                        className="mt-1 text-[11px]
                          text-slate-500"
                      >
                        Coincidís con {coincidentes.length} de{" "}
                        {coincidentes.length + faltantes.length}
                        {" "}requisitos.
                      </p>

                    </div>


                    {/* SEPARADOR */}

                    <div
                      className="border-t
                        border-slate-100 mb-2"
                    />


                    {/* HABILIDADES Y REQUISITOS */}

                    <div
                      className="flex flex-col
                        gap-2 flex-1"
                    >

                      {/* HABILIDADES COINCIDENTES */}

                      <div>

                        <p
                          className="text-xs font-medium
                            text-slate-600 mb-1"
                        >
                          Habilidades coincidentes
                        </p>

                        <div className="flex flex-wrap gap-1">

                          {coincidentes.length > 0 ? (

                            coincidentes.map((habilidad, i) => (
                              <Etiqueta key={i}>
                                ✓ {habilidad}
                              </Etiqueta>
                            ))

                          ) : (

                            <span
                              className="text-xs
                                text-slate-500"
                            >
                              Sin coincidencias
                            </span>

                          )}

                        </div>
                      </div>


                      {/* REQUISITOS FALTANTES */}

                      <div>

                        {faltantes.length > 0 ? (
                          <>
                            <p
                              className="text-xs font-medium
                                text-amber-600 mb-1"
                            >
                              {faltantes.length}{" "}
                              {faltantes.length === 1
                                ? "requisito por mejorar"
                                : "requisitos por mejorar"}
                            </p>

                            <div
                              className="flex flex-wrap gap-1"
                            >

                              {faltantes.map((requisito, i) => (
                                <Etiqueta
                                  key={i}
                                  tipo="faltante"
                                >
                                  {requisito}
                                </Etiqueta>
                              ))}

                            </div>
                          </>

                        ) : coincidentes.length > 0 ? (

                          <p
                            className="flex items-center gap-1
                              text-xs font-medium
                              text-emerald-600"
                          >
                            <CheckCircle2 size={14} />

                            Cumplís todos los requisitos
                          </p>

                        ) : (

                          <p className="text-xs text-slate-500">
                            Sin requisitos informados
                          </p>

                        )}

                      </div>
                    </div>


                    {/* BOTONES DE ACCION */}

                    <div
                      className="mt-auto pt-2
                        flex flex-col gap-1"
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setOfertaSeleccionada(empleo)
                        }
                        className="inline-flex w-full
                          items-center justify-center gap-2
                          rounded-lg bg-blue-50
                          hover:bg-blue-100 text-blue-700
                          px-3 py-2 text-xs font-semibold
                          cursor-pointer transition-colors
                          focus-visible:ring-2
                          focus-visible:ring-blue-500"
                      >
                        Ver oferta

                        <ArrowRight size={14} />
                      </button>


                      <div
                        className="text-[12px]
                          [&_button]:!text-[12px]
                          [&_button]:!py-1.5
                          [&_button]:!px-2
                          [&_button]:!min-h-0
                          [&_button]:!h-auto"
                      >
                        <AccionesPostulacion
                          empleo={empleo}
                          onSolicitarLogin={onSolicitarLogin}
                        />
                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}


          {/* PAGINACION */}

          {!cargando && !error && totalPaginas > 1 && (
            <nav
              aria-label="Paginación de recomendaciones"
              className="flex items-center justify-center
                gap-3 mt-4 text-sm"
            >

              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() =>
                  setPagina(paginaActual - 1)
                }
                className="rounded-lg border
                  border-slate-200 bg-white px-3 py-2
                  text-slate-700 hover:bg-slate-100
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  cursor-pointer transition-colors"
              >
                Anterior
              </button>

              <span className="text-slate-600">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                type="button"
                disabled={paginaActual === totalPaginas}
                onClick={() =>
                  setPagina(paginaActual + 1)
                }
                className="rounded-lg bg-blue-600
                  text-white px-3 py-2 hover:bg-blue-700
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  cursor-pointer transition-colors"
              >
                Siguiente
              </button>

            </nav>
          )}

        </section>
      </div>


      {/* MODAL DE DETALLE DE OFERTA */}

      {ofertaSeleccionada && (
        <DetalleOferta
          empleo={ofertaSeleccionada}
          onCerrar={() => setOfertaSeleccionada(null)}
          onSolicitarLogin={onSolicitarLogin}
        />
      )}

    </main>
  );
}
