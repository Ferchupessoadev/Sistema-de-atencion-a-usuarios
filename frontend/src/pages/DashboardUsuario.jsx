import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import RecetasManager from '../components/RecetasManager';
import SaltoGrandeLogo from '../components/SaltoGrandeLogo';

export default function DashboardUsuario() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState('INCIDENTES'); // 'INCIDENTES' | 'RECETAS'
  const [incidentes, setIncidentes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modal de creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idCategoria, setIdCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
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

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleCrearIncidente = async (e) => {
    e.preventDefault();
    setErrorCreacion('');
    setGuardando(true);

    try {
      await api.post('/incidentes', {
        id_categoria: idCategoria,
        descripcion,
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
  const totalEnCurso  = incidentes.filter(i => i.estado === 'EN_CURSO').length;
  const totalResueltos = incidentes.filter(i => i.estado === 'RESUELTO').length;

  const incidentesFiltrados = incidentes.filter(i => {
    if (filtroEstado === 'TODOS') return true;
    return i.estado === filtroEstado;
  });

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🎫</span>
          <div>
            <h1>Sistema de Soluciones</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Portal de Usuario
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationBell />
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
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button
            className={`btn ${seccionActiva === 'INCIDENTES' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSeccionActiva('INCIDENTES')}
          >
            🎫 Mis Incidentes
          </button>
          <button
            className={`btn ${seccionActiva === 'RECETAS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSeccionActiva('RECETAS')}
          >
            📚 Base de Conocimientos
          </button>
        </div>

        {seccionActiva === 'RECETAS' ? (
          <RecetasManager />
        ) : (
          <div>
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

            {/* Resumen de estadísticas */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{incidentes.length}</div>
                <div className="stat-label">Total Mis Incidentes</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#b45309' }}>{totalAbiertos} / 3</div>
                <div className="stat-label">Abiertos (RN-005)</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#1d4ed8' }}>{totalEnCurso}</div>
                <div className="stat-label">En Atención</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#047857' }}>{totalResueltos}</div>
                <div className="stat-label">Resueltos</div>
              </div>
            </div>

            {/* Alerta de bloqueo RN-005 si tiene >= 3 abiertos */}
            {totalAbiertos >= 3 && (
              <div className="alert alert-warning">
                ⚠️ <strong>Límite de incidentes alcanzado (RN-005):</strong> Tienes 3 incidentes en estado ABIERTO. Debes esperar a que sean resueltos antes de abrir uno nuevo.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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

              <button
                id="btn-nuevo-incidente"
                className="btn btn-primary"
                disabled={totalAbiertos >= 3}
                onClick={() => {
                  setErrorCreacion('');
                  setModalAbierto(true);
                }}
              >
                ➕ Nuevo Incidente
              </button>
            </div>

            {/* Lista de incidentes */}
            {loading ? (
              <div className="spinner">Cargando incidentes…</div>
            ) : incidentesFiltrados.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron incidentes</p>
                <p style={{ fontSize: '0.85rem' }}>
                  {filtroEstado === 'TODOS'
                    ? 'Aún no has reportado ningún incidente. Haz clic en "Nuevo Incidente" para comenzar.'
                    : `No tienes incidentes con estado "${filtroEstado}".`}
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
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        #{inc.id} · {new Date(inc.created_at).toLocaleDateString()} {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>
                      {inc.descripcion}
                    </p>

                    {inc.receta && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#166534' }}>💡 Solución aplicada:</strong> {inc.receta.titulo}
                        <p style={{ marginTop: '0.25rem', color: '#334155' }}>{inc.receta.solucion}</p>
                      </div>
                    )}

                    <div className="incident-meta">
                      <span>👤 Creado por: <strong>Tú</strong></span>
                      <span>🛠️ Técnico asignado: <strong>{inc.tecnico ? inc.tecnico.nombre : 'En espera de asignación'}</strong></span>
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

            {/* Modal de Creación de Incidente */}
            {modalAbierto && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#1e293b' }}>Reportar Nuevo Incidente</h2>
                    <button
                      onClick={() => setModalAbierto(false)}
                      style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      ✕
                    </button>
                  </div>

                  {errorCreacion && <div className="alert alert-error">{errorCreacion}</div>}

                  <form onSubmit={handleCrearIncidente}>
                    <div className="form-group">
                      <label htmlFor="modal-categoria">Categoría del Problema</label>
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

                    <div className="form-group">
                      <label htmlFor="modal-descripcion">Descripción detallada del incidente</label>
                      <textarea
                        id="modal-descripcion"
                        rows="4"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describe el inconveniente de manera clara (ej. Mi equipo no enciende, la impresora emite error de papel, etc.)"
                        required
                        minLength={5}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Mínimo 5 caracteres.</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setModalAbierto(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        id="btn-submit-incidente"
                        type="submit"
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={guardando}
                      >
                        {guardando ? 'Guardando…' : 'Registrar Incidente'}
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
