const API_URL = import.meta.env.VITE_RECOMENDACIONES_API_URL;

export async function obtenerRecomendaciones(usuarioId) {
  if (!usuarioId) {
    throw new Error("El identificador del usuario es obligatorio");
  }

  const response = await fetch(
    `${API_URL}/api/recomendaciones/usuario/${encodeURIComponent(usuarioId)}`
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener las recomendaciones laborales");
  }

  return response.json();
}
