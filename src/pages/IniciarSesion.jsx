import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { iniciarSesion } from '../services/usuariosService';

const IniciarSesion=()=> {
  const navigate = useNavigate();
  const [input, setInput] = useState({
    email:"",
    password:""
  });

  const handleChange=(e)=>{
    setInput({...input,[e.target.name]:e.target.value})
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await iniciarSesion(input);
      navigate('/empleos');
    } catch (err) {
      alert(err.message);
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
            Iniciá sesión
          </h1>
          <p className="mt-3 max-w-lg text-blue-100">
            Accedé a tus oportunidades laborales, recomendaciones y asistente.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-md px-5 pb-16">
        <form onSubmit={handleSubmit}
          className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-lg md:p-9">

          <h2 className="text-xl font-bold text-slate-900">
            Ingresar a mi cuenta
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completá tus datos para continuar.
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
          </div>

          <div className="mt-5">
            <label htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              onChange={handleChange}
              value={input.password}
              placeholder="Ingresá tu contraseña"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button type="submit"
            className="mt-7 w-full cursor-pointer rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
}

export default IniciarSesion;