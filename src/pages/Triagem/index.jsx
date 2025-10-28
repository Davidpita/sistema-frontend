// src/pages/Triagem/Triagem.jsx
import { useState } from 'react';
import api from '../../services/api';

function Triagem() {
  const [form, setForm] = useState({ utenteId: '', respostasJson: '{}' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/triagens', { ...form, respostasJson: JSON.parse(form.respostasJson) });
      alert('Triagem registrada!');
    } catch (err) {
      alert('Erro');
    }
  };

  return (
    <div>
      <h1>Processar Triagem</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="ID do Utente" value={form.utenteId} onChange={(e) => setForm({ ...form, utenteId: e.target.value })} />
        <textarea placeholder='{"febre": "alta", "tosse": "sim"}' value={form.respostasJson} onChange={(e) => setForm({ ...form, respostasJson: e.target.value })} />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default Triagem;