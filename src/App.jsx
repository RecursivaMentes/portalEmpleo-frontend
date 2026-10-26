import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import Empleos from "./pages/Empleos";
import Recomendaciones from "./pages/Recomendaciones";
import IniciarSesion from "./pages/IniciarSesion";

function App() {
  const navigate = useNavigate();

  // funcion para validar si el usuario esta autenticado
  const estaAutenticado = () => !!localStorage.getItem("accessToken");

  const cerrarSesion = () => {
    localStorage.removeItem("accessToken");
    navigate("/iniciarSesion",{replace:true});
  };

  const enlaceBase ="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer";

  //para aplicar clases dinámicamente según la URL activa
  const obtenerClaseEnlace = ({ isActive }) =>`${enlaceBase} ${isActive ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-blue-700 hover:border-blue-200"}`;

  return (
    <Routes>
      <Route path="/iniciarSesion" element={<IniciarSesion />} />
      <Route
        path="/*"
        element={
          estaAutenticado() ? (
            <>
              <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <nav className="max-w-6xl mx-auto px-5 flex flex-wrap items-center gap-2">
                  <NavLink to="/empleos" className={obtenerClaseEnlace}>
                    <span>💼</span> Buscar empleos
                  </NavLink>

                  <NavLink to="/recomendaciones" className={obtenerClaseEnlace}>
                    <span>✨</span> Mis recomendaciones
                  </NavLink>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className={`${enlaceBase} border-transparent text-slate-500 hover:text-red-700 ml-auto`}
                  >
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </nav>
              </header>

              <main>
                <Routes>
                  <Route path="empleos" element={<Empleos />} />
                  <Route path="recomendaciones" element={<Recomendaciones />} />
                  {/* Redirección por defecto si entran a '/' */}
                  <Route path="" element={<Navigate to="/empleos" replace />} />
                </Routes>
              </main>
            </>
          ) : (
            // Si intenta entrar a cualquier ruta sin token  al Login
            <Navigate to="/iniciarSesion" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
