import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortalPublico from './pages/PortalPublico';
import DashboardTecnico from './pages/DashboardTecnico';
import DashboardUsuario from './pages/DashboardUsuario';
import ProfilePage from './pages/ProfilePage';
import ResolverIncidentePage from './pages/ResolverIncidentePage';
import RecetaDetallePage from './pages/RecetaDetallePage';
import CategoriaDetallePage from './pages/CategoriaDetallePage';

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
      {/* Portal Público — página principal, visible para todos */}
      <Route path="/" element={<PortalPublico />} />

      {/* Vista y panel de Solución / Receta individual (pública y accesible por URL) */}
      <Route path="/recetas/:id" element={<RecetaDetallePage />} />
      <Route path="/receta/:id" element={<RecetaDetallePage />} />

      {/* Panel y vista de Gestión de Categoría individual */}
      <Route path="/categorias/:id" element={<TecnicoRoute><CategoriaDetallePage /></TecnicoRoute>} />
      <Route path="/categoria/:id" element={<TecnicoRoute><CategoriaDetallePage /></TecnicoRoute>} />

      {/* Login público */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={user?.es_tecnico ? '/tecnico' : '/usuario'} replace />
            : <LoginPage />
        }
      />

      {/* Registro público */}
      <Route
        path="/registro"
        element={
          isAuthenticated
            ? <Navigate to={user?.es_tecnico ? '/tecnico' : '/usuario'} replace />
            : <RegisterPage />
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

      {/* Resolver incidente — solo técnicos */}
      <Route
        path="/tecnico/incidentes/:id/resolver"
        element={
          <TecnicoRoute>
            <ResolverIncidentePage />
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

      {/* Perfil de usuario — cualquier autenticado */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all → portal público */}
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
