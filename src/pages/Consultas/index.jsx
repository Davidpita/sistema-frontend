// src/pages/Consultas/index.jsx
import { useState, useEffect } from "react";
import api from "../../services/api";
import "./index.css";

function Consultas() {
  const [utentes, setUtentes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [triagens, setTriagens] = useState([]);
  const [consultasHoje, setConsultasHoje] = useState([]);
  const [buscaContacto, setBuscaContacto] = useState("");
  const [utenteSelecionado, setUtenteSelecionado] = useState(null);
  const [form, setForm] = useState({
    tipo: "teleconsulta",
    data: "",
    hora: "",
    profissionalId: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Formata data atual para o input date
  const dataAtual = new Date().toISOString().split('T')[0];

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      await Promise.all([
        carregarUtentes(),
        carregarMedicos(),
        carregarConsultasHoje()
      ]);
    } catch (err) {
      setErro("Erro ao carregar dados iniciais");
    }
  };

  const carregarMedicos = async () => {
    try {
      const res = await api.get("/usuarios/medico");
      
      if (res.data.medicos && Array.isArray(res.data.medicos)) {
        setMedicos(res.data.medicos);
      } else if (Array.isArray(res.data)) {
        setMedicos(res.data);
      } else {
        setMedicos([]);
      }
    } catch (err) {
      console.error("Erro ao carregar médicos", err);
      setMedicos([]);
    }
  };

  const carregarUtentes = async () => {
    try {
      const res = await api.get("/utentes");
      setUtentes(res.data.utentes || res.data || []);
    } catch (err) {
      setErro("Erro ao carregar utentes");
    }
  };

  const carregarConsultasHoje = async () => {
      try {
        console.log("Carregando consultas de hoje...");
        
        // Primeiro: pega a contagem da rota específica
        const resContagem = await api.get("/consultas/hoje");
        console.log("Contagem de consultas:", resContagem.data.consultasHoje);
        
        // Segundo: busca a lista completa de consultas
        const resLista = await api.get("/consultas");
        
        let todasConsultas = [];
        
        // Processa a lista completa
        if (Array.isArray(resLista.data)) {
          todasConsultas = resLista.data;
        } else if (resLista.data.consultas && Array.isArray(resLista.data.consultas)) {
          todasConsultas = resLista.data.consultas;
        } else if (resLista.data.data && Array.isArray(resLista.data.data)) {
          todasConsultas = resLista.data.data;
        }
        
        // Filtra apenas as consultas de HOJE
        const hoje = new Date().toISOString().split('T')[0];
        const consultasDeHoje = todasConsultas.filter(consulta => {
          if (!consulta.data) return false;
          const dataConsulta = new Date(consulta.data).toISOString().split('T')[0];
          return dataConsulta === hoje;
        });
        
        console.log(`${consultasDeHoje.length} consultas de hoje encontradas:`, consultasDeHoje);
        setConsultasHoje(consultasDeHoje);
        
      } catch (err) {
        console.error("Erro ao carregar consultas:", err);
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

  const utentesFiltrados = utentes.filter((u) => {
    const termo = buscaContacto.toLowerCase();
    return (
      u.contacto?.toLowerCase().includes(termo) ||
      u.nome?.toLowerCase().includes(termo)
    );
  });

  const consultasFiltradas = consultasHoje.filter(consulta => {
    if (filtroTipo === "todos") return true;
    return consulta.tipo === filtroTipo;
  });

  const selecionarUtente = (utente) => {
    setUtenteSelecionado(utente);
    setBuscaContacto("");
    setErro("");
    setSucesso("");
    carregarTriagensDoUtente(utente.id);
  };

const handleAgendar = async (e) => {
  e.preventDefault();

  // Validações detalhadas
  if (!utenteSelecionado) {
    console.error("Nenhum utente selecionado");
    setErro("Selecione um utente primeiro");
    return;
  }

  if (!form.data) {
    setErro("Preencha a data da consulta");
    return;
  }

  if (!form.hora) {
    setErro("Preencha a hora da consulta");
    return;
  }

  console.log("✅ Todas validações passaram");

  setLoading(true);
  setErro("");
  setSucesso("");

  try {
    // Formatação da data/hora
    const dataHora = `${form.data}T${form.hora}:00.000Z`;

    const dadosConsulta = {
      utenteId: utenteSelecionado.id,
      profissionalId: form.profissionalId || null,
      tipo: form.tipo,
      data: dataHora,
    };

    // Chamada à API
    const response = await api.post("/consultas", dadosConsulta);
    
    setSucesso("Consulta agendada com sucesso!");
    
    // Limpar e recarregar
    limparForm();

    // Aguardar um pouco e recarregar as consultas
    setTimeout(async () => {
      await carregarConsultasHoje();
    }, 500);
    
  } catch (err) {
    console.error("Erro completo:", err);
    console.error("Detalhes do erro:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      headers: err.response?.headers
    });
    
    const errorMessage = err.response?.data?.error || 
                        err.response?.data?.message || 
                        "Erro ao agendar consulta. Tente novamente.";
    setErro(errorMessage);
  } finally {
    setLoading(false);
    console.log("Processamento finalizado");
  }
};

  const limparForm = () => {
    setForm({ 
      tipo: "teleconsulta", 
      data: "", 
      hora: "", 
      profissionalId: "" 
    });
    setUtenteSelecionado(null);
    setTriagens([]);
    setErro("");
    setSucesso("");
  };

  const marcarComoRealizada = async (id) => {
    try {
      await api.put(`/consultas/${id}/realizada`);
      setSucesso("Consulta marcada como realizada");
      await carregarConsultasHoje();
    } catch (err) {
      setErro("Erro ao atualizar consulta");
    }
  };

  const cancelarConsulta = async (id) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta consulta?")) {
      return;
    }

    try {
      await api.delete(`/consultas/${id}`);
      setSucesso("Consulta cancelada com sucesso");
      await carregarConsultasHoje();
    } catch (err) {
      setErro("Erro ao cancelar consulta");
    }
  };

  const getNomeMedico = (profissionalId) => {
    if (!profissionalId) return "A ser alocado";
    if (!Array.isArray(medicos)) return "Médico alocado";
    
    const medico = medicos.find((m) => m.id === profissionalId);
    return medico ? `Dr(a). ${medico.nome}` : "Médico alocado";
  };

  const getCorStatus = (realizada) => {
    return realizada ? "#28a745" : "#ffc107";
  };

  const getIconeTipo = (tipo) => {
    const icones = {
      teleconsulta: "call",
      presencial: "local_hospital", 
      triagem: "healing"
    };
    return icones[tipo] || "event";
  };

  const getLabelTipo = (tipo) => {
    const labels = {
      teleconsulta: "Teleconsulta",
      presencial: "Presencial",
      triagem: "Triagem"
    };
    return labels[tipo] || tipo;
  };

  // Função para formatar os sintomas de forma amigável
const renderizarSintomas = (sintomas) => {
  const mapeamentoSintomas = {
    febre: {
      label: "Febre",
      icone: "thermostat",
      opcoes: {
        alta: "Febre Alta (acima de 38°C)",
        baixa: "Febre Baixa (37-38°C)", 
        nao: "Sem febre"
      }
    },
    tosse: {
      label: "Tosse",
      icone: "sick",
      opcoes: {
        sim: "Sim",
        nao: "Não"
      }
    },
    dor_peito: {
      label: "Dor no Peito",
      icone: "favorite",
      opcoes: {
        sim: "Sim",
        nao: "Não"
      }
    },
    fadiga: {
      label: "Fadiga/Cansaço",
      icone: "bedtime",
      opcoes: {
        intensa: "Intenso (dificuldade para atividades)",
        moderada: "Moderado (cansaço perceptível)",
        leve: "Leve (pouco cansado)",
        nenhum: "Sem cansaço"
      }
    },
    dificuldade_respirar: {
      label: "Dificuldade para Respirar",
      icone: "air",
      opcoes: {
        sim: "Sim",
        nao: "Não"
      }
    },
    dor_garganta: {
      label: "Dor de Garganta",
      icone: "record_voice_over",
      opcoes: {
        sim: "Sim",
        nao: "Não"
      }
    },
    perda_olfato_paladar: {
      label: "Vontade de comer",
      icone: "restaurant",
      opcoes: {
        sim: "Sim",
        nao: "Não"
      }
    }
  };

  return (
    <div className="lista-sintomas">
      {Object.entries(sintomas).map(([sintoma, valor]) => {
        const infoSintoma = mapeamentoSintomas[sintoma];
        if (!infoSintoma) return null;

        const textoValor = infoSintoma.opcoes[valor] || valor;
        
        return (
          <div key={sintoma} className="item-sintoma">
            <div className="sintoma-info">
              <span className="material-icons sintoma-icone">{infoSintoma.icone}</span>
              <div className="sintoma-label">{infoSintoma.label}</div>
            </div>
            <div className="sintoma-valor">{textoValor}</div>
          </div>
        );
      })}
    </div>
  );
};

  return (
    <div className="consultas-container">
      <header className="consultas-header">
        <div className="header-content">
          <h1>
            <span className="material-icons">calendar_today</span>
            Gestão de Consultas
          </h1>
          <p>Agendamento e acompanhamento de consultas médicas</p>
        </div>
        <div className="estatisticas-rapidas">
          <div className="estatistica">
            <span className="material-icons">event</span>
            <span className="numero">{consultasHoje.length}</span>
            <span className="label">Consultas Hoje</span>
          </div>
          <div className="estatistica">
            <span className="material-icons">people</span>
            <span className="numero">{utentes.length}</span>
            <span className="label">Utentes</span>
          </div>
          <div className="estatistica">
            <span className="material-icons">local_hospital</span>
            <span className="numero">{medicos.length}</span>
            <span className="label">Médicos</span>
          </div>
        </div>
      </header>

      {/* MENSAGENS DE ALERTA */}
      {erro && (
        <div className="alert error">
          <span className="material-icons">error</span>
          <span className="alert-text">{erro}</span>
          <button onClick={() => setErro("")} className="btn-fechar-alerta">
            <span className="material-icons">close</span>
          </button>
        </div>
      )}
      
      {sucesso && (
        <div className="alert success">
          <span className="material-icons">check_circle</span>
          <span className="alert-text">{sucesso}</span>
          <button onClick={() => setSucesso("")} className="btn-fechar-alerta">
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      <div className="consultas-layout">
        {/* COLUNA ESQUERDA - AGENDAMENTO */}
        <div className="coluna-agendamento">
          <section className="agendar-section card">
            <div className="section-header">
              <h2>
                <span className="material-icons">schedule</span>
                Agendar Nova Consulta
              </h2>
            </div>

            <div className="busca-utente">
              <div className="input-with-icon">
                <span className="material-icons">search</span>
                <input
                  type="text"
                  placeholder="Buscar utente por contacto ou nome..."
                  value={buscaContacto}
                  onChange={(e) => setBuscaContacto(e.target.value)}
                  className="input-busca"
                />
              </div>
              {buscaContacto && utentesFiltrados.length > 0 && (
                <div className="resultados-busca">
                  {utentesFiltrados.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="item-resultado"
                      onClick={() => selecionarUtente(u)}
                    >
                      <span className="material-icons">person</span>
                      <div className="utente-info">
                        <div className="utente-nome">{u.nome}</div>
                        <div className="utente-contacto">{u.contacto}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {utenteSelecionado && (
              <div className="utente-selecionado-section">
                <div className="utente-info-card">
                  <div className="utente-detalhes">
                    <span className="material-icons">person</span>
                    <div>
                      <strong>{utenteSelecionado.nome}</strong>
                      <span>{utenteSelecionado.contacto}</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={limparForm}
                    className="btn-alterar-utente"
                  >
                    <span className="material-icons">swap_horiz</span>
                    Alterar
                  </button>
                </div>

                <form onSubmit={handleAgendar} className="agendar-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        <span className="material-icons">healing</span>
                        Tipo de Consulta
                      </label>
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        className="select-custom"
                      >
                        <option value="teleconsulta">Teleconsulta</option>
                        <option value="presencial">Presencial</option>
                        <option value="triagem">Triagem</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        <span className="material-icons">local_hospital</span>
                        Médico Responsável
                      </label>
                      <select
                        value={form.profissionalId}
                        onChange={(e) => setForm({ ...form, profissionalId: e.target.value })}
                        className="select-custom"
                      >
                        <option value="">Seleção automática</option>
                        {Array.isArray(medicos) && medicos.map((medico) => (
                          <option key={medico.id} value={medico.id}>
                            Dr(a). {medico.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        <span className="material-icons">calendar_today</span>
                        Data da Consulta
                      </label>
                      <input
                        type="date"
                        value={form.data}
                        min={dataAtual}
                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                        required
                        className="input-custom"
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <span className="material-icons">access_time</span>
                        Hora
                      </label>
                      <input
                        type="time"
                        value={form.hora}
                        onChange={(e) => setForm({ ...form, hora: e.target.value })}
                        required
                        className="input-custom"
                      />
                    </div>
                  </div>

                  <div className="actions-form">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="btn-agendar"
                    >
                      {loading ? (
                        <>
                          <span className="material-icons spinner">refresh</span>
                          Agendando...
                        </>
                      ) : (
                        <>
                          <span className="material-icons">event_available</span>
                          Agendar Consulta
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={limparForm}
                      className="btn-cancelar-form"
                    >
                      <span className="material-icons">cancel</span>
                      Cancelar
                    </button>
                  </div>
                </form>

                {/* HISTÓRICO DE TRIAGENS */}
                <div className="triagens-section">
                  <h3>
                    <span className="material-icons">assignment</span>
                    Histórico de Triagens
                  </h3>
                  {triagens.length > 0 ? (
                    <div className="lista-triagens">
                      {triagens.map((triagem) => (
                        <div
                          key={triagem.id}
                          className={`triagem-card ${triagem.resultado?.toLowerCase().replace(' ', '-')}`}
                        >
                          <div className="triagem-header">
                            <div className="triagem-data">
                              <span className="material-icons">event</span>
                              {new Date(triagem.data).toLocaleDateString('pt-PT')}
                            </div>
                            <span className={`triagem-resultado ${triagem.resultado?.toLowerCase().replace(' ', '-')}`}>
                              {triagem.resultado}
                            </span>
                          </div>
                          <p className="triagem-recomendacao">
                            {triagem.recomendacao}
                          </p>
                          {triagem.respostasJson && (
                            <details className="triagem-details">
                              <summary>
                                <span className="material-icons">expand_more</span>
                                Ver Sintomas Reportados
                              </summary>
                              <div className="sintomas-content">
                                {renderizarSintomas(JSON.parse(triagem.respostasJson))}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sem-registros">
                      <span className="material-icons">info</span>
                      <p>Nenhuma triagem registada para este utente.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* COLUNA DIREITA - CONSULTAS DE HOJE */}
        <div className="coluna-consultas">
          <div className="consultas-hoje-section card">
            <div className="section-header">
              <h2>
                <span className="material-icons">today</span>
                Consultas de Hoje ({consultasHoje.length})
              </h2>
              <div className="atualizacao-info">
                <span className="material-icons">update</span>
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="filtro-container">
              <select 
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="filtro-tipo"
              >
                <option value="todos">Todos os tipos</option>
                <option value="teleconsulta">Teleconsultas</option>
                <option value="presencial">Presenciais</option>
                <option value="triagem">Triagens</option>
              </select>
            </div>

            {consultasHoje.length === 0 ? (
              <div className="sem-consultas">
                <span className="material-icons">event_busy</span>
                <p>Nenhuma consulta agendada para hoje.</p>
              </div>
            ) : (
              <div className="lista-consultas">
                {consultasFiltradas.map((consulta) => {
                  return (
                    <div key={consulta.id} className="consulta-card">
                      <div className="consulta-header">
                        <div className="consulta-utente">
                          <strong>{consulta.utente?.nome || 'N/A'}</strong>
                          <span>{consulta.utente?.contacto || 'N/A'}</span>
                        </div>
                        <div className="consulta-tipo">
                          <span className="material-icons">{getIconeTipo(consulta.tipo)}</span>
                          {getLabelTipo(consulta.tipo)}
                        </div>
                      </div>

                      <div className="consulta-detalhes">
                        <div className="detalhe-item">
                          <span className="material-icons">access_time</span>
                          <div>
                            <span className="detalhe-label">Hora:</span>
                            <strong>
                              {new Date(consulta.data).toLocaleTimeString('pt-PT', {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </strong>
                          </div>
                        </div>
                        <div className="detalhe-item">
                          <span className="material-icons">local_hospital</span>
                          <div>
                            <span className="detalhe-label">Médico:</span>
                            <strong>{getNomeMedico(consulta.profissionalId)}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="consulta-actions">
                        <div 
                          className={`status-consulta ${consulta.realizada ? 'realizada' : 'pendente'}`}
                        >
                          <span className="material-icons">
                            {consulta.realizada ? "check_circle" : "schedule"}
                          </span>
                          {consulta.realizada ? "Realizada" : "Pendente"}
                        </div>
                        
                        <div className="botoes-acao">
                          {!consulta.realizada && (
                            <>
                              <button
                                onClick={() => marcarComoRealizada(consulta.id)}
                                className="btn-realizada"
                              >
                                <span className="material-icons">check</span>
                                Realizar
                              </button>
                              <button
                                onClick={() => cancelarConsulta(consulta.id)}
                                className="btn-cancelar-consulta"
                              >
                                <span className="material-icons">close</span>
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Consultas;