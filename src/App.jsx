import { useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { Briefcase, Sparkles, Bot, FileText, User, UserCircle, LogOut, LogIn } from 'lucide-react';
import Empleos from './pages/Empleos';
import Recomendaciones from './pages/Recomendaciones';
import IniciarSesion from './pages/IniciarSesion';
import Registrarse from './pages/Registrarse';
import Chatbot from './pages/Chatbot';
import Cvs from './pages/Cvs';
import FormDatosPersonales from './components/FormDatosPersonales';
import ModalAutenticacion from './components/Autenticacion';
import AvisosGlobales from './components/Avisos';
import { cerrarSesionUsuario, obtenerUsuarioIdActual } from './services/usuariosService';

const enlaceBase = 'inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer';
const claseEnlace = ({ isActive }) => `${enlaceBase} ${isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-blue-700 hover:border-blue-200'}`;

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
    ['/cvs', 'Mis CV', FileText],
  ];
  return <div className="relative ml-auto" ref={menuRef} onMouseEnter={() => setAbierto(true)} onMouseLeave={() => setAbierto(false)}>
    <button type="button" aria-label="Menú de usuario" aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)} onFocus={() => setAbierto(true)} className={`${enlaceBase} border-transparent text-slate-600 hover:text-blue-700`}><UserCircle size={23}/><span className="hidden sm:inline">Mi cuenta</span></button>
    {abierto && <div role="menu" className="absolute right-0 top-full z-50 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
      {opciones.map(([ruta, titulo, Icono]) => <NavLink key={ruta} role="menuitem" to={ruta} onClick={() => setAbierto(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><Icono size={16}/>{titulo}</NavLink>)}
      <div className="my-1 border-t border-slate-100"/><button role="menuitem" type="button" onClick={() => { setAbierto(false); salir(); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"><LogOut size={16}/>Cerrar sesión</button>
    </div>}
  </div>;
}

function Pendiente({ solicitarIngreso }) {
  useEffect(() => { solicitarIngreso('Iniciá sesión para acceder a esta sección.'); }, [solicitarIngreso]);
  return <div className="mx-auto max-w-xl px-5 py-14 text-center"><p className="text-slate-700">Iniciá sesión para continuar.</p><button onClick={() => solicitarIngreso('Iniciá sesión para acceder a esta sección.')} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white cursor-pointer">Iniciar sesión</button></div>;
}

export default function App() {
  const navigate = useNavigate();
  const [usuarioId, setUsuarioId] = useState(() => obtenerUsuarioIdActual());
  const [modal, setModal] = useState({ abierto: false, motivo: '' });
  const pedirLogin = useCallback((motivo = 'Iniciá sesión para continuar.') => setModal({ abierto: true, motivo }), []);
  const cerrarModal = useCallback(() => setModal({ abierto: false, motivo: '' }), []);

  useEffect(() => {
    const actualizar = () => setUsuarioId(obtenerUsuarioIdActual());
    window.addEventListener('auth-changed', actualizar);
    window.addEventListener('storage', actualizar);
    return () => { window.removeEventListener('auth-changed', actualizar); window.removeEventListener('storage', actualizar); };
  }, []);

  const salir = () => { cerrarSesionUsuario(); navigate('/empleos', { replace: true }); };
  const navegarProtegido = (e, destino) => {
    if (usuarioId) return;
    e.preventDefault();
    pedirLogin(`Iniciá sesión para acceder a ${destino}.`);
  };
  const acceso = (elemento) => usuarioId ? elemento : <Pendiente solicitarIngreso={pedirLogin}/>;

  return <>
    <Routes>
      <Route path="/iniciarSesion" element={<IniciarSesion/>}/>
      <Route path="/registrarse" element={<Registrarse/>}/>
      <Route path="/*" element={<>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40"><nav className="max-w-6xl mx-auto px-5 flex flex-wrap items-center gap-2">
          <NavLink to="/empleos" className={claseEnlace}><Briefcase size={18} className="text-slate-400"/>Buscar empleos</NavLink>
          <NavLink to="/recomendaciones" onClick={(e) => navegarProtegido(e, 'Mis recomendaciones')} className={claseEnlace}><Sparkles size={18} className="text-slate-400"/>Mis recomendaciones</NavLink>
          <NavLink to="/chatbot" onClick={(e) => navegarProtegido(e, 'Chatbot')} className={claseEnlace}><Bot size={18} className="text-blue-500"/>Chatbot</NavLink>
          <NavLink to="/cvs" onClick={(e) => navegarProtegido(e, 'Mis CV')} className={claseEnlace}><FileText size={18}/>Mis CV</NavLink>
          {usuarioId ? <MenuUsuario salir={salir}/> : <button type="button" onClick={() => pedirLogin()} className={`${enlaceBase} ml-auto border-transparent text-slate-600 hover:text-blue-700`}><LogIn size={19}/>Iniciar sesión</button>}
        </nav></header>
        <main><Routes>
          <Route path="empleos" element={<Empleos/>}/>
          <Route path="recomendaciones" element={acceso(<Recomendaciones usuarioId={usuarioId}/>)}/>
          <Route path="chatbot" element={acceso(<Chatbot/>)}/>
          <Route path="cvs" element={acceso(<Cvs/>)}/>
          <Route path="perfil/datos" element={acceso(<FormDatosPersonales actualizar/>)}/>
          <Route path="" element={<Navigate to="/empleos" replace/>}/>
          <Route path="*" element={<Navigate to="/empleos" replace/>}/>
        </Routes></main>
      </>}/>
    </Routes>
    <AvisosGlobales/>
    <ModalAutenticacion abierto={modal.abierto} motivo={modal.motivo} onCerrar={cerrarModal} onExito={cerrarModal}/>
  </>;
}
