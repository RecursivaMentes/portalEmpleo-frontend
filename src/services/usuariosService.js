import axios from 'axios';

const API_URL = import.meta.env.VITE_USUARIOS_API_URL;

export const iniciarSesion = async (usuario) => {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, usuario);
        localStorage.setItem("accessToken", response.data.accessToken);
    } catch (error) {
        console.log(error.response.data);
        
        throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }  
}

export const cambiarContrasena = async (formulario) => {
    const token = localStorage.getItem("accessToken");
  
    if (!token) {
      throw new Error("Debés iniciar sesión para cambiar tu contraseña.");
    }
  
    const datos = {
      currentPassword: formulario.contrasenaActual,
      newPassword: formulario.nuevaContrasena,
      confirmPassword: formulario.confirmarContrasena,
    };
  
    const respuesta = await fetch("/api/auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
  
    const resultado = await respuesta.json();
  
    if (!respuesta.ok) {
      throw new Error(
        resultado.message || "No se pudo cambiar la contraseña."
      );
    }
  
    return resultado;
  };  