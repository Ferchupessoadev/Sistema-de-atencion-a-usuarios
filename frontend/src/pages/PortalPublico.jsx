import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeaderPublico from '../components/HeaderPublico';
import PortalResponsiveStyles from '../components/PortalResponsiveStyles';
import RichTextViewer from '../components/RichTextViewer';

export default function PortalPublico() {
  const { isAuthenticated } = useAuth();

  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  // Votación (solo para usuarios autenticados)
  const [votandoId, setVotandoId] = useState(null);
  const [mensajeVoto, setMensajeVoto] = useState({});

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

        {/* Grid de Recetas */}
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
          <div className="portal-recetas-grid">
            {recetas.map(r => (
              <div key={r.id} className="portal-receta-card">
                <div className="portal-receta-top">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-cat">📁 {r.categoria?.nombre || 'General'}</span>
                    <span className="portal-receta-usos">
                      ⭐ {r.usos} {r.usos === 1 ? 'uso' : 'usos'}
                    </span>
                  </div>

                  <h3 className="portal-receta-titulo">{r.titulo}</h3>

                  {/* Keywords */}
                  {r.keywords && (
                    <div className="portal-receta-keywords">
                      {r.keywords.split(',').map((kw, i) => (
                        <span key={i} className="portal-keyword-chip">
                          #{kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Solución */}
                  <div className="portal-receta-solucion">
                    <RichTextViewer content={r.solucion} />
                  </div>
                </div>

                {/* Footer: Votación */}
                <div className="portal-receta-footer">
                  <div className="portal-receta-votos">
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>¿Te sirvió?</span>
                    <button
                      type="button"
                      disabled={votandoId === r.id || !isAuthenticated}
                      onClick={() => handleVotar(r.id, 'UTIL')}
                      className={`portal-voto-btn portal-voto-util ${r.mi_voto === 'UTIL' ? 'active' : ''}`}
                      title={isAuthenticated ? 'Esta solución me fue útil' : 'Iniciá sesión para votar'}
                    >
                      👍 {r.votos_util || 0}
                    </button>
                    <button
                      type="button"
                      disabled={votandoId === r.id || !isAuthenticated}
                      onClick={() => handleVotar(r.id, 'NO_UTIL')}
                      className={`portal-voto-btn portal-voto-no-util ${r.mi_voto === 'NO_UTIL' ? 'active' : ''}`}
                      title={isAuthenticated ? 'No me sirvió esta solución' : 'Iniciá sesión para votar'}
                    >
                      👎 {r.votos_no_util || 0}
                    </button>
                  </div>

                  {r.mi_voto && (
                    <span className="portal-voto-actual">
                      Tu voto: {r.mi_voto === 'UTIL' ? 'Útil 👍' : 'No útil 👎'}
                    </span>
                  )}

                  {mensajeVoto[r.id] && (
                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                      {mensajeVoto[r.id]}
                    </span>
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
