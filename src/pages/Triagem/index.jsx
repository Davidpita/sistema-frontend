// src/pages/Triagem/Triagem.jsx
import { useState, useEffect } from "react";
import api from "../../services/api";
import "./index.css";

function Triagem() {
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

  // Carregar utentes
  useEffect(() => {
    carregarUtentes();
    carregarTriagens();
    carregarUtentes();
  }, []);

  const carregarTriagens = async () => {
  try {
    const res = await api.get('/triagens'); // rota do backend
    setTriagensList(res.data); // assume que backend retorna array direto
  } catch (err) {
    console.error('Erro ao carregar triagens:', err);
    setErro('Não foi possível carregar triagens');
  }
};

  const carregarUtentes = async () => {
    try {
      const res = await api.get("/utentes");
      setUtentes(res.data);
    } catch (err) {
      setErro("Erro ao carregar utentes");
    }
  };

  // Filtrar utentes por contacto
  const utentesFiltrados = utentes.filter((u) =>
    u.contacto?.includes(buscaContacto)
  );

  // Selecionar utente
  const selecionarUtente = (utente) => {
    setUtenteSelecionado(utente);
    setBuscaContacto("");
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
      setErro("Selecione um utente");
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

      setSucesso("Triagem salva com sucesso!");
      limparTriagem();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao salvar triagem");
    } finally {
      setLoading(false);
    }
    await api.post("/triagens", {
  utenteId: utenteSelecionado.id,
  respostasJson: JSON.stringify(respostas),
  resultado,
  recomendacao,
});

// Recarregar lista de triagens
carregarTriagens();

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

  return (
    <div className="triagem-container">
      <h1>Triagem Clínica</h1>

      {/* BUSCA UTENTE */}
      <div className="busca-utente">
        <h2>1. Buscar Utente por Contacto</h2>
        <input
          type="text"
          placeholder="Digite o contacto (ex: 923456789)"
          value={buscaContacto}
          onChange={(e) => setBuscaContacto(e.target.value)}
          className="input-contacto"
        />

        {buscaContacto && utentesFiltrados.length > 0 && (
          <div className="resultados-busca">
            {utentesFiltrados.map((u) => (
              <div
                key={u.id}
                className="utente-item"
                onClick={() => selecionarUtente(u)}
              >
                <strong>{u.nome}</strong> - {u.contacto}
                {u.zona && <span> ({u.zona.nome})</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UTENTE SELECIONADO */}
      {utenteSelecionado && (
        <div className="utente-selecionado">
          <h3>Utente: {utenteSelecionado.nome}</h3>
          <p>
            <strong>Contacto:</strong> {utenteSelecionado.contacto} |{" "}
            <strong>Zona:</strong> {utenteSelecionado.zona?.nome || "N/A"}
          </p>
        </div>
      )}

      {/* FORMULÁRIO */}
      {utenteSelecionado && (
        <form onSubmit={handleSubmit} className="triagem-form">
          <h2>2. Questionário de Sintomas</h2>

          <div className="pergunta">
            <label>Febre?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="febre"
                  value="alta"
                  onChange={(e) =>
                    setRespostas({ ...respostas, febre: e.target.value })
                  }
                />{" "}
                Alta (acima de 38.5°C)
              </label>
              <label>
                <input
                  type="radio"
                  name="febre"
                  value="moderada"
                  onChange={(e) =>
                    setRespostas({ ...respostas, febre: e.target.value })
                  }
                />{" "}
                Moderada (37.5°C - 38.5°C)
              </label>
              <label>
                <input
                  type="radio"
                  name="febre"
                  value="baixa"
                  onChange={(e) =>
                    setRespostas({ ...respostas, febre: e.target.value })
                  }
                />{" "}
                Baixa (até 37.5°C)
              </label>
              <label>
                <input
                  type="radio"
                  name="febre"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, febre: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          <div className="pergunta">
            <label>Tosse?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="tosse"
                  value="frequente"
                  onChange={(e) =>
                    setRespostas({ ...respostas, tosse: e.target.value })
                  }
                />{" "}
                Frequente
              </label>
              <label>
                <input
                  type="radio"
                  name="tosse"
                  value="ocasional"
                  onChange={(e) =>
                    setRespostas({ ...respostas, tosse: e.target.value })
                  }
                />{" "}
                Ocasional
              </label>
              <label>
                <input
                  type="radio"
                  name="tosse"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, tosse: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          <div className="pergunta">
            <label>Dor de garganta?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="dorGarganta"
                  value="sim"
                  onChange={(e) =>
                    setRespostas({ ...respostas, dorGarganta: e.target.value })
                  }
                />{" "}
                Sim
              </label>
              <label>
                <input
                  type="radio"
                  name="dorGarganta"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, dorGarganta: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          <div className="pergunta">
            <label>Falta de ar?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="faltaAr"
                  value="sim"
                  onChange={(e) =>
                    setRespostas({ ...respostas, faltaAr: e.target.value })
                  }
                />{" "}
                Sim
              </label>
              <label>
                <input
                  type="radio"
                  name="faltaAr"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, faltaAr: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          <div className="pergunta">
            <label>Fadiga?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="fadiga"
                  value="sim"
                  onChange={(e) =>
                    setRespostas({ ...respostas, fadiga: e.target.value })
                  }
                />{" "}
                Sim
              </label>
              <label>
                <input
                  type="radio"
                  name="fadiga"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, fadiga: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          <div className="pergunta">
            <label>Dor no corpo?</label>
            <div className="opcoes">
              <label>
                <input
                  type="radio"
                  name="dorCorpo"
                  value="sim"
                  onChange={(e) =>
                    setRespostas({ ...respostas, dorCorpo: e.target.value })
                  }
                />{" "}
                Sim
              </label>
              <label>
                <input
                  type="radio"
                  name="dorCorpo"
                  value="nao"
                  onChange={(e) =>
                    setRespostas({ ...respostas, dorCorpo: e.target.value })
                  }
                />{" "}
                Não
              </label>
            </div>
          </div>

          {/* RESULTADO */}
          {resultado && (
            <div className={`resultado ${resultado.split(" ")[0].toLowerCase()}`}>
              <h3>Resultado: {resultado}</h3>
              <p><strong>Recomendação:</strong> {recomendacao}</p>
            </div>
          )}

          {sucesso && <div className="alert success">{sucesso}</div>}
          {erro && <div className="alert error">{erro}</div>}

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Triagem"}
            </button>
            <button type="button" onClick={limparTriagem}>
              Nova Triagem
            </button>
          </div>
        </form>
      )}
      <div className="lista-triagens">
  <h2>Triagens Realizadas</h2>
  {triagensList.length === 0 ? (
    <p>Nenhuma triagem registrada.</p>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Utente</th>
          <th>Resultado</th>
          <th>Recomendação</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {triagensList.map(t => (
          <tr key={t.id}>
            <td>{t.utente?.nome}</td>
            <td>{t.resultado}</td>
            <td>{t.recomendacao}</td>
            <td>{new Date(t.data).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

    </div>
  );
}

export default Triagem;