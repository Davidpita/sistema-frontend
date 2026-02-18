// src/components/Sidebar/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { logout, getPapel } from "../../utils/auth";
import { ChartBar, Users, User, Clipboard, Calendar, HeartPulse, MapPin, FileText, Pill } from "lucide-react";
import "./SideBar.css";

function Sidebar() {
  const location = useLocation();
  const papel = getPapel();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const menuItems = {
    gestor: [
      { label: "Dashboard", path: "/dashboard/gestor", icon: <ChartBar/>},
      { label: "Usuários", path: "/usuarios", icon: <Users/>},
      { label: "Utentes", path: "/utentes", icon: <User/>},
      { label: "Triagem", path: "/triagens", icon: <Clipboard/> },
      { label: "Consultas", path: "/consultas", icon: <Calendar/> },
      { label: "Leituras",path: "/leituras-clinicas", icon: <HeartPulse/> },
      { label: "Zonas", path: "/zonas", icon: <MapPin/> },
      { label: "Relatório", path: "/relatorios", icon: <FileText/> },
    ],
    medico: [
      { label: "Dashboard", path: "/dashboard/medico", icon: <ChartBar/> },
      { label: "Utentes", path: "/utentes", icon: <User/> },
      { label: "Triagem", path: "/triagens", icon: <Clipboard/> },
      { label: "Consultas", path: "/consultas", icon: <Calendar/>  },
      { label: "Prescrição", path: "/prescricoes", icon: <Pill/> },
      { label: "Leituras", path: "/leituras-clinicas", icon: <HeartPulse/> },
    ],
    enfermeiro: [
      { label: "Dashboard", path: "/dashboard/profissional", icon: <ChartBar/>  },
      { label: "Utentes", path: "/utentes", icon: <User/> },
      { label: "Triagem", path: "/triagens", icon: <Clipboard/> },
      { label: "Consultas", path: "/consultas", icon: <Calendar/> },
      { label: "Leituras", path: "/leituras-clinicas", icon: <HeartPulse/> },
    ],
    agente: [
      { label: "Dashboard", path: "/dashboard/profissional", icon: <ChartBar/>  },
      { label: "Utentes", path: "/utentes", icon: <User/> },
      { label: "Triagem", path: "/triagens", icon: <Clipboard/> },
      { label: "Consultas", path: "/consultas", icon: <Calendar/> },
      { label: "Leituras", path: "/leituras-clinicas", icon: <HeartPulse/> },
    ],
  };

  const itens = menuItems[papel] || [];

  return (
    <div className="sidebar-glass">
      <div className="sidebar-header">
        <div className="logo">
          <div className="icon">Heart</div>
          <h2>eSaúde Local</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {itens.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">
            {usuario.nome?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <p className="nome">{usuario.nome || "Usuário"}</p>
            <p className="papel">{papel || "Profissional"}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-sair">
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;