export default function SearchBar({
  filtros,
  onChange,
  onBuscar,
}) {
  function actualizar(event) {
    const { name, value } = event.target;

    onChange({
      ...filtros,
      [name]: value,
    });
  }

  function enviar(event) {
    event.preventDefault();
    onBuscar();
  }

  function limpiar() {
    onChange({
      busqueda: "",
      ubicacion: "",
      modalidad: "",
      salarioMin: "",
      orden: "fecha_desc",
    });
  }

  const campo =
    "w-full min-w-0 h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400";

  return (
    <form onSubmit={enviar} className="space-y-3">

      {/* Búsqueda principal */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔎
        </span>

        <input
          type="text"
          name="busqueda"
          placeholder="Puesto, tecnología o palabra clave..."
          value={filtros.busqueda}
          onChange={actualizar}
          className={`${campo} pl-10`}
        />
      </div>

      {/* Filtros compactos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        <input
          type="text"
          name="ubicacion"
          placeholder="📍 Ubicación"
          value={filtros.ubicacion}
          onChange={actualizar}
          className={campo}
        />

        <select
          name="modalidad"
          value={filtros.modalidad}
          onChange={actualizar}
          aria-label="Modalidad"
          className={campo}
        >
          <option value="">Todas las modalidades</option>
          <option value="Remoto">Remoto</option>
          <option value="Presencial">Presencial</option>
          <option value="Hibrido">Híbrido</option>
        </select>

        <input
          type="number"
          name="salarioMin"
          min="0"
          placeholder="💰 Salario mínimo"
          value={filtros.salarioMin}
          onChange={actualizar}
          className={campo}
        />

        <select
          name="orden"
          value={filtros.orden}
          onChange={actualizar}
          aria-label="Ordenar resultados"
          className={campo}
        >
          <option value="fecha_desc">Más recientes</option>
          <option value="fecha_asc">Más antiguos</option>
          <option value="titulo_asc">Título A-Z</option>
          <option value="titulo_desc">Título Z-A</option>
          <option value="salario_desc">Mayor salario</option>
        </select>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={limpiar}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          Limpiar filtros
        </button>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <span>🔎</span>
          Buscar empleos
        </button>
      </div>
    </form>
  );
}
