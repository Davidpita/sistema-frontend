// src/pages/Usuarios/index.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './index.css';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', papel: 'agente' });
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data.usuarios);
    } catch (err) {
      setErro('Erro ao carregar usuários');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      if (editando) {
        await api.put(`/usuarios/${editando}`, form);
        setSucesso('Usuário atualizado!');
      } else {
        await api.post('/usuarios/criar', form);
        setSucesso('Usuário criado!');
      }
      setForm({ nome: '', email: '', senha: '', papel: 'agente' });
      setEditando(null);
      carregarUsuarios();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro na operação');
    } finally {
      setLoading(false);
    }
  };

  const editarUsuario = (usuario) => {
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', papel: usuario.papel });
    setEditando(usuario.id);
  };

  const excluirUsuario = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregarUsuarios();
      setSucesso('Usuário excluído!');
    } catch (err) {
      setErro('Erro ao excluir');
    }
  };

  return (
    <div className="usuarios-container">
      <h1>Gerenciar Usuários</h1>

      <div className="form-section">
        <h2>{editando ? 'Editar' : 'Criar'} Usuário</h2>
        {sucesso && <div className="alert success">{sucesso}</div>}
        {erro && <div className="alert error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={editando}
          />
          <input
            placeholder={editando ? "Nova senha (opcional)" : "Senha"}
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            minLength="6"
          />
          <select
            value={form.papel}
            onChange={(e) => setForm({ ...form, papel: e.target.value })}
          >
            <option value="agente">Agente</option>
            <option value="enfermeiro">Enfermeiro</option>
            <option value="medico">Médico</option>
            <option value="gestor">Gestor</option>
          </select>
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
            </button>
            {editando && (
              <button type="button" onClick={() => { setEditando(null); setForm({ nome: '', email: '', senha: '', papel: 'agente' }); }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lista-section">
        <h2>Usuários Cadastrados</h2>
        {usuarios.length === 0 ? (
          <p>Nenhum usuário encontrado.</p>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Papel</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td>{u.papel}</td>
                  <td>
                    <button onClick={() => editarUsuario(u)} className="btn-edit">Editar</button>
                    <button onClick={() => excluirUsuario(u.id)} className="btn-delete">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Usuarios;