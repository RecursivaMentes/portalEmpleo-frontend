const API_URL = import.meta.env.VITE_RECOMENDACIONES_API_URL;
const USUARIOS_URL = import.meta.env.VITE_USUARIOS_API_URL;

export async function obtenerRecomendaciones(usuarioId) {
  const fetchOptions = {
    credentials: "include",
  };

  let id = usuarioId;

  if (!id) {
    const perfilResponse = await fetch(
      `${USUARIOS_URL}/api/auth/profile`,
      fetchOptions
    );

    // Si no hay cookie o expiró, .NET responde 401
    if (perfilResponse.status === 401) {
      throw new Error("Iniciá sesión para consultar tus recomendaciones");
    }

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
    fetchOptions
  );

  //otra vez, pero ahora si es que se paso id
  if (response.status === 401) {
    throw new Error("Iniciá sesión para consultar tus recomendaciones");
  }

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