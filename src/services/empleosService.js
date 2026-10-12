const API_URL = import.meta.env.VITE_API_URL;

export async function obtenerEmpleos(filtros = {}) {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== "" && valor !== null && valor !== undefined) {
      params.append(clave, valor);
    }
  });

  const response = await fetch(
    `${API_URL}/api/empleos?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener los empleos");
  }

  return response.json();
}