import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { DashboardNavbar } from '../components/Dashboard/DashboardHeader';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Datos del perfil
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [interno, setInterno] = useState('');
  const [fotoUrl, setFotoUrl] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Foto de perfil
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoMsg, setFotoMsg] = useState(null);
  const [fotoErr, setFotoErr] = useState(null);

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
        setFotoUrl(res.data.foto_url || null);
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

  // Subir foto de perfil
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo y tamaño en el cliente
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setFotoErr('Solo se permiten imágenes en formato JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoErr('La imagen supera los 2 MB permitidos. Por favor, selecciona una más ligera.');
      return;
    }

    setFotoErr(null);
    setFotoMsg(null);
    setSubiendoFoto(true);

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const res = await api.post('/profile/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFotoUrl(res.data.foto_url);
      setFotoMsg('¡Foto de perfil actualizada correctamente!');
      updateUser(res.data.user);
      setTimeout(() => setFotoMsg(null), 3500);
    } catch (err) {
      const msg = err.response?.data?.errors?.foto?.[0]
        || err.response?.data?.message
        || 'Error al subir la foto de perfil.';
      setFotoErr(msg);
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Eliminar foto de perfil
  const handleRemoveFoto = async () => {
    if (!window.confirm('¿Deseas eliminar tu foto de perfil actual?')) return;

    setFotoErr(null);
    setFotoMsg(null);
    setSubiendoFoto(true);

    try {
      const res = await api.delete('/profile/foto');
      setFotoUrl(null);
      setFotoMsg('Foto de perfil eliminada.');
      updateUser(res.data.user);
      setTimeout(() => setFotoMsg(null), 3500);
    } catch (err) {
      setFotoErr(err.response?.data?.message || 'Error al eliminar la foto.');
    } finally {
      setSubiendoFoto(false);
    }
  };

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
      setTimeout(() => setProfileMsg(null), 3500);
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
      setTimeout(() => setPwdMsg(null), 3500);
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
      <DashboardResponsiveStyles />
      {/* Header */}
      <DashboardNavbar
        role={user?.es_tecnico ? 'tecnico' : 'usuario'}
        user={user}
        onLogout={handleLogout}
        title="Mi Perfil"
        subtitle="Gestión de cuenta personal y foto"
        icon="👤"
        backButton={{ label: '← Volver al Panel', to: destino }}
      />

      <div className="profile-body">
        {/* Avatar + Info */}
        <div className="profile-header-card card">
          {/* Avatar con botón de subida */}
          <div className="profile-avatar-wrapper">
            {subiendoFoto ? (
              <div className="profile-avatar" style={{ opacity: 0.7 }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderTopColor: '#FFFFFF' }} />
              </div>
            ) : fotoUrl ? (
              <img src={fotoUrl} alt={nombre} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">
                {getInitials(nombre)}
              </div>
            )}

            {/* Botón flotante para cambiar foto */}
            <button
              type="button"
              className="profile-avatar-btn-edit"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoFoto}
              title="Subir o cambiar foto de perfil"
            >
              📷
            </button>

            {/* Input oculto para archivo */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
            />
          </div>

          <div className="profile-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 className="profile-header-name">{nombre || 'Usuario'}</h2>
              <span className={`badge ${user?.es_tecnico ? 'badge-tecnico' : 'badge-usuario'}`}>
                {user?.es_tecnico ? 'Técnico' : 'Usuario'}
              </span>
            </div>
            <p className="profile-header-email">📧 {correo}</p>
            {interno && <p className="profile-header-interno">📞 Interno: <strong>{interno}</strong></p>}

            {/* Botones de acción de la foto */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoFoto}
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
              >
                {fotoUrl ? '🔄 Cambiar foto' : '➕ Subir foto'}
              </button>
              {fotoUrl && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleRemoveFoto}
                  disabled={subiendoFoto}
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                >
                  🗑️ Quitar
                </button>
              )}
            </div>

            {fotoMsg && <div className="alert alert-success" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>{fotoMsg}</div>}
            {fotoErr && <div className="alert alert-error" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>{fotoErr}</div>}
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
                <label htmlFor="profile-interno">Interno de contacto</label>
                <input
                  id="profile-interno"
                  type="text"
                  value={interno}
                  onChange={e => setInterno(e.target.value)}
                  placeholder="Ej: 3105"
                  maxLength={20}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingProfile}
                style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
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
                style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
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
