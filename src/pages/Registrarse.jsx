import { useNavigate } from 'react-router-dom';
import FormDatosPersonales from '../components/FormDatosPersonales';

export default function Registrarse() {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-slate-50"><section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white"><div className="max-w-6xl mx-auto px-5 pt-14 pb-28"><h1 className="text-3xl md:text-4xl font-bold">Registrate</h1></div></section><div className="max-w-md mx-auto -mt-16 px-5 pb-16"><div className="relative bg-white rounded-2xl shadow-lg border border-slate-100 p-7 md:p-9"><FormDatosPersonales onRegistrado={() => navigate('/iniciarSesion', { replace: true, state: { registrado: true } })} onCancelar={() => navigate('/iniciarSesion')} /></div></div></main>;
}
