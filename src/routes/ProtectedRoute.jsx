// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getPapel } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const papel = getPapel();
  if (allowedRoles && !allowedRoles.includes(papel)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;