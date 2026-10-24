import { useState } from "react";
import Empleos from "./pages/Empleos";
import Recomendaciones from "./pages/Recomendaciones";

const USUARIO_PRUEBA = "11111111-1111-1111-1111-111111111111";

function App() {
  const [pagina, setPagina] = useState("empleos");

  const enlaceBase =
    "inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer";

  const enlaceActivo =
    "border-blue-600 text-blue-700";

  const enlaceInactivo =
    "border-transparent text-slate-500 hover:text-blue-700 hover:border-blue-200";

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <nav className="max-w-6xl mx-auto px-5 flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => setPagina("empleos")}
            aria-current={pagina === "empleos" ? "page" : undefined}
            className={`${enlaceBase} ${
              pagina === "empleos"
                ? enlaceActivo
                : enlaceInactivo
            }`}
          >
            <span>💼</span>
            Buscar empleos
          </button>

          <button
            type="button"
            onClick={() => setPagina("recomendaciones")}
            aria-current={pagina === "recomendaciones" ? "page" : undefined}
            className={`${enlaceBase} ${
              pagina === "recomendaciones"
                ? enlaceActivo
                : enlaceInactivo
            }`}
          >
            <span>✨</span>
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
