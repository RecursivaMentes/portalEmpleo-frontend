import axios from "axios";

const API_CVS = "/api/cvs";
const API_GENERACION = "/api/generacion-cv";

const obtenerHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export const obtenerCvs = async () => {
  const respuesta = await axios.get(API_CVS, {
    headers: obtenerHeaders(),
  });

  return respuesta.data;
};

export const obtenerCv = async (id) => {
  const respuesta = await axios.get(`${API_CVS}/${id}`, {
    headers: obtenerHeaders(),
  });

  return respuesta.data;
};

export const crearCv = async (datos) => {
  const respuesta = await axios.post(API_CVS, datos, {
    headers: obtenerHeaders(),
  });

  return respuesta.data;
};

export const actualizarCv = async (id, datos) => {
  if (!Number.isSafeInteger(datos?.version) || datos.version < 1) {
    throw new Error("No se pudo identificar la version del CV. Recarga el CV antes de guardar.");
  }
  const respuesta = await axios.put(`${API_CVS}/${id}`, datos, {
    headers: obtenerHeaders(),
  });
  return respuesta.data;
};

export const eliminarCv = async (id, version) => {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("No se pudo identificar la version del CV. Actualiza el listado antes de eliminar.");
  }
  await axios.delete(`${API_CVS}/${id}`, {
    headers: { ...obtenerHeaders(), "If-Match": String(version) },
  });
};

export const subirCv = async (archivo, titulo, esPrincipal = false) => {
  const formulario = new FormData();

  formulario.append("archivo", archivo);
  formulario.append("titulo", titulo);
  formulario.append("esPrincipal", String(esPrincipal));

  const respuesta = await axios.post(`${API_CVS}/archivo`, formulario, {
    headers: obtenerHeaders(),
  });

  return respuesta.data;
};

export const actualizarArchivoCv = async (id, archivo, version) => {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("No se pudo identificar la version del CV. Actualiza el CV antes de reemplazar el archivo.");
  }
  const formulario = new FormData();
  formulario.append("archivo", archivo);
  const respuesta = await axios.put(`${API_CVS}/${id}/archivo`, formulario, {
    headers: { ...obtenerHeaders(), "If-Match": String(version) },
  });
  return respuesta.data;
};

export const descargarCv = async (id, nombre = "curriculum.pdf") => {
  const respuesta = await axios.get(`${API_CVS}/${id}/descargar`, {
    headers: obtenerHeaders(),
    responseType: "blob",
  });

  const url = URL.createObjectURL(respuesta.data);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
};

export const generarCvIA = async (datos) => {
  const respuesta = await axios.post(API_GENERACION, datos, {
    headers: obtenerHeaders(),
  });

  return respuesta.data;
};

export const descargarArchivoCv = async (id, titulo = "cv-original") => {
  const respuesta = await axios.get(`${API_CVS}/${id}/archivo`, {
    headers: obtenerHeaders(),
    responseType: "blob",
  });

  const tipo = String(respuesta.headers?.["content-type"] || respuesta.data?.type || "").toLowerCase();
  const disposicion = String(respuesta.headers?.["content-disposition"] || "");
  let nombreServidor = "";
  const codificado = disposicion.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i);
  if (codificado) {
    try { nombreServidor = decodeURIComponent(codificado[1].trim().replace(/^"|"$/g, "")); }
    catch { nombreServidor = ""; }
  }
  if (!nombreServidor) {
    nombreServidor = disposicion.match(/filename\s*=\s*"([^"]+)"/i)?.[1] ||
      disposicion.match(/filename\s*=\s*([^;]+)/i)?.[1]?.trim() || "";
  }
  const extension = tipo.includes("wordprocessingml") ? ".docx" :
    tipo.includes("pdf") ? ".pdf" : "";
  const nombreBase = String(titulo || "cv-original").replace(/[\\/:*?"<>|\p{Cc}]/gu, "_");
  const nombreSeguro = nombreServidor.split(/[\\/]/).pop().replace(/[\p{Cc}]/gu, "").trim();
  const nombre = nombreSeguro || `${nombreBase}-original${extension || ".bin"}`;

  const url = URL.createObjectURL(respuesta.data);
  try {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export const obtenerVistaPreviaCv = async (id) => {
  const respuesta = await axios.get(`/api/cvs/${id}/descargar`, {
    headers: obtenerHeaders(),
    responseType: "blob",
  });

  return URL.createObjectURL(
    new Blob([respuesta.data], { type: "application/pdf" })
  );
};
