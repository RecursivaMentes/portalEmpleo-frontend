import axios from 'axios';

const API_URL = import.meta.env.VITE_CHATBOT_API_URL;

//config para las cookies
const config = {
    withCredentials: true
};

export const crearChat = async (Tipo) => {
    const payload=Tipo?{Tipo}:{};
    try {
        const response = await axios.post(`${API_URL}/api/chats`,payload,config);
        return response.data;
    } catch (error) {
            console.log(error.response?.data ?? error.message);
        
        throw new Error(error.response?.data?.message || 'Error al crear Chat');
    }  
}

export const enviarMensaje=async(idChat,Contenido)=>{
    try {
        const response=await axios.post(`${API_URL}/api/chats/${idChat}/mensajes`,{Contenido},config);
        return response.data;
    } catch (error) {
            console.log(error.response?.data ?? error.message);
        
        throw new Error(error.response?.data?.message || 'Error al enviar mensaje');
    }
}

export const listarChats=async()=>{
    try {
        const response=await axios(`${API_URL}/api/chats`,config)
        return response.data;
    } catch (error) {
            console.log(error.response?.data ?? error.message);
        
        throw new Error(error.response?.data?.message || 'Error al listar chats');
    }
}

export const obtenerMensajes=async(idChat)=>{
    try {
        const response=await axios(`${API_URL}/api/chats/${idChat}/mensajes`,config)
        return response.data;
    } catch (error) {
            console.log(error.response?.data ?? error.message);
        
        throw new Error(error.response?.data?.message || 'Error al obtener mensajes');
    }
}
