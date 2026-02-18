// src/pages/CriarPrescricao/index.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./index.css";

function CriarPrescricao() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [form, setForm] = useState({
    medicamento: "",
    dosagem: "",
    duracao: "",
    observacoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // CARREGAR CONSULTAS DO MÉDICO LOGADO - CORRIGIDO
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    
    // Verifica se é médico
    if (usuario.papel !== "medico") {
      navigate("/login");
      return;
    }

    const carregarConsultas = async () => {
      try {
        console.log("Carregando consultas para prescrição...");
        
        // Busca TODAS as consultas do sistema
        const res = await api.get("/consultas");
        console.log("Resposta completa da API:", res);
        
        let todasConsultas = [];
        
        // Extrai o array de consultas da resposta
        if (Array.isArray(res.data)) {
          todasConsultas = res.data;
        } else if (res.data.consultas && Array.isArray(res.data.consultas)) {
          todasConsultas = res.data.consultas;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          todasConsultas = res.data.data;
        }
        
        // FILTRO CORRIGIDO: MOSTRA TODAS AS CONSULTAS REALIZADAS
        const consultasRealizadas = todasConsultas.filter(consulta => {
          const foiRealizada = consulta.realizada === true;
          const temUtente = consulta.utente && consulta.utente.nome;
          const naoTemPrescricao = !consulta.prescricaoId; // Só mostra consultas sem prescrição
          
          const resultado = foiRealizada && temUtente && naoTemPrescricao;
          
          if (resultado) {
            console.log(`INCLUÍDA: ${consulta.utente.nome}`, {
              id: consulta.id,
              profissionalId: consulta.profissionalId,
              realizada: consulta.realizada,
              prescricaoId: consulta.prescricaoId,
              data: consulta.data
            });
          } else {
            console.log(`EXCLUÍDA: ${consulta.utente?.nome || 'Sem nome'}`, {
              motivo: !foiRealizada ? 'Não realizada' : 
                      !temUtente ? 'Sem utente' : 
                      consulta.prescricaoId ? 'Já tem prescrição' : 'Outro',
              profissionalId: consulta.profissionalId,
              realizada: consulta.realizada,
              prescricaoId: consulta.prescricaoId
            });
          }
          
          return resultado;
        });
        
        console.log(`Consultas realizadas sem prescrição (${consultasRealizadas.length}):`, consultasRealizadas);
        setConsultas(consultasRealizadas);
        
      } catch (err) {
        console.error("Erro ao carregar consultas:", err);
        setErro("Erro ao carregar consultas: " + (err.response?.data?.message || err.message));
      }
    };
    
    carregarConsultas();
  }, [navigate]);

  // FILTRAR POR NOME, CONTACTO OU DATA - CORRIGIDO
  const consultasFiltradas = consultas.filter(consulta => {
    if (!buscaPaciente) return false;
    
    const termo = buscaPaciente.toLowerCase();
    const nomeUtente = consulta.utente?.nome?.toLowerCase() || '';
    const contactoUtente = consulta.utente?.contacto?.toLowerCase() || '';
    const dataConsulta = new Date(consulta.data).toLocaleDateString('pt-PT');
    
    const passaFiltro = (
      nomeUtente.includes(termo) ||
      contactoUtente.includes(termo) ||
      dataConsulta.includes(buscaPaciente)
    );
    
    return passaFiltro;
  });

  const selecionarConsulta = (consulta) => {
    setConsultaSelecionada(consulta);
    setBuscaPaciente("");
    setErro("");
    setSucesso("");
  };

  const limparForm = () => {
    setConsultaSelecionada(null);
    setForm({ medicamento: "", dosagem: "", duracao: "", observacoes: "" });
    setErro("");
    setSucesso("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consultaSelecionada) {
      setErro("Selecione uma consulta primeiro");
      return;
    }

    if (!form.medicamento || !form.dosagem || !form.duracao) {
      setErro("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setErro("");
    setSucesso("");

    try {
      const res = await api.post("/prescricoes", {
        consultaId: consultaSelecionada.id,
        medicamento: form.medicamento,
        dosagem: form.dosagem,
        duracao: form.duracao,
        observacoes: form.observacoes,
      });

      setSucesso("Prescrição criada com sucesso!");
      await gerarPDF(res.data);
      limparForm();
    } catch (err) {
      console.error("Erro ao criar prescrição:", err);
      setErro(err.response?.data?.error || "Erro ao criar prescrição");
    } finally {
      setLoading(false);
    }
  };

  // GERAR PDF OFICIAL
  const gerarPDF = async (prescricao) => {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      const medico = JSON.parse(localStorage.getItem("usuario") || "{}");

      // Configurações do documento
      doc.setProperties({
        title: `Prescrição - ${consultaSelecionada.utente.nome}`,
        subject: 'Prescrição Médica',
        author: `Dr(a). ${medico.nome}`,
      });

      // Cabeçalho
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PRESCRIÇÃO MÉDICA", 105, 25, { align: "center" });

      // Linha decorativa
      doc.setDrawColor(0, 123, 255);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);

      // Informações do médico
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("MÉDICO PRESCRITOR", 20, 45);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Dr(a). ${medico.nome}`, 20, 52);

      // Informações do paciente
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("PACIENTE", 100, 45);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(consultaSelecionada.utente.nome.toUpperCase(), 100, 52);

      // Detalhes
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 20, 62);
      doc.text(`Contacto: ${consultaSelecionada.utente.contacto}`, 100, 62);
      doc.text(`Consulta: ${new Date(consultaSelecionada.data).toLocaleDateString("pt-PT")}`, 20, 68);

      // Medicamento - Destaque
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("MEDICAMENTO PRESCRITO", 20, 85);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 123, 255);
      doc.text(form.medicamento.toUpperCase(), 20, 95);

      // Instruções
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("INSTRUÇÕES DE USO:", 20, 115);

      doc.setFont("helvetica", "normal");
      doc.text(`• Dosagem: ${form.dosagem}`, 25, 125);
      doc.text(`• Duração: ${form.duracao}`, 25, 135);

      if (form.observacoes) {
        doc.text(`• Observações: ${form.observacoes}`, 25, 145, { maxWidth: 160 });
      }

      // Avisos importantes
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("AVISOS IMPORTANTES:", 20, 170);
      doc.setTextColor(0, 0, 0);
      doc.text("• Siga rigorosamente as instruções de dosagem", 25, 177, { maxWidth: 160 });
      doc.text("• Não interrompa o tratamento sem orientação médica", 25, 184, { maxWidth: 160 });
      doc.text("• Em caso de efeitos adversos, contacte o médico", 25, 191, { maxWidth: 160 });

      // Rodapé e assinatura
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 220, 190, 220);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Assinatura do Médico", 20, 235);
      doc.line(70, 230, 190, 230);
      
      doc.text(`Emitido eletronicamente em ${new Date().toLocaleString('pt-PT')}`, 105, 250, { align: "center" });
      doc.text("Documento válido sem assinatura manuscrita", 105, 255, { align: "center" });

      // Salvar PDF
      const nomeArquivo = `prescricao_${consultaSelecionada.utente.nome.replace(/\s/g, "_")}_${Date.now()}.pdf`;
      doc.save(nomeArquivo);
      
      resolve();
    });
  };

  const getPlaceholderMedicamento = () => {
    const medicamentosComuns = [
      "Paracetamol 500mg",
      "Amoxicilina 500mg", 
      "Ibuprofeno 400mg",
      "Omeprazol 20mg",
      "Losartana 50mg"
    ];
    return medicamentosComuns[Math.floor(Math.random() * medicamentosComuns.length)];
  };

  // DEBUG: Log do estado atual
  useEffect(() => {
    console.log("Estado atual:", {
      totalConsultas: consultas.length,
      consultas: consultas.map(c => ({
        id: c.id,
        utente: c.utente?.nome,
        contacto: c.utente?.contacto,
        realizada: c.realizada,
        profissionalId: c.profissionalId,
        data: c.data
      })),
      buscaPaciente,
      consultasFiltradas: consultasFiltradas.length
    });
  }, [consultas, buscaPaciente]);

  return (
    <div className="criar-prescricao-container">
      <header className="prescricao-header">
        <h1>
          <span className="material-icons">medication</span>
          Criar Prescrição Médica
        </h1>
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
          <span className="material-icons">warning</span>
          <span>{erro}</span>
          <button onClick={() => setErro("")} className="btn-fechar-alerta">
            <span className="material-icons">close</span>
          </button>
        </div>
      )}
      
      {sucesso && (
        <div className="alert success">
          <span className="material-icons">check_circle</span>
          <span>{sucesso}</span>
          <button onClick={() => setSucesso("")} className="btn-fechar-alerta">
            <span className="material-icons">close</span>
          </button>
        </div>
      )}

      <div className="prescricao-content">
        {/* BUSCA DE CONSULTA */}
        <section className="busca-section card">
          <h2>
            <span className="material-icons">group</span>
            Selecionar Consulta
          </h2>
          <div className="busca-consulta">
            <input
              type="text"
              placeholder="Buscar por nome do paciente, contacto ou data..."
              value={buscaPaciente}
              onChange={(e) => setBuscaPaciente(e.target.value)}
              className="input-busca"
            />
            {buscaPaciente && consultasFiltradas.length > 0 && (
              <div className="resultados-busca">
                {consultasFiltradas.map((consulta) => (
                  <div
                    key={consulta.id}
                    className="item-resultado"
                    onClick={() => selecionarConsulta(consulta)}
                  >
                    <div className="consulta-info">
                      <div className="paciente-nome">
                        <span className="material-icons">person</span>
                        {consulta.utente?.nome}
                      </div>
                      <div className="consulta-detalhes">
                        <span>
                          <span className="material-icons">phone</span>
                          {consulta.utente?.contacto}
                        </span>
                        <span>
                          <span className="material-icons">event</span>
                          {new Date(consulta.data).toLocaleDateString('pt-PT')}
                        </span>
                        <span>
                          <span className="material-icons">schedule</span>
                          {new Date(consulta.data).toLocaleTimeString('pt-PT', { 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        <span>
                          <span className="material-icons">local_hospital</span>
                          {consulta.tipo}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {buscaPaciente && consultasFiltradas.length === 0 && (
              <div className="sem-resultados">
                <span className="material-icons">search_off</span>
                Nenhuma consulta encontrada para "{buscaPaciente}"
              </div>
            )}
          </div>

          {/* CONSULTA SELECIONADA */}
          {consultaSelecionada && (
            <div className="consulta-selecionada-section">
              <div className="consulta-info-card">
                <div className="consulta-detalhes">
                  <strong>
                    <span className="material-icons">person</span>
                    {consultaSelecionada.utente?.nome}
                  </strong>
                  <div className="consulta-meta">
                    <span className="meta-item">
                      <span className="material-icons">phone</span>
                      {consultaSelecionada.utente?.contacto}
                    </span>
                    <span className="meta-item">
                      <span className="material-icons">event</span>
                      {new Date(consultaSelecionada.data).toLocaleDateString('pt-PT')}
                    </span>
                    <span className="meta-item">
                      <span className="material-icons">schedule</span>
                      {new Date(consultaSelecionada.data).toLocaleTimeString('pt-PT', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <span className="meta-item">
                      <span className="material-icons">local_hospital</span>
                      {consultaSelecionada.tipo}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={limparForm}
                  className="btn-alterar-consulta"
                >
                  <span className="material-icons">swap_horiz</span>
                  Alterar
                </button>
              </div>
            </div>
          )}
        </section>

        {/* FORMULÁRIO DE PRESCRIÇÃO */}
        {consultaSelecionada && (
          <section className="prescricao-form-section card">
            <h2>
              <span className="material-icons">description</span>
              Prescrição Médica
            </h2>
            
            <form onSubmit={handleSubmit} className="prescricao-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="material-icons">medication</span>
                    Medicamento *
                  </label>
                  <input
                    type="text"
                    placeholder={getPlaceholderMedicamento()}
                    value={form.medicamento}
                    onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
                    className="input-custom"
                    required
                  />
                  <small className="dica">
                    Ex: Paracetamol 500mg, Amoxicilina 250mg, etc.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="material-icons">balance</span>
                    Dosagem *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 1 comprimido de 8/8h"
                    value={form.dosagem}
                    onChange={(e) => setForm({ ...form, dosagem: e.target.value })}
                    className="input-custom"
                    required
                  />
                  <small className="dica">
                    Frequência e quantidade
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="material-icons">event</span>
                    Duração *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 7 dias"
                    value={form.duracao}
                    onChange={(e) => setForm({ ...form, duracao: e.target.value })}
                    className="input-custom"
                    required
                  />
                  <small className="dica">
                    Período do tratamento
                  </small>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">
                    <span className="material-icons">notes</span>
                    Observações
                  </label>
                  <textarea
                    placeholder="ex: Tomar após as refeições, Evitar álcool, etc."
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    className="textarea-custom"
                    rows="3"
                  />
                  <small className="dica">
                    Instruções adicionais e precauções
                  </small>
                </div>
              </div>

              {/* PREVIEW DA PRESCRIÇÃO */}
              {(form.medicamento || form.dosagem || form.duracao) && (
                <div className="prescricao-preview">
                  <div className="preview-card">
                    <h4>
                      <span className="material-icons">visibility</span>
                      Pré-visualização da Prescrição
                    </h4>
                    <div className="preview-content">
                      {form.medicamento && (
                        <div className="preview-item">
                          <strong>Medicamento:</strong> {form.medicamento}
                        </div>
                      )}
                      {form.dosagem && (
                        <div className="preview-item">
                          <strong>Dosagem:</strong> {form.dosagem}
                        </div>
                      )}
                      {form.duracao && (
                        <div className="preview-item">
                          <strong>Duração:</strong> {form.duracao}
                        </div>
                      )}
                      {form.observacoes && (
                        <div className="preview-item">
                          <strong>Observações:</strong> {form.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                    <>
                      <span className="material-icons">add_circle</span>
                      Criar Prescrição + PDF
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
          </section>
        )}

        {/* INFORMAÇÕES */}
        {!consultaSelecionada && consultas.length === 0 && (
          <section className="info-section card">
            <h3>
              <span className="material-icons">info</span>
              Nenhuma consulta disponível
            </h3>
            <div className="info-content">
              <p>Não foram encontradas consultas realizadas para criar prescrições.</p>
              <p><strong>Requisitos para criar uma prescrição:</strong></p>
              <ul>
                <li>Consulta deve ser do médico logado</li>
                <li>Consulta deve estar marcada como "Realizada"</li>
                <li>Utente deve estar associado à consulta</li>
              </ul>
            </div>
          </section>
        )}

        {!consultaSelecionada && consultas.length > 0 && (
          <section className="info-section card">
            <h3>
              <span className="material-icons">help</span>
              Como funciona
            </h3>
            <div className="info-content">
              <div className="info-item">
                <strong>1. Selecione uma consulta</strong>
                <p>Busque e selecione uma consulta realizada para a qual deseja criar a prescrição</p>
              </div>
              <div className="info-item">
                <strong>2. Preencha a prescrição</strong>
                <p>Informe o medicamento, dosagem, duração e observações necessárias</p>
              </div>
              <div className="info-item">
                <strong>3. Gere o PDF</strong>
                <p>A prescrição será salva no sistema e um PDF será gerado automaticamente</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default CriarPrescricao;