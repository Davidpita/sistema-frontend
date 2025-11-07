// src/pages/Zonas/index.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import './index.css';

function Zonas() {
  const [zonas, setZonas] = useState([]);
  const [form, setForm] = useState({ nome: '', coordenadas: '' });
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    carregarZonas();
  }, []);

  const carregarZonas = async () => {
    try {
      const res = await api.get('/zonas');
      setZonas(res.data);
    } catch (err) {
      setErro('Erro ao carregar zonas');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      if (editando) {
        await api.put(`/zonas/${editando}`, form);
        setSucesso('Zona atualizada!');
      } else {
        await api.post('/zonas', form);
        setSucesso('Zona criada!');
      }
      limparForm();
      carregarZonas();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro na operação');
    } finally {
      setLoading(false);
    }
  };

  const limparForm = () => {
    setForm({ nome: '', coordenadas: '' });
    setEditando(null);
  };

  const editarZona = (zona) => {
    setForm({ nome: zona.nome, coordenadas: zona.coordenadas || '' });
    setEditando(zona.id);
  };

  const excluirZona = async (id) => {
    if (!window.confirm('Excluir esta zona? Utentes serão afetados!')) return;
    try {
      await api.delete(`/zonas/${id}`);
      carregarZonas();
      setSucesso('Zona excluída!');
    } catch (err) {
      setErro('Erro ao excluir');
    }
  };

  return (
    <div className="zonas-container">
      <h1>Gerenciar Zonas</h1>

      <div className="form-section">
        <h2>{editando ? 'Editar' : 'Criar'} Zona</h2>
        {sucesso && <div className="alert success">{sucesso}</div>}
        {erro && <div className="alert error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Nome da Zona (ex: Maputo Cidade)"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <input
            placeholder="Coordenadas (opcional: lat,long)"
            value={form.coordenadas}
            onChange={(e) => setForm({ ...form, coordenadas: e.target.value })}
          />
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : editando ? 'Atualizar' : 'Criar'}
            </button>
            {editando && (
              <button type="button" onClick={limparForm}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      <div className="lista-section">
        <h2>Zonas Cadastradas ({zonas.length})</h2>
        {zonas.length === 0 ? (
          <p>Nenhuma zona encontrada. Crie uma!</p>
        ) : (
          <div className="zonas-grid">
            {zonas.map(z => (
              <div key={z.id} className="zona-card">
                <h3>{z.nome}</h3>
                <div className="card-actions">
                  <button onClick={() => editarZona(z)} className="btn-edit">Editar</button>
                  <button onClick={() => excluirZona(z.id)} className="btn-delete">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Zonas;