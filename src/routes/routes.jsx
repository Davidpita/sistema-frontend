// src/routes/routes.js
import Login from '../pages/Login/index.jsx';
import DashboardGestor from '../pages/DashboardGestor/index.jsx';
import DashboardMedico from '../pages/DashboardMedico/index.jsx'; // FALTAVA!
import DashboardProfissional from '../pages/DashboardProfissional/index.jsx';
import CriarUsuario from '../pages/CriarUsuario/index.jsx';
import CriarUtente from '../pages/CriarUtente/index.jsx';
import Triagem from '../pages/Triagem/index.jsx';
/*
import AgendarConsulta from '../pages/AgendarConsulta/index.jsx';
import CriarPrescricao from '../pages/CriarPrescricao/index.jsx';
import RegistrarLeitura from '../pages/RegistrarLeitura/index.jsx';
import Relatorio from '../pages/Relatorio/index.jsx';
*/

const routes = [
  { path: '/', element: <Login />, isPublic: true },
  { path: '/dashboard/gestor', element: <DashboardGestor />, roles: ['gestor'] },
  { path: '/dashboard/medico', element: <DashboardMedico />, roles: ['medico'] }, // AGORA FUNCIONA
  { path: '/dashboard/profissional', element: <DashboardProfissional />, roles: ['agente', 'enfermeiro'] },
  { path: '/usuarios/criar', element: <CriarUsuario />, roles: ['gestor'] },
  { path: '/utentes/criar', element: <CriarUtente />, roles: ['gestor', 'medico', 'enfermeiro', 'agente'] },
  { path: '/triagens', element: <Triagem />, roles: ['gestor', 'medico', 'enfermeiro', 'agente'] },
  /*
  { path: '/consultas', element: <AgendarConsulta />, roles: ['gestor', 'medico', 'enfermeiro', 'agente'] },
  { path: '/prescricoes', element: <CriarPrescricao />, roles: ['medico'] },
  { path: '/leituras-clinicas', element: <RegistrarLeitura />, roles: ['gestor', 'medico', 'enfermeiro', 'agente'] },
  { path: '/relatorios', element: <Relatorio />, roles: ['gestor'] },
  */
];

export default routes;