// src/pages/RegistrarLeitura/index.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function RegistrarLeitura() {
  const navigate = useNavigate();

  const [utentes, setUtentes] = useState([]);
  const [buscaContacto, setBuscaContacto] = useState("");
  const [utenteSelecionado, setUtenteSelecionado] = useState(null);
  const [form, setForm] = useState({
    tipo: "pressao_arterial",
    valor: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // CARREGAR TODOS OS UTENTES
  useEffect(() => {
    const carregarUtentes = async () => {
      try {
        const res = await api.get("/utentes");
        setUtentes(res.data.utentes || res.data || []);
      } catch (err) {
        setErro("Erro ao carregar utentes");
      }
    };
    carregarUtentes();
  }, []);

  // FILTRAR UTENTES PELO CONTACTO OU NOME
  const utentesFiltrados = utentes.filter((u) => {
    const termo = buscaContacto.toLowerCase();
    return (
      u.contacto?.toLowerCase().includes(termo) ||
      u.nome?.toLowerCase().includes(termo)
    );
  });

  const selecionarUtente = (utente) => {
    setUtenteSelecionado(utente);
    setBuscaContacto("");
    setErro("");
    setSucesso("");
  };

  const limparForm = () => {
    setUtenteSelecionado(null);
    setForm({ tipo: "pressao_arterial", valor: "" });
    setErro("");
    setSucesso("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!utenteSelecionado) {
      setErro("Selecione um utente primeiro");
      return;
    }

    // Validações específicas por tipo
    if (form.tipo === "pressao_arterial" && !form.valor.includes('/')) {
      setErro("Formato inválido para pressão arterial. Use: 120/80");
      return;
    }

    if (form.tipo !== "pressao_arterial" && isNaN(parseFloat(form.valor))) {
      setErro("Valor deve ser numérico");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      await api.post("/leituras-clinicas", {
        utenteId: utenteSelecionado.id,
        tipo: form.tipo,
        valor: form.tipo === "pressao_arterial" ? form.valor : parseFloat(form.valor),
        inseridoPor: JSON.parse(localStorage.getItem("usuario") || "{}").id || null,
      });

      setSucesso("Leitura clínica registrada com sucesso!");
      setTimeout(() => {
        limparForm();
      }, 2000);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao registrar leitura");
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    const placeholders = {
      pressao_arterial: "ex: 120/80",
      glicemia: "ex: 95",
      peso: "ex: 68.5",
      temperatura: "ex: 36.5",
      saturacao: "ex: 98"
    };
    return placeholders[form.tipo] || "Digite o valor";
  };

  const getLabelTipo = (tipo) => {
    const labels = {
      pressao_arterial: "Pressão Arterial",
      glicemia: "Glicemia",
      peso: "Peso",
      temperatura: "Temperatura",
      saturacao: "Saturação O₂"
    };
    return labels[tipo] || tipo;
  };

  const getUnidade = (tipo) => {
    const unidades = {
      pressao_arterial: "mmHg",
      glicemia: "mg/dL",
      peso: "kg",
      temperatura: "°C",
      saturacao: "%"
    };
    return unidades[tipo] || "";
  };

  return (
    <div className="registrar-leitura-container">
      <header className="leitura-header">
        <div className="header-content">
          <h1>Registrar Leitura Clínica</h1>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="btn-voltar"
        >
          Voltar
        </button>
      </header>

      {/* ALERTAS */}
      {erro && (
        <div className="alert error">
          <span>{erro}</span>
          <button onClick={() => setErro("")} className="btn-fechar-alerta">
            ×
          </button>
        </div>
      )}
      
      {sucesso && (
        <div className="alert success">
          <span>{sucesso}</span>
          <button onClick={() => setSucesso("")} className="btn-fechar-alerta">
            ×
          </button>
        </div>
      )}

      <div className="leitura-content">
        {/* BUSCA DE UTENTE */}
        <section className="busca-section card">
          <h2>Selecionar Utente</h2>
          <div className="busca-utente">
            <input
              type="text"
              placeholder="Buscar utente por contacto ou nome..."
              value={buscaContacto}
              onChange={(e) => setBuscaContacto(e.target.value)}
              className="input-busca"
            />
            {buscaContacto && utentesFiltrados.length > 0 && (
              <div className="resultados-busca">
                {utentesFiltrados.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="item-resultado"
                    onClick={() => selecionarUtente(u)}
                  >
                    <div className="utente-info">
                      <div className="utente-nome">{u.nome}</div>
                      <div className="utente-contacto">{u.contacto}</div>
                      <div className="utente-detalhes-adicionais">
                        {u.sexo} • {new Date(u.dataNascimento).toLocaleDateString('pt-PT')}
                      </div>
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
                  <strong>{utenteSelecionado.nome}</strong>
                  <div className="utente-meta">
                    <span className="meta-item">{utenteSelecionado.contacto}</span>
                    <span className="meta-item">
                      {utenteSelecionado.sexo} • {new Date(utenteSelecionado.dataNascimento).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={limparForm}
                  className="btn-alterar-utente"
                >
                  Alterar Utente
                </button>
              </div>
            </div>
          )}
        </section>

        {/* FORMULÁRIO DE LEITURA */}
        {utenteSelecionado && (
          <section className="leitura-form-section card">
            <h2>Registrar Leitura Clínica</h2>
            
            <form onSubmit={handleSubmit} className="leitura-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Tipo de Leitura
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value, valor: "" })}
                    className="select-custom"
                    required
                  >
                    <option value="pressao_arterial">Pressão Arterial</option>
                    <option value="glicemia">Glicemia</option>
                    <option value="peso">Peso</option>
                    <option value="temperatura">Temperatura</option>
                    <option value="saturacao">Saturação O₂</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Valor da Leitura
                    <span className="unidade"> ({getUnidade(form.tipo)})</span>
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholder()}
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="input-custom"
                    required
                  />
                  <div className="dica">
                    {form.tipo === "pressao_arterial" && "Formato: sistólica/diastólica (ex: 120/80)"}
                    {form.tipo === "glicemia" && "Valores normais: 70-100 mg/dL (jejum)"}
                    {form.tipo === "peso" && "Use ponto para decimais (ex: 68.5)"}
                    {form.tipo === "temperatura" && "Normal: 36.1°C - 37.2°C"}
                    {form.tipo === "saturacao" && "Normal: 95-100%"}
                  </div>
                </div>
              </div>

              <div className="leitura-preview">
                <div className="preview-card">
                  <div className="preview-content">
                    <div className="preview-tipo">{getLabelTipo(form.tipo)}</div>
                    <div className="preview-valor">
                      {form.valor || "---"}
                      <span className="preview-unidade"> {getUnidade(form.tipo)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="actions-form">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-registrar"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Processando...
                    </>
                  ) : (
                    "Registrar Leitura"
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={limparForm}
                  className="btn-cancelar-form"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default RegistrarLeitura;