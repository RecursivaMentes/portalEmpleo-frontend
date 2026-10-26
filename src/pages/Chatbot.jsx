import { useState, useEffect, useRef } from 'react';
import { listarChats, crearChat, obtenerMensajes, enviarMensaje } from '../services/chatbotService';

const Chatbot=()=> {
    const [chats, setChats] = useState([]);
    const [chatActivoId, setChatActivoId] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [estaCargando, setEstaCargando] = useState(false);
    const desplegarMensajesFin = useRef(null);

    //lista de chats al iniciar
    useEffect(() => {
        listarChats()
            .then(data => setChats(data))
            .catch(err => console.error(err));
    }, []);

    // para cargar los mensajes cuando el usuario cambie de chat
    useEffect(() => {
        if (chatActivoId) {
            obtenerMensajes(chatActivoId)
                .then(data => setMensajes(data))
                .catch(err => console.error(err));
        } else {
            setMensajes([]);
        }
    }, [chatActivoId]);

    // Auto-scroll al último mensaje enviado o recibido
    useEffect(() => {
        desplegarMensajesFin.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // 3. Crear un nuevo tema de conversación
    const handleCrearNuevoChat = async () => {
        try {
            const nuevoChat = await crearChat(); // Tu endpoint recibe 'Tipo'
            setChats([nuevoChat, ...chats]); // Lo agrega arriba en la lista
            setChatActivoId(nuevoChat.id);   // Lo selecciona automáticamente
        } catch (error) {
            alert("No se pudo crear el chat");
        }
    };

    // 4. Enviar mensaje y manejar la respuesta en tiempo real (Streaming)
    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !chatActivoId) return;

        const mensajeUsuario = {Rol: 'user', Contenido: nuevoMensaje };
  
  
        setMensajes(prev => [...prev, mensajeUsuario]);
        setNuevoMensaje("");
        setEstaCargando(true); // Evita envíos dobles mientras responde la API

        try {
            const respuesta = await enviarMensaje(chatActivoId, mensajeUsuario.Contenido);
    
            //respuesta del bot al chat
            const mensajeBot = { Rol: 'assistant',Contenido: respuesta };
            setMensajes(prev => [...prev, mensajeBot]);
            } catch (error) {
                console.error("Error al enviar el mensaje:", error);
                alert("No se pudo enviar el mensaje");
             } finally {
                setEstaCargando(false);
        }
    };

    return (
        <div style={{ display: 'flex', h: '100vh', height: '100vh', fontFamily: 'sans-serif' }}>
            
            {/* PANEL IZQUIERDO: LISTA DE CHATS */}
            <div style={{ width: '250px', background: '#202123', color: 'white', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <button onClick={handleCrearNuevoChat} style={{ padding: '10px', background: '#10a37f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
                    + Nuevo Chat
                </button>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3>Tus Conversaciones</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {chats.map(c => (
                            <li 
                                key={c.id} 
                                onClick={() => setChatActivoId(c.id)}
                                style={{ padding: '10px', margin: '5px 0', background: chatActivoId === c.id ? '#343541' : 'transparent', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                                Chat #{c.fechaInicio} 
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* PANEL DERECHO: CONVERSACIÓN ACTIVA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#343541', color: 'white' }}>
                {chatActivoId ? (
                    <>
                        {/* Mensajes */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {mensajes.map((m, index) => (
                            <div key={m.id || index} style={{ display: 'flex', justifyContent: m.Rol === 'user' ? 'flex-end' : 'flex-start', margin: '15px 0' }}>
                                <div style={{ maxWidth: '70%', padding: '12px', borderRadius: '10px', background: m.Rol === 'user' ? '#10a37f' : '#444654', lineHeight: '1.4' }}>
                                    <strong>{m.Rol === 'user' ? 'Tú: ' : 'Ollama: '}</strong>           
                                        {m.Contenido} 
                                </div>
                            </div>
                            ))}
                            {estaCargando && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '15px 0' }}>
                                    <div style={{ maxWidth: '70%', padding: '12px', borderRadius: '10px', background: '#444654', color: '#aaa', lineHeight: '1.4' }}>
                                        <strong>Ollama: </strong>
                                            <em>Pensando...</em>
                                    </div>
                                </div>
                            )}
                            <div ref={desplegarMensajesFin} />
                        </div>

                        {/* Input de Envío */}
                        <form onSubmit={handleEnviar} style={{ padding: '20px', background: '#40414f', display: 'flex' }}>
                            <input 
                                type="text" 
                                value={nuevoMensaje}
                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                placeholder="Escribe un mensaje a Ollama..."
                                style={{ flex: 1, padding: '12px', borderRadius: '5px', border: 'none', background: '#40414f', color: 'white', fontSize: '16px', outline: 'none' }}
                                disabled={estaCargando}
                            />
                            <button type="submit" disabled={estaCargando} style={{ marginLeft: '10px', padding: '0 20px', background: '#10a37f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                Enviar
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0a6' }}>
                        <h2>Selecciona un chat o crea uno nuevo para empezar a hablar con Ollama.</h2>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Chatbot;