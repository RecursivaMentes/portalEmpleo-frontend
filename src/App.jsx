import { useState } from "react";
import Empleos from "./pages/Empleos";
import Recomendaciones from "./pages/Recomendaciones";

// Usuario de prueba con los mocks del backend.
const USUARIO_PRUEBA = "11111111-1111-1111-1111-111111111111";

function App() {
  const [pagina, setPagina] = useState("empleos");

  return (
    <>
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setPagina("empleos")}
            className={`font-medium cursor-pointer ${
              pagina === "empleos"
                ? "text-blue-700"
                : "text-gray-600 hover:text-blue-700"
            }`}
          >
            Buscar empleos
          </button>

          <button
            type="button"
            onClick={() => setPagina("recomendaciones")}
            className={`font-medium cursor-pointer ${
              pagina === "recomendaciones"
                ? "text-blue-700"
                : "text-gray-600 hover:text-blue-700"
            }`}
          >
            Mis recomendaciones
          </button>
        </nav>
      </header>

      {pagina === "empleos" ? (
        <Empleos />
      ) : (
        <Recomendaciones usuarioId={USUARIO_PRUEBA} />
      )}
    </>
  );
}

export default App;
