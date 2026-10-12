export default function SearchBar({
    filtros,
    onChange,
    onBuscar
  }) {
    function actualizar(event) {
      const { name, value } = event.target;
  
      onChange({
        ...filtros,
        [name]: value
      });
    }
  
    function enviar(event) {
      event.preventDefault();
      onBuscar();
    }
  
    return (
      <form
        onSubmit={enviar}
        className="bg-white p-6 rounded-xl shadow-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          Buscar oportunidades laborales
        </h2>
  
        <input
          type="text"
          name="busqueda"
          placeholder="Puesto, tecnología o palabra clave"
          value={filtros.busqueda}
          onChange={actualizar}
          className="w-full border rounded-lg p-3"
        />
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="ubicacion"
            placeholder="Ubicación"
            value={filtros.ubicacion}
            onChange={actualizar}
            className="border rounded-lg p-3"
          />
  
          <select
            name="modalidad"
            value={filtros.modalidad}
            onChange={actualizar}
            className="border rounded-lg p-3"
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
            placeholder="Salario mínimo"
            value={filtros.salarioMin}
            onChange={actualizar}
            className="border rounded-lg p-3"
          />
  
          <select
            name="orden"
            value={filtros.orden}
            onChange={actualizar}
            className="border rounded-lg p-3"
          >
            <option value="fecha_desc">Más recientes</option>
            <option value="fecha_asc">Más antiguos</option>
            <option value="titulo_asc">Título A-Z</option>
            <option value="titulo_desc">Título Z-A</option>
            <option value="salario_desc">Mayor salario</option>
          </select>
        </div>
  
        <button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg"
        >
          Buscar empleos
        </button>
      </form>
    );
  }