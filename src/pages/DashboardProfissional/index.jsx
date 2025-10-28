// src/pages/DashboardProfissional/DashboardProfissional.jsx
import { Link } from 'react-router-dom';
import { logout } from '../../utils/auth';

function DashboardProfissional() {
  return (
    <div>
      <h1>Bem-vindo, Profissional!</h1>
      <nav>
        <Link to="/utentes/criar">Criar Utente</Link> | 
        <Link to="/triagens">Triagem</Link> | 
        <Link to="/leituras-clinicas">Leitura</Link> | 
        <button onClick={logout}>Sair</button>
      </nav>
    </div>
  );
}

export default DashboardProfissional;