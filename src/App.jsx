// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import routes from './routes/routes';

function App() {
  return (
    <Routes>
      {routes.map((route) => {
        if (route.isPublic) {
          return <Route key={route.path} path={route.path} element={route.element} />;
        }

        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute allowedRoles={route.roles}>
                {route.element}
              </ProtectedRoute>
            }
          />
        );
      })}
      <Route path="*" element={<div>Página não encontrada</div>} />
    </Routes>
  );
}

export default App;