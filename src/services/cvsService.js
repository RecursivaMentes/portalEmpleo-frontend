import axios from "axios";

const API_CVS = "/api/cvs";
const API_GENERACION = "/api/generacion-cv";

//config para las cookies
const config = {
    withCredentials: true
};

export const obtenerCvs = async () => {
  const respuesta = await axios.get(API_CVS,config);

  return respuesta.data;
};

export const obtenerCv = async (id) => {
  const respuesta = await axios.get(`${API_CVS}/${id}`,config);

  return respuesta.data;
};

export const crearCv = async (datos) => {
  const respuesta = await axios.post(API_CVS, datos,config);

  return respuesta.data;
};

export const actualizarCv = async (id, datos) => {
  const respuesta = await axios.put(`${API_CVS}/${id}`, datos,config);

  return respuesta.data;
};

export const eliminarCv = async (id) => {
  await axios.delete(`${API_CVS}/${id}`, config);
};

export const subirCv = async (archivo, titulo, esPrincipal = false) => {
  const formulario = new FormData();

  formulario.append("archivo", archivo);
  formulario.append("titulo", titulo);
  formulario.append("esPrincipal", String(esPrincipal));

  const respuesta = await axios.post(`${API_CVS}/archivo`, formulario,config);

  return respuesta.data;
};

export const actualizarArchivoCv = async (id, archivo) => {
  const formulario = new FormData();
  formulario.append("archivo", archivo);

  const respuesta = await axios.put(`${API_CVS}/${id}/archivo`, formulario, config);

  return respuesta.data;
};

export const descargarCv = async (id, nombre = "curriculum.pdf") => {
  const respuesta = await axios.get(`${API_CVS}/${id}/descargar`, {
    ...config,
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
  const respuesta = await axios.post(API_GENERACION, datos,config);

  return respuesta.data;
};

export const descargarArchivoCv = async (id, nombre = "cv-original.pdf") => {
    const respuesta = await axios.get(`/api/cvs/${id}/archivo`, {
      ...config,
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

export const obtenerVistaPreviaCv = async (id) => {
  const respuesta = await axios.get(`/api/cvs/${id}/descargar`, {
    ...config,
    responseType: "blob",
  });

  return URL.createObjectURL(
    new Blob([respuesta.data], { type: "application/pdf" })
  );
};
