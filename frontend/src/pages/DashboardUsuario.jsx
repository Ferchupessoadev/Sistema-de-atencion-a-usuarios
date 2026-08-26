import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import RecetasManager from '../components/RecetasManager';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';
import RichTextEditor from '../components/RichTextEditor';
import RichTextViewer from '../components/RichTextViewer';
import { DashboardNavbar } from '../components/Dashboard/DashboardHeader';

export default function DashboardUsuario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState('INCIDENTES'); // 'INCIDENTES' | 'RECETAS' | 'CONSULTAS'
  const [incidentes, setIncidentes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');


  // Modal de creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idCategoria, setIdCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [interno, setInterno] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resInc, resCat] = await Promise.all([
        api.get('/incidentes'),
        api.get('/categorias'),
      ]);
      setIncidentes(resInc.data);
      setCategorias(resCat.data);
      if (resCat.data.length > 0 && !idCategoria) {
        setIdCategoria(resCat.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (user?.interno && !interno) {
      setInterno(user.interno);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleCrearIncidente = async (e) => {
    e.preventDefault();
    setErrorCreacion('');

    const textoLimpio = descripcion.replace(/<[^>]*>/g, '').trim();
    if (!descripcion || textoLimpio.length < 5) {
      setErrorCreacion('Por favor escribe una descripción del problema (mínimo 5 caracteres).');
      return;
    }

    setGuardando(true);

    try {
      await api.post('/incidentes', {
        id_categoria: idCategoria,
        descripcion,
        interno: interno || user?.interno || null,
      });

      setMensajeExito('¡Incidente creado con éxito! El equipo de soporte lo atenderá a la brevedad.');
      setModalAbierto(false);
      setDescripcion('');
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.errors?.id_usuario?.[0]
        || err.response?.data?.errors?.descripcion?.[0]
        || err.response?.data?.message
        || 'Error al crear el incidente.';
      setErrorCreacion(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Conteo de estados
  const totalAbiertos = incidentes.filter(i => i.estado === 'ABIERTO').length;
  const totalEnCurso = incidentes.filter(i => i.estado === 'EN_CURSO').length;
  const totalResueltos = incidentes.filter(i => i.estado === 'RESUELTO').length;

  const incidentesFiltrados = incidentes.filter(i => {
    if (filtroEstado === 'TODOS') return true;
    return i.estado === filtroEstado;
  });

  return (
    <div className="dashboard">
      <DashboardResponsiveStyles />
      <nav className="dashboard-nav">
        <div className="dashboard-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🎫</span>
          <div>
            <h1>Sistema de Soluciones</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Portal de Usuario {user?.interno && `· Int. ${user.interno}`}
            </span>
          </div>
        </div>
        <div className="dashboard-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            id="btn-portal-publico"
            className="btn btn-outline-header btn-sm"
            onClick={() => navigate('/')}
            title="Volver al Portal Público"
          >
            🏠 Portal
          </button>
          <button
            id="btn-mi-perfil-usuario"
            className="btn btn-outline-header btn-sm"
            onClick={() => navigate('/perfil')}
            title="Mi Perfil"
          >
            👤 Mi Perfil
          </button>
          <NotificationBell />
          {user?.foto_url ? (
            <img src={user.foto_url} alt={user.nombre} className="navbar-avatar-img" />
          ) : (
            <span className="navbar-avatar-initials">
              {user?.nombre ? user.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
            </span>
          )}
          <span className="badge badge-usuario" style={{ background: '#CCFBF1', color: '#0F766E' }}>Usuario</span>
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{user?.nombre}</span>
          <button
            id="btn-logout-usuario"
            className="btn btn-outline-header btn-sm"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* Navegación por Pestañas Principales */}
        <div className="dashboard-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <div className="dashboard-tabs-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${seccionActiva === 'INCIDENTES' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSeccionActiva('INCIDENTES')}
          >
            Mis Incidentes ({incidentes.length})
          </button>
          <button
            className={`btn ${seccionActiva === 'RECETAS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSeccionActiva('RECETAS')}
          >
            Base de Conocimientos
          </button>
          </div>
        </div>

        {seccionActiva === 'RECETAS' ? (
          <RecetasManager />
        ) : (
          <div>
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

            {/* Resumen de estadísticas interactivas */}
            <div className="stats-grid">
              <div
                className={`stat-box clickable ${filtroEstado === 'TODOS' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('TODOS')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFiltroEstado('TODOS'); }}
                title="Toca para ver todos tus incidentes"
              >
                <div className="stat-number">{incidentes.length}</div>
                <div className="stat-label">Total Mis Incidentes</div>
              </div>

              <div
                className={`stat-box clickable ${filtroEstado === 'ABIERTO' ? 'active' : ''}`}
                onClick={() => setFiltroEstado(prev => (prev === 'ABIERTO' ? 'TODOS' : 'ABIERTO'))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFiltroEstado(prev => (prev === 'ABIERTO' ? 'TODOS' : 'ABIERTO')); }}
                title="Toca para filtrar incidentes Abiertos"
              >
                <div className="stat-number" style={{ color: '#b45309' }}>{totalAbiertos} / 3</div>
                <div className="stat-label">Abiertos</div>
              </div>

              <div
                className={`stat-box clickable ${filtroEstado === 'EN_CURSO' ? 'active' : ''}`}
                onClick={() => setFiltroEstado(prev => (prev === 'EN_CURSO' ? 'TODOS' : 'EN_CURSO'))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFiltroEstado(prev => (prev === 'EN_CURSO' ? 'TODOS' : 'EN_CURSO')); }}
                title="Toca para filtrar incidentes En Atención"
              >
                <div className="stat-number" style={{ color: '#1d4ed8' }}>{totalEnCurso}</div>
                <div className="stat-label">En Atención</div>
              </div>

              <div
                className={`stat-box clickable ${filtroEstado === 'RESUELTO' ? 'active' : ''}`}
                onClick={() => setFiltroEstado(prev => (prev === 'RESUELTO' ? 'TODOS' : 'RESUELTO'))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFiltroEstado(prev => (prev === 'RESUELTO' ? 'TODOS' : 'RESUELTO')); }}
                title="Toca para filtrar incidentes Resueltos"
              >
                <div className="stat-number" style={{ color: '#047857' }}>{totalResueltos}</div>
                <div className="stat-label">Resueltos</div>
              </div>
            </div>

            {/* Alerta de límite de incidentes abiertos */}
            {totalAbiertos >= 3 && (
              <div className="alert alert-warning">
                ⚠️ <strong>Límite de incidentes alcanzado:</strong> Tienes 3 incidentes en estado ABIERTO. Debes esperar a que sean resueltos antes de abrir uno nuevo.
              </div>
            )}

            <div className="dashboard-content-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              {/* Pestañas de filtrado */}
              <div className="filter-tabs" style={{ marginBottom: 0 }}>
                {['TODOS', 'ABIERTO', 'EN_CURSO', 'RESUELTO'].map(est => (
                  <button
                    key={est}
                    className={`filter-tab ${filtroEstado === est ? 'active' : ''}`}
                    onClick={() => setFiltroEstado(est)}
                  >
                    {est === 'TODOS' ? 'Todos' : est.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Botón para crear incidente */}
              <button
                id="btn-crear-incidente"
                className="btn btn-primary"
                disabled={totalAbiertos >= 3}
                onClick={() => {
                  setErrorCreacion('');
                  setModalAbierto(true);
                }}
                title={totalAbiertos >= 3 ? 'Límite alcanzado (máximo 3 abiertos)' : 'Reportar nuevo incidente'}
              >
                ➕ Nuevo Incidente
              </button>
            </div>

            {/* Lista de incidentes */}
            {loading ? (
              <div className="spinner">Cargando incidentes…</div>
            ) : incidentesFiltrados.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No tienes incidentes en esta sección</p>
                <p style={{ fontSize: '0.85rem' }}>
                  {totalAbiertos < 3 ? 'Presioná "Nuevo Incidente" para reportar un problema al equipo técnico.' : ''}
                </p>
              </div>
            ) : (
              <div>
                {incidentesFiltrados.map(inc => (
                  <div key={inc.id} className="incident-card">
                    <div className="incident-header">
                      <div className="incident-badges">
                        <span className={`badge badge-${inc.estado}`}>{inc.estado.replace('_', ' ')}</span>
                        <span className={`badge badge-prioridad-${inc.prioridad}`}>Prioridad {inc.prioridad}</span>
                        <span className="badge badge-cat">📁 {inc.categoria?.nombre || 'General'}</span>
                        {(inc.interno || user?.interno) && (
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569', fontWeight: 600, border: '1px solid #cbd5e1' }}>
                            ☎️ Int: {inc.interno || user?.interno}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        #{inc.id} · {new Date(inc.created_at).toLocaleDateString()} {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                      <RichTextViewer content={inc.descripcion} />
                    </div>

                    {inc.receta && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#166534' }}>💡 Solución aplicada (Receta #{inc.receta.id}):</strong> {inc.receta.titulo}
                        <div style={{ marginTop: '0.35rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <RichTextViewer content={inc.receta.solucion} />
                        </div>
                      </div>
                    )}
                    {inc.solucion && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#78350f' }}>💡 Solución aplicada (Explicada por el técnico):</strong>
                        <div style={{ marginTop: '0.35rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <RichTextViewer content={inc.solucion} />
                        </div>
                      </div>
                    )}

                    <div className="incident-meta">
                      <span>
                        🛠️ Técnico: <strong>{inc.tecnico ? inc.tecnico.nombre : 'Sin asignar (en espera)'}</strong>
                      </span>
                      {inc.resolucion && (
                        <span style={{ color: '#047857' }}>
                          ✅ Resuelto el: {new Date(inc.resolucion).toLocaleDateString()} {new Date(inc.resolucion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de Creación de Incidente con TipTap */}
            {modalAbierto && (
              <div className="modal-overlay">
                <div className="modal-content modal-lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.8rem' }}>🎫</span>
                      <div>
                        <h2 style={{ fontSize: '1.3rem', color: 'var(--c-navy)', fontWeight: 800, margin: 0 }}>
                          Reportar Nuevo Incidente
                        </h2>
                        <span style={{ fontSize: '0.785rem', color: '#64748B' }}>
                          Describe el problema para que el equipo de soporte técnico pueda asistirte
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalAbierto(false)}
                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
                      title="Cerrar modal"
                    >
                      ✕
                    </button>
                  </div>

                  {errorCreacion && <div className="alert alert-error">{errorCreacion}</div>}

                  <form onSubmit={handleCrearIncidente}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="modal-categoria" style={{ fontWeight: 600, color: '#1E293B' }}>
                          Categoría del Problema <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <select
                          id="modal-categoria"
                          value={idCategoria}
                          onChange={(e) => setIdCategoria(e.target.value)}
                          required
                        >
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="modal-interno" style={{ fontWeight: 600, color: '#1E293B' }}>
                          Interno de Contacto
                        </label>
                        <input
                          id="modal-interno"
                          type="text"
                          value={interno}
                          onChange={(e) => setInterno(e.target.value)}
                          placeholder="Ej. 3105, 3777, 3422..."
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 600, color: '#1E293B' }}>
                        <span>Descripción Detallada del Incidente <span style={{ color: '#EF4444' }}>*</span></span>
                        <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 400 }}>Editor con formato enriquecido</span>
                      </label>
                      <RichTextEditor
                        value={descripcion}
                        onChange={setDescripcion}
                        placeholder="Describe el inconveniente de manera clara (puedes incluir pasos que realizaste, mensajes de error en pantalla, listas con viñetas, etc.)..."
                        minHeight="200px"
                      />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setModalAbierto(false)}
                        disabled={guardando}
                      >
                        ← Cancelar
                      </button>
                      <button
                        id="btn-submit-incidente"
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 1.5, padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
                        disabled={guardando}
                      >
                        {guardando ? 'Guardando Incidente…' : '✅ Registrar Incidente'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
