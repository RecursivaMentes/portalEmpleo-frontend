import { useEffect, useState } from "react";
import { FileText, LoaderCircle, Download, Plus, X, Pencil, Trash2, Upload, Sparkles } from "lucide-react";
import { obtenerCvs, obtenerCv, descargarCv, descargarArchivoCv, crearCv, actualizarCv, eliminarCv, subirCv, generarCvIA } from "../services/cvsService";

const formularioVacio = {
  titulo: "",
  textoPlano: "",
  esPrincipal: false,
};

const formularioIAVacio = {
  titulo: "",
  puestoObjetivo: "",
  esPrincipal: false,
};

export default function Cvs() {
  const [cvs, setCvs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [vista, setVista] = useState("listado");
  const [guardando, setGuardando] = useState(false);
  const [cvEditando, setCvEditando] = useState(null);
  const [nuevoCv, setNuevoCv] = useState({ ...formularioVacio });

  const [archivoCv, setArchivoCv] = useState(null);
  const [tituloArchivo, setTituloArchivo] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const [datosIA, setDatosIA] = useState({ ...formularioIAVacio });
  const [generando, setGenerando] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarCvs = async () => {
    try {
      setError("");
      const datos = await obtenerCvs();
      setCvs(datos);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudieron cargar tus CV."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCvs();
  }, []);

  const cerrarFormulario = () => {
    setVista("listado");
    setCvEditando(null);
    setNuevoCv({ ...formularioVacio });
    setArchivoCv(null);
    setTituloArchivo("");
    setDatosIA({ ...formularioIAVacio });
    setErrorIA("");
  };

  const abrirNuevoCv = () => {
    cerrarFormulario();
    setMensaje("");
    setVista("manual");
  };

  const abrirSubida = () => {
    cerrarFormulario();
    setMensaje("");
    setVista("archivo");
  };

  const abrirGeneracionIA = () => {
    cerrarFormulario();
    setMensaje("");
    setVista("ia");
  };

  const handleEditar = async (cv) => {
    try {
      const completo = await obtenerCv(cv.id);

      setNuevoCv({
        titulo: completo.titulo || "",
        textoPlano: completo.textoPlano || "",
        esPrincipal: completo.esPrincipal || false,
      });

      setCvEditando(cv.id);
      setMensaje("");
      setVista("manual");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo cargar el CV."
      );
    }
  };

  const handleGuardarCv = async (e) => {
    e.preventDefault();

    if (!nuevoCv.titulo.trim()) {
      alert("Ingresá un título para el CV.");
      return;
    }

    try {
      setGuardando(true);

      if (cvEditando) {
        await actualizarCv(cvEditando, nuevoCv);
      } else {
        await crearCv(nuevoCv);
      }

      await cargarCvs();
      cerrarFormulario();

      setMensaje(
        cvEditando
          ? "El currículum se actualizó correctamente."
          : "El currículum se creó correctamente."
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo guardar el CV."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cv) => {
    if (!window.confirm(`¿Seguro que querés eliminar "${cv.titulo}"?`)) {
      return;
    }

    try {
      await eliminarCv(cv.id);
      await cargarCvs();
      setMensaje("El currículum se eliminó correctamente.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo eliminar el CV."
      );
    }
  };

  const handleDescargar = async (cv) => {
    try {
      await descargarCv(cv.id, `${cv.titulo}.pdf`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo descargar el PDF."
      );
    }
  };

  const handleDescargarOriginal = async (cv) => {
    try {
      await descargarArchivoCv(
        cv.id,
        `${cv.titulo}-original.pdf`
      );
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo descargar el archivo original."
      );
    }
  };

  const handleSubirCv = async (e) => {
    e.preventDefault();

    if (!archivoCv || !tituloArchivo.trim()) {
      alert("Completá el título y seleccioná un archivo.");
      return;
    }

    if (
      archivoCv.type !== "application/pdf" &&
      !archivoCv.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Seleccioná un archivo PDF.");
      return;
    }

    try {
      setSubiendo(true);

      await subirCv(archivoCv, tituloArchivo.trim(), false);
      await cargarCvs();

      cerrarFormulario();
      setMensaje("El archivo se subió correctamente.");
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "No se pudo subir el CV."
      );
    } finally {
      setSubiendo(false);
    }
  };

  const handleGenerarIA = async (e) => {
    e.preventDefault();
    setErrorIA("");

    if (datosIA.puestoObjetivo.length > 200) {
      setErrorIA(
        "El puesto objetivo no puede superar los 200 caracteres."
      );
      return;
    }

    try {
      setGenerando(true);

      await generarCvIA({
        titulo: datosIA.titulo.trim() || null,
        puestoObjetivo: datosIA.puestoObjetivo.trim() || null,
        esPrincipal: datosIA.esPrincipal,
      });

      await cargarCvs();
      cerrarFormulario();

      setMensaje("¡Tu CV se generó correctamente con IA!");
    } catch (err) {
      const datosError = err.response?.data;

      setErrorIA(
        datosError?.message ||
          datosError?.mensaje ||
          "No se pudo generar el CV. Intentá nuevamente."
      );
    } finally {
      setGenerando(false);
    }
  };

  const inputClase =
    "w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const botonPrimario =
    "inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer";

  const botonSecundario =
    "inline-flex items-center justify-center gap-2 border border-slate-300 px-5 py-2.5 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold mb-5">
            <FileText size={16} />
            Tu perfil profesional comienza acá
          </span>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Tu experiencia, tu próximo gran paso.
          </h1>

          <p className="text-lg text-blue-100 max-w-3xl">
            Creá, administrá y potenciá tus currículums con ayuda
            de la inteligencia artificial.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Mis currículums
        </h2>

        <p className="text-slate-500 mb-8">
          Administrá tus CV y preparalos para tus postulaciones.
        </p>

        {vista === "listado" && (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={abrirNuevoCv}
                className={botonPrimario}
              >
                <Plus size={18} />
                Crear CV
              </button>

              <button
                type="button"
                onClick={abrirSubida}
                className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-50 cursor-pointer"
              >
                <Upload size={18} />
                Subir CV
              </button>

              <button
                type="button"
                onClick={abrirGeneracionIA}
                className="inline-flex items-center gap-2 border border-violet-300 text-violet-700 px-5 py-2.5 rounded-lg hover:bg-violet-50 cursor-pointer"
              >
                <Sparkles size={18} />
                Generar con IA
              </button>
            </div>

            {mensaje && (
              <div
                role="status"
                className="mb-6 bg-green-50 text-green-700 border border-green-200 rounded-lg p-4"
              >
                {mensaje}
              </div>
            )}

            {cargando && (
              <div className="flex items-center gap-2 text-slate-500">
                <LoaderCircle size={20} className="animate-spin" />
                Cargando tus CV...
              </div>
            )}

            {error && (
              <p className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </p>
            )}

            {!cargando && !error && cvs.length === 0 && (
              <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center">
                <FileText
                  size={40}
                  className="mx-auto mb-3 text-slate-400"
                />
                <p className="text-slate-600">
                  Todavía no tenés currículums cargados.
                </p>
              </div>
            )}

            {!cargando && !error && cvs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        size={26}
                        className="text-blue-600 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-800 break-words">
                          {cv.titulo}
                        </h3>

                        {cv.esPrincipal && (
                          <span className="inline-block mt-2 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            CV principal
                          </span>
                        )}

                        <p className="text-sm text-slate-500 mt-3">
                          {cv.tieneArchivo
                            ? "Contiene un archivo adjunto"
                            : "CV sin archivo adjunto"}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleDescargar(cv)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                          >
                            <Download size={17} />
                            Descargar PDF
                          </button>

                          {cv.tieneArchivo && (
                            <button
                              type="button"
                              onClick={() => handleDescargarOriginal(cv)}
                              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                            >
                              <Download size={17} />
                              Archivo original
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handleEditar(cv)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(cv)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {vista === "manual" && (
          <form
            onSubmit={handleGuardarCv}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                {cvEditando
                  ? "Editar currículum"
                  : "Crear nuevo currículum"}
              </h2>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                aria-label="Cerrar formulario"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label
                htmlFor="tituloCv"
                className="block text-sm font-medium mb-2"
              >
                Título del CV
              </label>

              <input
                id="tituloCv"
                type="text"
                required
                className={inputClase}
                value={nuevoCv.titulo}
                onChange={(e) =>
                  setNuevoCv({
                    ...nuevoCv,
                    titulo: e.target.value,
                  })
                }
                placeholder="Ej: CV Desarrollador Full Stack"
              />
            </div>

            <div>
              <label
                htmlFor="textoCv"
                className="block text-sm font-medium mb-2"
              >
                Contenido del CV
              </label>

              <textarea
                id="textoCv"
                rows={8}
                className={inputClase}
                value={nuevoCv.textoPlano}
                onChange={(e) =>
                  setNuevoCv({
                    ...nuevoCv,
                    textoPlano: e.target.value,
                  })
                }
                placeholder="Escribí tu experiencia, formación, habilidades..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={nuevoCv.esPrincipal}
                onChange={(e) =>
                  setNuevoCv({
                    ...nuevoCv,
                    esPrincipal: e.target.checked,
                  })
                }
              />
              Establecer como CV principal
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={guardando}
                className={botonPrimario}
              >
                {guardando
                  ? "Guardando..."
                  : cvEditando
                    ? "Guardar cambios"
                    : "Guardar CV"}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                className={botonSecundario}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {vista === "archivo" && (
          <form
            onSubmit={handleSubirCv}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Subir currículum
              </h2>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={subiendo}
                aria-label="Cerrar formulario"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label
                htmlFor="tituloArchivo"
                className="block text-sm font-medium mb-2"
              >
                Título del CV
              </label>

              <input
                id="tituloArchivo"
                type="text"
                required
                className={inputClase}
                value={tituloArchivo}
                onChange={(e) =>
                  setTituloArchivo(e.target.value)
                }
                placeholder="Ej: CV Analista de Sistemas"
              />
            </div>

            <div>
              <label
                htmlFor="archivoCv"
                className="block text-sm font-medium mb-2"
              >
                Archivo PDF
              </label>

              <input
                id="archivoCv"
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={(e) =>
                  setArchivoCv(e.target.files?.[0] || null)
                }
                className="block w-full text-sm text-slate-600"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={subiendo}
                className={botonPrimario}
              >
                {subiendo ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Subiendo...
                  </>
                ) : (
                  "Guardar archivo"
                )}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={subiendo}
                className={botonSecundario}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {vista === "ia" && (
          <form
            onSubmit={handleGenerarIA}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles
                  size={24}
                  className="text-violet-600"
                />

                <h2 className="text-xl font-semibold text-slate-800">
                  Generar currículum con IA
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={generando}
                aria-label="Cerrar formulario"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              El asistente utilizará la información de tu perfil
              laboral para redactar un currículum orientado al
              puesto que elijas.
            </p>

            <div>
              <label
                htmlFor="tituloIA"
                className="block text-sm font-medium mb-2"
              >
                Título del CV (opcional)
              </label>

              <input
                id="tituloIA"
                type="text"
                className={inputClase}
                placeholder="Ej: CV Desarrollador Backend"
                value={datosIA.titulo}
                onChange={(e) =>
                  setDatosIA({
                    ...datosIA,
                    titulo: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label
                htmlFor="puestoObjetivo"
                className="block text-sm font-medium mb-2"
              >
                Puesto objetivo (opcional)
              </label>

              <input
                id="puestoObjetivo"
                type="text"
                maxLength={200}
                className={inputClase}
                placeholder="Ej: Desarrollador .NET"
                value={datosIA.puestoObjetivo}
                onChange={(e) =>
                  setDatosIA({
                    ...datosIA,
                    puestoObjetivo: e.target.value,
                  })
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={datosIA.esPrincipal}
                onChange={(e) =>
                  setDatosIA({
                    ...datosIA,
                    esPrincipal: e.target.checked,
                  })
                }
              />
              Establecer como CV principal
            </label>

            {errorIA && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm"
              >
                {errorIA}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={generando}
                className={botonPrimario}
              >
                {generando ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Generando CV...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generar CV
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={generando}
                className={botonSecundario}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}