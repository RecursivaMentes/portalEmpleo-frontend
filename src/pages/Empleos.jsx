import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { obtenerEmpleos } from "../services/empleosService";

const filtrosIniciales = {
  busqueda: "",
  ubicacion: "",
  modalidad: "",
  salarioMin: "",
  orden: "fecha_desc"
};

export default function Empleos() {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [empleos, setEmpleos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function buscar(filtrosConsulta) {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerEmpleos(filtrosConsulta);
      setEmpleos(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    buscar(filtrosIniciales);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Portal de Empleos
        </h1>

        <SearchBar
          filtros={filtros}
          onChange={setFiltros}
          onBuscar={() => buscar(filtros)}
        />

        {cargando && (
          <p className="text-gray-600">
            Buscando empleos...
          </p>
        )}

        {error && (
          <p className="text-red-600">
            {error}
          </p>
        )}

        {!cargando && !error && empleos.length === 0 && (
          <p className="text-gray-600 text-center py-8">
            No se encontraron ofertas laborales.
          </p>
        )}

        {!cargando && !error && empleos.map((empleo) => (
          <article
            key={empleo.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              {empleo.titulo}
            </h2>

            <p className="text-gray-600 mt-2">
              {empleo.descripcion}
            </p>

            <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-700">
              <span>📍 {empleo.ubicacion || "Sin especificar"}</span>
              <span>💼 {empleo.modalidad}</span>
              <span>📋 {empleo.tipoContrato}</span>
            </div>

            {(empleo.salarioMin != null ||
              empleo.salarioMax != null) && (
              <p className="mt-3 font-medium text-green-700">
                Salario:{" "}
                {empleo.salarioMin ?? "No informado"}
                {" - "}
                {empleo.salarioMax ?? "No informado"}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}