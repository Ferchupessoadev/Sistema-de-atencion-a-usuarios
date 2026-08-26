import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const EMOJIS_PREDEFINIDOS = [
  '💻', '🖥️', '🖨️', '🌐', '📶', '📞', '🏢', '📦',
  '🔒', '🛡️', '⚙️', '🔧', '💾', '📁', '🚀', '💡',
  '⚡', '🎧', '👥', '📋', '🔑', '📊', '🔌', '📡'
];

export default function CategoriasManager() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Categoría expandida para ver sus recetas asociadas
  const [categoriaExpandidaId, setCategoriaExpandidaId] = useState(null);

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [catEditandoId, setCatEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('🏷️');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getCategoryIcon = (cat) => {
    if (cat?.icono && cat.icono.trim() !== '') return cat.icono;
    const name = (cat?.nombre || '').toLowerCase();
    if (name.includes('computadora') || name.includes('hardware') || name.includes('pc') || name.includes('pantalla')) return '💻';
    if (name.includes('impresora') || name.includes('fotocopiadora') || name.includes('toner') || name.includes('hoja')) return '🖨️';
    if (name.includes('red') || name.includes('internet') || name.includes('cableado') || name.includes('vpn')) return '🌐';
    if (name.includes('wifi') || name.includes('inalámbrica') || name.includes('conectividad')) return '📶';
    if (name.includes('telef') || name.includes('interno') || name.includes('voip') || name.includes('llamada')) return '📞';
    if (name.includes('k2b') || name.includes('erp') || name.includes('sistema') || name.includes('genexus')) return '🏢';
    if (name.includes('acceso') || name.includes('seguridad') || name.includes('password') || name.includes('clave')) return '🔒';
    if (name.includes('software') || name.includes('aplicacion') || name.includes('office') || name.includes('outlook')) return '📦';
    return '🏷️';
  };

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/categorias');
      setCategorias(res.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setErrorMsg('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const toggleExpandir = (id) => {
    setCategoriaExpandidaId(prev => (prev === id ? null : id));
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setCatEditandoId(null);
    setNombre('');
    setIcono('🏷️');
    setErrorMsg('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (cat) => {
    setModoEdicion(true);
    setCatEditandoId(cat.id);
    setNombre(cat.nombre);
    setIcono(cat.icono || getCategoryIcon(cat));
    setErrorMsg('');
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setGuardando(true);
    setErrorMsg('');

    const payload = {
      nombre: nombre.trim(),
      icono: icono.trim() || '🏷️',
    };

    try {
      if (modoEdicion) {
        const res = await api.put(`/categorias/${catEditandoId}`, payload);
        setCategorias(prev => prev.map(c => (c.id === catEditandoId ? res.data.categoria : c)));
        setMensajeExito('Categoría actualizada con éxito.');
      } else {
        const res = await api.post('/categorias', payload);
        setCategorias(prev => [...prev, res.data.categoria].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setMensajeExito('Categoría creada con éxito.');
      }

      setModalAbierto(false);
      setTimeout(() => setMensajeExito(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al procesar la solicitud.';
      setErrorMsg(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cat) => {
    if (cat.incidentes_count > 0 || cat.recetas_count > 0) {
      alert(`No es posible eliminar "${cat.nombre}" porque tiene ${cat.incidentes_count || 0} incidentes y ${cat.recetas_count || 0} recetas asociadas.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat.nombre}"?`)) {
      return;
    }

    try {
      await api.delete(`/categorias/${cat.id}`);
      setCategorias(prev => prev.filter(c => c.id !== cat.id));
      if (categoriaExpandidaId === cat.id) setCategoriaExpandidaId(null);
      setMensajeExito('Categoría eliminada con éxito.');
      setTimeout(() => setMensajeExito(''), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar la categoría.');
    }
  };

  const categoriasFiltradas = categorias.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* Mensajes Globales */}
      {mensajeExito && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {mensajeExito}
        </div>
      )}

      {/* Encabezado y Acciones */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#022E5B', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏷️</span> Gestión de Categorías de Soporte
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
              Personalizá nombres, emojis y tocá cualquier categoría para ver al instante sus guías y soluciones asociadas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar categoría…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ minWidth: '220px', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            />
            <button
              className="btn btn-primary"
              onClick={abrirModalCrear}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <span>➕</span> Nueva Categoría
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Categorías */}
      {loading ? (
        <div className="spinner">Cargando categorías…</div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron categorías</p>
          <p style={{ fontSize: '0.85rem' }}>Probá con otro término de búsqueda o creá una nueva categoría con su emoji.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {categoriasFiltradas.map(cat => {
            const estaExpandida = categoriaExpandidaId === cat.id;
            const tieneUso = (cat.incidentes_count || 0) > 0 || (cat.recetas_count || 0) > 0;
            const emojiActual = getCategoryIcon(cat);
            const recetasList = cat.recetas || [];

            return (
              <div
                key={cat.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.25rem',
                  borderTop: `4px solid ${estaExpandida ? '#022E5B' : '#0284C7'}`,
                  boxShadow: estaExpandida ? '0 10px 25px -5px rgba(2, 46, 91, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  background: estaExpandida ? '#FAFCFF' : '#FFFFFF',
                }}
              >
                {/* Cabecera de la Categoría */}
                <div
                  onClick={() => toggleExpandir(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpandir(cat.id); }}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Toca para desplegar las recetas asociadas"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '2rem',
                        background: estaExpandida ? '#DBEAFE' : '#F0F9FF',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        transform: estaExpandida ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {emojiActual}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>ID #{cat.id}</span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: estaExpandida ? '#022E5B' : '#0284C7',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                        >
                          {estaExpandida ? 'Cerrar ▲' : 'Ver recetas ▼'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#022E5B', margin: '0.1rem 0 0', lineHeight: 1.3 }}>
                        {cat.nombre}
                      </h3>
                    </div>
                  </div>

                  {/* Badges de Conteo */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span className="badge badge-default" style={{ fontSize: '0.75rem', background: '#F1F5F9' }}>
                      📋 {cat.incidentes_count || 0} {(cat.incidentes_count === 1) ? 'incidente' : 'incidentes'}
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.75rem',
                        background: recetasList.length > 0 ? '#EFF6FF' : '#F8FAFC',
                        color: recetasList.length > 0 ? '#1D4ED8' : '#64748B',
                        border: '1px solid #BFDBFE',
                        fontWeight: 700,
                      }}
                    >
                      💡 {cat.recetas_count || recetasList.length} {(cat.recetas_count === 1 || recetasList.length === 1) ? 'receta' : 'recetas'}
                    </span>
                  </div>
                </div>

                {/* Desplegable interactivo: Lista rápida de Recetas / Soluciones */}
                {estaExpandida && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      marginBottom: '1rem',
                      animation: 'fadeIn 0.2s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#022E5B', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        📖 Guías y Soluciones Asociadas:
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        ({recetasList.length})
                      </span>
                    </div>

                    {recetasList.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: '0.5rem 0', fontStyle: 'italic' }}>
                        Esta categoría aún no tiene recetas de solución registradas.
                      </p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {recetasList.map(rec => (
                          <li
                            key={rec.id}
                            onClick={() => navigate(`/receta/${rec.id}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              background: '#F8FAFC',
                              fontSize: '0.825rem',
                              color: '#1E293B',
                              cursor: 'pointer',
                              border: '1px solid #E2E8F0',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#EFF6FF';
                              e.currentTarget.style.borderColor = '#93C5FD';
                              e.currentTarget.style.color = '#1D4ED8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#F8FAFC';
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.color = '#1E293B';
                            }}
                            title="Toca para abrir la solución completa"
                          >
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                              • {rec.titulo}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700 }}>
                              →
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Acciones de la Categoría */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/categoria/${cat.id}`);
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                    title="Abrir panel completo de modificación de esta categoría"
                  >
                    ✏️ Modificar
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(cat);
                    }}
                    disabled={tieneUso}
                    title={tieneUso ? 'No se puede eliminar porque tiene incidentes o recetas asociadas' : 'Eliminar categoría'}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.3rem 0.65rem',
                      opacity: tieneUso ? 0.45 : 1,
                      cursor: tieneUso ? 'not-allowed' : 'pointer',
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar con Selector de Emojis */}
      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#022E5B', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{icono}</span>
                <span>{modoEdicion ? 'Editar Categoría' : 'Nueva Categoría'}</span>
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGuardar}>
              {/* Selector de Emoji */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Ícono / Emoji de la Categoría
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <div
                    style={{
                      fontSize: '2.2rem',
                      width: '56px',
                      height: '56px',
                      background: '#EFF6FF',
                      border: '2px solid #BFDBFE',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {icono || '🏷️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="form-control"
                      value={icono}
                      onChange={(e) => setIcono(e.target.value)}
                      placeholder="Escribe o pega cualquier emoji"
                      maxLength={10}
                      style={{ fontSize: '1.1rem' }}
                    />
                    <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
                      Elegí uno de la grilla rápida o pegá el emoji que prefieras.
                    </small>
                  </div>
                </div>

                {/* Paleta rápida de emojis */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '0.35rem',
                    background: '#F8FAFC',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {EMOJIS_PREDEFINIDOS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcono(emoji)}
                      style={{
                        background: icono === emoji ? '#DBEAFE' : '#FFFFFF',
                        border: icono === emoji ? '2px solid #2563EB' : '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '1.3rem',
                        padding: '0.25rem 0',
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                      title={`Seleccionar ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="cat-nombre" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  Nombre de la Categoría
                </label>
                <input
                  id="cat-nombre"
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Servidores y Almacenamiento"
                  maxLength={100}
                  required
                  autoFocus
                />
                <small style={{ color: '#64748B', display: 'block', marginTop: '0.35rem', fontSize: '0.78rem' }}>
                  Aparecerá en el selector de nuevo incidente y en los filtros de soluciones técnicas.
                </small>
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
                  disabled={guardando || !nombre.trim()}
                >
                  {guardando ? 'Guardando…' : (modoEdicion ? 'Guardar Cambios' : 'Crear Categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
