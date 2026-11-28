import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles, LoaderCircle, CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { analizarCv, aplicarPropuesta } from "../services/analisisCvService";
import { obtenerPerfilLaboral } from "../services/perfilLaboralService";
import { obtenerMensajeErrorCv } from "../services/cvErrors";

// Cada sección de la propuesta: cómo se llama, qué texto muestra cada dato y cómo se escribe en plural.
const periodo = (inicio, fin, esActual) => {
  const desde = inicio || "";
  const hasta = esActual ? "Actualidad" : fin || "";
  return [desde, hasta].filter(Boolean).join(" – ");
};

const SECCIONES = [
  {
    clave: "experiencias",
    titulo: "Experiencia laboral",
    titular: (e) => [e.puesto, e.empresa].filter(Boolean).join(" — "),
    detalle: (e) => [periodo(e.fechaInicio, e.fechaFin, e.esActual), e.ubicacion].filter(Boolean).join(" · "),
  },
  {
    clave: "formacion",
    titulo: "Formación",
    titular: (f) => [f.titulo || f.nivelEducativo, f.institucion].filter(Boolean).join(" — "),
    detalle: (f) => [f.nivelEducativo, f.estado, periodo(f.fechaInicio, f.fechaFin, false)].filter(Boolean).join(" · "),
  },
  {
    clave: "habilidades",
    titulo: "Habilidades",
    titular: (h) => h.nombre,
    detalle: (h) => h.nivel || "",
  },
  {
    clave: "idiomas",
    titulo: "Idiomas",
    titular: (i) => i.idioma,
    detalle: (i) => i.nivel || "",
  },
];

const ETIQUETA_INCOMPLETO = { experiencia: "Experiencia", formacion: "Formación", idioma: "Idioma" };

// Por defecto se marca lo que todavía no está en el perfil; lo que ya está queda sin marcar.
const seleccionInicial = (propuesta) => ({
  resumen: !!propuesta.resumen,
  telefono: !!propuesta.telefono,
  ...Object.fromEntries(
    SECCIONES.map(({ clave }) => [
      clave,
      new Set((propuesta[clave] ?? []).flatMap((item, i) => (item.yaEnPerfil ? [] : [i]))),
    ])
  ),
});

const contarSeleccion = (sel) =>
  Number(sel.resumen) + Number(sel.telefono) + SECCIONES.reduce((total, { clave }) => total + sel[clave].size, 0);

export default function ImportarCvPerfil({ cv, onCerrar }) {
  const [fase, setFase] = useState("analizando"); // analizando | revision | aplicando | resultado | error
  const [analisis, setAnalisis] = useState(null);
  const [seleccion, setSeleccion] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensajeError, setMensajeError] = useState("");
  // Perfil laboral actual: undefined = todavía no se sabe (o no se pudo leer), null = la persona aún no tiene uno.
  const [perfilActual, setPerfilActual] = useState(undefined);

  // En desarrollo React ejecuta los efectos dos veces. Sin esta marca se mandarían dos análisis seguidos y el
  // segundo recibiría un 409 ("ya hay una operación en curso"), porque el servidor permite una sola por persona.
  const analisisIniciado = useRef(false);

  const analizar = async () => {
    setFase("analizando");
    setMensajeError("");
    try {
      const datos = await analizarCv(cv.id);
      setAnalisis(datos);
      setSeleccion(seleccionInicial(datos.propuesta));
      setFase("revision");

      // Se lee el perfil para avisar de antemano si falta una experiencia. Si falla, no se bloquea nada:
      // el servidor igual valida y devuelve su mensaje.
      obtenerPerfilLaboral().then(setPerfilActual).catch(() => setPerfilActual(undefined));
    } catch (err) {
      setMensajeError(obtenerMensajeErrorCv(err, "No se pudo analizar el CV."));
      setFase("error");
    }
  };

  useEffect(() => {
    if (analisisIniciado.current) return;
    analisisIniciado.current = true;
    analizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const escapar = (e) => { if (e.key === "Escape" && fase !== "aplicando") onCerrar(); };
    document.addEventListener("keydown", escapar);
    return () => document.removeEventListener("keydown", escapar);
  }, [fase, onCerrar]);

  const alternarItem = (clave, indice) => {
    setSeleccion((previa) => {
      const nuevo = new Set(previa[clave]);
      if (nuevo.has(indice)) nuevo.delete(indice); else nuevo.add(indice);
      return { ...previa, [clave]: nuevo };
    });
  };

  const alternarCampo = (campo) => setSeleccion((previa) => ({ ...previa, [campo]: !previa[campo] }));

  const importar = async () => {
    const { propuesta, incompletos } = analisis;
    setFase("aplicando");
    setMensajeError("");
    try {
      const respuesta = await aplicarPropuesta({
        resumen: seleccion.resumen ? propuesta.resumen : null,
        telefono: seleccion.telefono ? propuesta.telefono : null,
        ...Object.fromEntries(
          SECCIONES.map(({ clave }) => [
            clave,
            propuesta[clave].filter((_, i) => seleccion[clave].has(i)).map((item) => item.dato),
          ])
        ),
        incompletos,
      });
      setResultado(respuesta);
      setFase("resultado");
    } catch (err) {
      setMensajeError(obtenerMensajeErrorCv(err, "No se pudieron importar los datos."));
      setFase("revision");
    }
  };

  const cantidad = seleccion ? contarSeleccion(seleccion) : 0;
  const propuesta = analisis?.propuesta;

  // Usuarios no guarda un perfil sin experiencias, salvo que la persona haya declarado "sin experiencia".
  // Si el perfil no tiene ninguna y en la importación tampoco se elige una, guardar daría error (422).
  // El teléfono se guarda aparte, por eso no cuenta para esta regla.
  const sinExperienciasEnPerfil = perfilActual !== undefined
    && !(perfilActual?.experiencias?.length > 0) && perfilActual?.sinExperiencia !== true;
  const faltaExperiencia = !!seleccion && sinExperienciasEnPerfil && seleccion.experiencias.size === 0
    && cantidad - Number(seleccion.telefono) > 0;

  const hayPropuesta = propuesta && (propuesta.resumen || propuesta.telefono ||
    SECCIONES.some(({ clave }) => propuesta[clave].length > 0));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-importar-cv"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 id="titulo-importar-cv" className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Sparkles size={20} className="text-violet-600 shrink-0" />
              Importar a mi perfil
            </h2>
            <p className="mt-1 text-sm text-slate-500 truncate">Desde: {cv.titulo}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={fase === "aplicando"}
            className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {fase === "analizando" && (
            <div role="status" className="flex flex-col items-center gap-3 py-12 text-center">
              <LoaderCircle size={36} className="animate-spin text-violet-600" />
              <p className="font-semibold text-slate-800">La IA está leyendo tu CV…</p>
              <p className="max-w-sm text-sm text-slate-500">
                Está buscando tu experiencia, formación, habilidades e idiomas. Puede tardar unos segundos.
              </p>
            </div>
          )}

          {fase === "error" && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18} /> No se pudo analizar el CV</p>
              <p className="mt-2 text-sm">{mensajeError}</p>
            </div>
          )}

          {(fase === "revision" || fase === "aplicando") && analisis && (
            <div className="space-y-6">
              <p className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
                <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                <span>
                  Esto es solo una propuesta: <strong>no se guarda nada hasta que confirmes</strong>. Elegí qué datos
                  querés sumar a tu perfil. Nunca se borra ni se pisa lo que ya cargaste.
                </span>
              </p>

              {mensajeError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{mensajeError}</p>
              )}

              {faltaExperiencia && (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <span>
                    Tu perfil todavía no tiene experiencias y para guardarlo hace falta al menos una. Elegí una
                    experiencia de la lista, o indicá que no tenés experiencia en{" "}
                    <Link to="/perfil/laboral" onClick={onCerrar} className="font-semibold underline">Mi perfil laboral</Link>
                    {" "}y volvé a importar.
                  </span>
                </p>
              )}

              {!hayPropuesta && (
                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No se encontraron datos para importar en este CV.
                </p>
              )}

              {propuesta.resumen && (
                <Bloque titulo="Resumen profesional" nota="Se guarda solo si tu perfil todavía no tiene uno.">
                  <Fila
                    marcado={seleccion.resumen}
                    onCambio={() => alternarCampo("resumen")}
                    deshabilitado={fase === "aplicando"}
                    titular={propuesta.resumen}
                  />
                </Bloque>
              )}

              {propuesta.telefono && (
                <Bloque titulo="Teléfono" nota="Se guarda solo si todavía no tenés uno cargado.">
                  <Fila
                    marcado={seleccion.telefono}
                    onCambio={() => alternarCampo("telefono")}
                    deshabilitado={fase === "aplicando"}
                    titular={propuesta.telefono}
                  />
                </Bloque>
              )}

              {SECCIONES.map(({ clave, titulo, titular, detalle }) =>
                propuesta[clave].length > 0 && (
                  <Bloque key={clave} titulo={`${titulo} (${propuesta[clave].length})`}>
                    {propuesta[clave].map((item, i) => (
                      <Fila
                        key={i}
                        marcado={seleccion[clave].has(i)}
                        onCambio={() => alternarItem(clave, i)}
                        deshabilitado={fase === "aplicando" || item.yaEnPerfil}
                        titular={titular(item.dato)}
                        detalle={detalle(item.dato)}
                        etiqueta={item.yaEnPerfil ? "Ya está en tu perfil" : null}
                      />
                    ))}
                  </Bloque>
                )
              )}

              {analisis.incompletos?.length > 0 && (
                <Bloque titulo="No se pueden importar todavía" nota="El CV los menciona, pero falta un dato que el perfil exige.">
                  {analisis.incompletos.map((item, i) => (
                    <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-medium">{ETIQUETA_INCOMPLETO[item.tipo] ?? item.tipo}: {item.descripcion}</p>
                      {item.faltan?.length > 0 && <p className="mt-1 text-amber-800">Falta: {item.faltan.join(", ")}</p>}
                    </div>
                  ))}
                </Bloque>
              )}

              {analisis.faltantes?.length > 0 && (
                <Bloque titulo="Para completar tu perfil" nota="Podés cargarlos después desde Mi perfil laboral.">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {/* El campo se repite (p. ej. varias experiencias incompletas), por eso la clave lleva el índice. */}
                    {analisis.faltantes.map((f, i) => <li key={`${f.campo}-${i}`}>{f.pregunta}</li>)}
                  </ul>
                </Bloque>
              )}

              {analisis.avisos?.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-500">
                  {analisis.avisos.map((aviso, i) => (
                    <li key={i} className="flex items-start gap-2"><Info size={15} className="mt-0.5 shrink-0" />{aviso}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {fase === "resultado" && resultado && (
            <div className="space-y-4">
              <p role="status" className="flex items-center gap-2 text-lg font-semibold text-green-700">
                <CheckCircle2 size={22} /> Datos importados a tu perfil
              </p>
              <ul className="space-y-1 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                {resultado.agregados?.experiencias > 0 && <li>Experiencias agregadas: {resultado.agregados.experiencias}</li>}
                {resultado.agregados?.formacion > 0 && <li>Formaciones agregadas: {resultado.agregados.formacion}</li>}
                {resultado.agregados?.habilidades > 0 && <li>Habilidades agregadas: {resultado.agregados.habilidades}</li>}
                {resultado.agregados?.idiomas > 0 && <li>Idiomas agregados: {resultado.agregados.idiomas}</li>}
                {resultado.resumenGuardado && <li>Resumen profesional guardado</li>}
                {resultado.telefonoGuardado && <li>Teléfono guardado</li>}
                {resultado.omitidosPorDuplicado > 0 && (
                  <li>Omitidos por estar ya en tu perfil: {resultado.omitidosPorDuplicado}</li>
                )}
                {!(resultado.agregados?.experiencias || resultado.agregados?.formacion || resultado.agregados?.habilidades
                  || resultado.agregados?.idiomas || resultado.resumenGuardado || resultado.telefonoGuardado) && (
                  <li>No hubo datos nuevos para agregar.</li>
                )}
              </ul>

              {resultado.faltantes?.length > 0 && (
                <Bloque titulo="Todavía te falta completar" nota="Podés hacerlo desde Mi perfil laboral.">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {resultado.faltantes.map((f, i) => <li key={`${f.campo}-${i}`}>{f.pregunta}</li>)}
                  </ul>
                </Bloque>
              )}

              {resultado.avisos?.length > 0 && (
                <ul className="space-y-1 text-sm text-slate-500">
                  {resultado.avisos.map((aviso, i) => <li key={i}>{aviso}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Pie con las acciones */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          {fase === "error" && (
            <button
              type="button"
              onClick={analizar}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 cursor-pointer"
            >
              Reintentar
            </button>
          )}

          {(fase === "revision" || fase === "aplicando") && (
            <>
              <span className="mr-auto text-sm text-slate-500">
                {cantidad === 0 ? "No hay nada seleccionado" : `${cantidad} dato${cantidad === 1 ? "" : "s"} seleccionado${cantidad === 1 ? "" : "s"}`}
              </span>
              <button
                type="button"
                onClick={importar}
                disabled={fase === "aplicando" || cantidad === 0 || faltaExperiencia}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
              >
                {fase === "aplicando" && <LoaderCircle size={16} className="animate-spin" />}
                {fase === "aplicando" ? "Importando…" : "Importar seleccionados"}
              </button>
            </>
          )}

          {fase === "resultado" && (
            <Link
              to="/perfil/laboral"
              onClick={onCerrar}
              className="px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Ver mi perfil laboral
            </Link>
          )}

          <button
            type="button"
            onClick={onCerrar}
            disabled={fase === "aplicando"}
            className="px-5 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            {fase === "resultado" ? "Cerrar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bloque({ titulo, nota, children }) {
  return (
    <section>
      <h3 className="font-semibold text-slate-800">{titulo}</h3>
      {nota && <p className="mb-2 text-xs text-slate-500">{nota}</p>}
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Fila({ marcado, onCambio, deshabilitado, titular, detalle, etiqueta }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        deshabilitado && etiqueta ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-200 hover:bg-slate-50 cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={marcado}
        onChange={onCambio}
        disabled={deshabilitado}
        className="mt-1 h-4 w-4 shrink-0 accent-primary-600"
      />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium text-slate-800">{titular}</span>
        {detalle && <span className="block text-xs text-slate-500">{detalle}</span>}
        {etiqueta && <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{etiqueta}</span>}
      </span>
    </label>
  );
}
