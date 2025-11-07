// src/pages/Utentes/index.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function Utentes() {
  const [utentes, setUtentes] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    dataNascimento: "",
    sexo: "M",
    contacto: "",
    localizacao: "",
    idLocal: "",
    senha: "",
  });
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const navigate = useNavigate();

  const [zonas, setZonas] = useState([]);

  useEffect(() => {
    carregarZonas();
  }, []);

  const carregarZonas = async () => {
    try {
      const res = await api.get("/zonas");
      setZonas(res.data);
    } catch (err) {
      console.error("Erro ao carregar zonas");
    }
  };

  useEffect(() => {
    carregarUtentes();
  }, []);

  const carregarUtentes = async () => {
    try {
      const res = await api.get("/utentes");
      setUtentes(res.data);
    } catch (err) {
      setErro("Erro ao carregar utentes");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);

    try {
      // CONVERTER dataNascimento para ISO-8601
      const dadosParaEnviar = {
        ...form,
        dataNascimento: form.dataNascimento
          ? `${form.dataNascimento}:00.000Z` // ADICIONA SEGUNDOS E Z
          : null,
      };

      if (editando) {
        await api.put(`/utentes/${editando}`, dadosParaEnviar);
        setSucesso("Utente atualizado!");
      } else {
        await api.post("/utentes/", dadosParaEnviar);
        setSucesso("Utente criado!");
      }
      limparForm();
      carregarUtentes();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro na operação");
    } finally {
      setLoading(false);
    }
  };

  const limparForm = () => {
    setForm({
      nome: "",
      dataNascimento: "",
      sexo: "M",
      contacto: "",
      localizacao: "",
      idLocal: "",
      senha: "",
    });
    setEditando(null);
  };

  const editarUtente = (utente) => {
    const dataOriginal = utente.dataNascimento;
    const dataFormatada = dataOriginal
      ? new Date(dataOriginal).toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
      : "";

    setForm({
      nome: utente.nome,
      dataNascimento: dataFormatada,
      sexo: utente.sexo,
      contacto: utente.contacto,
      localizacao: utente.localizacao,
      idLocal: utente.idLocal || "",
      senha: "",
    });
    setEditando(utente.id);
  };
  const excluirUtente = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este utente?")) return;
    try {
      await api.delete(`/utentes/${id}`);
      carregarUtentes();
      setSucesso("Utente excluído!");
    } catch (err) {
      setErro("Erro ao excluir");
    }
  };

  const utentesFiltrados = utentes.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.contacto.includes(busca)
  );

  return (
    <div className="utentes-container">
      <h1>Gerenciar Utentes</h1>

      <div className="busca-section">
        <input
          type="text"
          placeholder="Buscar por nome ou contacto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-input"
        />
      </div>

      <div className="form-section">
        <h2>{editando ? "Editar" : "Criar"} Utente</h2>
        {sucesso && <div className="alert success">{sucesso}</div>}
        {erro && <div className="alert error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input
              placeholder="Nome Completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              placeholder="Data Nascimento"
              value={form.dataNascimento}
              onChange={(e) =>
                setForm({ ...form, dataNascimento: e.target.value })
              }
              required
            />
            <select
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
            <input
              placeholder="Contacto (ex: 923456789)"
              value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              required
              disabled={editando}
            />

            <select
              value={form.idLocal}
              onChange={(e) => setForm({ ...form, idLocal: e.target.value })}
              required
            >
              <option value="">Selecione uma zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nome}
                </option>
              ))}
            </select>

            <input
              type="password"
              placeholder={editando ? "Nova senha (opcional)" : "Senha"}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              minLength="6"
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editando ? "Atualizar" : "Criar"}
            </button>
            {editando && (
              <button type="button" onClick={limparForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lista-section">
        <h2>Utentes Cadastrados ({utentesFiltrados.length})</h2>
        {utentesFiltrados.length === 0 ? (
          <p>Nenhum utente encontrado.</p>
        ) : (
          <div className="utentes-grid">
            {utentesFiltrados.map((u) => (
              <div key={u.id} className="utente-card">
                <div className="card-header">
                  <h3>{u.nome}</h3>
                  <span className={`sexo ${u.sexo}`}>
                    {u.sexo === "M" ? "👩" : "👨"}
                  </span>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Contact:</strong> {u.contacto}
                  </p>
                  <p>
                    <strong>Local:</strong> {u.localizacao || "Não informado"}
                  </p>
                  <p>
                    <strong>Zona:</strong> {u.zona?.nome || u.idLocal}
                  </p>
                </div>
                <div className="card-actions">
                  <button onClick={() => editarUtente(u)} className="btn-edit">
                    Editar
                  </button>
                  <button
                    onClick={() => excluirUtente(u.id)}
                    className="btn-delete"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Utentes;
