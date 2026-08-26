import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeaderPublico from '../components/HeaderPublico';
import PortalResponsiveStyles from '../components/PortalResponsiveStyles';
import RichTextViewer from '../components/RichTextViewer';

export default function PortalPublico() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);

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
  
  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (busqueda) params.q = busqueda;
      if (catFiltro) params.id_categoria = catFiltro;

      const [resRec, resCat] = await Promise.all([
        api.get('/recetas', { params }),
        api.get('/categorias'),
      ]);
      setRecetas(resRec.data);
      setCategorias(resCat.data);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, [busqueda, catFiltro]);

  const handleVotar = async (recetaId, tipo) => {
    if (!isAuthenticated) return;
    setVotandoId(recetaId);
    try {
      const res = await api.post(`/recetas/${recetaId}/votar`, { tipo });
      setRecetas(prev => prev.map(r => (r.id === recetaId ? res.data.receta : r)));
      if (recetaSeleccionada && recetaSeleccionada.id === recetaId) {
        setRecetaSeleccionada(res.data.receta);
      }
      setMensajeVoto(prev => ({
        ...prev,
        [recetaId]: tipo === 'UTIL' ? '¡Gracias por valorar! 👍' : 'Gracias por el reporte',
      }));
      setTimeout(() => {
        setMensajeVoto(prev => {
          const next = { ...prev };
          delete next[recetaId];
          return next;
        });
      }, 3000);
    } catch (err) {
      console.error('Error al votar receta:', err);
    } finally {
      setVotandoId(null);
    }
  };

  return (
    <div className="portal-publico">
      <PortalResponsiveStyles />
      <HeaderPublico />

      {/* Hero / Banner Principal */}
      <div className="portal-hero">
        <div className="portal-hero-inner">
          <h2 className="portal-hero-title">
            ¿Tenés un problema técnico?
          </h2>
          <p className="portal-hero-subtitle">
            Buscá en nuestra base de conocimientos. Encontrá soluciones paso a paso para los incidentes más comunes.
          </p>

          {/* Barra de Búsqueda principal */}
          <div className="portal-search-bar">
            <div className="portal-search-input-wrap">
              <span className="portal-search-icon">🔍</span>
              <input
                id="portal-busqueda"
                type="text"
                className="portal-search-input"
                placeholder="Buscar por palabra clave, modelo, interno o título (ej. 3777, toshiba, wifi, vpn)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              id="portal-filtro-categoria"
              className="portal-search-select"
              value={catFiltro}
              onChange={(e) => setCatFiltro(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenido principal: Recetas */}
      <div className="portal-body">
        {/* Contador de resultados */}
        <div className="portal-results-header">
          <span className="portal-results-count">
            {loading ? 'Buscando...' : `${recetas.length} ${recetas.length === 1 ? 'solución encontrada' : 'soluciones encontradas'}`}
          </span>
          {(busqueda || catFiltro) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setBusqueda(''); setCatFiltro(''); }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {/* Grid de Soluciones Cuadradas */}
        {loading ? (
          <div className="spinner">Cargando base de conocimientos…</div>
        ) : recetas.length === 0 ? (
          <div className="portal-empty">
            <div className="portal-empty-icon">📭</div>
            <p className="portal-empty-title">No se encontraron soluciones</p>
            <p className="portal-empty-text">
              Intentá con otro término de búsqueda o seleccioná otra categoría.
            </p>
            {!isAuthenticated && (
              <p className="portal-empty-text" style={{ marginTop: '0.75rem' }}>
                Si no encontrás una solución, podés{' '}
                <a href="/login" style={{ color: '#022E5B', fontWeight: 700 }}>iniciar sesión</a>{' '}
                y cargar una consulta al equipo técnico.
              </p>
            )}
          </div>
        ) : (
          <div className="solution-card-grid">
            {recetas.map(r => (
              <div
                key={r.id}
                className="solution-square-card"
                onClick={() => navigate(`/receta/${r.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/receta/${r.id}`); }}
                title="Haz clic para abrir el panel de solución completo"
              >
                {/* Header de la tarjeta */}
                <div className="solution-card-header">
                  <span className="badge badge-cat">
                    {getCategoryIcon(r.categoria?.nombre)} {r.categoria?.nombre || 'General'}
                  </span>
                  <span className="solution-card-usos" title={`${r.usos} veces aplicada`}>
                    ⭐ {r.usos} {r.usos === 1 ? 'uso' : 'usos'}
                  </span>
                </div>

                {/* Cuerpo central: Ícono y Título */}
                <div className="solution-card-body">
                  <div className="solution-card-icon-circle">
                    {getCategoryIcon(r.categoria?.nombre)}
                  </div>
                  <h3 className="solution-card-title">
                    {r.titulo}
                  </h3>

                  {/* Keywords resumidas */}
                  {r.keywords && (
                    <div className="solution-card-tags">
                      {r.keywords.split(',').slice(0, 3).map((kw, i) => (
                        <span key={i} className="solution-tag-chip">
                          #{kw.trim()}
                        </span>
                      ))}
                      {r.keywords.split(',').length > 3 && (
                        <span className="solution-tag-more">+{r.keywords.split(',').length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Pie de la tarjeta */}
                <div className="solution-card-footer">
                  <span className="solution-view-action">
                    <span>Ver Solución</span>
                    <span className="solution-view-arrow">→</span>
                  </span>
                  {(r.votos_util > 0 || r.votos_no_util > 0) && (
                    <div className="solution-card-rating">
                      <span className="solution-rating-pill" title={`${r.votos_util || 0} personas la calificaron como útil`}>
                        👍 {r.votos_util || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalle de Solución Completa */}
        {recetaSeleccionada && (
          <div className="modal-overlay" onClick={() => setRecetaSeleccionada(null)}>
            <div
              className="modal-content modal-lg solution-modal-detail"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="solution-modal-header">
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: 1 }}>
                  <div className="solution-modal-icon-badge">
                    {getCategoryIcon(recetaSeleccionada.categoria?.nombre)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span className="badge badge-cat">
                        📁 {recetaSeleccionada.categoria?.nombre || 'General'}
                      </span>
                      <span className="solution-card-usos">
                        ⭐ {recetaSeleccionada.usos} {recetaSeleccionada.usos === 1 ? 'uso registrado' : 'usos registrados'}
                      </span>
                    </div>
                    <h2 className="solution-modal-title">
                      {recetaSeleccionada.titulo}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  className="solution-modal-close"
                  onClick={() => setRecetaSeleccionada(null)}
                  title="Cerrar solución"
                >
                  ✕
                </button>
              </div>

              {/* Tags del Modal */}
              {recetaSeleccionada.keywords && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {recetaSeleccionada.keywords.split(',').map((kw, i) => (
                    <span key={i} className="solution-tag-chip" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                      #{kw.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Procedimiento Completo con TipTap Viewer */}
              <div className="solution-modal-body">
                <div className="solution-modal-body-header">
                  <span>📋 Procedimiento de Solución Paso a Paso:</span>
                </div>
                <div className="solution-modal-body-content">
                  <RichTextViewer content={recetaSeleccionada.solucion} />
                </div>
              </div>

              {/* Footer con Votación */}
              <div className="solution-modal-footer">
                <div className="portal-receta-vote-area">
                  <span className="portal-receta-vote-label">¿Te sirvió esta solución?</span>
                  <div className="portal-receta-votos" role="group" aria-label="Valorar receta">
                    <button
                      type="button"
                      disabled={votandoId === recetaSeleccionada.id || !isAuthenticated}
                      onClick={() => handleVotar(recetaSeleccionada.id, 'UTIL')}
                      className={`portal-voto-btn portal-voto-util ${recetaSeleccionada.mi_voto === 'UTIL' ? 'active' : ''}`}
                      title={isAuthenticated ? 'Esta solución me fue útil' : 'Iniciá sesión para valorar'}
                    >
                      <span className="portal-voto-icon" aria-hidden="true">👍</span>
                      <span className="portal-voto-copy">
                        <span>Útil</span>
                        <strong>{recetaSeleccionada.votos_util || 0}</strong>
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={votandoId === recetaSeleccionada.id || !isAuthenticated}
                      onClick={() => handleVotar(recetaSeleccionada.id, 'NO_UTIL')}
                      className={`portal-voto-btn portal-voto-no-util ${recetaSeleccionada.mi_voto === 'NO_UTIL' ? 'active' : ''}`}
                      title={isAuthenticated ? 'No me sirvió esta solución' : 'Iniciá sesión para valorar'}
                    >
                      <span className="portal-voto-icon" aria-hidden="true">👎</span>
                      <span className="portal-voto-copy">
                        <span>No útil</span>
                        <strong>{recetaSeleccionada.votos_no_util || 0}</strong>
                      </span>
                    </button>
                  </div>

                  {recetaSeleccionada.mi_voto && (
                    <span className="portal-voto-actual">
                      Tu voto: <strong>{recetaSeleccionada.mi_voto === 'UTIL' ? 'Útil 👍' : 'No útil 👎'}</strong>
                    </span>
                  )}

                  {mensajeVoto[recetaSeleccionada.id] && (
                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                      {mensajeVoto[recetaSeleccionada.id]}
                    </span>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}
                    onClick={() => setRecetaSeleccionada(null)}
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA para usuarios no autenticados */}
        {!isAuthenticated && (
          <div className="portal-cta">
            <div className="portal-cta-inner">
              <h3 className="portal-cta-title">¿No encontraste lo que buscabas?</h3>
              <p className="portal-cta-text">
                Iniciá sesión para cargar una consulta y que nuestro equipo técnico te ayude directamente.
              </p>
              <a href="/login" className="btn btn-primary" id="btn-cta-login">
                🔑 Iniciar Sesión
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
