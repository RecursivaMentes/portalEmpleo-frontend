const API_URL = "/api/postulaciones";

function obtenerHeaders() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Debés iniciar sesión para postularte.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function procesarRespuesta(response) {
  if (response.status === 401) {
    throw new Error(
      "Tu sesión venció o no es válida. Iniciá sesión nuevamente."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "No tenés autorización para realizar esta operación."
    );
  }

  const resultado = await response.json();

  if (!response.ok) {
    throw new Error(
      resultado.mensaje || "Ocurrió un error al consultar la API."
    );
  }

  return resultado;
}

export async function yaEstaPostulado(usuarioId, empleoId) {
  if (!usuarioId || !empleoId) return false;

  const response = await fetch(
    `${API_URL}/usuario/${usuarioId}`,
    {
      headers: obtenerHeaders(),
    }
  );

  const postulaciones = await procesarRespuesta(response);

  return postulaciones.some(
    (postulacion) => postulacion.empleoId === empleoId
  );
}

export async function registrarPostulacion(
  usuarioId,
  empleoId,
  cvId
) {
  if (!usuarioId || !empleoId || !cvId) {
    throw new Error(
      "Faltan datos para registrar la postulación."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: obtenerHeaders(),
    body: JSON.stringify({
      usuarioId,
      empleoId,
      cvId,
      textoPresentacion: null,
    }),
  });

  return procesarRespuesta(response);
}

export async function obtenerPostulacionesUsuario(usuarioId) {
  if (!usuarioId) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const response = await fetch(
    `${API_URL}/usuario/${usuarioId}`,
    {
      headers: obtenerHeaders(),
    }
  );

  return procesarRespuesta(response);
}
