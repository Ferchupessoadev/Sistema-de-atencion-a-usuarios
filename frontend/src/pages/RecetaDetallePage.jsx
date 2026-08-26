import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeaderPublico from '../components/HeaderPublico';
import RichTextViewer from '../components/RichTextViewer';
import RichTextEditor from '../components/RichTextEditor';
import NotificationBell from '../components/NotificationBell';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';

export default function RecetaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Votación feedback
  const [votando, setVotando] = useState(false);
  const [mensajeVoto, setMensajeVoto] = useState('');

  // Modal Edición para técnicos
  const [modalEditar, setModalEditar] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [editTitulo, setEditTitulo] = useState('');
  const [editSolucion, setEditSolucion] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [editIdCategoria, setEditIdCategoria] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const getCategoryIcon = (nombre = '') => {
    const n = (nombre || '').toLowerCase();
    if (n.includes('computadora') || n.includes('hardware') || n.includes('pc') || n.includes('pantalla')) return '💻';
    if (n.includes('impresora') || n.includes('fotocopiadora') || n.includes('toner') || n.includes('hoja')) return '🖨️';
    if (n.includes('red') || n.includes('internet') || n.includes('cableado') || n.includes('vpn')) return '🌐';
    if (n.includes('wifi') || n.includes('inalámbrica') || n.includes('conectividad')) return '📶';
    if (n.includes('telef') || n.includes('interno') || n.includes('voip') || n.includes('llamada')) return '📞';
    if (n.includes('k2b') || n.includes('erp') || n.includes('sistema') || n.includes('genexus')) return '🏢';
    if (n.includes('acceso') || n.includes('seguridad') || n.includes('password') || n.includes('clave')) return '🔒';
    if (n.includes('software') || n.includes('aplicacion') || n.includes('office') || n.includes('outlook')) return '📦';
    if (n.includes('aico') || n.includes('atencion') || n.includes('soporte')) return '🎧';
    return '💡';
  };

  const cargarReceta = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [resRec, resCat] = await Promise.all([
        api.get(`/recetas/${id}`),
        api.get('/categorias'),
      ]);
      setReceta(resRec.data);
      setCategorias(resCat.data);
    } catch (err) {
      console.error('Error al cargar la receta:', err);
      setErrorMsg('No se pudo encontrar la guía de solución solicitada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReceta();
  }, [id]);

  const handleVolver = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else if (user?.es_tecnico) {
      navigate('/tecnico');
    } else if (isAuthenticated) {
      navigate('/usuario');
    } else {
      navigate('/');
    }
  };

  const handleVotar = async (tipo) => {
    if (!isAuthenticated) return;
    setVotando(true);
    try {
      const res = await api.post(`/recetas/${id}/votar`, { tipo });
      setReceta(res.data.receta);
      setMensajeVoto(tipo === 'UTIL' ? '¡Gracias por valorar esta solución! 👍' : 'Gracias por tu feedback');
      setTimeout(() => setMensajeVoto(''), 3500);
    } catch (err) {
      console.error('Error al votar:', err);
    } finally {
      setVotando(false);
    }
  };

  const handleCopiarSolucion = () => {
    if (!receta) return;
    const textoPlano = receta.solucion.replace(/<[^>]*>/g, '').trim();
    navigator.clipboard.writeText(`${receta.titulo}\n\n${textoPlano}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const abrirModalEdicion = () => {
    setEditTitulo(receta.titulo);
    setEditSolucion(receta.solucion);
    setEditKeywords(receta.keywords || '');
    setEditIdCategoria(receta.id_categoria);
    setModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const res = await api.put(`/recetas/${id}`, {
        titulo: editTitulo,
        solucion: editSolucion,
        keywords: editKeywords,
        id_categoria: editIdCategoria,
      });
      setReceta(res.data.receta);
      setModalEditar(false);
      setMensajeExito('Guía de solución actualizada correctamente.');
      setTimeout(() => setMensajeExito(''), 3500);
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar esta guía de solución?')) return;
    try {
      await api.delete(`/recetas/${id}`);
      alert('Guía eliminada con éxito.');
      navigate(user?.es_tecnico ? '/tecnico' : '/');
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div>
        <HeaderPublico />
        <div className="spinner" style={{ height: '70vh' }}>
          Cargando guía técnica #{id}…
        </div>
      </div>
    );
  }

  if (errorMsg || !receta) {
    return (
      <div>
        <HeaderPublico />
        <div className="dashboard-body" style={{ maxWidth: '800px', textAlign: 'center', paddingTop: '4rem' }}>
          <div className="card" style={{ padding: '3rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ color: '#022E5B', fontWeight: 800 }}>Guía no encontrada</h2>
            <p style={{ color: '#64748B', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              {errorMsg || 'La solución que buscas no existe o fue eliminada.'}
            </p>
            <button className="btn btn-primary" onClick={handleVolver}>
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8' }}>
      <DashboardResponsiveStyles />

      {/* Header según tipo de usuario */}
      {isAuthenticated && user?.es_tecnico ? (
        <nav className="dashboard-nav">
          <div className="dashboard-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🛠️</span>
            <div>
              <h1>Base de Conocimientos CTM</h1>
              <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
                Guía Técnica de Solución #{receta.id}
              </span>
            </div>
          </div>
          <div className="dashboard-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-outline-header btn-sm" onClick={handleVolver}>
              ← Volver
            </button>
            <NotificationBell />
            <span className="badge badge-tecnico" style={{ background: '#DBEAFE', color: '#022E5B' }}>Técnico</span>
            <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{user?.nombre}</span>
          </div>
        </nav>
      ) : (
        <HeaderPublico />
      )}

      {/* Cuerpo Principal: Panel de Lectura Enfocado */}
      <div className="dashboard-body" style={{ maxWidth: '920px', padding: '1.75rem 1rem 4rem' }}>
        {mensajeExito && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>{mensajeExito}</div>}

        {/* Barra de Navegación Superior / Breadcrumbs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleVolver}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            ← Volver al listado
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopiarSolucion}
              title="Copiar solución al portapapeles"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {copiado ? '✅ ¡Copiado!' : '📋 Copiar Solución'}
            </button>

            {user?.es_tecnico && (
              <>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={abrirModalEdicion}
                  title="Editar contenido de la guía"
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleEliminar}
                  title="Eliminar esta guía"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tarjeta Principal de la Guía */}
        <div className="card" style={{ padding: '2rem', borderTop: '4px solid #022E5B', boxShadow: '0 12px 32px -4px rgba(2, 46, 91, 0.08)' }}>
          {/* Encabezado */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="solution-modal-icon-badge" style={{ width: '64px', height: '64px', fontSize: '2.2rem' }}>
              {getCategoryIcon(receta.categoria?.nombre)}
            </div>

            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className="badge badge-cat" style={{ fontSize: '0.825rem', padding: '0.25rem 0.65rem' }}>
                  📁 {receta.categoria?.nombre || 'General'}
                </span>
                <span className="solution-card-usos" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                  ⭐ {receta.usos} {receta.usos === 1 ? 'uso registrado en incidentes' : 'usos registrados en incidentes'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
                  ID: #{receta.id}
                </span>
              </div>

              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#022E5B', lineHeight: 1.3, margin: 0 }}>
                {receta.titulo}
              </h1>
            </div>
          </div>

          {/* Keywords Chips */}
          {receta.keywords && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #E2E8F0' }}>
              {receta.keywords.split(',').map((kw, i) => (
                <span key={i} className="solution-tag-chip" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE', fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}>
                  #{kw.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Procedimiento de Solución con TipTap Viewer */}
          <div className="solution-modal-body" style={{ margin: '0 0 1.75rem' }}>
            <div className="solution-modal-body-header">
              <span>📋 Procedimiento Técnico Paso a Paso:</span>
            </div>
            <div className="solution-modal-body-content" style={{ fontSize: '1rem', lineHeight: 1.65 }}>
              <RichTextViewer content={receta.solucion} />
            </div>
          </div>

          {/* Barra de Feedback y Votación */}
          <div className="solution-modal-footer" style={{ borderTop: '2px solid #F1F5F9', paddingTop: '1.5rem' }}>
            <div className="portal-receta-vote-area">
              <span className="portal-receta-vote-label" style={{ fontSize: '0.875rem' }}>
                ¿Te sirvió esta solución para resolver el problema?
              </span>
              <div className="portal-receta-votos" role="group" aria-label="Valorar receta">
                <button
                  type="button"
                  disabled={votando || !isAuthenticated}
                  onClick={() => handleVotar('UTIL')}
                  className={`portal-voto-btn portal-voto-util ${receta.mi_voto === 'UTIL' ? 'active' : ''}`}
                  title={isAuthenticated ? 'Esta solución me fue útil' : 'Iniciá sesión para valorar'}
                  style={{ minWidth: '5.5rem', padding: '0.45rem 0.85rem' }}
                >
                  <span className="portal-voto-icon" aria-hidden="true" style={{ fontSize: '1.2rem' }}>👍</span>
                  <span className="portal-voto-copy">
                    <span style={{ fontSize: '0.75rem' }}>Útil</span>
                    <strong style={{ fontSize: '0.9rem' }}>{receta.votos_util || 0}</strong>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={votando || !isAuthenticated}
                  onClick={() => handleVotar('NO_UTIL')}
                  className={`portal-voto-btn portal-voto-no-util ${receta.mi_voto === 'NO_UTIL' ? 'active' : ''}`}
                  title={isAuthenticated ? 'No me sirvió esta solución' : 'Iniciá sesión para valorar'}
                  style={{ minWidth: '5.5rem', padding: '0.45rem 0.85rem' }}
                >
                  <span className="portal-voto-icon" aria-hidden="true" style={{ fontSize: '1.2rem' }}>👎</span>
                  <span className="portal-voto-copy">
                    <span style={{ fontSize: '0.75rem' }}>No útil</span>
                    <strong style={{ fontSize: '0.9rem' }}>{receta.votos_no_util || 0}</strong>
                  </span>
                </button>
              </div>

              {receta.mi_voto && (
                <span className="portal-voto-actual">
                  Tu voto: <strong>{receta.mi_voto === 'UTIL' ? 'Útil 👍' : 'No útil 👎'}</strong>
                </span>
              )}

              {mensajeVoto && (
                <span style={{ fontSize: '0.825rem', color: '#047857', fontWeight: 700 }}>
                  {mensajeVoto}
                </span>
              )}

              {!isAuthenticated && (
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  (<Link to="/login" style={{ color: '#0284C7', fontWeight: 700 }}>Iniciá sesión</Link> para dejar tu voto)
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVolver}
              style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edición para Técnicos */}
      {modalEditar && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#022E5B', fontWeight: 800, margin: 0 }}>
                ✏️ Editar Guía Técnica #{receta.id}
              </h2>
              <button
                onClick={() => setModalEditar(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion}>
              <div className="form-group">
                <label htmlFor="edit-cat">Categoría</label>
                <select
                  id="edit-cat"
                  value={editIdCategoria}
                  onChange={(e) => setEditIdCategoria(e.target.value)}
                  required
                >
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-titulo">Título de la Solución</label>
                <input
                  id="edit-titulo"
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-keywords">Palabras Clave (separadas por comas)</label>
                <input
                  id="edit-keywords"
                  type="text"
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                  placeholder="Ej. 3777, toshiba, toner, impresion"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Procedimiento de Solución (TipTap Editor)
                </label>
                <RichTextEditor
                  value={editSolucion}
                  onChange={setEditSolucion}
                  minHeight="220px"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setModalEditar(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
