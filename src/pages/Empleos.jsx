import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { obtenerEmpleos } from "../services/empleosService";

const filtrosIniciales = {
  busqueda: "",
  ubicacion: "",
  modalidad: "",
  salarioMin: "",
  orden: "fecha_desc",
};

const formatoMoneda = (valor) => {
  if (valor == null) return null;

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
};

function Etiqueta({ children, color = "gray" }) {
  const colores = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colores[color]}`}>
      {children}
    </span>
  );
}

export default function Empleos() {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [empleos, setEmpleos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [empleoSeleccionado, setEmpleoSeleccionado] = useState(null);

  async function buscar(filtrosConsulta) {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerEmpleos(filtrosConsulta);
      setEmpleos(datos);
    } catch (err) {
      setError(err.message);
      setEmpleos([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    buscar(filtrosIniciales);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Encabezado */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-medium mb-5">
            Tu próximo desafío profesional empieza acá
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Encontrá el trabajo ideal para vos.
          </h1>

          <p className="text-blue-100 mt-4 text-lg max-w-2xl">
            Explorá oportunidades laborales, filtrá según tus preferencias
            y descubrí el próximo paso en tu carrera.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5">
        {/* Buscador */}
        <div className="-mt-7 relative z-10 bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
              🔎
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Buscá tu próxima oportunidad
              </h2>
              <p className="text-sm text-slate-500">
                Personalizá la búsqueda según lo que estás buscando.
              </p>
            </div>
          </div>

          <SearchBar
            filtros={filtros}
            onChange={setFiltros}
            onBuscar={() => buscar(filtros)}
          />
        </div>

        {/* Resultados */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Oportunidades disponibles
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {cargando
                  ? "Buscando oportunidades..."
                  : `${empleos.length} ${empleos.length === 1 ? "oferta encontrada" : "ofertas encontradas"}`}
              </p>
            </div>

            {!cargando && !error && (
              <Etiqueta color="blue">
                {empleos.length} resultados
              </Etiqueta>
            )}
          </div>

          {cargando && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              Buscando las mejores oportunidades...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6">
              No pudimos cargar las ofertas: {error}
            </div>
          )}

          {!cargando && !error && empleos.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900">
                No encontramos ofertas con esos filtros
              </h3>
              <p className="text-slate-500 mt-2">
                Probá con otra palabra clave, ubicación o modalidad.
              </p>
            </div>
          )}

          {!cargando && !error && (
            <div className="space-y-4">
              {empleos.map((empleo) => {
                const modalidad = String(empleo.modalidad ?? "");
                const colorModalidad =
                  modalidad.toLowerCase() === "remoto"
                    ? "green"
                    : modalidad.toLowerCase().includes("hibr")
                      ? "purple"
                      : "blue";

                return (
                  <article
                    key={empleo.id}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Etiqueta color={colorModalidad}>
                            {empleo.modalidad || "A definir"}
                          </Etiqueta>

                          {empleo.tipoContrato && (
                            <Etiqueta>{empleo.tipoContrato}</Etiqueta>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {empleo.titulo}
                        </h3>

                        <p className="text-slate-600 mt-3 leading-relaxed">
                          {empleo.descripcion || "Descripción no disponible."}
                        </p>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm text-slate-500">
                          <span className="flex items-center gap-2">
                            📍 {empleo.ubicacion || "Ubicación a definir"}
                          </span>
                          <span className="flex items-center gap-2">
                            💼 {empleo.tipoContrato || "Contrato a definir"}
                          </span>
                        </div>
                      </div>

                      <div className="md:w-60 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between gap-5">
                        <div>
                          <p className="text-xs uppercase tracking-wide font-semibold text-slate-400 mb-2">
                            Remuneración
                          </p>

                          <p className="font-bold text-emerald-700 text-lg">
                            {empleo.salarioMin != null || empleo.salarioMax != null
                              ? `${formatoMoneda(empleo.salarioMin) ?? "A convenir"} – ${formatoMoneda(empleo.salarioMax) ?? "A convenir"}`
                              : "A convenir"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEmpleoSeleccionado(empleo)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-sm font-semibold cursor-pointer transition-colors"
                        >
                          Ver detalles →
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

      {/* Modal de detalle */}
      {empleoSeleccionado && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          onClick={() => setEmpleoSeleccionado(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-empleo"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-7 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4">
              <h2 id="titulo-detalle-empleo" className="text-2xl font-bold text-slate-900">
                {empleoSeleccionado.titulo}
              </h2>

              <button
                type="button"
                onClick={() => setEmpleoSeleccionado(null)}
                aria-label="Cerrar detalle"
                className="text-slate-400 hover:text-slate-700 text-2xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-slate-600 mt-5 leading-relaxed">
              {empleoSeleccionado.descripcion || "Sin descripción disponible."}
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p>📍 <strong>Ubicación:</strong> {empleoSeleccionado.ubicacion || "No especificada"}</p>
              <p>💼 <strong>Modalidad:</strong> {empleoSeleccionado.modalidad || "No especificada"}</p>
              <p>📋 <strong>Contrato:</strong> {empleoSeleccionado.tipoContrato || "No especificado"}</p>
              <p>
                💰 <strong>Salario:</strong>{" "}
                {formatoMoneda(empleoSeleccionado.salarioMin) ?? "No informado"}
                {" – "}
                {formatoMoneda(empleoSeleccionado.salarioMax) ?? "No informado"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEmpleoSeleccionado(null)}
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
