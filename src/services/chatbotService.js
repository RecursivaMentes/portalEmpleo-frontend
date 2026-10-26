import axios from 'axios';

const API_URL = import.meta.env.VITE_CHATBOT_API_URL;

const getHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");
    return {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    };
};

export const crearChat = async (Tipo) => {
    const payload=Tipo?{Tipo}:{};
    try {
        const response = await axios.post(`${API_URL}/api/chats`,payload,getHeaders());
        return response.data;
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al crear Chat');
    }  
}

export const enviarMensaje=async(idChat,Contenido)=>{
    try {
        const response=await axios.post(`${API_URL}/api/chats/${idChat}/mensajes`,{Contenido},getHeaders());
        return response.data;
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al enviar mensaje');
    }
}

export const listarChats=async()=>{
    try {
        const response=await axios(`${API_URL}/api/chats`,getHeaders())
        return response.data;
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al listar chats');
    }
}

export const obtenerMensajes=async(idChat)=>{
    try {
        const response=await axios(`${API_URL}/api/chats/${idChat}/mensajes`,getHeaders())
        return response.data;
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al obtener mensajes');
    }
}
