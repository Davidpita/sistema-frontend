// src/pages/Login/index.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { login } from '../../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await api.post('/usuarios/login', { email, senha });
      const { token, usuario } = response.data;

      login(token, usuario);

      const papel = usuario.papel;
      if (papel === 'gestor') navigate('/dashboard/gestor');
      else if (papel === 'medico') navigate('/dashboard/medico');
      else if (['agente', 'enfermeiro'].includes(papel)) navigate('/dashboard/profissional');
      else navigate('/');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <h1>Login - eSaúde Local</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={carregando}
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            disabled={carregando}
          />
        </div>
        {erro && <p style={{ color: 'red' }}>{erro}</p>}
        <button type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default Login;