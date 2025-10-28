// src/pages/CriarUtente/CriarUtente.jsx
import { useState } from 'react';
import api from '../../services/api';

function CriarUtente() {
  const [form, setForm] = useState({ nome: '', contacto: '', localizacao: '', idLocal: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/utentes', form);
      alert('Utente criado!');
    } catch (err) {
      alert('Erro ao criar utente');
    }
  };

  return (
    <div>
      <h1>Criar Utente</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <input placeholder="Contacto" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
        <input placeholder="Localização" value={form.localizacao} onChange={(e) => setForm({ ...form, localizacao: e.target.value })} />
        <input placeholder="ID Local (Zona)" value={form.idLocal} onChange={(e) => setForm({ ...form, idLocal: e.target.value })} />
        <button type="submit">Criar</button>
      </form>
    </div>
  );
}

export default CriarUtente;