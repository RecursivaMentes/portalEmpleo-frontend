import { useState, useEffect, useRef } from 'react';
import { Bot, Menu, MessageSquare, Plus, Send, X } from 'lucide-react';
import { listarChats, crearChat, obtenerMensajes, enviarMensaje } from '../services/chatbotService';

const formatearFecha = (f) => new Date(f).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const Chatbot=({ onCerrar })=> {
    const [chats, setChats] = useState([]);
    const [chatActivoId, setChatActivoId] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [estaCargando, setEstaCargando] = useState(false);
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [error, setError] = useState("");
    const desplegarMensajesFin = useRef(null);

    //lista de chats al iniciar
    useEffect(() => {
        listarChats()
            .then(data => setChats(data))
            .catch(err => console.error(err));
    }, []);

    // para cargar los mensajes cuando el usuario cambie de chat
    useEffect(() => {
        let activo = true;
        if (chatActivoId) {
            obtenerMensajes(chatActivoId)
                .then(data => { if (activo) setMensajes(data); })
                .catch(err => { if (activo) console.error(err); });
        } else {
            Promise.resolve().then(() => { if (activo) setMensajes([]); });
        }
        return () => { activo = false; };
    }, [chatActivoId]);

    // Auto-scroll al último mensaje enviado o recibido
    useEffect(() => {
        desplegarMensajesFin.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // 3. Crear un nuevo tema de conversación
    const handleCrearNuevoChat = async () => {
        try {
            setError("");
            const nuevoChat = await crearChat(); // { id, tipo, fechaInicio }
            setChats([nuevoChat, ...chats]); // Lo agrega arriba en la lista
            setChatActivoId(nuevoChat.id);   // Lo selecciona automáticamente
            setPanelAbierto(false);
        } catch {
            setError("No se pudo crear el chat");
        }
    };

    const seleccionarChat = (id) => { setChatActivoId(id); setPanelAbierto(false); };

    // 4. Enviar mensaje. La API responde con todo el texto junto (no hay streaming):
    //    { mensajeUsuario: { id, rol, contenido, fecha }, respuesta: { id, rol, contenido, fecha } }
    const handleEnviar = async (e) => {
        e.preventDefault();
        const texto = nuevoMensaje.trim();
        if (!texto || !chatActivoId) return;

        // Se muestra enseguida con un id temporal; al llegar la respuesta se reemplaza por el real.
        const idTemporal = `tmp-${Date.now()}`;
        setMensajes(prev => [...prev, { id: idTemporal, rol: 'Usuario', contenido: texto }]);
        setNuevoMensaje("");
        setError("");
        setEstaCargando(true); // Evita envíos dobles mientras responde la API

        try {
            const resultado = await enviarMensaje(chatActivoId, texto);

            setMensajes(prev => [
                ...prev.filter(m => m.id !== idTemporal),
                resultado.mensajeUsuario,
                resultado.respuesta,
            ]);
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            // Si la API falla no guarda nada: se quita el mensaje y se devuelve el texto al cuadro para reintentar.
            setMensajes(prev => prev.filter(m => m.id !== idTemporal));
            setNuevoMensaje(texto);
            setError(error.message);
        } finally {
            setEstaCargando(false);
        }
    };

    const avatar = <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Bot size={16}/></span>;

    return (
        <div className="relative flex h-full overflow-hidden bg-slate-50">

            {/* PANEL IZQUIERDO: LISTA DE CHATS */}
            <aside className={`${panelAbierto ? 'flex' : 'hidden'} absolute inset-y-0 left-0 z-20 w-72 max-w-[85%] flex-col border-r border-slate-200 bg-white p-4 shadow-xl`}>
                <button onClick={handleCrearNuevoChat} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                    <Plus size={18}/> Nuevo chat
                </button>
                <h3 className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tus conversaciones</h3>
                <ul className="flex-1 space-y-1 overflow-y-auto">
                    {chats.length === 0 && <li className="px-2 text-sm text-slate-400">Todavía no tenés conversaciones.</li>}
                    {chats.map(c => (
                        <li key={c.id}>
                            <button onClick={() => seleccionarChat(c.id)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${chatActivoId === c.id ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                                <MessageSquare size={16} className="shrink-0"/>
                                <span className="truncate">Chat del {formatearFecha(c.fechaInicio)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* PANEL DERECHO: CONVERSACIÓN ACTIVA */}
            <section className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                    <button onClick={() => setPanelAbierto(v => !v)} aria-label="Ver conversaciones" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Menu size={20}/></button>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Bot size={20}/></span>
                    <p className="flex-1 text-sm font-semibold text-slate-800">Asistente de empleo</p>
                    {onCerrar && <button onClick={onCerrar} aria-label="Cerrar chat" className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button>}
                </div>

                {chatActivoId ? (
                    <>
                        {/* Mensajes */}
                        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-6">
                            {mensajes.map((m, index) => {
                                const esUsuario = m.rol === 'Usuario';
                                return (
                                    <div key={m.id || index} className={`flex items-end gap-2 ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                                        {!esUsuario && avatar}
                                        <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm md:max-w-[70%] ${esUsuario ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}>
                                            {m.contenido}
                                        </div>
                                    </div>
                                );
                            })}
                            {estaCargando && (
                                <div className="flex items-end gap-2">
                                    {avatar}
                                    <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm" aria-label="El asistente está escribiendo">
                                        {[0, 150, 300].map(d => <span key={d} style={{ animationDelay: `${d}ms` }} className="h-2 w-2 animate-bounce rounded-full bg-slate-400"/>)}
                                    </div>
                                </div>
                            )}
                            <div ref={desplegarMensajesFin} />
                        </div>

                        {/* Input de Envío */}
                        <div className="border-t border-slate-200 bg-white px-4 py-3">
                            {error && <p role="alert" className="mx-auto mb-2 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                            <form onSubmit={handleEnviar} className="mx-auto flex max-w-3xl items-center gap-2">
                                <input
                                    type="text"
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    placeholder="Escribí un mensaje..."
                                    disabled={estaCargando}
                                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                                />
                                <button type="submit" disabled={estaCargando || !nuevoMensaje.trim()} aria-label="Enviar" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                                    <Send size={18}/>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg"><Bot size={32}/></span>
                        <h2 className="mt-5 text-xl font-bold text-slate-800">¿En qué te puedo ayudar?</h2>
                        <p className="mt-2 max-w-md text-sm text-slate-500">Creá una conversación nueva o elegí una existente para hablar con el asistente.</p>
                        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                        <button onClick={handleCrearNuevoChat} className="mt-6 flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"><Plus size={18}/> Empezar un chat</button>
                    </div>
                )}
            </section>
        </div>
    );
}
export default Chatbot;
