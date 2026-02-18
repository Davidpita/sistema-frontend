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
        setSucesso("Utente atualizado com sucesso!");
      } else {
        await api.post("/utentes/", dadosParaEnviar);
        setSucesso("Utente criado com sucesso!");
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
      setSucesso("Utente excluído com sucesso!");
    } catch (err) {
      setErro("Erro ao excluir utente");
    }
  };

  const utentesFiltrados = utentes.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.contacto.includes(busca)
  );

  const getSexoIcon = (sexo) => {
    return sexo === "M" ? "male" : "female";
  };

  const getSexoLabel = (sexo) => {
    return sexo === "M" ? "Masculino" : "Feminino";
  };

  return (
    <div className="utentes-container">
      <header className="utentes-header">
        <div className="header-content">
          <h1>
            <span className="material-icons">people</span>
            Gerenciar Utentes
          </h1>
        </div>
      </header>

      {/* BUSCA */}
      <section className="busca-section card">
        <div className="input-with-icon">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar utente por nome ou contacto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="busca-input"
          />
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section className="form-section card">
        <div className="section-header">
          <h2>
            <span className="material-icons">
              {editando ? "edit" : "person_add"}
            </span>
            {editando ? "Editar Utente" : "Cadastrar Novo Utente"}
          </h2>
        </div>

        {/* ALERTAS */}
        {sucesso && (
          <div className="alert success">
            <span className="material-icons">check_circle</span>
            <span className="alert-text">{sucesso}</span>
            <button onClick={() => setSucesso("")} className="btn-fechar-alerta">
              <span className="material-icons">close</span>
            </button>
          </div>
        )}
        
        {erro && (
          <div className="alert error">
            <span className="material-icons">error</span>
            <span className="alert-text">{erro}</span>
            <button onClick={() => setErro("")} className="btn-fechar-alerta">
              <span className="material-icons">close</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="utente-form">
          <div className="form-grid">
            <div className="form-group">
              <label>
                <span className="material-icons">badge</span>
                Nome Completo
              </label>
              <input
                placeholder="Nome completo do utente"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="material-icons">cake</span>
                Data de Nascimento
              </label>
              <input
                type="datetime-local"
                placeholder="Data de Nascimento"
                value={form.dataNascimento}
                onChange={(e) =>
                  setForm({ ...form, dataNascimento: e.target.value })
                }
                required
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="material-icons">person</span>
                Sexo
              </label>
              <select
                value={form.sexo}
                onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                className="input-field"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <span className="material-icons">phone</span>
                Contacto
              </label>
              <input
                placeholder="Número de contacto (ex: 923456789)"
                value={form.contacto}
                onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                required
                disabled={editando}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="material-icons">location_on</span>
                Zona
              </label>
              <select
                value={form.idLocal}
                onChange={(e) => setForm({ ...form, idLocal: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Selecione uma zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <span className="material-icons">lock</span>
                {editando ? "Nova Senha" : "Senha"}
              </label>
              <input
                type="password"
                placeholder={editando ? "Nova senha (opcional)" : "Senha do utente"}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                minLength="6"
                className="input-field"
                required={!editando}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <span className="material-icons spinner">refresh</span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-icons">
                    {editando ? "save" : "add"}
                  </span>
                  {editando ? "Atualizar Utente" : "Criar Utente"}
                </>
              )}
            </button>
            
            {editando && (
              <button 
                type="button" 
                onClick={limparForm}
                className="btn-secondary"
              >
                <span className="material-icons">cancel</span>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </section>

      {/* LISTA DE UTENTES */}
      <section className="lista-section card">
        <div className="section-header">
          <h2>
            <span className="material-icons">list_alt</span>
            Utentes Cadastrados ({utentesFiltrados.length})
          </h2>
        </div>

        {utentesFiltrados.length === 0 ? (
          <div className="sem-registros">
            <span className="material-icons">people_outline</span>
            <p>Nenhum utente encontrado.</p>
            {busca && (
              <p className="busca-vazia">
                Nenhum resultado para "{busca}"
              </p>
            )}
          </div>
        ) : (
          <div className="utentes-grid">
            {utentesFiltrados.map((u) => (
              <div key={u.id} className="utente-card">
                <div className="card-header">
                  <div className="utente-info">
                    <span className={`sexo-icon ${u.sexo}`}>
                      <span className="material-icons">{getSexoIcon(u.sexo)}</span>
                    </span>
                    <div>
                      <h3>{u.nome}</h3>
                      <span className="sexo-label">{getSexoLabel(u.sexo)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      onClick={() => editarUtente(u)} 
                      className="btn-edit"
                      title="Editar utente"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      onClick={() => excluirUtente(u.id)}
                      className="btn-delete"
                      title="Excluir utente"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="info-item">
                    <span className="material-icons">phone</span>
                    <div>
                      <span className="info-label">Contacto</span>
                      <span className="info-value">{u.contacto}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <span className="material-icons">location_on</span>
                    <div>
                      <span className="info-label">Localização</span>
                      <span className="info-value">{u.localizacao || "Não informado"}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <span className="material-icons">map</span>
                    <div>
                      <span className="info-label">Zona</span>
                      <span className="info-value">{u.zona?.nome || u.idLocal || "Não atribuída"}</span>
                    </div>
                  </div>

                  {u.dataNascimento && (
                    <div className="info-item">
                      <span className="material-icons">cake</span>
                      <div>
                        <span className="info-label">Data Nasc.</span>
                        <span className="info-value">
                          {new Date(u.dataNascimento).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Utentes;