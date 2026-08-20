import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedireccion = (user) => {
    if (user.es_tecnico) {
      navigate('/tecnico', { replace: true });
    } else {
      navigate('/usuario', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(correo, contrasena);
      handleRedireccion(user);
    } catch (err) {
      const msg = err.response?.data?.errors?.correo?.[0]
               || err.response?.data?.message
               || 'Credenciales inválidas. Por favor verifique su correo y contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '440px', paddingTop: '5rem' }}>
      <div className="card" style={{ padding: '2.5rem 2.25rem', borderTop: '4px solid #022E5B' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🎫</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#022E5B', letterSpacing: '-0.02em' }}>
            Sistema de Soluciones
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Gestión y Atención a Usuarios
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@ctm.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            {loading ? 'Validando credenciales…' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
          <a
            href="/"
            style={{ fontSize: '0.85rem', color: '#022E5B', fontWeight: 600, textDecoration: 'none' }}
          >
            ← Volver al Portal Público
          </a>
        </div>
      </div>
    </div>
  );
}
