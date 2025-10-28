// src/pages/DashboardGestor/DashboardGestor.jsx
import { Link } from 'react-router-dom';
import { logout } from '../../utils/auth';

function DashboardGestor() {
  return (
    <div>
      <h1>Bem-vindo, Gestor!</h1>
      <nav>
        <Link to="/usuarios/criar">Criar Usuário</Link> | 
        <Link to="/utentes/criar">Criar Utente</Link> | 
        <Link to="/relatorios">Gerar Relatório</Link> | 
        <button onClick={logout}>Sair</button>
      </nav>
    </div>
  );
}

export default DashboardGestor;