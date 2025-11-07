// src/pages/Consultas/index.jsx
import { useState, useEffect } from "react";
import api from "../../services/api";
import "./index.css";

function Consultas() {
  const [utentes, setUtentes] = useState([]);
  const [medicos, setMedicos] = useState([]); // NOVO: LISTA DE MÉDICOS
  const [triagens, setTriagens] = useState([]);
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [buscaContacto, setBuscaContacto] = useState("");
  const [utenteSelecionado, setUtenteSelecionado] = useState(null);
  const [form, setForm] = useState({
    tipo: "teleconsulta",
    data: "",
    hora: "",
    profissionalId: "", // vazio = automático
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarUtentes();
    carregarMedicos(); // CARREGA MÉDICOS
    carregarConsultasHoje();
  }, []);

  // CARREGAR MÉDICOS DO BACKEND
  const carregarMedicos = async () => {
    try {
      const res = await api.get("/usuarios/medico");
      setMedicos(res.data || res.data);
    } catch (err) {
      console.error("Erro ao carregar médicos", err);
      setMedicos([]);
    }
  };

  const carregarUtentes = async () => {
    try {
      const res = await api.get("/utentes");
      setUtentes(res.data.utentes || res.data);
    } catch (err) {
      setErro("Erro ao carregar utentes");
    }
  };

const carregarConsultasHoje = async () => {
  try {
    const res = await api.get("/consultas/hoje");

    const consultas =
      Array.isArray(res.data.consultas)
        ? res.data.consultas
        : Array.isArray(res.data)
        ? res.data
        : [];

    setConsultasHoje(consultas);
  } catch (err) {
    console.error("Erro ao carregar consultas de hoje", err);
    setConsultasHoje([]);
  }
};

  const carregarTriagensDoUtente = async (utenteId) => {
    try {
      const res = await api.get(`/triagens/utente/${utenteId}`);
      setTriagens(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar triagens", err);
      setTriagens([]);
    }
  };


  const utentesFiltrados = utentes.filter((u) =>
    u.contacto?.includes(buscaContacto)
  );

  const selecionarUtente = (utente) => {
    setUtenteSelecionado(utente);
    setBuscaContacto("");
    carregarTriagensDoUtente(utente.id);
  };

  const handleAgendar = async (e) => {
    e.preventDefault();
    if (!utenteSelecionado) {
      setErro("Selecione um utente");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const dataHora = `${form.data}T${form.hora}:00.000Z`;

      await api.post("/consultas", {
        utenteId: utenteSelecionado.id,
        profissionalId: form.profissionalId || null, // null = automático
        tipo: form.tipo,
        data: dataHora,
      });

      setSucesso("Consulta agendada com sucesso!");
      limparForm();
      carregarConsultasHoje();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao agendar");
    } finally {
      setLoading(false);
    }
  };

  const limparForm = () => {
    setForm({ tipo: "teleconsulta", data: "", hora: "", profissionalId: "" });
    setUtenteSelecionado(null);
    setTriagens([]);
  };

  const marcarComoRealizada = async (id) => {
    try {
      await api.put(`/consultas/${id}/realizada`);
      carregarConsultasHoje();
      setSucesso("Consulta marcada como realizada");
    } catch (err) {
      setErro("Erro ao atualizar");
    }
  };

  // FUNÇÃO PARA MOSTRAR NOME DO MÉDICO
  const getNomeMedico = (profissionalId) => {
    if (!profissionalId) return "Automático";
    const medico = medicos.find((m) => m.id === profissionalId);
    return medico ? `Dr(a). ${medico.nome}` : "Médico alocado";
  };

  return (
    <div className="consultas-container">
      <h1>Gerenciar Consultas</h1>

      {/* AGENDAR NOVA CONSULTA */}
      <div className="agendar-section">
        <h2>Agendar Nova Consulta</h2>

        <div className="busca-utente">
          <input
            type="text"
            placeholder="Buscar utente por contacto..."
            value={buscaContacto}
            onChange={(e) => setBuscaContacto(e.target.value)}
          />
          {buscaContacto && utentesFiltrados.length > 0 && (
            <div className="resultados">
              {utentesFiltrados.map((u) => (
                <div
                  key={u.id}
                  className="item"
                  onClick={() => selecionarUtente(u)}
                >
                  {u.nome} - {u.contacto}
                </div>
              ))}
            </div>
          )}
        </div>

        {utenteSelecionado && (
          <>
            <div className="utente-info">
              <strong>{utenteSelecionado.nome}</strong> |{" "}
              {utenteSelecionado.contacto}
            </div>

            <form onSubmit={handleAgendar} className="agendar-form">
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="teleconsulta">Teleconsulta</option>
                <option value="presencial">Presencial</option>
                <option value="triagem">Triagem</option>
              </select>

              {/* SELECT DE MÉDICOS - CARREGADO DINAMICAMENTE */}
              <select
                value={form.profissionalId}
                onChange={(e) =>
                  setForm({ ...form, profissionalId: e.target.value })
                }
              >
                <option value="">Selecione um medico</option>
                {medicos.map((medico) => (
                  <option key={medico.id} value={medico.id}>
                    Dr(a). {medico.nome}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
              />
              <input
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                required
              />

              <div className="actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Agendando..." : "Agendar"}
                </button>
                <button type="button" onClick={limparForm}>
                  Cancelar
                </button>
              </div>
            </form>

            {sucesso && <div className="alert success">{sucesso}</div>}
            {erro && <div className="alert error">{erro}</div>}
          </>
        )}
      </div>

      {/* TRIAGENS RECENTES */}
      {utenteSelecionado && triagens.length > 0 && (
        <div className="triagens-recentes">
          <h3>Triagens Recentes</h3>
          {triagens.map((t) => (
            <div
              key={t.id}
              className={`triagem-card ${t.resultado.toLowerCase()}`}
            >
              <p>
                <strong>{new Date(t.data).toLocaleDateString()}</strong>
              </p>
              <p>
                <strong>Resultado:</strong> {t.resultado}
              </p>
              <p>
                <strong>Recomendação:</strong> {t.recomendacao}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CONSULTAS DE HOJE */}
      <div className="consultas-hoje">
        <h2>Consultas de Hoje ({consultasHoje.length})</h2>
        {consultasHoje.length === 0 ? (
          <p>Nenhuma consulta agendada para hoje.</p>
        ) : (
          <div className="lista-consultas">
            {consultasHoje.map((c) => (
              <div key={c.id} className="consulta-card">
                <div>
                  <strong>{c.utente.nome}</strong> ({c.utente.contacto})
                </div>
                <div>
                  Tipo: <strong>{c.tipo}</strong>
                </div>
                <div>
                  Hora:{" "}
                  <strong>
                    {new Date(c.data).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </div>

                {/* MÉDICO ALOCADO - MOSTRA NOME REAL */}
                <div>
                  Médico: <strong>{getNomeMedico(c.profissionalId)}</strong>
                </div>

                <div className="status">
                  {c.realizada ? "Realizada" : "Pendente"}
                </div>
                {!c.realizada && (
                  <button
                    onClick={() => marcarComoRealizada(c.id)}
                    className="btn-realizada"
                    disabled={loading} // opcional
                  >
                    Marcar como Realizada
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Consultas;
