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
    carregarDadosDashboard(usuario.id);
  }, [navigate]);

  const carregarDadosDashboard = async (medicoId) => {
    try {
      setLoading(true);
      
      // 1. CARREGAR TODAS AS CONSULTAS
      const resConsultas = await api.get("/consultas");
      console.log("📦 Resposta completa das consultas:", resConsultas);
      
      // Extrai o array de consultas da resposta
      let todasConsultas = [];
      if (Array.isArray(resConsultas.data)) {
        todasConsultas = resConsultas.data;
      } else if (resConsultas.data.consultas && Array.isArray(resConsultas.data.consultas)) {
        todasConsultas = resConsultas.data.consultas;
      } else if (resConsultas.data.data && Array.isArray(resConsultas.data.data)) {
        todasConsultas = resConsultas.data.data;
      }
      
      console.log("🔍 Todas as consultas:", todasConsultas);

      // FILTRO CORRIGIDO: Consultas do médico logado (incluindo profissionalId null para testes)
      const minhasConsultas = todasConsultas.filter(consulta => {
        return consulta.profissionalId === medicoId || consulta.profissionalId === null;
      });

      console.log("🎯 Minhas consultas:", minhasConsultas);

      // CONSULTAS DE HOJE - data atual
      const hoje = new Date().toISOString().split('T')[0];
      const consultasDeHoje = minhasConsultas.filter(consulta => {
        const dataConsulta = new Date(consulta.data).toISOString().split('T')[0];
        return dataConsulta === hoje;
      });

      console.log("📅 Consultas de hoje:", consultasDeHoje);

      setConsultasHoje(consultasDeHoje);
      
      // ATUALIZAR ESTATÍSTICAS
      setStats({
        consultasHoje: consultasDeHoje.length,
        consultasPendentes: consultasDeHoje.filter(c => !c.realizada).length,
        pacientesAtendidos: minhasConsultas.filter(c => c.realizada).length,
      });

      // 2. TRIAGENS - Carregar todas e filtrar
      try {
        const resTriagens = await api.get("/triagens");
        console.log("📋 Resposta das triagens:", resTriagens);
        
        let todasTriagens = [];
        if (Array.isArray(resTriagens.data)) {
          todasTriagens = resTriagens.data;
        } else if (resTriagens.data.triagens && Array.isArray(resTriagens.data.triagens)) {
          todasTriagens = resTriagens.data.triagens;
        } else if (resTriagens.data.data && Array.isArray(resTriagens.data.data)) {
          todasTriagens = resTriagens.data.data;
        }

        // Filtrar triagens críticas (risco alto)
        const triagensCriticas = todasTriagens
          .filter(t => t.resultado && (
            t.resultado.toLowerCase().includes('risco alto') || 
            t.resultado.toLowerCase().includes('urgente') ||
            t.resultado.toLowerCase().includes('crítico')
          ))
          .slice(0, 5);

        console.log("🚨 Triagens críticas:", triagensCriticas);
        setTriagensPendentes(triagensCriticas);
        
      } catch (triagemError) {
        console.warn("⚠️ Erro ao carregar triagens:", triagemError);
        setTriagensPendentes([]);
      }

    } catch (err) {
      console.error("❌ Erro ao carregar dashboard médico", err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoRealizada = async (id) => {
    try {
      await api.put(`/consultas/${id}/realizada`);
      
      // Atualizar estado local
      setConsultasHoje(prev => 
        prev.map(c => c.id === id ? { ...c, realizada: true } : c)
      );
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        consultasPendentes: prev.consultasPendentes - 1,
        pacientesAtendidos: prev.pacientesAtendidos + 1,
      }));
      
    } catch (err) {
      console.error("Erro ao marcar consulta:", err);
      alert("Erro ao marcar consulta como realizada");
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