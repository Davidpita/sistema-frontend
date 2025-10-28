// src/pages/CriarUsuario/CriarUsuario.jsx
import { useState } from 'react';
import api from '../../services/api';

function CriarUsuario() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'agente' });
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', form);
      alert('Usuário criado!');
    } catch (err) {
      setErro('Erro ao criar usuário');
    }
  };

  return (
    <div>
      <h1>Criar Usuário</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Senha" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
        <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}>
          <option value="agente">Agente</option>
          <option value="enfermeiro">Enfermeiro</option>
          <option value="medico">Médico</option>
          <option value="gestor">Gestor</option>
        </select>
        <button type="submit">Criar</button>
      </form>
      {erro && <p>{erro}</p>}
    </div>
  );
}

export default CriarUsuario;