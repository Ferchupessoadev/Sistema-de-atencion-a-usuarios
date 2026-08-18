import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    es_tecnico: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const user = await register(form);
      if (user.es_tecnico) {
        navigate('/tecnico/dashboard');
      } else {
        navigate('/usuario/dashboard');
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mesa de Ayuda — CTM</h1>
        <h2 style={styles.subtitle}>Crear Cuenta</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="nombre" style={styles.label}>Nombre completo</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Juan Pérez"
            />
            {errors.nombre && <span style={styles.fieldError}>{errors.nombre[0]}</span>}
          </div>

          <div style={styles.field}>
            <label htmlFor="correo-reg" style={styles.label}>Correo electrónico</label>
            <input
              id="correo-reg"
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="usuario@ctm.com"
            />
            {errors.correo && <span style={styles.fieldError}>{errors.correo[0]}</span>}
          </div>

          <div style={styles.field}>
            <label htmlFor="contrasena-reg" style={styles.label}>Contraseña (mín. 6 caracteres)</label>
            <input
              id="contrasena-reg"
              type="password"
              name="contrasena"
              value={form.contrasena}
              onChange={handleChange}
              required
              minLength={6}
              style={styles.input}
              placeholder="••••••••"
            />
            {errors.contrasena && <span style={styles.fieldError}>{errors.contrasena[0]}</span>}
          </div>

          <div style={styles.checkboxField}>
            <input
              id="es_tecnico"
              type="checkbox"
              name="es_tecnico"
              checked={form.es_tecnico}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="es_tecnico" style={styles.checkboxLabel}>
              Soy técnico de soporte (Nivel 1)
            </label>
          </div>

          {errors.general && <p style={styles.error}>{errors.general}</p>}

          <button
            id="btn-register"
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <p style={styles.loginLink}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={styles.link}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: '100%',
    maxWidth: '420px',
  },
  title: { margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#555', textAlign: 'center', fontWeight: 'normal' },
  subtitle: { margin: '0 0 1.5rem', fontSize: '1.5rem', color: '#222', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontSize: '0.9rem', color: '#444', fontWeight: 'bold' },
  input: { padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
  checkboxField: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  checkboxLabel: { fontSize: '0.9rem', color: '#444', cursor: 'pointer' },
  button: {
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    margin: 0,
  },
  fieldError: { color: '#dc2626', fontSize: '0.8rem' },
  loginLink: { textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#555' },
  link: { color: '#2563eb' },
};
