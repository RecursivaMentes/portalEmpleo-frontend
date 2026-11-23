import { useEffect, useState } from "react";
import { Banknote, MapPin } from "lucide-react";
import SearchBar from "../components/SearchBar";
import DetalleOferta from '../components/DetalleOferta';
import AccionesPostulacion from "../components/AccionesPostulacion";
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
    blue: "bg-primary-50 text-primary-700 border-primary-100",
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

export default function Empleos({ onSolicitarLogin }) {
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
    // La consulta comienza tras el montaje, fuera del cuerpo sincrono del efecto.
    Promise.resolve().then(() => buscar(filtrosIniciales));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Encabezado */}
      <section className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 text-white">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-medium mb-5">
            Tu próximo desafío profesional empieza acá
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Encontrá el trabajo ideal para vos.
          </h1>

          <p className="text-primary-100 mt-4 text-lg max-w-2xl">
            Explorá oportunidades laborales, filtrá según tus preferencias
            y descubrí el próximo paso en tu carrera.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5">
        {/* Buscador */}
        <div className="-mt-7 relative z-10 bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl">
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
            <div aria-label="Cargando ofertas" role="status" className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => <div key={n} className="h-40 rounded-2xl border border-slate-200 bg-slate-200"/>)}
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
            <div className="space-y-3">
              {empleos.map((empleo) => {
                const modalidad = String(empleo.modalidad ?? "");
                const colorModalidad =
                  modalidad.toLowerCase() === "remoto"
                    ? "green"
                    : modalidad.toLowerCase().includes("hibr")
                      ? "purple"
                      : "blue";

                const remuneracion = empleo.salarioMin != null || empleo.salarioMax != null
                  ? `${formatoMoneda(empleo.salarioMin) ?? "A convenir"} – ${formatoMoneda(empleo.salarioMax) ?? "A convenir"}`
                  : "A convenir";

                return (
                  <article
                    key={empleo.id}
                    className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-lg"
                  >
                    {/* Barra lateral de acento */}
                    <div className="w-1.5 shrink-0 bg-primary-500 transition-colors group-hover:bg-accent-600" aria-hidden="true" />

                    <div className="flex min-w-0 flex-1 flex-col md:flex-row">
                      {/* Columna principal */}
                      <div className="min-w-0 flex-1 px-4 py-3.5 md:px-5">
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <Etiqueta color={colorModalidad}>
                            {empleo.modalidad || "A definir"}
                          </Etiqueta>

                          {empleo.tipoContrato && (
                            <Etiqueta>{empleo.tipoContrato}</Etiqueta>
                          )}
                        </div>

                        <h3 className="text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-primary-700">
                          {empleo.titulo}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {empleo.descripcion || "Descripción no disponible."}
                        </p>

                        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                          <li className="flex items-center gap-1.5">
                            <MapPin size={16} className="shrink-0 text-slate-400" />
                            {empleo.ubicacion || "Ubicación a definir"}
                          </li>
                          <li className="flex items-center gap-1.5">
                            <Banknote size={16} className="shrink-0 text-emerald-600" />
                            <span className="font-semibold text-emerald-700">{remuneracion}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Columna lateral: acciones */}
                      <div className="flex shrink-0 flex-col justify-center gap-2 border-t border-slate-100 px-4 py-3.5 md:w-60 md:border-l md:border-t-0 [&_button]:py-2 [&>div]:mt-0">
                        <button
                          type="button"
                          onClick={() => setEmpleoSeleccionado(empleo)}
                          className="w-full cursor-pointer rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                        >
                          Ver detalles →
                        </button>
                        <AccionesPostulacion empleo={empleo} onSolicitarLogin={onSolicitarLogin}/>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {empleoSeleccionado && <DetalleOferta empleo={empleoSeleccionado} onCerrar={() => setEmpleoSeleccionado(null)} onSolicitarLogin={onSolicitarLogin}/>} 
    </main>
  );
}
