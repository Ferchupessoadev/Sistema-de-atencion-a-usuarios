import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HeaderPublico from '../components/HeaderPublico';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const user = await register(form);
      if (user.es_tecnico) {
        navigate('/tecnico', { replace: true });
      } else {
        navigate('/usuario', { replace: true });
      }
    } catch (err) {
      // Mostrar errores de validación de Laravel (422)
      const apiErrors = err.response?.data?.errors || {};
      const generalMsg = err.response?.data?.message || 'Error al registrar usuario.';
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      } else {
        setErrors({ general: generalMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderPublico />

      <div className="container" style={{ maxWidth: '440px', paddingTop: '4rem', paddingBottom: '3rem' }}>
        <div className="card" style={{ padding: '2.5rem 2.25rem', borderTop: '4px solid #022E5B' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🎫</div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#022E5B', letterSpacing: '-0.02em' }}>
              Sistema de Soluciones
            </h1>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Crear una nueva cuenta
            </p>
          </div>

          {errors.general && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{errors.general}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="nombre">Nombre completo</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
                autoComplete="name"
              />
              {errors.nombre && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.nombre[0]}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="correo-reg">Correo electrónico</label>
              <input
                id="correo-reg"
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                placeholder="usuario@empresa.com"
                required
                autoComplete="email"
              />
              {errors.correo && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.correo[0]}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="contrasena-reg">Contraseña</label>
              <input
                id="contrasena-reg"
                type="password"
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>
                Mín. 8 caracteres (letras y números)
              </small>
              {errors.contrasena && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.contrasena[0]}</span>}
            </div>

            <button
              id="btn-register"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>¿Ya tenés cuenta? </span>
            <Link
              to="/login"
              style={{ fontSize: '0.85rem', color: '#022E5B', fontWeight: 600, textDecoration: 'none' }}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
