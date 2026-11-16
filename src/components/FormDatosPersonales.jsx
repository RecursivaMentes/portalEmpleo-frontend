import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {  actualizarDatosPersonales, obtenerDatosPersonales, registrarse } from '../services/usuariosService';
import Swal from 'sweetalert2';

//prop para reutilizar el form 
const FormDatosPersonales=({actualizar=false})=> {
  const navigate = useNavigate();
  const [errors, setErrors]=useState({})
  const [datosActuales, setDatosActuales] = useState(null);
  const [input, setInput] = useState({
    email:"",
    nombre:"",
    apellido:"",
    //si es para actualizar datos, agrego campos no obligatorios
    ...(actualizar
    ? {
        telefono: "",
        // preferenciasJson: {
        //   modalidad: "remoto",     
        //   jornada: "full-time",
        //   salarioMinimo: ""
        // },
        // reglasPostulacion: {
        //   automatica: false,
        //   porcentajeMinimo: 80
        // }
      }
    : { //sino agrego la contraseña 
        password: ""
      })
  });

  useEffect(()=>{
    const cargarDatos=async()=>{
      if(actualizar) { //al renderizar componente, si es para actualizar...
        const usuario= await obtenerDatosPersonales();
        const datos={
          email:usuario.email,
          nombre:usuario.nombre,
          apellido:usuario.apellido,
          telefono:usuario.telefono || "",
          // preferenciasJson:usuario.preferenciasJson,
          // reglasPostulacion:usuario.reglasPostulacion
        }
        setInput(datos);
        setDatosActuales(datos);
        console.log("Datos originales:", datos);
        console.log("Input inicial:", input);
      }
    }
    cargarDatos();
  },[actualizar])

  const handleChange=(e)=>{
    const {name, value}=e.target;
    setInput({...input,[name]:value})
    const Name = name.charAt(0).toUpperCase() + name.slice(1);
    
    setErrors({
      ...errors,
      [Name]: null
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if(actualizar) {
        const payload = {
          ...input,
          // preferenciasJson: JSON.stringify(input.preferenciasJson),
          // reglasPostulacion: JSON.stringify(input.reglasPostulacion)
        };
        await actualizarDatosPersonales(payload)
        Swal.fire({
          title:"Datos actualizados correctamente",
          icon:"success"
        })
      }
      else{
        await registrarse(input);
        navigate('/iniciarSesion');
      }
    } catch (err) {
      setErrors(err?.errors)
      Swal.fire({
        title:`Error al ${actualizar? "actualizar datos" : "registrarse"}`,
        text:err.message?err.message:null,
        icon:"error"
      })
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-28">
          <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium">
            RecursivaMentes
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
            {actualizar?"Datos Personales y preferencias":"Registrate"} 
          </h1>
          <p className="mt-3 max-w-lg text-blue-100">
            {actualizar?"Actualizá tus datos de contacto y ajustá tus preferencias de postulación.":"Accedé a tus oportunidades laborales, recomendaciones y asistente."}
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-md px-5 pb-16">
        <form onSubmit={handleSubmit}
          className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-lg md:p-9">

          <h2 className="text-xl font-bold text-slate-900">
            {actualizar?"Actualizá tus datos":"Registrá una cuenta"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {actualizar?"Modificá los campos que desees actualizar.":"Completá tus datos para continuar."}
          </p>

          <div className="mt-7">
            <label htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              onChange={handleChange}
              value={input.email}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors?.Email && (<p className="mt-1.5 text-sm text-red-600">{errors.Email[0]}</p>)}
          </div>

          <div className="mt-7">
            <label htmlFor="nombre"
              className="mb-2 block text-sm font-semibold text-slate-700">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              required
              onChange={handleChange}
              value={input.nombre}
              placeholder="Ingresá tu nombre"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors?.Nombre && (<p className="mt-1.5 text-sm text-red-600">{errors.Nombre[0]}</p>)}
          </div>

          <div className="mt-7">
            <label htmlFor="apellido"
              className="mb-2 block text-sm font-semibold text-slate-700">
              Apellido
            </label>
            <input
              id="apellido"
              type="text"
              name="apellido"
              required
              onChange={handleChange}
              value={input.apellido}
              placeholder="Ingresá tu apellido"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors?.Apellido && (<p className="mt-1.5 text-sm text-red-600">{errors.Apellido[0]}</p>)}
          </div>

          <div className="mt-5">
            <label
              htmlFor={actualizar ? "telefono" : "password"}
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {actualizar ? "Teléfono" : "Contraseña"}
            </label>

            <input
              id={actualizar ? "telefono" : "password"}
              type={actualizar ? "tel" : "password"}
              name={actualizar ? "telefono" : "password"}
              required={!actualizar}
              autoComplete={actualizar ? "tel" : "new-password"}
              onChange={handleChange}
              value={actualizar ? input.telefono : input.password}
              placeholder={actualizar ? "Ingresá tu teléfono" : "Ingresá una contraseña"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {errors?.[actualizar ? "Telefono" : "Password"] && (
              <p className="mt-1.5 text-sm text-red-600">
                {errors[actualizar ? "Telefono" : "Password"][0]}
              </p>
            )}
          </div>

          <button type="submit"
            className="mt-7 w-full cursor-pointer rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 
              disabled:cursor-not-allowed 
              disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
            disabled={actualizar && datosActuales && Object.entries(input).every(([key, value]) => datosActuales[key] === value)}
          >
            {actualizar?"Guardar cambios" : "Registrarse"}
          </button>
          {!actualizar && <>
            <p className="mt-6 text-center text-sm text-slate-500">
              ¿Ya tenés cuenta?
            </p>

            <button 
              type="button" 
              onClick={() => navigate("/iniciarSesion")} 
              className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Iniciar Sesión
            </button>
          </>}
        </form>
      </div>
    </main>
  );
}

export default FormDatosPersonales;