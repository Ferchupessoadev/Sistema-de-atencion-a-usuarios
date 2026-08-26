import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Datos del perfil
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [interno, setInterno] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Cambio de contraseña
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [contrasenaConfirm, setContrasenaConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdErr, setPwdErr] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const [loading, setLoading] = useState(true);

  // Cargar datos del perfil
  useEffect(() => {
    api.get('/profile')
      .then(res => {
        setNombre(res.data.nombre || '');
        setCorreo(res.data.correo || '');
        setInterno(res.data.interno || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Avatar con iniciales
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const destino = user?.es_tecnico ? '/tecnico' : '/usuario';

  // Guardar perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);

    try {
      const res = await api.put('/profile', { nombre, correo, interno });
      setProfileMsg(res.data.message);
      updateUser(res.data.user);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setProfileErr(Object.values(data.errors).flat().join(' '));
      } else {
        setProfileErr(data?.message || 'Error al actualizar el perfil.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);
    setSavingPwd(true);

    try {
      const res = await api.put('/profile/password', {
        contrasena_actual: contrasenaActual,
        contrasena: contrasenaNueva,
        contrasena_confirmation: contrasenaConfirm,
      });
      setPwdMsg(res.data.message);
      setContrasenaActual('');
      setContrasenaNueva('');
      setContrasenaConfirm('');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setPwdErr(Object.values(data.errors).flat().join(' '));
      } else {
        setPwdErr(data?.message || 'Error al cambiar la contraseña.');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="spinner">Cargando perfil…</div>;

  return (
    <div className="dashboard">
      {/* Header */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>👤</span>
          <div>
            <h1>Mi Perfil</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Gestión de cuenta personal
            </span>
          </div>
        </div>
        <div className="dashboard-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            id="btn-volver-dashboard"
            className="btn btn-outline-header btn-sm"
            onClick={() => navigate(destino)}
          >
            ← Volver al Panel
          </button>
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{user?.nombre}</span>
          <button
            id="btn-logout-profile"
            className="btn btn-outline-header btn-sm"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="profile-body">
        {/* Avatar + Info */}
        <div className="profile-header-card card">
          <div className="profile-avatar">
            {getInitials(nombre)}
          </div>
          <div className="profile-header-info">
            <h2 className="profile-header-name">{nombre || 'Usuario'}</h2>
            <p className="profile-header-email">{correo}</p>
            {interno && <p className="profile-header-interno">Interno: {interno}</p>}
            <span className={`badge ${user?.es_tecnico ? 'badge-tecnico' : 'badge-usuario'}`}>
              {user?.es_tecnico ? 'Técnico' : 'Usuario'}
            </span>
          </div>
        </div>

        <div className="profile-grid">
          {/* Formulario de datos */}
          <div className="card">
            <h3 className="profile-section-title">📋 Datos personales</h3>

            {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
            {profileErr && <div className="alert alert-error">{profileErr}</div>}

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label htmlFor="profile-nombre">Nombre completo</label>
                <input
                  id="profile-nombre"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-correo">Correo electrónico</label>
                <input
                  id="profile-correo"
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-interno">Interno</label>
                <input
                  id="profile-interno"
                  type="text"
                  value={interno}
                  onChange={e => setInterno(e.target.value)}
                  placeholder="Ej: 2145"
                  maxLength={20}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
                style={{ width: '100%' }}
              >
                {savingProfile ? 'Guardando…' : '💾 Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Formulario de contraseña */}
          <div className="card">
            <h3 className="profile-section-title">🔒 Cambiar contraseña</h3>

            {pwdMsg && <div className="alert alert-success">{pwdMsg}</div>}
            {pwdErr && <div className="alert alert-error">{pwdErr}</div>}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="profile-pwd-actual">Contraseña actual</label>
                <input
                  id="profile-pwd-actual"
                  type="password"
                  value={contrasenaActual}
                  onChange={e => setContrasenaActual(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-pwd-nueva">Nueva contraseña (mín. 8 caracteres, letras y números)</label>
                <input
                  id="profile-pwd-nueva"
                  type="password"
                  value={contrasenaNueva}
                  onChange={e => setContrasenaNueva(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-pwd-confirm">Confirmar nueva contraseña</label>
                <input
                  id="profile-pwd-confirm"
                  type="password"
                  value={contrasenaConfirm}
                  onChange={e => setContrasenaConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                className="btn btn-warning"
                disabled={savingPwd}
                style={{ width: '100%' }}
              >
                {savingPwd ? 'Cambiando…' : '🔑 Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
