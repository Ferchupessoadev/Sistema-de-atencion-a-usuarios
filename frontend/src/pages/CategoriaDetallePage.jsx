import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';
import { DashboardNavbar } from '../components/Dashboard/DashboardHeader';

const EMOJIS_SUGERIDOS = [
  '💻', '🖨️', '🌐', '📶', '📞', '🏢', '📦', '🔒',
  '🛡️', '⚙️', '🔧', '📁', '🚀', '💡', '⚡', '🎧',
  '👥', '📋', '🔑', '📊', '🛠️', '🖥️', '🔌', '📄',
];

export default function CategoriaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [categoria, setCategoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados de edición
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('📁');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const getCategoryIcon = (catOrName) => {
    if (typeof catOrName === 'object' && catOrName?.icono) return catOrName.icono;
    const n = (typeof catOrName === 'string' ? catOrName : catOrName?.nombre || '').toLowerCase();
    if (n.includes('computadora') || n.includes('hardware') || n.includes('pc') || n.includes('pantalla')) return '💻';
    if (n.includes('impresora') || n.includes('fotocopiadora') || n.includes('toner') || n.includes('hoja')) return '🖨️';
    if (n.includes('red') || n.includes('internet') || n.includes('cableado') || n.includes('vpn')) return '🌐';
    if (n.includes('wifi') || n.includes('inalámbrica') || n.includes('conectividad')) return '📶';
    if (n.includes('telef') || n.includes('interno') || n.includes('voip') || n.includes('llamada')) return '📞';
    if (n.includes('k2b') || n.includes('erp') || n.includes('sistema') || n.includes('genexus')) return '🏢';
    if (n.includes('acceso') || n.includes('seguridad') || n.includes('password') || n.includes('clave')) return '🔒';
    if (n.includes('software') || n.includes('aplicacion') || n.includes('office') || n.includes('outlook')) return '📦';
    return '💡';
  };

  const cargarCategoria = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get(`/categorias/${id}`);
      setCategoria(res.data);
      setNombre(res.data.nombre || '');
      setIcono(res.data.icono || getCategoryIcon(res.data.nombre));
    } catch (err) {
      console.error('Error al cargar la categoría:', err);
      setErrorMsg('No se pudo encontrar la categoría solicitada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategoria();
  }, [id]);

  const handleVolver = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else if (user?.es_tecnico) {
      navigate('/tecnico');
    } else {
      navigate('/');
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      setGuardando(true);
      setErrorMsg('');
      const res = await api.put(`/categorias/${id}`, {
        nombre: nombre.trim(),
        icono: icono.trim() || null,
      });

      setCategoria(res.data.categoria);
      setMensajeExito('¡Categoría actualizada exitosamente!');
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.errors?.nombre?.[0]
        || err.response?.data?.message
        || 'Error al guardar los cambios de la categoría.';
      setErrorMsg(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!categoria) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    try {
      setEliminando(true);
      setErrorMsg('');
      await api.delete(`/categorias/${id}`);
      alert('Categoría eliminada correctamente.');
      navigate('/tecnico');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al eliminar la categoría.';
      setErrorMsg(msg);
    } finally {
      setEliminando(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard">
        <DashboardResponsiveStyles />
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <div className="spinner">Cargando panel de categoría…</div>
        </div>
      </div>
    );
  }

  if (errorMsg && !categoria) {
    return (
      <div className="dashboard">
        <DashboardResponsiveStyles />
        <div className="dashboard-body" style={{ maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#022E5B', marginBottom: '0.75rem' }}>Categoría no encontrada</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button className="btn btn-primary" onClick={handleVolver}>
              ← Volver al Panel Técnico
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <DashboardResponsiveStyles />

      {/* Header Institucional */}
      <DashboardNavbar
        role="tecnico"
        user={user}
        onLogout={handleLogout}
        title="Gestión de Categoría"
        subtitle="Panel de Configuración de Mesa de Ayuda"
        icon="🏷️"
        backButton={{ label: '← Volver a Categorías', onClick: handleVolver }}
      />

      {/* Contenedor Principal */}
      <div className="dashboard-body" style={{ maxWidth: '980px', margin: '2rem auto', padding: '0 1rem' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          <Link to="/tecnico" style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 600 }}>
            Consola Técnica
          </Link>
          <span>/</span>
          <span style={{ color: '#64748b' }}>Categorías</span>
          <span>/</span>
          <strong style={{ color: '#022E5B' }}>{categoria?.nombre}</strong>
        </div>

        {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        {/* Tarjeta Principal de Cabecera */}
        <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', borderTop: '4px solid #022E5B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '2px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                boxShadow: '0 4px 12px rgba(2, 46, 91, 0.08)',
                flexShrink: 0,
              }}
            >
              {icono || getCategoryIcon(categoria)}
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <span className="badge badge-tecnico" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                  ID #{categoria?.id}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Creada el {new Date(categoria?.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#022E5B', margin: 0 }}>
                {categoria?.nombre}
              </h2>
            </div>

            {/* Métricas rápidas */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.6rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#022E5B' }}>{categoria?.incidentes_count || 0}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Incidentes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.6rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7' }}>{categoria?.recetas_count || 0}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Recetas</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Panel de Modificación */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#022E5B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✏️</span> Modificar Datos de la Categoría
            </h3>

            <form onSubmit={handleGuardar}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', display: 'block' }}>
                  Nombre de la categoría *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Impresoras y Fotocopiadoras"
                  required
                  maxLength={100}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.95rem' }}
                />
              </div>

              {/* Selector de Emoji */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem', display: 'block' }}>
                  Emoji / Ícono representativo
                </label>

                {/* Paleta rápida */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '0.4rem',
                    marginBottom: '0.75rem',
                    padding: '0.6rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {EMOJIS_SUGERIDOS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setIcono(emo)}
                      style={{
                        fontSize: '1.35rem',
                        padding: '0.4rem',
                        border: icono === emo ? '2px solid #0284C7' : '1px solid transparent',
                        borderRadius: '6px',
                        background: icono === emo ? '#E0F2FE' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Seleccionar ${emo}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={icono}
                    onChange={(e) => setIcono(e.target.value)}
                    placeholder="Escribí o pegá un emoji personalizado"
                    maxLength={10}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                  />
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                    }}
                  >
                    {icono || '💡'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando || !nombre.trim()}
                  style={{ flex: 1, padding: '0.7rem', fontWeight: 700 }}
                >
                  {guardando ? 'Guardando cambios…' : '💾 Guardar Modificaciones'}
                </button>
              </div>
            </form>
          </div>

          {/* Panel de Recetas y Gestión */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Lista de Recetas Asociadas */}
            <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#022E5B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📖</span> Recetas en esta Categoría ({categoria?.recetas?.length || 0})
                </h3>
              </div>

              {(!categoria?.recetas || categoria.recetas.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', background: '#F8FAFC', borderRadius: '8px' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Esta categoría aún no tiene recetas de solución registradas.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '380px', overflowY: 'auto' }}>
                  {categoria.recetas.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                          {rec.titulo}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                          <span>⭐ {rec.usos} {rec.usos === 1 ? 'uso' : 'usos'}</span>
                          {rec.keywords && (
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                              🏷️ {rec.keywords}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/receta/${rec.id}`)}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', flexShrink: 0 }}
                        title="Ver y editar esta receta"
                      >
                        👁️ Ver Solución
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zona de Peligro / Eliminación */}
            <div className="card" style={{ padding: '1.25rem', border: '1px solid #FECDD3', background: '#FFF1F2' }}>
              <h4 style={{ color: '#9F1239', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>⚠️</span> Eliminar Categoría
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#881337', marginBottom: '0.75rem' }}>
                Solo se pueden eliminar categorías que no tengan incidentes ni recetas asociadas.
              </p>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleEliminar}
                disabled={eliminando || (categoria?.incidentes_count > 0) || (categoria?.recetas_count > 0)}
                style={{ fontWeight: 700, fontSize: '0.8rem' }}
                title={
                  (categoria?.incidentes_count > 0 || categoria?.recetas_count > 0)
                    ? 'No se puede eliminar: tiene incidentes o recetas asociadas'
                    : 'Eliminar esta categoría'
                }
              >
                {eliminando ? 'Eliminando…' : '🗑️ Eliminar esta Categoría'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
