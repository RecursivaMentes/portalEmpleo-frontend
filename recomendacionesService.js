const API_URL = "/api/recomendaciones";

export async function obtenerRecomendaciones(usuarioId) {
  if (!usuarioId) {
    throw new Error("El identificador del usuario es obligatorio");
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("No hay una sesión activa");
  }

  const response = await fetch(
    `${API_URL}/usuario/${encodeURIComponent(usuarioId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Error al obtener recomendaciones: HTTP ${response.status}`);
  }

  return response.json();
}
