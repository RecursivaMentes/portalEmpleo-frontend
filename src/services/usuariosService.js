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

export const obtenerUsuarioIdActual = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
        const partes = token.split(".");
        if (partes.length !== 3 || partes.some((parte) => !parte)) return null;

        const payloadBase64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(payloadBase64));
        const usuarioId = payload?.sub;
        const patronGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (typeof usuarioId !== "string" || !patronGuid.test(usuarioId)) return null;
        if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now()) return null;

        return usuarioId;
    } catch {
        return null;
    }
};
