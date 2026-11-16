import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { Briefcase, Sparkles, Bot, LogOut, UserCircle, User, Lock, BriefcaseBusiness, FileText } from "lucide-react";
import { useState } from "react";
import Empleos from "./pages/Empleos";
import Recomendaciones from "./pages/Recomendaciones";
import IniciarSesion from "./pages/IniciarSesion";
import Chatbot from "./pages/Chatbot";
import FormDatosPersonales from "./components/FormDatosPersonales";
import Cvs from "./pages/Cvs";

function App() {
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const navigate = useNavigate();

  // Función para validar si el usuario está autenticado
  const estaAutenticado = () => !!localStorage.getItem("accessToken");

  const cerrarSesion = () => {
    localStorage.removeItem("accessToken");
    navigate("/iniciarSesion", { replace: true });
  };

  const enlaceBase = "inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer";

  // Para aplicar clases dinámicamente según la URL activa
  const obtenerClaseEnlace = ({ isActive }) =>
    `${enlaceBase} ${isActive ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-blue-700 hover:border-blue-200"}`;

  return (
    <Routes>
      <Route path="/iniciarSesion" element={<IniciarSesion />} />
      <Route path="/registrarse" element={<FormDatosPersonales />} />
      <Route
        path="/*"
        element={
          estaAutenticado() ? (
            <>
              <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <nav className="max-w-6xl mx-auto px-5 flex flex-wrap items-center gap-2">
                  <NavLink to="/empleos" className={obtenerClaseEnlace}>
                    <Briefcase size={18} className="text-slate-400 group-hover:text-blue-600" /> Buscar empleos
                  </NavLink>

                  <NavLink to="/recomendaciones" className={obtenerClaseEnlace}>
                    <Sparkles size={18} className="text-slate-400" /> Mis recomendaciones
                  </NavLink>

                  <NavLink to="/chatbot" className={obtenerClaseEnlace}>
                    <Bot size={18} className="text-blue-500 animate-pulse" /> Chatbot
                  </NavLink>

                  <div className="relative flex items-center ml-auto">
                    <button
                      type="button"
                      onClick={() => setMostrarMenuUsuario(!mostrarMenuUsuario)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded-full transition-colors cursor-pointer"
                    >
                      <UserCircle size={32} className="text-slate-600 hover:text-blue-600 transition-colors" />
                    </button>

                    {/* Menú de usuario */}
                    {mostrarMenuUsuario && (
                      <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs text-slate-400 font-medium">Mi Cuenta</p>
                        </div>

                        <button
                          onClick={() => {
                            setMostrarMenuUsuario(false);
                            navigate("/perfil/datos");
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <User size={16} className="text-slate-400" /> Datos personales
                        </button>

                        <button
                          onClick={() => {
                            setMostrarMenuUsuario(false);
                            navigate("/perfil/seguridad");
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <Lock size={16} className="text-slate-400" /> Cambiar contraseña
                        </button>

                        <button
                          onClick={() => {
                            setMostrarMenuUsuario(false);
                            navigate("/perfil/laboral");
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <BriefcaseBusiness size={16} className="text-slate-400" /> Perfil laboral
                        </button>

                        <button
                          onClick={() => {
                            setMostrarMenuUsuario(false);
                            navigate("/cvs");
                          }}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer text-left"
                        >
                          <FileText size={16} className="text-slate-400" /> Mi CV / Currículum
                        </button>

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={cerrarSesion}
                          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer text-left font-medium"
                        >
                          <LogOut size={16} /> Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              </header>

              <main>
                <Routes>
                  <Route path="empleos" element={<Empleos />} />
                  <Route path="recomendaciones" element={<Recomendaciones />} />
                  <Route path="chatbot" element={<Chatbot />} />
                  <Route path="perfil/datos" element={<FormDatosPersonales actualizar={true} />} />
                  <Route path="cvs" element={<Cvs />} />
                  {/* <Route path="perfil/seguridad" element={<CambiarContrasena />} />
                  <Route path="perfil/laboral" element={<PerfilLaboral />} /> */}
                  <Route path="" element={<Navigate to="/empleos" replace />} />
                </Routes>
              </main>
            </>
          ) : (
            <Navigate to="/iniciarSesion" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
