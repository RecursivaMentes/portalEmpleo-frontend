/** Interpreta errores HTTP de los servicios de CV, Usuarios y Chatbot sin mostrar códigos crudos al usuario. */
const fallbackPorEstado = {
  400: "Revisá los datos ingresados y corregí los campos indicados.",
  401: "Tu sesión venció o no es válida. Iniciá sesión nuevamente.",
  403: "No tenés permisos para realizar esta operación.",
  404: "El recurso solicitado no existe o ya no está disponible.",
  408: "La solicitud tardó demasiado. Verificá si se completó antes de reintentar.",
  409: "La operación entró en conflicto con los datos actuales. Actualizá la información y volvé a intentarlo.",
  413: "El archivo es demasiado grande. El límite para CV es de 5 MB.",
  415: "El tipo de archivo no está permitido. Elegí PDF o DOCX.",
  422: "No se pudo completar la operación. Revisá la información e intentá nuevamente.",
  429: "Se realizaron demasiadas solicitudes. Volvé a intentarlo más tarde.",
  500: "Ocurrió un problema interno. Volvé a intentarlo más tarde.",
  502: "No se pudo completar correctamente la respuesta del servicio de IA. Podés volver a intentarlo.",
  503: "El servicio no está disponible por el momento. Intentá nuevamente más tarde.",
  504: "El servicio tardó demasiado en responder. Verificá si la operación se completó antes de reintentar.",
};
const limpiar = (valor) => typeof valor === "string" ? valor.trim() : "";
const extraerCampos = (errores) => {
  if (!errores || typeof errores !== "object" || Array.isArray(errores)) return [];
  return Object.entries(errores).flatMap(([campo, mensajes]) => {
    const lista = Array.isArray(mensajes) ? mensajes : [mensajes];
    return lista.map(limpiar).filter(Boolean).map(m =>
      campo === "" || campo === "$" ? m : campo + ": " + m
    );
  });
};
export function obtenerMensajeErrorCv(error, alternativo = "No se pudo completar la operación.") {
  const respuesta = error?.response;
  if (!respuesta) {
    if (!error?.isAxiosError && typeof error?.message === "string" && error.message.trim()) return error.message.trim();
    if (error?.code === "ERR_CANCELED") return "La operación fue cancelada.";
    if (error?.code === "ECONNABORTED") return "La solicitud tardó demasiado. Verificá si se completó antes de reintentar.";
    return "No pudimos comunicarnos con el servidor. Revisá tu conexión e intentá nuevamente.";
  }
  const datos = respuesta.data;
  const detalles = extraerCampos(datos?.errors);
  if (detalles.length) return detalles.join(" · ");
  if (respuesta.status === 401) return fallbackPorEstado[401];
  if (respuesta.status === 403) return fallbackPorEstado[403];
  const mensaje = limpiar(datos?.message) || limpiar(datos?.mensaje) || limpiar(datos?.title) || limpiar(datos?.detail);
  if (mensaje && mensaje !== "One or more validation errors occurred.") return mensaje;
  return fallbackPorEstado[respuesta.status] || alternativo;
}

/** Recupera mensajes JSON de errores HTTP en descargas de archivos CV. */
export async function obtenerMensajeErrorDescargaCv(error, alternativo) {
  const datos = error?.response?.data;
  if (typeof Blob !== "undefined" && datos instanceof Blob && datos.size > 0 && datos.size < 65536) {
    const tipo = String(datos.type || "").toLowerCase();
    if (tipo.includes("json")) {
      try {
        const json = JSON.parse(await datos.text());
        return obtenerMensajeErrorCv({ ...error, response: { ...error.response, data: json } }, alternativo);
      } catch { /* Se muestra el error HTTP de respaldo. */ }
    }
  }
  return obtenerMensajeErrorCv(error, alternativo);
}
