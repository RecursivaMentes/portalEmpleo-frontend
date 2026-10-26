const API_URL = import.meta.env.VITE_RECOMENDACIONES_API_URL;
const USUARIOS_URL = import.meta.env.VITE_USUARIOS_API_URL;

export async function obtenerRecomendaciones(usuarioId) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Iniciá sesión para consultar tus recomendaciones");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  let id = usuarioId;

  if (!id) {
    const perfilResponse = await fetch(
      `${USUARIOS_URL}/api/auth/profile`,
      { headers }
    );

    if (!perfilResponse.ok) {
      throw new Error("No se pudo obtener el usuario autenticado");
    }

    const perfil = await perfilResponse.json();
    id = perfil.id;
  }

  if (!id) {
    throw new Error("El identificador del usuario es obligatorio");
  }

  const response = await fetch(
    `${API_URL}/api/recomendaciones/usuario/${encodeURIComponent(id)}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("No se pudieron obtener las recomendaciones laborales");
  }

  const datos = await response.json();

  return Array.isArray(datos)
    ? datos.map(empleo => ({
        ...empleo,
        requisitosCoincidentes:
          empleo.coincidencias ?? empleo.requisitosCoincidentes ?? []
      }))
    : datos;
}