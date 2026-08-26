import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from './RichTextEditor';
import RichTextViewer from './RichTextViewer';

export default function RecetasManager() {
  const { user } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Crear / Editar Receta
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [recetaEditandoId, setRecetaEditandoId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [solucion, setSolucion] = useState('');
  const [keywords, setKeywords] = useState('');
  const [idCategoria, setIdCategoria] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal para ver solución completa
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  // Votación feedback
  const [votandoId, setVotandoId] = useState(null);
  const [mensajeVoto, setMensajeVoto] = useState({});

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
      if (resCat.data.length > 0 && !idCategoria) {
        setIdCategoria(resCat.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, [busqueda, catFiltro]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setRecetaEditandoId(null);
    setTitulo('');
    setSolucion('');
    setKeywords('');
    if (categorias.length > 0) setIdCategoria(categorias[0].id);
    setErrorMsg('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (receta) => {
    setModoEdicion(true);
    setRecetaEditandoId(receta.id);
    setTitulo(receta.titulo);
    setSolucion(receta.solucion);
    setKeywords(receta.keywords || '');
    setIdCategoria(receta.id_categoria);
    setErrorMsg('');
    setModalAbierto(true);
  };

  const handleGuardarReceta = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');

    const solucionLimpia = solucion.replace(/<[^>]*>/g, '').trim();
    if (!solucion || solucionLimpia.length < 5) {
      setErrorMsg('Debes ingresar un procedimiento de solución de al menos 5 caracteres.');
      setGuardando(false);
      return;
    }

    try {
      if (modoEdicion) {
        await api.put(`/recetas/${recetaEditandoId}`, {
          titulo,
          solucion,
          keywords,
          id_categoria: idCategoria,
        });
        setMensajeExito('Receta actualizada con éxito.');
      } else {
        await api.post('/recetas', {
          titulo,
          solucion,
          keywords,
          id_categoria: idCategoria,
        });
        setMensajeExito('Receta creada y publicada en la Base de Conocimientos.');
      }
      setModalAbierto(false);
      cargarRecetas();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar la receta.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarReceta = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta guía de solución?')) return;
    try {
      await api.delete(`/recetas/${id}`);
      setMensajeExito('Receta eliminada.');
      cargarRecetas();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVotar = async (recetaId, tipo) => {
    setVotandoId(recetaId);
    try {
      const res = await api.post(`/recetas/${recetaId}/votar`, { tipo });
      setRecetas(prev => prev.map(r => (r.id === recetaId ? res.data.receta : r)));
      if (recetaSeleccionada && recetaSeleccionada.id === recetaId) {
        setRecetaSeleccionada(res.data.receta);
      }
      setMensajeVoto(prev => ({ ...prev, [recetaId]: tipo === 'UTIL' ? '¡Gracias por valorar! 👍' : 'Gracias por el reporte' }));
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
    <div>
      {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', borderLeft: '4px solid #022E5B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#022E5B', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              📚 Base de Conocimientos & Guías Técnicas
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
              Soluciones paso a paso para resolver incidentes comunes. Haz clic en cualquier tarjeta para ver el procedimiento completo.
            </p>
          </div>

          {user?.es_tecnico && (
            <button
              id="btn-nueva-receta"
              className="btn btn-primary"
              onClick={abrirModalCrear}
            >
              ➕ Nueva Receta
            </button>
          )}
        </div>

        {/* Barra de Búsqueda y Filtro de Categoría */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 250px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por palabra clave, modelo, interno o título (ej. 3777, toshiba, k2b, wifi, vpn)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <select
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

      {/* Lista de Recetas en formato Cuadrado */}
      {loading ? (
        <div className="spinner">Cargando base de conocimientos…</div>
      ) : recetas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron recetas</p>
          <p style={{ fontSize: '0.85rem' }}>Prueba con otro término de búsqueda o categoría.</p>
        </div>
      ) : (
        <div className="solution-card-grid">
          {recetas.map(r => (
            <div
              key={r.id}
              className="solution-square-card"
              onClick={() => setRecetaSeleccionada(r)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRecetaSeleccionada(r); }}
              title="Haz clic para ver la solución completa"
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

            {/* Footer con Votación y Acciones */}
            <div className="solution-modal-footer">
              <div className="portal-receta-vote-area">
                <span className="portal-receta-vote-label">¿Te sirvió esta solución?</span>
                <div className="portal-receta-votos" role="group" aria-label="Valorar receta">
                  <button
                    type="button"
                    disabled={votandoId === recetaSeleccionada.id}
                    onClick={() => handleVotar(recetaSeleccionada.id, 'UTIL')}
                    className={`portal-voto-btn portal-voto-util ${recetaSeleccionada.mi_voto === 'UTIL' ? 'active' : ''}`}
                    title="Esta solución me fue útil"
                  >
                    <span className="portal-voto-icon" aria-hidden="true">👍</span>
                    <span className="portal-voto-copy">
                      <span>Útil</span>
                      <strong>{recetaSeleccionada.votos_util || 0}</strong>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={votandoId === recetaSeleccionada.id}
                    onClick={() => handleVotar(recetaSeleccionada.id, 'NO_UTIL')}
                    className={`portal-voto-btn portal-voto-no-util ${recetaSeleccionada.mi_voto === 'NO_UTIL' ? 'active' : ''}`}
                    title="No me sirvió esta solución"
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

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {user?.es_tecnico && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        const target = recetaSeleccionada;
                        setRecetaSeleccionada(null);
                        abrirModalEditar(target);
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const targetId = recetaSeleccionada.id;
                        setRecetaSeleccionada(null);
                        handleEliminarReceta(targetId);
                      }}
                      title="Eliminar receta"
                    >
                      🗑️ Eliminar
                    </button>
                  </>
                )}
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

      {/* Modal Crear / Editar Receta */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#022E5B', fontWeight: 800 }}>
                {modoEdicion ? 'Editar Receta Técnica' : 'Publicar Nueva Receta en Base de Conocimientos'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

            <form onSubmit={handleGuardarReceta}>
              <div className="form-group">
                <label htmlFor="receta-cat">Categoría</label>
                <select
                  id="receta-cat"
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value)}
                  required
                >
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="receta-titulo">Título de la Solución</label>
                <input
                  id="receta-titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Restablecimiento de perfil de correo Outlook"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="receta-keywords">
                  Palabras Clave / Etiquetas (separadas por comas)
                </label>
                <input
                  id="receta-keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Ej. 3777, toshiba, toner, impresion, hojas, atasco"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', color: '#1e293b' }}>
                  Procedimiento / Pasos de Solución (Editor Enriquecido)
                </label>
                <RichTextEditor
                  value={solucion}
                  onChange={setSolucion}
                  placeholder="Detalla aquí los pasos de la solución técnica, comandos, notas o instrucciones..."
                  minHeight="180px"
                />
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
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando…' : modoEdicion ? 'Actualizar Receta' : 'Publicar Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
