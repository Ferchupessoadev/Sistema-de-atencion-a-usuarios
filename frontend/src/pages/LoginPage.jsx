import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [correo,     setCorreo]     = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(correo, contrasena);
      // Redirigir según rol
      if (user.es_tecnico) {
        navigate('/tecnico', { replace: true });
      } else {
        navigate('/usuario', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.errors?.correo?.[0]
               || err.response?.data?.message
               || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '5rem' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#4f46e5' }}>
          Mesa de Ayuda
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Ingresá tus credenciales para continuar
        </p>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="usuario@empresa.com"
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
              onChange={e => setContrasena(e.target.value)}
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
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
