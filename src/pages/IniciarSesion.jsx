import { useLocation, useNavigate } from 'react-router-dom';
import { FormularioAutenticacion } from '../components/Autenticacion';

export default function IniciarSesion() {
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  return <main className="min-h-screen bg-slate-50">
    <section className="bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 text-white"><div className="max-w-6xl mx-auto px-5 pt-14 pb-28"><span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm">RecursivaMentes</span><h1 className="mt-5 text-3xl md:text-4xl font-extrabold">Iniciá sesión</h1><p className="mt-3 text-primary-100">Accedé a tus oportunidades laborales, recomendaciones y asistente.</p></div></section>
    <div className="max-w-md mx-auto -mt-16 px-5 pb-16"><div className="relative rounded-2xl border border-slate-100 bg-white p-7 md:p-9 shadow-lg">{location.state?.contrasenaActualizada && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Contraseña actualizada. Iniciá sesión nuevamente.</p>}<FormularioAutenticacion onExito={() => navigate('/empleos', { replace: true })} /></div></div>
  </main>;
=======
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-5 pt-14 pb-28">
          <span className="rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm">
            RecursivaMentes
          </span>
          <h1 className="mt-5 text-3xl md:text-4xl font-extrabold">Iniciá sesión</h1>
          <p className="mt-3 text-blue-100">
            Accedé a tus oportunidades laborales, recomendaciones y asistente.
          </p>
        </div>
      </section>
      <div className="max-w-md mx-auto -mt-16 px-5 pb-16">
        <div className="relative rounded-2xl border border-slate-100 bg-white p-7 md:p-9 shadow-lg">
          {location.state?.contrasenaActualizada && (
            <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Contraseña actualizada. Iniciá sesión nuevamente.
            </p>
          )}
          <FormularioAutenticacion onExito={() => navigate('/empleos', { replace: true })} />
        </div>
      </div>
    </main>
  );
>>>>>>> origin/feat/cookie-accessToken
}
