import axios from "axios";

export const iniciarSesion = async (usuario) => {
  try {
    const response = await axios.post(
      "/api/auth/login",
      usuario
    );

    const { accessToken, expiresAtUtc } = response.data;

    localStorage.setItem("accessToken", accessToken);

    return {
      accessToken,
      expiresAtUtc,
    };
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.message ||
      "No se pudo iniciar sesión. Verificá tus credenciales."
    );
  }
};

export const obtenerPerfil = async () => {
    const token = localStorage.getItem("accessToken");
  
    if (!token) {
      throw new Error("Debés iniciar sesión para postularte.");
    }
  
    try {
      const response = await axios.get("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
        "No se pudo obtener el perfil del usuario."
      );
    }
  };
  
