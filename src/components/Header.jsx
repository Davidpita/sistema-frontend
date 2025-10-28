// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { logout } from '../utils/auth';

function Header() {
  return (
    <header>
      <nav>
        <Link to="/">Início</Link> | <button onClick={logout}>Sair</button>
      </nav>
    </header>
  );
}

export default Header;