import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;

const getHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    return {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    };
};

export const iniciarSesion = async (usuario) => {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, usuario);
        localStorage.setItem("accessToken", response.data.accessToken);
    } catch (error) {
        throw error.response?.data
    }  
}

export const registrarse = async (usuario)=>{
    try {
        await axios.post(`${API_URL}/api/auth/register`, usuario)
    } catch (error) {
        console.log("error en service: ", error.response.data);
        throw error.response?.data || { message: "Error de conexión con el servidor" };
    }
}

export const obtenerDatosPersonales = async()=>{
    try {
        const response=await axios(`${API_URL}/api/auth/profile`,getHeaders())
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error al traer datos del perfil');
    }
}

export const actualizarDatosPersonales=async(usuario)=>{
    try {
        const response=await axios.put(`${API_URL}/api/auth/profile`,usuario,getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data;
    }
}