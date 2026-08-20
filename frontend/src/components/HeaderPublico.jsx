import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SaltoGrandeLogo from './SaltoGrandeLogo';

export default function HeaderPublico() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const destino = user?.es_tecnico ? '/tecnico' : '/usuario';

  return (
    <nav className="portal-header">
      <div className="portal-header-inner">
        {/* Logo + Título */}
        <div
          className="portal-header-brand"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
          title="Ir al Portal Público"
        >
          <SaltoGrandeLogo size={40} />
          <div className="portal-header-titles">
            <h1 className="portal-header-title">Sistema de Soluciones</h1>
            <span className="portal-header-subtitle">
              CTM Salto Grande · Mesa de Ayuda
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="portal-header-actions">
          {isAuthenticated ? (
            <>
              <span className="portal-header-user">
                👤 {user?.nombre}
              </span>
              <button
                id="btn-ir-panel"
                className="btn btn-primary btn-sm"
                onClick={() => navigate(destino)}
              >
                Ir a mi Panel
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-header-login"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/login')}
              >
                🔑 Iniciar Sesión
              </button>
              <button
                id="btn-header-registro"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/registro')}
                style={{ marginLeft: '0.4rem' }}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
