// src/pages/Relatorio/index.jsx
import { useState, useEffect } from "react";
import api from "../../services/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./index.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function Relatorio() {
  const [zonas, setZonas] = useState([]);
  const [form, setForm] = useState({
    zonaId: "",
    periodoInicio: "",
    periodoFim: "",
  });
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  // CARREGAR ZONAS
  useEffect(() => {
    const carregarZonas = async () => {
      try {
        const res = await api.get("/zonas");
        setZonas(res.data);
      } catch (err) {
        console.error("Erro ao carregar zonas", err);
      }
    };
    carregarZonas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    setDados(null);

    try {
      const response = await api.post("/relatorios/vigilancia", {
        zonaId: form.zonaId || null,
        periodoInicio: form.periodoInicio,
        periodoFim: form.periodoFim,
      });

      const dadosBrutos = response.data;

      // Mapear triagens por resultado (NORMAL / ATENÇÃO / URGÊNCIA) a partir dos sintomas
      const triagensPorResultado = [
        { resultado: "NORMAL", total: 0, cor: "#27ae60" },
        { resultado: "ATENÇÃO", total: 0, cor: "#f1c40f" },
        { resultado: "URGÊNCIA", total: 0, cor: "#e74c3c" },
      ];

      // Exemplo simples: febre alta = URGÊNCIA, febre baixa = ATENÇÃO, resto = NORMAL
      if (dadosBrutos.resumoSintomas.febre) {
        Object.entries(dadosBrutos.resumoSintomas.febre).forEach(([valor, total]) => {
          if (valor.toLowerCase() === "alta") triagensPorResultado[2].total += total;
          else if (valor.toLowerCase() === "baixa") triagensPorResultado[1].total += total;
          else triagensPorResultado[0].total += total;
        });
      }

      // Sintomas mais comuns
      const sintomasMaisComuns = [];
      for (let sintoma in dadosBrutos.resumoSintomas) {
        let total = Object.values(dadosBrutos.resumoSintomas[sintoma]).reduce((a, b) => a + b, 0);
        sintomasMaisComuns.push({ sintoma, total });
      }
      
      // Ordenar sintomas por frequência
      sintomasMaisComuns.sort((a, b) => b.total - a.total);

      setDados({
        ...dadosBrutos,
        triagensPorResultado,
        sintomasMaisComuns: sintomasMaisComuns.slice(0, 10), // Top 10 sintomas
      });
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao gerar relatório");
    } finally {
      setCarregando(false);
    }
  };

  // EXPORTAR PDF
  const exportarPDF = () => {
    if (!dados) return;

    const doc = new jsPDF();
    const hoje = new Date().toLocaleDateString("pt-MZ");

    // Cabeçalho estilizado
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 220, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("RELATÓRIO EPIDEMIOLÓGICO", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Período: ${form.periodoInicio} a ${form.periodoFim}`, 105, 22, { align: "center" });
    doc.text(`Gerado em: ${hoje}`, 105, 28, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    let yPos = 40;

    if (dados.zonaId) {
      const zonaSelecionada = zonas.find((z) => z.id === Number(dados.zonaId));
      if (zonaSelecionada) {
        doc.setFontSize(12);
        doc.text(`Zona: ${zonaSelecionada.nome}`, 20, yPos);
        yPos += 10;
      }
    }

    // Resumo executivo
    doc.setFontSize(14);
    doc.text("RESUMO EXECUTIVO", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total de Triagens: ${dados.totalTriagens}`, 25, yPos);
    yPos += 6;
    doc.text(`Total de Leituras: ${dados.totalLeituras}`, 25, yPos);
    yPos += 6;
    const casosCriticos = dados.triagensPorResultado
      .filter((t) => t.resultado !== "NORMAL")
      .reduce((acc, t) => acc + t.total, 0);
    doc.text(`Casos de Atenção/Urgência: ${casosCriticos}`, 25, yPos);
    yPos += 15;

    // Tabela de Triagens
    doc.setFontSize(12);
    doc.text("DISTRIBUIÇÃO DAS TRIAGENS", 20, yPos);
    yPos += 8;
    
    const tabelaTriagens = dados.triagensPorResultado.map((item) => [item.resultado, item.total]);
    autoTable(doc, {
      head: [["Resultado", "Total"]],
      body: tabelaTriagens,
      startY: yPos,
      headStyles: { fillColor: [52, 73, 94] },
    });

    // Tabela de Sintomas
    doc.text("SINTOMAS MAIS FREQUENTES", 20, doc.lastAutoTable.finalY + 10);
    const tabelaSintomas = dados.sintomasMaisComuns.map((s) => [s.sintoma, s.total]);
    autoTable(doc, {
      head: [["Sintoma", "Casos"]],
      body: tabelaSintomas,
      startY: doc.lastAutoTable.finalY + 15,
      headStyles: { fillColor: [52, 73, 94] },
    });

    // Alertas de surtos
    if (dados.alertas.length > 0) {
      doc.text("ALERTAS DE VIGILÂNCIA", 20, doc.lastAutoTable.finalY + 10);
      dados.alertas.forEach((a, i) => {
        const startY = doc.lastAutoTable.finalY + 15 + (i * 15);
        doc.setFillColor(a.tipo === 'URGENTE' ? [231, 76, 60] : [241, 196, 15]);
        doc.rect(25, startY - 5, 3, 3, 'F');
        doc.text(`${a.mensagem}`, 30, startY);
      });
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
      doc.text("Sistema de Vigilância Epidemiológica", 105, 290, { align: "center" });
    }

    doc.save(`relatorio_vigilancia_${form.periodoInicio}_a_${form.periodoFim}.pdf`);
  };

  // Dados para gráficos
  const chartDataBar = dados
    ? {
        labels: dados.triagensPorResultado.map((t) => t.resultado),
        datasets: [
          {
            label: "Número de Casos",
            data: dados.triagensPorResultado.map((t) => t.total),
            backgroundColor: dados.triagensPorResultado.map((t) => t.cor),
            borderColor: dados.triagensPorResultado.map((t) => t.cor),
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      }
    : null;

  const chartDataDoughnut = dados
    ? {
        labels: dados.triagensPorResultado.map((t) => t.resultado),
        datasets: [
          {
            data: dados.triagensPorResultado.map((t) => t.total),
            backgroundColor: dados.triagensPorResultado.map((t) => t.cor),
            borderColor: '#ffffff',
            borderWidth: 3,
            cutout: '60%',
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
  };

  return (
    <div className="relatorio-container">
      <div className="relatorio-header">
        <div className="header-content">
          <h1>
            <span className="material-icons">assessment</span>
            Relatório Epidemiológico
          </h1>
        </div>
      </div>

      <div className="filtros-section">
        <div className="filtros-card">
          <h3>
            <span className="material-icons">filter_list</span>
            Filtros do Relatório
          </h3>
          <form onSubmit={handleSubmit} className="relatorio-form">
            <div className="form-grid">
              <div className="campo">
                <label>
                  <span className="material-icons">location_on</span>
                  Zona (opcional)
                </label>
                <select
                  value={form.zonaId}
                  onChange={(e) => setForm({ ...form, zonaId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Selecionar</option>
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>
                  <span className="material-icons">calendar_today</span>
                  Data Início
                </label>
                <input
                  type="date"
                  value={form.periodoInicio}
                  onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="campo">
                <label>
                  <span className="material-icons">event</span>
                  Data Fim
                </label>
                <input
                  type="date"
                  value={form.periodoFim}
                  onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="campo acoes">
                <button 
                  type="submit" 
                  disabled={carregando} 
                  className={`btn-gerar ${carregando ? 'loading' : ''}`}
                >
                  {carregando ? (
                    <>
                      <div className="spinner"></div>
                      Gerando Relatório...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">analytics</span>
                      Gerar Relatório
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {erro && (
        <div className="alerta erro">
          <span className="material-icons">error</span>
          <div className="alerta-content">
            <strong>Erro</strong>
            <p>{erro}</p>
          </div>
        </div>
      )}

      {dados && (
        <div className="resultado-relatorio">
          <div className="cabecalho-resultado">
            <div className="info-periodo">
              <h2>
                <span className="material-icons">summarize</span>
                Resultados do Período
              </h2>
              <div className="periodo-info">
                <span className="data-range">
                  {new Date(form.periodoInicio).toLocaleDateString('pt-MZ')} 
                  {" a "} 
                  {new Date(form.periodoFim).toLocaleDateString('pt-MZ')}
                </span>
                {dados.zonaId && (
                  <span className="zona-info">
                    <span className="material-icons">location_on</span>
                    {zonas.find((z) => z.id === Number(dados.zonaId))?.nome || "Todas as zonas"}
                  </span>
                )}
              </div>
            </div>
            
            <div className="acoes-cabecalho">
              <button onClick={exportarPDF} className="btn-pdf">
                <span className="material-icons">picture_as_pdf</span>
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Navegação por abas */}
          <div className="abas-navegacao">
            <button 
              className={`aba ${abaAtiva === 'visao-geral' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('visao-geral')}
            >
              <span className="material-icons">bar_chart</span>
              Visão Geral
            </button>
            <button 
              className={`aba ${abaAtiva === 'sintomas' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('sintomas')}
            >
              <span className="material-icons">healing</span>
              Sintomas
            </button>
            <button 
              className={`aba ${abaAtiva === 'alertas' ? 'ativa' : ''}`}
              onClick={() => setAbaAtiva('alertas')}
            >
              <span className="material-icons">warning</span>
              Alertas
            </button>
          </div>

          {/* Conteúdo das abas */}
          <div className="conteudo-abas">
            {abaAtiva === 'visao-geral' && (
              <div className="aba-conteudo">
                {/* Cards de Resumo */}
                <div className="cards-resumo">
                  <div className="card-resumo total">
                    <div className="card-icon">
                      <span className="material-icons">assignment</span>
                    </div>
                    <div className="card-content">
                      <h3>Total de Triagens</h3>
                      <span className="card-valor">{dados.totalTriagens}</span>
                    </div>
                  </div>
                  
                  <div className="card-resumo leituras">
                    <div className="card-icon">
                      <span className="material-icons">monitor_heart</span>
                    </div>
                    <div className="card-content">
                      <h3>Leituras Clínicas</h3>
                      <span className="card-valor">{dados.totalLeituras}</span>
                    </div>
                  </div>
                  
                  <div className="card-resumo criticos">
                    <div className="card-icon">
                      <span className="material-icons">priority_high</span>
                    </div>
                    <div className="card-content">
                      <h3>Casos Críticos</h3>
                      <span className="card-valor">
                        {dados.triagensPorResultado
                          .filter((t) => t.resultado !== "NORMAL")
                          .reduce((acc, t) => acc + t.total, 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid-graficos">
                  <div className="card-grafico">
                    <h3>
                      <span className="material-icons">show_chart</span>
                      Distribuição das Triagens
                    </h3>
                    <div className="grafico-container">
                      {chartDataBar && (
                        <Bar data={chartDataBar} options={chartOptions} />
                      )}
                    </div>
                  </div>
                  
                  <div className="card-grafico">
                    <h3>
                      <span className="material-icons">pie_chart</span>
                      Proporção por Resultado
                    </h3>
                    <div className="grafico-container doughnut">
                      {chartDataDoughnut && (
                        <Doughnut data={chartDataDoughnut} options={chartOptions} />
                      )}
                    </div>
                    <div className="legenda-grafico">
                      {dados.triagensPorResultado.map((item, index) => (
                        <div key={index} className="item-legenda">
                          <span 
                            className="cor-legenda" 
                            style={{ backgroundColor: item.cor }}
                          ></span>
                          <span className="texto-legenda">{item.resultado}</span>
                          <span className="valor-legenda">{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabela de Triagens */}
                <div className="card-tabela">
                  <h3>
                    <span className="material-icons">table_chart</span>
                    Detalhamento por Resultado
                  </h3>
                  <div className="tabela-container">
                    <table className="tabela-relatorio">
                      <thead>
                        <tr>
                          <th>Resultado</th>
                          <th>Total</th>
                          <th>Percentual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.triagensPorResultado.map((item) => (
                          <tr key={item.resultado}>
                            <td>
                              <span className="status-badge" style={{ color: item.cor }}>
                                {item.resultado === "NORMAL" ? (
                                  <span className="material-icons">check_circle</span>
                                ) : item.resultado === "ATENÇÃO" ? (
                                  <span className="material-icons">warning</span>
                                ) : (
                                  <span className="material-icons">error</span>
                                )}
                                {item.resultado}
                              </span>
                            </td>
                            <td className="valor-destaque">{item.total}</td>
                            <td className="percentual">
                              {((item.total / dados.totalTriagens) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'sintomas' && (
              <div className="aba-conteudo">
                <div className="card-tabela full-width">
                  <h3>
                    <span className="material-icons">healing</span>
                    Sintomas Mais Frequentes
                  </h3>
                  <div className="tabela-container">
                    <table className="tabela-relatorio">
                      <thead>
                        <tr>
                          <th>Sintoma</th>
                          <th>Total de Casos</th>
                          <th>Frequência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.sintomasMaisComuns.map((s, index) => (
                          <tr key={s.sintoma}>
                            <td>
                              <span className="sintoma-nome">{s.sintoma}</span>
                            </td>
                            <td className="valor-destaque">{s.total}</td>
                            <td className="percentual">
                              {((s.total / dados.totalTriagens) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'alertas' && dados.alertas.length > 0 && (
              <div className="aba-conteudo">
                <div className="alertas-container">
                  <h3>
                    <span className="material-icons">notifications</span>
                    Alertas de Vigilância
                  </h3>
                  <div className="lista-alertas">
                    {dados.alertas.map((alerta, index) => (
                      <div key={index} className={`alerta-item ${alerta.tipo.toLowerCase()}`}>
                        <div className="alerta-icon">
                          {alerta.tipo === 'URGENTE' ? (
                            <span className="material-icons">error</span>
                          ) : (
                            <span className="material-icons">warning</span>
                          )}
                        </div>
                        <div className="alerta-content">
                          <h4>{alerta.tipo}</h4>
                          <p>{alerta.mensagem}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorio;