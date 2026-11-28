import axios from "axios";

// Servicio de Chatbot: la IA lee un CV y propone datos para el perfil laboral (RF-09 y RF-10).
// Se hace en dos pasos para que la persona controle lo que entra a su perfil:
//   1. analizarCv      -> devuelve una propuesta. No guarda nada.
//   2. aplicarPropuesta -> guarda solo lo que la persona confirmó. Nunca borra ni pisa datos existentes.
const API_ANALISIS = "/api/analisis-cv";

const config = {
  withCredentials: true,
};

// La IA puede tardar: se da más margen que el resto de las llamadas.
const TIEMPO_MAXIMO_IA_MS = 120_000;

export const analizarCv = async (cvId) => {
  const respuesta = await axios.post(API_ANALISIS, { cvId }, { ...config, timeout: TIEMPO_MAXIMO_IA_MS });
  return respuesta.data;
};

export const aplicarPropuesta = async (cuerpo) => {
  const respuesta = await axios.post(`${API_ANALISIS}/aplicar`, cuerpo, config);
  return respuesta.data;
};
