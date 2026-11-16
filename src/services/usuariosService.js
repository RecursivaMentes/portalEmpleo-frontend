import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;

//config para las cookies
const config = {
    withCredentials: true
};

export const iniciarSesion = async (usuario) => {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, usuario,config);
    } catch (error) {
        throw error.response?.data
    }  
}

export const registrarse = async (usuario)=>{
    try {
        await axios.post(`${API_URL}/api/auth/register`, usuario)
    } catch (error) {
        throw error.response?.data || { message: "Error al registrarse" };
    }
}

export const obtenerDatosPersonales = async()=>{
    try {
        const response=await axios(`${API_URL}/api/auth/profile`,config)
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al traer datos del perfil');
    }
}

export const actualizarDatosPersonales=async(usuario)=>{
    try {
        const response=await axios.put(`${API_URL}/api/auth/profile`,usuario,config);
        return response.data;
    } catch (error) {
        throw error.response?.data;
    }
}

export const cerrarSesion=async()=>{
    try {
        await axios.post(`${API_URL}/api/auth/logout`,{},config)
    } catch (error) {
        throw error.response?.data || { message: "Error al cerrar sesión" };
    }
}