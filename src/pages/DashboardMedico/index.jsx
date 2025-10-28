// src/pages/DashboardMedico/index.jsx
import { Link } from 'react-router-dom';
import { logout } from '../../utils/auth';

function DashboardMedico() {
  return (
    <div>
      <h1>Bem-vindo, Médico!</h1>
      <nav>
        <Link to="/utentes/criar">Criar Utente</Link> | 
        <Link to="/triagens">Triagem</Link> | 
        <button onClick={logout}>Sair</button>
      </nav>
    </div>
  );
}

export default DashboardMedico;