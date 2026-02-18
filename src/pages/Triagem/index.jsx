// src/pages/Triagem/Triagem.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function Triagem() {
  const navigate = useNavigate();
  const [triagensList, setTriagensList] = useState([]);
  const [utentes, setUtentes] = useState([]);
  const [buscaContacto, setBuscaContacto] = useState("");
  const [utenteSelecionado, setUtenteSelecionado] = useState(null);
  const [respostas, setRespostas] = useState({
    febre: "",
    tosse: "",
    dorGarganta: "",
    faltaAr: "",
    fadiga: "",
    dorCorpo: "",
  });
  const [resultado, setResultado] = useState("");
  const [recomendacao, setRecomendacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      await Promise.all([carregarUtentes(), carregarTriagens()]);
    } catch (err) {
      setErro("Erro ao carregar dados iniciais");
    }
  };

  const carregarTriagens = async () => {
    try {
      const res = await api.get('/triagens');
      setTriagensList(res.data);
    } catch (err) {
      console.error('Erro ao carregar triagens:', err);
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

  // Filtrar utentes por contacto ou nome
  const utentesFiltrados = utentes.filter((u) => {
    const termo = buscaContacto.toLowerCase();
    return (
      u.contacto?.toLowerCase().includes(termo) ||
      u.nome?.toLowerCase().includes(termo)
    );
  });

  // Selecionar utente
  const selecionarUtente = (utente) => {
    setUtenteSelecionado(utente);
    setBuscaContacto("");
    setErro("");
    setSucesso("");
  };

  // Calcular resultado e recomendação
  const calcularTriagem = () => {
    const { febre, tosse, dorGarganta, faltaAr, fadiga, dorCorpo } = respostas;
    let pontos = 0;
    let detalhes = [];

    if (febre === "alta") {
      pontos += 3;
      detalhes.push("Febre alta");
    } else if (febre === "moderada") {
      pontos += 2;
      detalhes.push("Febre moderada");
    } else if (febre === "baixa") {
      pontos += 1;
      detalhes.push("Febre baixa");
    }

    if (tosse === "frequente") {
      pontos += 2;
      detalhes.push("Tosse frequente");
    } else if (tosse === "ocasional") {
      pontos += 1;
    }

    if (dorGarganta === "sim") {
      pontos += 1;
      detalhes.push("Dor de garganta");
    }

    if (faltaAr === "sim") {
      pontos += 3;
      detalhes.push("Falta de ar");
    }

    if (fadiga === "sim") {
      pontos += 1;
      detalhes.push("Fadiga");
    }

    if (dorCorpo === "sim") {
      pontos += 1;
      detalhes.push("Dor no corpo");
    }

    let resultado = "";
    let recomendacao = "";

    if (pontos >= 6) {
      resultado = "Grave";
      recomendacao = "Agendar teleconsulta URGENTE com médico";
    } else if (pontos >= 3) {
      resultado = "Moderado";
      recomendacao = "Agendar consulta em até 24h";
    } else if (pontos >= 1) {
      resultado = "Leve";
      recomendacao = "Auto-cuidado e monitoramento";
    } else {
      resultado = "Sem sintomas";
      recomendacao = "Continuar com medidas preventivas";
    }

    setResultado(`${resultado} (${pontos} pontos)`);
    setRecomendacao(recomendacao);
    return { resultado, recomendacao, detalhes };
  };

  // Enviar triagem
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utenteSelecionado) {
      setErro("Selecione um utente primeiro");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const { resultado, recomendacao } = calcularTriagem();

      await api.post("/triagens", {
        utenteId: utenteSelecionado.id,
        respostasJson: JSON.stringify(respostas),
        resultado,
        recomendacao,
      });

      setSucesso("Triagem registrada com sucesso!");
      limparTriagem();
      await carregarTriagens();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao registrar triagem");
    } finally {
      setLoading(false);
    }
  };

  const limparTriagem = () => {
    setUtenteSelecionado(null);
    setRespostas({
      febre: "",
      tosse: "",
      dorGarganta: "",
      faltaAr: "",
      fadiga: "",
      dorCorpo: "",
    });
    setResultado("");
    setRecomendacao("");
  };

  const getCorResultado = () => {
    if (resultado.includes("Grave")) return "#dc3545";
    if (resultado.includes("Moderado")) return "#fd7e14";
    if (resultado.includes("Leve")) return "#ffc107";
    return "#28a745";
  };

  return (
    <div className="triagem-container">
      <header className="triagem-header">
        <div className="header-content">
          <h1>
            <span className="material-icons">healing</span>
            Triagem Clínica
          </h1>
          <p>Avaliação inicial de sintomas e priorização de atendimento</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="btn-voltar"
        >
          <span className="material-icons">arrow_back</span>
          Voltar
        </button>
      </header>

      {/* ALERTAS */}
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

      <div className="triagem-content">
        {/* BUSCA DE UTENTE */}
        <section className="busca-section card">
          <div className="section-header">
            <h2>
              <span className="material-icons">person_search</span>
              Selecionar Utente
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
                      {u.zona?.nome && (
                        <div className="utente-zona">
                          <span className="material-icons">location_on</span>
                          {u.zona.nome}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UTENTE SELECIONADO */}
          {utenteSelecionado && (
            <div className="utente-selecionado-section">
              <div className="utente-info-card">
                <div className="utente-detalhes">
                  <span className="material-icons">person</span>
                  <div>
                    <strong>{utenteSelecionado.nome}</strong>
                    <div className="utente-meta">
                      <span className="meta-item">
                        <span className="material-icons">phone</span>
                        {utenteSelecionado.contacto}
                      </span>
                      <span className="meta-item">
                        <span className="material-icons">location_on</span>
                        {utenteSelecionado.zona?.nome || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={limparTriagem}
                  className="btn-alterar-utente"
                >
                  <span className="material-icons">swap_horiz</span>
                  Alterar
                </button>
              </div>
            </div>
          )}
        </section>

        {/* FORMULÁRIO DE TRIAGEM */}
        {utenteSelecionado && (
          <section className="triagem-form-section card">
            <div className="section-header">
              <h2>
                <span className="material-icons">assignment</span>
                Questionário de Sintomas
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="triagem-form">
              <div className="perguntas-grid">
                {/* FEBRE */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">thermostat</span>
                    Febre?
                  </label>
                  <div className="opcoes-radio">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="febre"
                        value="alta"
                        checked={respostas.febre === "alta"}
                        onChange={(e) => setRespostas({ ...respostas, febre: e.target.value })}
                      />
                      <span className="opcao-texto">Alta (acima de 38.5°C)</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="febre"
                        value="moderada"
                        checked={respostas.febre === "moderada"}
                        onChange={(e) => setRespostas({ ...respostas, febre: e.target.value })}
                      />
                      <span className="opcao-texto">Moderada (37.5°C - 38.5°C)</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="febre"
                        value="baixa"
                        checked={respostas.febre === "baixa"}
                        onChange={(e) => setRespostas({ ...respostas, febre: e.target.value })}
                      />
                      <span className="opcao-texto">Baixa (até 37.5°C)</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="febre"
                        value="nao"
                        checked={respostas.febre === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, febre: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>

                {/* TOSSE */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">sick</span>
                    Tosse?
                  </label>
                  <div className="opcoes-radio">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="tosse"
                        value="frequente"
                        checked={respostas.tosse === "frequente"}
                        onChange={(e) => setRespostas({ ...respostas, tosse: e.target.value })}
                      />
                      <span className="opcao-texto">Frequente</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="tosse"
                        value="ocasional"
                        checked={respostas.tosse === "ocasional"}
                        onChange={(e) => setRespostas({ ...respostas, tosse: e.target.value })}
                      />
                      <span className="opcao-texto">Ocasional</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="tosse"
                        value="nao"
                        checked={respostas.tosse === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, tosse: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>

                {/* DOR DE GARGANTA */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">healing</span>
                    Dor de garganta?
                  </label>
                  <div className="opcoes-radio horizontal">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="dorGarganta"
                        value="sim"
                        checked={respostas.dorGarganta === "sim"}
                        onChange={(e) => setRespostas({ ...respostas, dorGarganta: e.target.value })}
                      />
                      <span className="opcao-texto">Sim</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="dorGarganta"
                        value="nao"
                        checked={respostas.dorGarganta === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, dorGarganta: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>

                {/* FALTA DE AR */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">air</span>
                    Falta de ar?
                  </label>
                  <div className="opcoes-radio horizontal">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="faltaAr"
                        value="sim"
                        checked={respostas.faltaAr === "sim"}
                        onChange={(e) => setRespostas({ ...respostas, faltaAr: e.target.value })}
                      />
                      <span className="opcao-texto">Sim</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="faltaAr"
                        value="nao"
                        checked={respostas.faltaAr === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, faltaAr: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>

                {/* FADIGA */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">bedtime</span>
                    Fadiga?
                  </label>
                  <div className="opcoes-radio horizontal">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="fadiga"
                        value="sim"
                        checked={respostas.fadiga === "sim"}
                        onChange={(e) => setRespostas({ ...respostas, fadiga: e.target.value })}
                      />
                      <span className="opcao-texto">Sim</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="fadiga"
                        value="nao"
                        checked={respostas.fadiga === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, fadiga: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>

                {/* DOR NO CORPO */}
                <div className="pergunta-group">
                  <label className="pergunta-label">
                    <span className="material-icons">fitness_center</span>
                    Dor no corpo?
                  </label>
                  <div className="opcoes-radio horizontal">
                    <label className="opcao">
                      <input
                        type="radio"
                        name="dorCorpo"
                        value="sim"
                        checked={respostas.dorCorpo === "sim"}
                        onChange={(e) => setRespostas({ ...respostas, dorCorpo: e.target.value })}
                      />
                      <span className="opcao-texto">Sim</span>
                    </label>
                    <label className="opcao">
                      <input
                        type="radio"
                        name="dorCorpo"
                        value="nao"
                        checked={respostas.dorCorpo === "nao"}
                        onChange={(e) => setRespostas({ ...respostas, dorCorpo: e.target.value })}
                      />
                      <span className="opcao-texto">Não</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* RESULTADO DA TRIAGEM */}
              {resultado && (
                <div className="resultado-triagem" style={{ borderLeftColor: getCorResultado() }}>
                  <div className="resultado-header">
                    <h3>
                      <span className="material-icons">analytics</span>
                      Resultado da Triagem
                    </h3>
                    <div className="resultado-pontuacao">{resultado}</div>
                  </div>
                  <div className="recomendacao">
                    <strong>
                      <span className="material-icons">lightbulb</span>
                      Recomendação:
                    </strong> 
                    {recomendacao}
                  </div>
                </div>
              )}

              {/* AÇÕES */}
              <div className="actions-form">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-registrar"
                >
                  {loading ? (
                    <>
                      <span className="material-icons spinner">refresh</span>
                      Processando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      Registrar Triagem
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={limparTriagem}
                  className="btn-cancelar-form"
                >
                  <span className="material-icons">add</span>
                  Nova Triagem
                </button>
              </div>
            </form>
          </section>
        )}

        {/* LISTA DE TRIAGENS REALIZADAS */}
        <section className="lista-triagens-section card">
          <div className="section-header">
            <h2>
              <span className="material-icons">list_alt</span>
              Triagens Realizadas ({triagensList.length})
            </h2>
          </div>

          {triagensList.length === 0 ? (
            <div className="sem-registros">
              <span className="material-icons">inbox</span>
              <p>Nenhuma triagem registrada.</p>
            </div>
          ) : (
            <div className="tabela-container">
              <table className="tabela-triagens">
                <thead>
                  <tr>
                    <th>Utente</th>
                    <th>Contacto</th>
                    <th>Resultado</th>
                    <th>Recomendação</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {triagensList.map((triagem) => (
                    <tr key={triagem.id}>
                      <td>
                        <div className="utente-info-tabela">
                          <span className="material-icons">person</span>
                          <strong>{triagem.utente?.nome || 'N/A'}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="contacto-tabela">
                          <span className="material-icons">phone</span>
                          {triagem.utente?.contacto || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`status-resultado ${triagem.resultado?.toLowerCase().split(' ')[0]}`}
                        >
                          {triagem.resultado === "Grave" && <span className="material-icons">error</span>}
                          {triagem.resultado === "Moderado" && <span className="material-icons">warning</span>}
                          {triagem.resultado === "Leve" && <span className="material-icons">info</span>}
                          {triagem.resultado === "Sem sintomas" && <span className="material-icons">check_circle</span>}
                          {triagem.resultado}
                        </span>
                      </td>
                      <td className="recomendacao-tabela">
                        <span className="material-icons">lightbulb</span>
                        {triagem.recomendacao}
                      </td>
                      <td>
                        <div className="data-tabela">
                          <span className="material-icons">event</span>
                          <div>
                            {new Date(triagem.data).toLocaleDateString('pt-PT')}
                            <br />
                            <small>
                              {new Date(triagem.data).toLocaleTimeString('pt-PT', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </small>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Triagem;