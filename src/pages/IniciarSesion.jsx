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
    <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input type="text" name='email' onChange={handleChange} value={input.email}/>
        <label>Contraseña:</label>
        <input type="password" name='password' onChange={handleChange} value={input.password}/>
        <button type='submit'>Iniciar Sesión</button>
    </form>
  );
}

export default IniciarSesion;