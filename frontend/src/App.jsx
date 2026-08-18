import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardTecnico from './pages/DashboardTecnico';
import DashboardUsuario from './pages/DashboardUsuario';

// Guard: requiere autenticación
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="spinner">Cargando…</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Guard: solo técnicos
function TecnicoRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="spinner">Cargando…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.es_tecnico) return <Navigate to="/usuario" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="spinner">Cargando…</div>;

  return (
    <Routes>
      {/* Ruta raíz: redirigir según estado */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to={user?.es_tecnico ? '/tecnico' : '/usuario'} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Login público */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={user?.es_tecnico ? '/tecnico' : '/usuario'} replace />
            : <LoginPage />
        }
      />

      {/* Dashboard técnico — solo técnicos */}
      <Route
        path="/tecnico"
        element={
          <TecnicoRoute>
            <DashboardTecnico />
          </TecnicoRoute>
        }
      />

      {/* Dashboard usuario — cualquier autenticado */}
      <Route
        path="/usuario"
        element={
          <ProtectedRoute>
            <DashboardUsuario />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
