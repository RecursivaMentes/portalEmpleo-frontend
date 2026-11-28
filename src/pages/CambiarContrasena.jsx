import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import { LockKeyhole, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { cambiarContrasena, cerrarSesionUsuario } from "../services/usuariosService";

export default function CambiarContrasena() {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    contrasenaActual: "",
    nuevaContrasena: "",
    confirmarContrasena: "",
  });

  const [mostrarContrasenas, setMostrarContrasenas] = useState({
    contrasenaActual: false,
    nuevaContrasena: false,
    confirmarContrasena: false,
  });

  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Actualizar los campos del formulario
  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  // Mostrar u ocultar contraseñas
  const alternarVisibilidad = (campo) => {
    setMostrarContrasenas((anterior) => ({
      ...anterior,
      [campo]: !anterior[campo],
    }));
  };

  // Validar y enviar el formulario
  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setNotificacion(null);

    const {
      contrasenaActual,
      nuevaContrasena,
      confirmarContrasena,
    } = formulario;

    if (
      !contrasenaActual.trim() ||
      !nuevaContrasena.trim() ||
      !confirmarContrasena.trim()
    ) {
      setNotificacion({
        tipo: "error",
        mensaje: "Todos los campos son obligatorios.",
      });
      return;
    }

    if (nuevaContrasena.length < 8 || nuevaContrasena.length > 128) {
      setNotificacion({
        tipo: "error",
        mensaje: "La nueva contraseña debe tener entre 8 y 128 caracteres.",
      });
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setNotificacion({
        tipo: "error",
        mensaje: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }

    if (contrasenaActual === nuevaContrasena) {
      setNotificacion({
        tipo: "error",
        mensaje: "La nueva contraseña debe ser diferente a la actual.",
      });
      return;
    }

    try {
      setCargando(true);

      // El servicio convierte los nombres al formato del backend
      await cambiarContrasena({
        currentPassword: contrasenaActual,
        newPassword: nuevaContrasena,
        confirmPassword: confirmarContrasena
      });
      await cerrarSesionUsuario();
      navigate('/iniciarSesion', {
        replace: true,
        state: { contrasenaActualizada: true }
      });



      // Limpiar los campos después de actualizar
      setFormulario({
        contrasenaActual: "",
        nuevaContrasena: "",
        confirmarContrasena: "",
      });

      setMostrarContrasenas({
        contrasenaActual: false,
        nuevaContrasena: false,
        confirmarContrasena: false,
      });
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje:
          error.response?.data?.message ||
          error.message ||
          "No se pudo actualizar la contraseña.",
      });
    } finally {
      setCargando(false);
    }
  };

  const campos = [
    {
      nombre: "contrasenaActual",
      etiqueta: "Contraseña actual",
      autocompletar: "current-password",
    },
    {
      nombre: "nuevaContrasena",
      etiqueta: "Nueva contraseña",
      autocompletar: "new-password",
    },
    {
      nombre: "confirmarContrasena",
      etiqueta: "Confirmar nueva contraseña",
      autocompletar: "new-password",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Encabezado */}
        <div className="rounded-2xl bg-gradient-to-r from-primary-700 to-accent-700 p-8 text-white shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-3">
            <LockKeyhole size={30} />
            <h1 className="text-2xl font-bold">
              Cambiar contraseña
            </h1>
          </div>

          <p className="text-primary-100">
            Mantené tu cuenta protegida actualizando tu contraseña.
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={manejarEnvio}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="text-primary-600" size={22} />
            <h2 className="text-lg font-semibold text-slate-800">
              Seguridad de la cuenta
            </h2>
          </div>

          <div className="space-y-5">
            {campos.map((campo) => (
              <div key={campo.nombre}>
                <label
                  htmlFor={campo.nombre}
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  {campo.etiqueta}
                </label>

                <div className="relative">
                  <input
                    id={campo.nombre}
                    name={campo.nombre}
                    type={
                      mostrarContrasenas[campo.nombre]
                        ? "text"
                        : "password"
                    }
                    value={formulario[campo.nombre]}
                    onChange={manejarCambio}
                    autoComplete={campo.autocompletar}
                    placeholder={`Ingresá ${campo.etiqueta.toLowerCase()}`}
                    disabled={cargando}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      alternarVisibilidad(campo.nombre)
                    }
                    aria-label={
                      mostrarContrasenas[campo.nombre]
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 cursor-pointer"
                  >
                    {mostrarContrasenas[campo.nombre] ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-4">
            La nueva contraseña debe tener entre 8 y 128 caracteres
            y ser diferente de la actual.
          </p>

          {/* Notificación */}
          {notificacion && (
            <div
              role="alert"
              className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
                notificacion.tipo === "exito"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {notificacion.mensaje}
            </div>
          )}

          {/* Botón de actualización */}
          <button
            type="submit"
            disabled={cargando}
            className="mt-7 w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-60 cursor-pointer"
          >
            {cargando ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <LockKeyhole size={19} />
                Actualizar contraseña
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
