import { useEffect, useState } from "react";
import { Banknote, MapPin, CodeXml, ArrowRight } from "lucide-react";
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
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [empleoSeleccionado, setEmpleoSeleccionado] = useState(null);

  async function buscar(filtrosConsulta) {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerEmpleos(filtrosConsulta);
      setEmpleos(Array.isArray(datos) ? datos : []);
      setPagina(1);
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

  const porPagina = 16;
  const totalPaginas = Math.max(1, Math.ceil(empleos.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = empleos.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  return (
    <main className="min-h-screen bg-slate-50 pb-6">
      {/* Encabezado */}
      <section className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 text-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6">
          <span className="inline-flex rounded-full bg-white/15 border border-white/20 px-4 py-1.5 text-sm font-medium mb-5">
            Tu próximo desafío profesional empieza acá
          </span>

          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Encontrá el trabajo ideal para vos.
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-primary-100">
            Explorá oportunidades laborales, filtrá según tus preferencias
            y descubrí el próximo paso en tu carrera.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        {/* Buscador */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
        <section className="mt-4">
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
            <div aria-label="Cargando ofertas" role="status" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, n) => <div key={n} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3"><div className="mb-3 h-10 w-10 rounded-xl bg-slate-200"/><div className="mb-3 h-4 w-4/5 rounded bg-slate-200"/><div className="mb-4 h-12 rounded bg-slate-100"/><div className="mb-2 h-8 rounded-lg bg-slate-200"/><div className="h-8 rounded-lg bg-slate-100"/></div>)}
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
            <div className="grid grid-cols-1 gap-3 items-stretch sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibles.map((empleo) => {
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
                  <article key={empleo.id} className={`group relative flex min-w-0 flex-col rounded-xl border border-slate-200 border-t-[3px] ${colorModalidad === 'green' ? 'border-t-emerald-500' : colorModalidad === 'purple' ? 'border-t-violet-500' : 'border-t-primary-500'} bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-within:z-20`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorModalidad === 'green' ? 'bg-emerald-100 text-emerald-700' : colorModalidad === 'purple' ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'}`}><CodeXml size={22} strokeWidth={2}/></div>
                      <div className="flex flex-wrap justify-end gap-1"><Etiqueta color={colorModalidad}>{empleo.modalidad || 'A definir'}</Etiqueta>{empleo.tipoContrato && <Etiqueta>{empleo.tipoContrato}</Etiqueta>}</div>
                    </div>
                    <h3 className="mb-2 break-words text-base font-semibold leading-tight text-slate-900 group-hover:text-primary-700">{empleo.titulo}</h3>
                    <p className="mb-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{empleo.descripcion || 'Descripción no disponible.'}</p>
                    <div className="mb-2 border-t border-slate-100"/>
                    <ul className="flex flex-1 flex-col gap-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                      <li className="flex items-start gap-1.5"><MapPin size={15} className="shrink-0 text-slate-400"/>{empleo.ubicacion || 'Ubicación a definir'}</li>
                      <li className="flex items-start gap-1.5"><Banknote size={15} className="shrink-0 text-emerald-600"/><span className="font-semibold text-emerald-700">{remuneracion}</span></li>
                    </ul>
                    <div className="mt-auto flex flex-col gap-1 pt-2">
                      <button type="button" onClick={() => setEmpleoSeleccionado(empleo)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 cursor-pointer">Ver oferta <ArrowRight size={14}/></button>
                      <div className="text-[12px] [&_button]:!text-[12px] [&_button]:!py-1.5 [&_button]:!px-2 [&_button]:!min-h-0 [&_button]:!h-auto"><AccionesPostulacion empleo={empleo} onSolicitarLogin={onSolicitarLogin}/></div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!cargando && !error && totalPaginas > 1 && <nav aria-label="Paginación de empleos" className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button type="button" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Anterior</button>
            <span className="text-slate-600" aria-live="polite">Página {paginaActual} de {totalPaginas}</span>
            <button type="button" disabled={paginaActual === totalPaginas} onClick={() => setPagina(paginaActual + 1)} className="rounded-lg bg-primary-600 px-3 py-2 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Siguiente</button>
          </nav>}
        </section>
      </div>

      {empleoSeleccionado && <DetalleOferta empleo={empleoSeleccionado} onCerrar={() => setEmpleoSeleccionado(null)} onSolicitarLogin={onSolicitarLogin}/>} 
    </main>
  );
}
