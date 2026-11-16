import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, LoaderCircle, Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { obtenerPerfilLaboral, guardarPerfilLaboral } from '../services/perfilLaboralService';

const vacio = () => ({ resumen: '', experiencias: [], sinExperiencia: true, formacion: [], habilidades: [], idiomas: [] });
const nuevaExperiencia = () => ({ empresa: '', puesto: '', ubicacion: '', descripcion: '', fechaInicio: '', fechaFin: '', esActual: false });
const nuevaFormacion = () => ({ institucion: '', titulo: '', nivelEducativo: '', estado: '', fechaInicio: '', fechaFin: '', descripcion: '' });
const nuevaHabilidad = () => ({ nombre: '', nivel: '' });
const nuevoIdioma = () => ({ idioma: '', nivel: '' });
const nivelesEducativos = ['Primaria', 'Secundaria', 'Terciaria', 'Universitaria de grado', 'Posgrado', 'Curso o certificación'];
const estadosFormacion = [['EnCurso', 'En curso'], ['Finalizado', 'Finalizado'], ['Incompleto', 'Incompleto']];
const nivelesHabilidad = [['', 'Sin especificar'], ['Basico', 'Básico'], ['Intermedio', 'Intermedio'], ['Avanzado', 'Avanzado']];
const nivelesIdioma = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo'];
const campoClase = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const botonSecundario = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer';
const botonPrincipal = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer';
const formatoFecha = (valor) => typeof valor === 'string' ? valor.slice(0, 10) : '';
function normalizar(perfil) {
  return {
    resumen: perfil?.resumen ?? '',
    experiencias: (perfil?.experiencias ?? []).map((e) => ({ ...nuevaExperiencia(), ...e, fechaInicio: formatoFecha(e.fechaInicio), fechaFin: formatoFecha(e.fechaFin) })),
    sinExperiencia: perfil?.sinExperiencia ?? !(perfil?.experiencias?.length),
    formacion: (perfil?.formacion ?? []).map((f) => ({ ...nuevaFormacion(), ...f, fechaInicio: formatoFecha(f.fechaInicio), fechaFin: formatoFecha(f.fechaFin) })),
    habilidades: (perfil?.habilidades ?? []).map((h) => ({ ...nuevaHabilidad(), ...h })),
    idiomas: (perfil?.idiomas ?? []).map((i) => ({ ...nuevoIdioma(), ...i })),
  };
}
function Texto({ titulo, valor, onChange, error, maxLength, placeholder, required = false, type = 'text', disabled = false }) {
  return <label className="block text-sm font-semibold text-slate-700">{titulo}{required && <span className="text-red-600"> *</span>}
    <input type={type} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} required={required} disabled={disabled} aria-invalid={!!error} className={`${campoClase} mt-2 ${error ? 'border-red-400' : ''}`} />
    {error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}
  </label>;
}
function Seleccion({ titulo, valor, onChange, opciones, required = false, error }) {
  return <label className="block text-sm font-semibold text-slate-700">{titulo}{required && <span className="text-red-600"> *</span>}
    <select className={`${campoClase} mt-2 ${error ? 'border-red-400' : ''}`} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} required={required} aria-invalid={!!error}>
      <option value="">Seleccionar</option>
      {opciones.map((o) => Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>)}
    </select>
    {error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}
  </label>;
}
function Area({ titulo, valor, onChange, maxLength = 2000, placeholder }) {
  return <label className="block text-sm font-semibold text-slate-700">{titulo}
    <textarea className={`${campoClase} mt-2 min-h-28 resize-y`} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} />
    <span className="mt-1 block text-right text-xs font-normal text-slate-500">{(valor ?? '').length}/{maxLength}</span>
  </label>;
}
function Seccion({ titulo, cantidad, abierta, alAlternar, children }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <button type="button" onClick={alAlternar} aria-expanded={abierta} className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50">
      <span className="text-lg font-bold text-slate-900">{titulo} <span className="ml-2 text-xs font-semibold text-slate-500">{cantidad}</span></span>
      {abierta ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
    </button>
    {abierta && <div className="border-t border-slate-100 px-5 py-5">{children}</div>}
  </section>;
}
function validar(datos) {
  const errores = {};
  const hoy = new Date().toISOString().slice(0, 10);
  const minimo = `${Number(hoy.slice(0, 4)) - 100}${hoy.slice(4)}`;
  if ((datos.resumen ?? '').length > 2000) errores.resumen = 'El resumen supera los 2000 caracteres.';
  if (!datos.sinExperiencia && !datos.experiencias.length) errores.experiencias = 'Agregá una experiencia o seleccioná Sin experiencia.';
  if (datos.sinExperiencia && datos.experiencias.length) errores.experiencias = 'Eliminá las experiencias o desmarcá Sin experiencia.';
  const fechaValida = (f) => !f || (f >= minimo && f <= hoy);
  datos.experiencias.forEach((e, i) => {
    const p = `experiencias.${i}.`;
    if (!e.empresa.trim() || e.empresa.length > 150) errores[`${p}empresa`] = 'Ingresá una empresa (máximo 150 caracteres).';
    if (!e.puesto.trim() || e.puesto.length > 120) errores[`${p}puesto`] = 'Ingresá un puesto (máximo 120 caracteres).';
    if (e.ubicacion.length > 120) errores[`${p}ubicacion`] = 'Máximo 120 caracteres.';
    if (e.descripcion.length > 2000) errores[`${p}descripcion`] = 'Máximo 2000 caracteres.';
    if (!e.fechaInicio || !fechaValida(e.fechaInicio)) errores[`${p}fechaInicio`] = 'Ingresá una fecha válida, no futura.';
    if (!fechaValida(e.fechaFin) || (e.fechaFin && e.fechaFin < e.fechaInicio)) errores[`${p}fechaFin`] = 'La fecha final debe ser válida y posterior al inicio.';
    if (e.esActual && e.fechaFin) errores[`${p}fechaFin`] = 'Si el trabajo es actual, eliminá la fecha final.';
  });
  datos.formacion.forEach((f, i) => {
    const p = `formacion.${i}.`;
    if (!f.institucion.trim() || f.institucion.length > 150) errores[`${p}institucion`] = 'Ingresá una institución (máximo 150 caracteres).';
    if (!nivelesEducativos.includes(f.nivelEducativo)) errores[`${p}nivelEducativo`] = 'Seleccioná un nivel educativo.';
    if (!estadosFormacion.some((x) => x[0] === f.estado)) errores[`${p}estado`] = 'Seleccioná un estado válido.';
    if (!['Primaria', 'Secundaria'].includes(f.nivelEducativo) && !f.titulo.trim()) errores[`${p}titulo`] = 'Ingresá el título de la formación.';
    if (f.titulo.length > 150) errores[`${p}titulo`] = 'Máximo 150 caracteres.';
    if (f.descripcion.length > 2000) errores[`${p}descripcion`] = 'Máximo 2000 caracteres.';
    if (f.estado === 'Finalizado' && !f.fechaFin) errores[`${p}fechaFin`] = 'Indicá cuándo finalizó.';
    if (!fechaValida(f.fechaInicio)) errores[`${p}fechaInicio`] = 'La fecha no puede ser futura ni demasiado antigua.';
    if (!fechaValida(f.fechaFin) || (f.fechaInicio && f.fechaFin && f.fechaFin < f.fechaInicio)) errores[`${p}fechaFin`] = 'La fecha final debe ser válida y posterior al inicio.';
  });
  for (const [clave, propiedad] of [['habilidades', 'nombre'], ['idiomas', 'idioma']]) {
    const vistos = new Set();
    datos[clave].forEach((item, i) => {
      const nombre = (item[propiedad] ?? '').trim();
      const p = `${clave}.${i}.`;
      if (!nombre || nombre.length > 100) errores[`${p}${propiedad}`] = 'Ingresá un nombre de hasta 100 caracteres.';
      else if (vistos.has(nombre.toLocaleLowerCase())) errores[`${p}${propiedad}`] = 'Este valor está repetido.';
      vistos.add(nombre.toLocaleLowerCase());
      if (clave === 'idiomas' && !nivelesIdioma.includes(item.nivel)) errores[`${p}nivel`] = 'Seleccioná un nivel.';
      if (clave === 'habilidades' && item.nivel && !nivelesHabilidad.some((x) => x[0] === item.nivel)) errores[`${p}nivel`] = 'Seleccioná un nivel válido.';
    });
  }
  return errores;
}
function preparar(datos) {
  return {
    resumen: datos.resumen.trim() || null,
    sinExperiencia: datos.sinExperiencia,
    experiencias: datos.sinExperiencia ? [] : datos.experiencias.map((e) => ({ ...e, empresa: e.empresa.trim(), puesto: e.puesto.trim(), ubicacion: e.ubicacion.trim() || null, descripcion: e.descripcion.trim() || null, fechaFin: e.esActual ? null : (e.fechaFin || null) })),
    formacion: datos.formacion.map((f) => ({ ...f, institucion: f.institucion.trim(), titulo: f.titulo.trim() || null, descripcion: f.descripcion.trim() || null, fechaInicio: f.fechaInicio || null, fechaFin: f.fechaFin || null })),
    habilidades: datos.habilidades.map((h) => ({ nombre: h.nombre.trim(), nivel: h.nivel || null })),
    idiomas: datos.idiomas.map((i) => ({ idioma: i.idioma.trim(), nivel: i.nivel })),
  };
}
export default function PerfilLaboral() {
  const [datos, setDatos] = useState(vacio);
  const [original, setOriginal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState({});
  const [recarga, setRecarga] = useState(0);
  const [abiertas, setAbiertas] = useState({ resumen: true, experiencias: true, formacion: false, habilidades: false, idiomas: false });
  const modificado = useMemo(() => original !== null && JSON.stringify(datos) !== JSON.stringify(original), [datos, original]);

  useEffect(() => {
    let activo = true;
    obtenerPerfilLaboral().then((perfil) => {
      if (!activo) return;
      const normalizado = normalizar(perfil);
      setDatos(normalizado); setOriginal(normalizado);
    }).catch((err) => { if (activo) setError(err.message); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [recarga]);
  useEffect(() => {
    if (!modificado) return;
    const advertir = (e) => { e.preventDefault(); e.returnValue = ''; };
    const confirmarEnlaces = (e) => {
      const enlace = e.target.closest?.('a[href]');
      if (enlace && enlace.origin === window.location.origin && !window.confirm('Tenés cambios sin guardar en tu perfil laboral. ¿Querés salir sin guardarlos?')) {
        e.preventDefault(); e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', advertir);
    document.addEventListener('click', confirmarEnlaces, true);
    return () => { window.removeEventListener('beforeunload', advertir); document.removeEventListener('click', confirmarEnlaces, true); };
  }, [modificado]);
  function cambiar(campo, valor) { setDatos((d) => ({ ...d, [campo]: valor })); setErrores({}); }
  function cambiarLista(lista, indice, campo, valor) {
    setDatos((d) => ({ ...d, [lista]: d[lista].map((item, i) => i === indice ? { ...item, [campo]: valor } : item) }));
    setErrores({});
  }
  function agregar(lista, plantilla) { setDatos((d) => ({ ...d, [lista]: [...d[lista], plantilla()] })); setErrores({}); }
  function quitar(lista, indice) { setDatos((d) => ({ ...d, [lista]: d[lista].filter((_, i) => i !== indice) })); setErrores({}); }
  function alternar(nombre) { setAbiertas((actual) => ({ ...actual, [nombre]: !actual[nombre] })); }
  function descartar() { if (modificado && !window.confirm('¿Descartar los cambios sin guardar?')) return; setDatos(structuredClone(original)); setErrores({}); setError(''); }
  async function guardar(e) {
    e.preventDefault();
    if (guardando || cargando || !modificado) return;
    const encontrados = validar(datos);
    setErrores(encontrados); setError('');
    if (Object.keys(encontrados).length) {
      const secciones = Object.keys(encontrados).map((x) => x.split('.')[0]);
      setAbiertas((actual) => Object.fromEntries(Object.entries(actual).map(([k, v]) => [k, v || secciones.includes(k)])));
      setError('Revisá los campos señalados antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const resultado = await guardarPerfilLaboral(preparar(datos));
      const actualizado = normalizar(resultado);
      setDatos(actualizado); setOriginal(actualizado); setErrores({});
      window.dispatchEvent(new CustomEvent('recursiva:aviso', { detail: { mensaje: 'Perfil laboral guardado correctamente.' } }));
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  }
  const errorDe = (p) => errores[p];
  const vacioError = error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} {!original && <button type="button" onClick={() => { setCargando(true); setError(''); setRecarga((n) => n + 1); }} className="ml-2 underline cursor-pointer">Volver a consultar</button>}</div>;

  return <main className="min-h-screen bg-slate-50 pb-20">
    <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white"><div className="mx-auto max-w-6xl px-5 py-10"><span className="inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm">Mi cuenta</span><h1 className="mt-4 text-3xl font-extrabold">Perfil laboral</h1><p className="mt-2 text-blue-100">Completá tus datos profesionales para mejorar tus oportunidades laborales.</p></div></section>
    <div className="mx-auto max-w-4xl space-y-5 px-5 pt-8">
      {cargando ? <div aria-label="Cargando perfil laboral" className="space-y-4 animate-pulse">{[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-20 rounded-2xl border border-slate-200 bg-white p-5"><div className="h-5 w-48 rounded-lg bg-slate-200" /></div>)}</div> : <>
        {vacioError}
        {original && <form noValidate onSubmit={guardar} className="space-y-4">
          <Seccion titulo="Resumen profesional" cantidad="Opcional" abierta={abiertas.resumen} alAlternar={() => alternar('resumen')}><Area titulo="Sobre vos" valor={datos.resumen} onChange={(v) => cambiar('resumen', v)} placeholder="Contá brevemente tu experiencia y objetivos." /></Seccion>
          <Seccion titulo="Experiencia laboral" cantidad={datos.experiencias.length} abierta={abiertas.experiencias} alAlternar={() => alternar('experiencias')}>
            <label className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={datos.sinExperiencia} onChange={(e) => { if (e.target.checked && datos.experiencias.length && !window.confirm('Se quitarán las experiencias cargadas. ¿Continuar?')) return; setDatos((d) => ({ ...d, sinExperiencia: e.target.checked, experiencias: e.target.checked ? [] : d.experiencias })); }} /> Todavía no tengo experiencia laboral</label>
            {errorDe('experiencias') && <p role="alert" className="mb-3 text-sm text-red-700">{errorDe('experiencias')}</p>}
            {!datos.sinExperiencia && <div className="space-y-5">{datos.experiencias.map((e, i) => <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-slate-900">Experiencia {i + 1}</h3><button type="button" onClick={() => quitar('experiencias', i)} className="flex items-center gap-1 text-sm text-red-700 cursor-pointer"><Trash2 size={16}/>Eliminar</button></div><div className="grid gap-4 sm:grid-cols-2">
              <Texto titulo="Empresa" valor={e.empresa} onChange={(v) => cambiarLista('experiencias', i, 'empresa', v)} maxLength={150} error={errorDe(`experiencias.${i}.empresa`)} required />
              <Texto titulo="Puesto" valor={e.puesto} onChange={(v) => cambiarLista('experiencias', i, 'puesto', v)} maxLength={120} error={errorDe(`experiencias.${i}.puesto`)} required />
              <Texto titulo="Ubicación" valor={e.ubicacion} onChange={(v) => cambiarLista('experiencias', i, 'ubicacion', v)} maxLength={120} error={errorDe(`experiencias.${i}.ubicacion`)} />
              <Texto titulo="Fecha de inicio" type="date" valor={e.fechaInicio} onChange={(v) => cambiarLista('experiencias', i, 'fechaInicio', v)} error={errorDe(`experiencias.${i}.fechaInicio`)} required />
              <Texto titulo="Fecha de finalización" type="date" valor={e.fechaFin} onChange={(v) => cambiarLista('experiencias', i, 'fechaFin', v)} error={errorDe(`experiencias.${i}.fechaFin`)} disabled={e.esActual} />
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={e.esActual} onChange={(v) => setDatos((d) => ({ ...d, experiencias: d.experiencias.map((x, n) => n === i ? { ...x, esActual: v.target.checked, fechaFin: v.target.checked ? '' : x.fechaFin } : x) }))} /> Trabajo actualmente aquí</label>
            </div><div className="mt-4"><Area titulo="Descripción" valor={e.descripcion} onChange={(v) => cambiarLista('experiencias', i, 'descripcion', v)} /></div></div>)}
              <button type="button" className={botonSecundario} onClick={() => agregar('experiencias', nuevaExperiencia)}><Plus size={17}/>Agregar experiencia</button></div>}
          </Seccion>
          <Seccion titulo="Formación académica" cantidad={datos.formacion.length} abierta={abiertas.formacion} alAlternar={() => alternar('formacion')}>
            <div className="space-y-5">{datos.formacion.map((f, i) => <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Formación {i + 1}</h3><button type="button" onClick={() => quitar('formacion', i)} className="flex items-center gap-1 text-sm text-red-700 cursor-pointer"><Trash2 size={16}/>Eliminar</button></div><div className="grid gap-4 sm:grid-cols-2">
              <Texto titulo="Institución" valor={f.institucion} onChange={(v) => cambiarLista('formacion', i, 'institucion', v)} maxLength={150} error={errorDe(`formacion.${i}.institucion`)} required />
              <Texto titulo="Título" valor={f.titulo} onChange={(v) => cambiarLista('formacion', i, 'titulo', v)} maxLength={150} error={errorDe(`formacion.${i}.titulo`)} />
              <Seleccion titulo="Nivel educativo" valor={f.nivelEducativo} onChange={(v) => cambiarLista('formacion', i, 'nivelEducativo', v)} opciones={nivelesEducativos} error={errorDe(`formacion.${i}.nivelEducativo`)} required />
              <Seleccion titulo="Estado" valor={f.estado} onChange={(v) => cambiarLista('formacion', i, 'estado', v)} opciones={estadosFormacion} error={errorDe(`formacion.${i}.estado`)} required />
              <Texto titulo="Fecha de inicio" type="date" valor={f.fechaInicio} onChange={(v) => cambiarLista('formacion', i, 'fechaInicio', v)} error={errorDe(`formacion.${i}.fechaInicio`)} />
              <Texto titulo="Fecha de finalización" type="date" valor={f.fechaFin} onChange={(v) => cambiarLista('formacion', i, 'fechaFin', v)} error={errorDe(`formacion.${i}.fechaFin`)} />
            </div><div className="mt-4"><Area titulo="Descripción" valor={f.descripcion} onChange={(v) => cambiarLista('formacion', i, 'descripcion', v)} /></div></div>)}
            <button type="button" className={botonSecundario} onClick={() => agregar('formacion', nuevaFormacion)}><Plus size={17}/>Agregar formación</button></div>
          </Seccion>
          <Seccion titulo="Habilidades" cantidad={datos.habilidades.length} abierta={abiertas.habilidades} alAlternar={() => alternar('habilidades')}>
            <div className="space-y-3">{datos.habilidades.map((h, i) => <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"><div className="flex-1"><Texto titulo="Habilidad" valor={h.nombre} onChange={(v) => cambiarLista('habilidades', i, 'nombre', v)} maxLength={100} error={errorDe(`habilidades.${i}.nombre`)} required /></div><div className="sm:w-44"><Seleccion titulo="Nivel" valor={h.nivel} onChange={(v) => cambiarLista('habilidades', i, 'nivel', v)} opciones={nivelesHabilidad} error={errorDe(`habilidades.${i}.nivel`)} /></div><button type="button" aria-label={`Eliminar habilidad ${i + 1}`} className={`${botonSecundario} text-red-700`} onClick={() => quitar('habilidades', i)}><Trash2 size={18}/></button></div>)}
            <button type="button" className={botonSecundario} onClick={() => agregar('habilidades', nuevaHabilidad)}><Plus size={17}/>Agregar habilidad</button></div>
          </Seccion>
          <Seccion titulo="Idiomas" cantidad={datos.idiomas.length} abierta={abiertas.idiomas} alAlternar={() => alternar('idiomas')}>
            <div className="space-y-3">{datos.idiomas.map((i, n) => <div key={n} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"><div className="flex-1"><Texto titulo="Idioma" valor={i.idioma} onChange={(v) => cambiarLista('idiomas', n, 'idioma', v)} maxLength={100} error={errorDe(`idiomas.${n}.idioma`)} required /></div><div className="sm:w-44"><Seleccion titulo="Nivel" valor={i.nivel} onChange={(v) => cambiarLista('idiomas', n, 'nivel', v)} opciones={nivelesIdioma} error={errorDe(`idiomas.${n}.nivel`)} required /></div><button type="button" aria-label={`Eliminar idioma ${n + 1}`} className={`${botonSecundario} text-red-700`} onClick={() => quitar('idiomas', n)}><Trash2 size={18}/></button></div>)}
            <button type="button" className={botonSecundario} onClick={() => agregar('idiomas', nuevoIdioma)}><Plus size={17}/>Agregar idioma</button></div>
          </Seccion>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3"><button type="button" disabled={!modificado || guardando} onClick={descartar} className={botonSecundario}><RotateCcw size={17}/>Descartar cambios</button><button type="submit" disabled={!modificado || guardando} className={botonPrincipal}>{guardando ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18}/>} {guardando ? 'Guardando...' : 'Guardar cambios'}</button></div>
        </form>}
      </>}
    </div>
  </main>;
}
