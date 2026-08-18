import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const [idCategoria, setIdCategoria] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    if (categorias.length > 0) setIdCategoria(categorias[0].id);
    setErrorMsg('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (receta) => {
    setModoEdicion(true);
    setRecetaEditandoId(receta.id);
    setTitulo(receta.titulo);
    setSolucion(receta.solucion);
    setIdCategoria(receta.id_categoria);
    setErrorMsg('');
    setModalAbierto(true);
  };

  const handleGuardarReceta = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg('');

    try {
      if (modoEdicion) {
        await api.put(`/recetas/${recetaEditandoId}`, {
          titulo,
          solucion,
          id_categoria: idCategoria,
        });
        setMensajeExito('Receta actualizada con éxito.');
      } else {
        await api.post('/recetas', {
          titulo,
          solucion,
          id_categoria: idCategoria,
        });
        setMensajeExito('Receta creada y publicada en la Base de Conocimiento.');
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

  return (
    <div>
      {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 Base de Conocimientos & Guías Técnicas
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
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
              placeholder="🔍 Buscar por palabra clave (ej. impresora, wifi, contraseña, correo)..."
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
        <div className="spinner">Cargando base de conocimiento…</div>
      ) : recetas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron recetas</p>
          <p style={{ fontSize: '0.85rem' }}>Prueba con otro término de búsqueda o categoría.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {recetas.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                  <span className="badge badge-cat">📁 {r.categoria?.nombre || 'General'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                    ⭐ {r.usos} {r.usos === 1 ? 'uso' : 'usos'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '0.75rem', fontWeight: 700 }}>
                  {r.titulo}
                </h3>

                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {r.solucion}
                </div>
              </div>

              {user?.es_tecnico && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
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
          ))}
        </div>
      )}

      {/* Modal Crear / Editar Receta */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#1e293b' }}>
                {modoEdicion ? 'Editar Receta Técnica' : 'Publicar Nueva Receta en Base de Conocimientos'}
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
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
                <label htmlFor="receta-solucion">Procedimiento / Pasos de Solución</label>
                <textarea
                  id="receta-solucion"
                  rows="6"
                  value={solucion}
                  onChange={(e) => setSolucion(e.target.value)}
                  placeholder="1. Paso 1...&#10;2. Paso 2...&#10;3. Comprobación final..."
                  required
                  minLength={10}
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
