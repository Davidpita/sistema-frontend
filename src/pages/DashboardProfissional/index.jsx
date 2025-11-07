// src/pages/DashboardProfissional/DashboardProfissional.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { logout } from "../../utils/auth";
import "./index.css";

function DashboardProfissional() {
  const navigate = useNavigate();
  const [profissional, setProfissional] = useState(null);
  const [triagensHoje, setTriagensHoje] = useState([]);
  const [leiturasHoje, setLeiturasHoje] = useState([]);
  const [stats, setStats] = useState({
    triagensHoje: 0,
    pacientesAtendidos: 0,
    urgencias: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    const papeisValidos = ["agente", "enfermeiro"];
    
    if (!usuario.id || !papeisValidos.includes(usuario.papel)) {
      navigate("/login");
      return;
    }

    setProfissional(usuario);

    const carregarDados = async () => {
      try {
        // 1. TRIAGENS DE HOJE
        const resTriagens = await api.get("/triagens/hoje");
        const triagens = Array.isArray(resTriagens.data) ? resTriagens.data : [];
        
        const minhasTriagens = triagens.filter(t => 
          t.inseridoPor === usuario.id || usuario.papel === "enfermeiro"
        );

        setTriagensHoje(minhasTriagens);
        const urgencias = minhasTriagens.filter(t => t.resultado === "URGÊNCIA").length;

        // 2. LEITURAS CLÍNICAS DE HOJE
        const hoje = new Date().toISOString().split('T')[0];
        const resLeituras = await api.get("/leituras-clinicas");
        const todasLeituras = resLeituras.data || [];
        const minhasLeituras = todasLeituras.filter(l => 
          new Date(l.data).toISOString().split('T')[0] === hoje &&
          (l.inseridoPor === usuario.id || usuario.papel === "enfermeiro")
        );

        setLeiturasHoje(minhasLeituras.slice(0, 5));

        setStats({
          triagensHoje: minhasTriagens.length,
          pacientesAtendidos: new Set(minhasTriagens.map(t => t.utenteId)).size,
          urgencias: urgencias,
        });

      } catch (err) {
        console.error("Erro no dashboard profissional", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard-profissional">
      <div className="header">
        <h1>OlÁ, {profissional?.nome}!</h1>
        <button onClick={logout} className="btn-sair">Sair</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Triagens Hoje</h3>
          <p className="numero">{stats.triagensHoje}</p>
        </div>
        <div className="stat-card pacientes">
          <h3>Pacientes Atendidos</h3>
          <p className="numero">{stats.pacientesAtendidos}</p>
        </div>
        <div className="stat-card urgencia">
          <h3>Urgências</h3>
          <p className="numero">{stats.urgencias}</p>
        </div>
      </div>

      <div className="secoes">
        {/* TRIAGENS RECENTES */}
        <div className="secao">
          <h2>Últimas Triagens</h2>
          {triagensHoje.length === 0 ? (
            <p className="vazio">Nenhuma triagem realizada hoje.</p>
          ) : (
            <div className="lista-triagens">
              {triagensHoje.slice(0, 5).map((t) => (
                <div key={t.id} className={`triagem-card ${t.resultado.toLowerCase()}`}>
                  <div className="info">
                    <strong>{t.utente?.nome || "Paciente"}</strong>
                    <span>{t.utente?.contacto || ""}</span>
                  </div>
                  <div className="detalhes">
                    <span className="hora">
                      {new Date(t.data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={`resultado ${t.resultado.toLowerCase()}`}>
                      {t.resultado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LEITURAS RECENTES */}
        <div className="secao">
          <h2>Últimas Leituras Clínicas</h2>
          {leiturasHoje.length === 0 ? (
            <p className="vazio">Nenhuma leitura registrada hoje.</p>
          ) : (
            <div className="lista-leituras">
              {leiturasHoje.map((l) => (
                <div key={l.id} className="leitura-card">
                  <div>
                    <strong>{l.utente?.nome || "Paciente"}</strong>
                    <span>{l.tipo.replace(/_/g, " ")}</span>
                  </div>
                  <div className="valor">
                    <strong>{l.valor}</strong>
                    <small>{new Date(l.data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
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
          <Link to="/utentes/criar" className="btn-acao">Novo Paciente</Link>
          <Link to="/triagens" className="btn-acao">Realizar Triagem</Link>
          <Link to="/leituras-clinicas" className="btn-acao">Registrar Leitura</Link>
          <Link to="/consultas" className="btn-acao">Agendar Consulta</Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfissional;