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
