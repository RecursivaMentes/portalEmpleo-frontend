import { useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { Briefcase, Sparkles, FileText, ClipboardList, ChevronDown, BriefcaseBusiness, User, UserCircle, LogOut, LogIn } from 'lucide-react';
import Empleos from './pages/Empleos';
import Recomendaciones from './pages/Recomendaciones';
import IniciarSesion from './pages/IniciarSesion';
import Registrarse from './pages/Registrarse';
import Chatbot from './pages/Chatbot';
import Cvs from './pages/Cvs';
import FormDatosPersonales from './components/FormDatosPersonales';
import Postulaciones from './pages/Postulaciones';
import PerfilLaboral from './pages/PerfilLaboral';
import CambiarContrasena from './pages/CambiarContrasena';
import RecuperarContrasena from './pages/RecuperarContrasena';
import ModalAutenticacion from './components/Autenticacion';
import AvisosGlobales from './components/Avisos';
import { cerrarSesionUsuario, obtenerUsuarioIdActual,obtenerDatosPersonales } from './services/usuariosService';

const enlaceBase = 'inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer';
const claseEnlace = ({ isActive }) => `${enlaceBase} ${isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-primary-700 hover:border-primary-200'}`;

function MenuUsuario({ salir }) {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    function fuera(e) { if (!menuRef.current?.contains(e.target)) setAbierto(false); }
    function escapar(e) { if (e.key === 'Escape') setAbierto(false); }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escapar);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', escapar); };
  }, [abierto]);
  const opciones = [
    ['/perfil/datos', 'Datos personales', User],
    ['/perfil/laboral', 'Perfil laboral', BriefcaseBusiness],
    ['/perfil/seguridad', 'Cambiar contraseña', User],
    ['/cvs', 'Mis CV', FileText],
  ];
  return <div className="relative ml-auto" ref={menuRef} onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)} >
    <button type="button" aria-label="Menú de usuario" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(true)} className={`${enlaceBase} border-transparent text-slate-600 hover:text-primary-700`}><UserCircle size={23}/><span className="hidden sm:inline">Mi cuenta</span></button>
    {abierto && <div role="menu" className="absolute right-0 top-full z-50 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
      {opciones.map(([ruta, titulo, Icono]) => <NavLink key={ruta} role="menuitem" to={ruta} onClick={() => setAbierto(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><Icono size={16}/>{titulo}</NavLink>)}
      <div className="my-1 border-t border-slate-100"/><button role="menuitem" type="button" onClick={() => { setAbierto(false); salir(); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"><LogOut size={16}/>Cerrar sesión</button>
    </div>}
  </div>;
}

function MenuPostulaciones({ proteger }) {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    function fuera(e) { if (!menuRef.current?.contains(e.target)) setAbierto(false); }
    function escapar(e) { if (e.key === 'Escape') setAbierto(false); }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escapar);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', escapar); };
  }, [abierto]);
  const items = [['/postulaciones/pendientes', 'Pendientes'], ['/postulaciones/aprobaciones', 'Requieren tu aprobación'], ['/postulaciones/realizadas', 'Realizadas']];
  return <div ref={menuRef} onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)} className="relative" >
    <button type="button" aria-label="Postulaciones" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(true)} className={`${enlaceBase} border-transparent text-slate-500 hover:text-primary-700 hover:border-primary-200`}><ClipboardList size={18}/>Postulaciones<ChevronDown size={14}/></button>
    {abierto && <div role="menu" className="absolute left-0 top-full z-50 w-60 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
      {items.map(([ruta, texto]) => <NavLink key={ruta} role="menuitem" to={ruta} onClick={(e) => { proteger(e, texto); if (!e.defaultPrevented) setAbierto(false); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-primary-50">{texto}</NavLink>)}
    </div>}
  </div>;
}
function Pendiente({ solicitarIngreso }) {
  useEffect(() => { solicitarIngreso('Iniciá sesión para acceder a esta sección.'); }, [solicitarIngreso]);
  return <div className="mx-auto max-w-xl px-5 py-14 text-center"><p className="text-slate-700">Iniciá sesión para continuar.</p><button onClick={() => solicitarIngreso('Iniciá sesión para acceder a esta sección.')} className="mt-4 rounded-xl bg-primary-600 px-5 py-3 text-white cursor-pointer">Iniciar sesión</button></div>;
}

export default function App() {
  const navigate = useNavigate();
  const [chatAbierto, setChatAbierto] = useState(false);
  const [chatMontado, setChatMontado] = useState(false);
  const [chatPeticion, setChatPeticion] = useState(null);
  const [usuarioId, setUsuarioId] = useState(() => obtenerUsuarioIdActual());
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [modal, setModal] = useState({ abierto: false, motivo: '' });
  const pedirLogin = useCallback((motivo = 'Iniciá sesión para continuar.') => setModal({ abierto: true, motivo }), []);
  const cerrarModal = useCallback(() => setModal({ abierto: false, motivo: '' }), []);

  useEffect(() => {
    const actualizar = () => setUsuarioId(obtenerUsuarioIdActual());
    obtenerDatosPersonales()
    .catch(() => {})
    .finally(() => {
      actualizar();
      setVerificandoSesion(false);
    });
    window.addEventListener('auth-changed', actualizar);
    window.addEventListener('storage', actualizar);
    return () => { window.removeEventListener('auth-changed', actualizar); window.removeEventListener('storage', actualizar); };
  }, []);

  // Cualquier pantalla puede abrir el chat: window.dispatchEvent(new CustomEvent('abrir-chatbot', { detail: { mensaje } }))
  useEffect(() => {
    const abrir = (e) => {
      if (!usuarioId) { pedirLogin('Iniciá sesión para acceder a Chatbot.'); return; }
      setChatMontado(true);
      setChatAbierto(true);
      setChatPeticion({ id: Date.now(), mensaje: e.detail?.mensaje ?? '' });
    };
    window.addEventListener('abrir-chatbot', abrir);
    return () => window.removeEventListener('abrir-chatbot', abrir);
  }, [usuarioId, pedirLogin]);
  const chatVisible = chatAbierto && !!usuarioId;
  useEffect(() => {
    if (!chatVisible) return;
    const escapar = (e) => { if (e.key === 'Escape') setChatAbierto(false); };
    document.addEventListener('keydown', escapar);
    return () => document.removeEventListener('keydown', escapar);
  }, [chatVisible]);

  const salir = () => { setChatAbierto(false); setChatMontado(false); cerrarSesionUsuario(); navigate('/empleos', { replace: true }); };
  const navegarProtegido = (e, destino) => {
    if (usuarioId) return;
    e.preventDefault();
    pedirLogin(`Iniciá sesión para acceder a ${destino}.`);
  };
  const acceso = (elemento) => {
    if (verificandoSesion) return null; 
    return usuarioId ? elemento : <Pendiente solicitarIngreso={pedirLogin}/>;
  };
  return <>
    <Routes>
      <Route path="/iniciarSesion" element={<IniciarSesion/>}/>
      <Route path="/registrarse" element={<Registrarse/>}/>
      <Route path="/recuperar-clave" element={<RecuperarContrasena/>}/>
      <Route path="/*" element={<>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40"><nav className="max-w-6xl mx-auto px-5 flex flex-wrap items-center gap-2">
          <NavLink to="/empleos" className={claseEnlace}><Briefcase size={18} className="text-slate-400"/>Buscar empleos</NavLink>
          <NavLink to="/recomendaciones" onClick={(e) => navegarProtegido(e, 'Mis recomendaciones')} className={claseEnlace}><Sparkles size={18} className="text-slate-400"/>Mis recomendaciones</NavLink>
          <MenuPostulaciones proteger={navegarProtegido}/>
          <NavLink to="/cvs" onClick={(e) => navegarProtegido(e, 'Mis CV')} className={claseEnlace}><FileText size={18}/>Mis CV</NavLink>
          {usuarioId ? <MenuUsuario salir={salir}/> : <button type="button" onClick={() => pedirLogin()} className={`${enlaceBase} ml-auto border-transparent text-slate-600 hover:text-primary-700`}><LogIn size={19}/>Iniciar sesión</button>}
        </nav></header>
        <main><Routes>
          <Route path="empleos" element={<Empleos onSolicitarLogin={pedirLogin}/>}/>
          <Route path="recomendaciones" element={acceso(<Recomendaciones usuarioId={usuarioId} onSolicitarLogin={pedirLogin}/>)}/>
          <Route path="chatbot" element={<Navigate to="/empleos" replace/>}/>
          <Route path="cvs" element={acceso(<Cvs/>)}/>
          <Route path="postulaciones/:seccion" element={acceso(<Postulaciones/>)}/>
          <Route path="postulaciones" element={<Navigate to="/postulaciones/pendientes" replace/>}/>
          <Route path="perfil/datos" element={acceso(<FormDatosPersonales actualizar/>)}/>
          <Route path="perfil/laboral" element={acceso(<PerfilLaboral/>)}/>
          <Route path="perfil/seguridad" element={acceso(<CambiarContrasena/>)}/>
          <Route path="" element={<Navigate to="/empleos" replace/>}/>
          <Route path="*" element={<Navigate to="/empleos" replace/>}/>
        </Routes></main>
        {usuarioId && chatMontado && <aside aria-hidden={!chatVisible} inert={!chatVisible} className={`fixed inset-y-0 right-0 z-50 w-full border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 sm:w-[420px] ${chatVisible ? 'translate-x-0' : 'translate-x-full'}`}><Chatbot onCerrar={() => setChatAbierto(false)} peticion={chatPeticion}/></aside>}
      </>}/>
    </Routes>
    <AvisosGlobales/>
    <ModalAutenticacion abierto={modal.abierto} motivo={modal.motivo} onCerrar={cerrarModal} onExito={cerrarModal}/>
  </>;
}
