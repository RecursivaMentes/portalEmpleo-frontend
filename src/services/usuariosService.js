import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;

export const iniciarSesion = async (usuario) => {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, usuario);
        localStorage.setItem("accessToken", response.data.accessToken);
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }  
}
