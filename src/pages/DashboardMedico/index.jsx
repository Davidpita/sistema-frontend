// src/pages/DashboardMedico/index.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { logout } from "../../utils/auth";
import "./index.css";

function DashboardMedico() {
  const navigate = useNavigate();
  const [medico, setMedico] = useState(null);
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [triagensPendentes, setTriagensPendentes] = useState([]);
  const [stats, setStats] = useState({
    consultasHoje: 0,
    consultasPendentes: 0,
    pacientesAtendidos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!usuario.id || usuario.papel !== "medico") {
      navigate("/login");
      return;
    }

    setMedico(usuario);

    const carregarDados = async () => {
      try {
        // 1. CONSULTAS DE HOJE
        const resConsultas = await api.get("/consultas/hoje");
        const todasConsultas = resConsultas.data.consultas || [];
        const totalConsultasHoje = resConsultas.data.totalConsultasHoje || todasConsultas.length || 0;

        const minhasConsultas = todasConsultas.filter(
        c => c.profissionalId === usuario.id
      );

      setConsultasHoje(minhasConsultas);
      setStats(prev => ({
        ...prev,
        consultasHoje: minhasConsultas.length,
        consultasPendentes: minhasConsultas.filter(c => !c.realizada).length,
        pacientesAtendidos: minhasConsultas.filter(c => c.realizada).length,
      }));


        // 2. TRIAGENS RECENTES (últimas 5 com resultado ATENÇÃO/URGÊNCIA)
        const resTriagens = await api.get("/triagens/today");
        const triagens = resTriagens.data || [];

        const criticas = triagens
          .filter(t => t.resultado?.toLowerCase() === "risco alto")
          .slice(0, 5);

        setTriagensPendentes(criticas);
        } catch (err) {
          console.error("Erro ao carregar dashboard médico", err);
        } finally {
          setLoading(false);
        }
      };

    carregarDados();
  }, [navigate]);

  const marcarComoRealizada = async (id) => {
    try {
      await api.put(`/consultas/${id}/realizada`);
      setConsultasHoje(prev => 
        prev.map(c => c.id === id ? { ...c, realizada: true } : c)
      );
      setStats(prev => ({
        ...prev,
        consultasPendentes: prev.consultasPendentes - 1,
        pacientesAtendidos: prev.pacientesAtendidos + 1,
      }));
    } catch (err) {
      alert("Erro ao marcar consulta");
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard do médico...</div>;
  }

  return (
    <div className="dashboard-medico">
      <div className="header">
        <h1>Dr(a). {medico?.nome}</h1>
        <button onClick={logout} className="btn-sair">Sair</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Consultas Hoje</h3>
          <p className="numero">{stats.consultasHoje}</p>
        </div>
        <div className="stat-card pendente">
          <h3>Pendentes</h3>
          <p className="numero">{stats.consultasPendentes}</p>
        </div>
        <div className="stat-card concluido">
          <h3>Atendidos</h3>
          <p className="numero">{stats.pacientesAtendidos}</p>
        </div>
      </div>

      <div className="secoes">
        {/* CONSULTAS DE HOJE */}
        <div className="secao">
          <h2>Minhas Consultas de Hoje</h2>
          {consultasHoje.length === 0 ? (
            <p className="vazio">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <div className="lista-consultas">
              {consultasHoje.map((c) => (
                <div key={c.id} className={`consulta-card ${c.realizada ? "realizada" : ""}`}>
                  <div className="info-paciente">
                    <strong>{c.utente.nome}</strong>
                    <span>{c.utente.contacto}</span>
                  </div>
                  <div className="detalhes">
                    <span className="tipo">{c.tipo}</span>
                    <span className="hora">
                      {new Date(c.data).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="status">
                    {c.realizada ? (
                      <span className="concluido">Atendido</span>
                    ) : (
                      <button
                        onClick={() => marcarComoRealizada(c.id)}
                        className="btn-realizada"
                      >
                        Marcar como Atendido
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* TRIAGENS CRÍTICAS */}
      <div className="secao alerta">
        <h2>Triagens Críticas (Risco Alto)</h2>
        {triagensPendentes.length === 0 ? (
          <p className="vazio">Nenhuma triagem crítica no momento.</p>
        ) : (
          <div className="lista-triagens">
            {triagensPendentes.map((t) => (
              <div key={t.id} className="triagem-card risco-alto">
                <div>
                  <strong>{t.utente?.nome || "Paciente"}</strong>
                  <span>
                    {new Date(t.data).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="resultado">
                  <strong>{t.resultado}</strong>
                  <p>{t.recomendacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>

      <div className="acoes-rapidas">
        <h2>Ações Rápidas</h2>
        <div className="botoes">
          <Link to="/utentes" className="btn-acao">Novo Paciente</Link>
          <Link to="/triagens" className="btn-acao">Realizar Triagem</Link>
          <Link to="/consultas" className="btn-acao">Agendar Consulta</Link>
          <Link to="/leituras-clinicas" className="btn-acao">Registrar Leitura</Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardMedico;