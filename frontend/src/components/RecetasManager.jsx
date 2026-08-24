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

  // Votación feedback
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
              Soluciones paso a paso para resolver incidentes comunes.
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

      {/* Lista de Recetas */}
      {loading ? (
        <div className="spinner">Cargando base de conocimientos…</div>
      ) : recetas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron recetas</p>
          <p style={{ fontSize: '0.85rem' }}>Prueba con otro término de búsqueda o categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {recetas.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '3px solid #022E5B' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-cat">📁 {r.categoria?.nombre || 'General'}</span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#047857', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, border: '1px solid #A7F3D0' }}>
                      ⭐ {r.usos} {r.usos === 1 ? 'uso' : 'usos'}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', color: '#022E5B', marginBottom: '0.65rem', fontWeight: 800 }}>
                  {r.titulo}
                </h3>

                {/* Chips de Palabras Clave / Keywords */}
                {r.keywords && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {r.keywords.split(',').map((kw, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid #DBEAFE',
                          fontWeight: 600,
                        }}
                      >
                        #{kw.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <RichTextViewer content={r.solucion} />
                </div>
              </div>

              <div>
                {/* Sección de Votación / Utilidad */}
                <div className="portal-receta-footer">
                  <div className="portal-receta-vote-area">
                    <span className="portal-receta-vote-label">¿Te sirvió esta solución?</span>
                    <div className="portal-receta-votos" role="group" aria-label="Valorar receta">
                    <button
                      type="button"
                      disabled={votandoId === r.id}
                      onClick={() => handleVotar(r.id, 'UTIL')}
                      className={`portal-voto-btn portal-voto-util ${r.mi_voto === 'UTIL' ? 'active' : ''}`}
                      title="Esta solución me fue útil"
                    >
                      <span className="portal-voto-icon" aria-hidden="true">👍</span>
                      <span className="portal-voto-copy">
                        <span>Útil</span>
                        <strong>{r.votos_util || 0}</strong>
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={votandoId === r.id}
                      onClick={() => handleVotar(r.id, 'NO_UTIL')}
                      className={`portal-voto-btn portal-voto-no-util ${r.mi_voto === 'NO_UTIL' ? 'active' : ''}`}
                      title="No me sirvió esta solución"
                    >
                      <span className="portal-voto-icon" aria-hidden="true">👎</span>
                      <span className="portal-voto-copy">
                        <span>No útil</span>
                        <strong>{r.votos_no_util || 0}</strong>
                      </span>
                    </button>
                    </div>
                  </div>

                  {r.mi_voto && (
                    <span className="portal-voto-actual">
                      Tu voto: <strong>{r.mi_voto === 'UTIL' ? 'Útil 👍' : 'No útil 👎'}</strong>
                    </span>
                  )}

                  {mensajeVoto[r.id] && (
                    <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                      {mensajeVoto[r.id]}
                    </span>
                  )}
                </div>

                {user?.es_tecnico && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => abrirModalEditar(r)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={() => handleEliminarReceta(r.id)}
                      title="Eliminar receta"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
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
