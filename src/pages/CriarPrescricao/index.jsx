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

  // CARREGAR CONSULTAS DO DIA (só do médico logado)
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (usuario.papel !== "medico") {
      navigate("/login");
      return;
    }

    const carregarConsultas = async () => {
      try {
        const res = await api.get("/consultas/hoje");
        const todas = res.data.consultas || [];
        const minhas = todas.filter(c => c.profissionalId === usuario.id && c.realizada);
        setConsultas(minhas);
      } catch (err) {
        setErro("Erro ao carregar consultas");
      }
    };
    carregarConsultas();
  }, [navigate]);

  // FILTRAR POR NOME OU CONTACTO
  const consultasFiltradas = consultas.filter(c =>
    c.utente.nome.toLowerCase().includes(buscaPaciente.toLowerCase()) ||
    c.utente.contacto.includes(buscaPaciente)
  );

  const selecionarConsulta = (consulta) => {
    setConsultaSelecionada(consulta);
    setBuscaPaciente("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consultaSelecionada) {
      setErro("Selecione uma consulta primeiro");
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
      gerarPDF(res.data);
      setForm({ medicamento: "", dosagem: "", duracao: "", observacoes: "" });
      setConsultaSelecionada(null);
      setTimeout(() => setSucesso(""), 3000);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao criar prescrição");
    } finally {
      setLoading(false);
    }
  };

  // GERAR PDF OFICIAL
  const gerarPDF = (prescricao) => {
    const doc = new jsPDF();
    const medico = JSON.parse(localStorage.getItem("usuario") || "{}");

    // Cabeçalho
    doc.setFontSize(18);
    doc.text("PRESCRIÇÃO MÉDICA", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Dr(a). ${medico.nome}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-MZ")}`, 20, 48);
    doc.text(`Paciente: ${consultaSelecionada.utente.nome}`, 20, 56);
    doc.text(`Contacto: ${consultaSelecionada.utente.contacto}`, 20, 64);

    // Medicamento
    doc.setFontSize(14);
    doc.text("Medicamento:", 20, 80);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(form.medicamento.toUpperCase(), 20, 90);

    // Detalhes
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Dosagem: ${form.dosagem}`, 20, 105);
    doc.text(`Duração: ${form.duracao}`, 20, 115);
    if (form.observacoes) {
      doc.text("Observações:", 20, 130);
      doc.text(form.observacoes, 20, 140, { maxWidth: 170 });
    }

    // Rodapé
    doc.setFontSize(10);
    doc.text("Assinatura do Médico:", 20, 200);
    doc.line(70, 205, 190, 205);

    doc.save(`prescricao_${consultaSelecionada.utente.nome.replace(/\s/g, "_")}.pdf`);
  };

  return (
    <div className="criar-prescricao-container">
      <h1>Criar Prescrição</h1>

      {/* BUSCA DE CONSULTA */}
      <div className="busca-consulta">
        <input
          type="text"
          placeholder="Buscar paciente por nome ou contacto..."
          value={buscaPaciente}
          onChange={(e) => setBuscaPaciente(e.target.value)}
        />
        {buscaPaciente && consultasFiltradas.length > 0 && (
          <div className="resultados">
            {consultasFiltradas.map((c) => (
              <div
                key={c.id}
                className="item"
                onClick={() => selecionarConsulta(c)}
              >
                <strong>{c.utente.nome}</strong> - {c.utente.contacto}
                <span>{new Date(c.data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PACIENTE SELECIONADO */}
      {consultaSelecionada && (
        <div className="paciente-selecionado">
          <strong>Paciente:</strong> {consultaSelecionada.utente.nome} ({consultaSelecionada.utente.contacto})
          <br />
          <small>Consulta: {new Date(consultaSelecionada.data).toLocaleString("pt-MZ")}</small>
        </div>
      )}

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="prescricao-form">
        <input
          type="text"
          placeholder="Medicamento (ex: Paracetamol)"
          value={form.medicamento}
          onChange={(e) => setForm({ ...form, medicamento: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Dosagem (ex: 500mg de 8/8h)"
          value={form.dosagem}
          onChange={(e) => setForm({ ...form, dosagem: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Duração (ex: 5 dias)"
          value={form.duracao}
          onChange={(e) => setForm({ ...form, duracao: e.target.value })}
          required
        />
        <textarea
          placeholder="Observações (ex: Tomar após as refeições)"
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows="4"
        />
        <div className="acoes">
          <button type="submit" disabled={loading || !consultaSelecionada}>
            {loading ? "Gerando..." : "Criar Prescrição + PDF"}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </form>

      {/* ALERTAS */}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}
      {erro && <div className="alerta erro">{erro}</div>}
    </div>
  );
}

export default CriarPrescricao;