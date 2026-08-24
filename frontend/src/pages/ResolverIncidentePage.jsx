import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import RichTextViewer from '../components/RichTextViewer';
import NotificationBell from '../components/NotificationBell';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';

export default function ResolverIncidentePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [incidente, setIncidente] = useState(null);
  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tipo de resolución: 'CUSTOM' (TipTap) o 'RECETA' (Existente)
  const [modoResolucion, setModoResolucion] = useState('CUSTOM');

  // Solución personalizada (TipTap)
  const [tituloReceta, setTituloReceta] = useState('');
  const [idCategoriaReceta, setIdCategoriaReceta] = useState('');
  const [solucionHtml, setSolucionHtml] = useState('');

  // Receta existente
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState('');
  const [busquedaReceta, setBusquedaReceta] = useState('');

  // Estados de envío
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resInc, resRec, resCat] = await Promise.all([
          api.get(`/incidentes/${id}`),
          api.get('/recetas'),
          api.get('/categorias'),
        ]);

        setIncidente(resInc.data);
        setRecetas(resRec.data);
        setCategorias(resCat.data);

        // Pre-cargar valores por defecto
        setTituloReceta(`Solución para: ${resInc.data.descripcion.substring(0, 50)}`);
        setIdCategoriaReceta(resInc.data.id_categoria || (resCat.data[0]?.id ?? ''));

        if (resRec.data.length > 0) {
          // Filtrar por categoría del incidente si existe
          const coincidentes = resRec.data.filter(r => r.id_categoria === resInc.data.id_categoria);
          setRecetaSeleccionadaId(coincidentes.length > 0 ? coincidentes[0].id : resRec.data[0].id);
        }
      } catch (err) {
        console.error('Error al cargar datos del incidente:', err);
        setErrorMsg('No se pudo cargar el incidente solicitado.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleResolver = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setGuardando(true);

    try {
      const payload = {
        estado: 'RESUELTO',
      };

      if (modoResolucion === 'RECETA') {
        if (!recetaSeleccionadaId) {
          setErrorMsg('Debes seleccionar una receta existente.');
          setGuardando(false);
          return;
        }
        payload.id_receta = recetaSeleccionadaId;
      } else {
        const textoLimpio = solucionHtml.replace(/<[^>]*>/g, '').trim();
        if (!solucionHtml || textoLimpio.length < 5) {
          setErrorMsg('Por favor escribe los detalles de la solución aplicada (mínimo 5 caracteres).');
          setGuardando(false);
          return;
        }

        payload.titulo_receta = tituloReceta.trim() || `Solución Incidente #${id}`;
        payload.solucion_texto = solucionHtml;
        if (idCategoriaReceta) {
          payload.id_categoria = idCategoriaReceta;
        }
      }

      await api.put(`/incidentes/${id}`, payload);
      setExitoMsg('¡Incidente resuelto exitosamente! Redirigiendo a la consola técnica...');

      setTimeout(() => {
        navigate('/tecnico');
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.errors?.resolucion?.[0]
        || err.response?.data?.message
        || 'Error al resolver el incidente.';
      setErrorMsg(msg);
      setGuardando(false);
    }
  };

  const recetaActual = recetas.find(r => String(r.id) === String(recetaSeleccionadaId));

  const recetasFiltradas = recetas.filter(r => {
    if (!busquedaReceta.trim()) return true;
    const q = busquedaReceta.toLowerCase();
    return r.titulo.toLowerCase().includes(q) || (r.keywords && r.keywords.toLowerCase().includes(q));
  });

  if (loading) {
    return <div className="spinner">Cargando detalles del incidente #{id}…</div>;
  }

  if (!incidente) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Incidente no encontrado</h2>
        <button className="btn btn-primary" onClick={() => navigate('/tecnico')} style={{ marginTop: '1rem' }}>
          ← Volver a la Consola
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <DashboardResponsiveStyles />

      {/* Header */}
      <nav className="dashboard-nav">
        <div className="dashboard-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🛠️</span>
          <div>
            <h1>Resolver Incidente #{incidente.id}</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Consola de Atención y Respuesta Técnica
            </span>
          </div>
        </div>
        <div className="dashboard-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-outline-header btn-sm"
            onClick={() => navigate('/tecnico')}
            title="Volver a la Consola"
          >
            ← Volver a la Consola
          </button>
          <NotificationBell />
          <span className="badge badge-tecnico" style={{ background: '#DBEAFE', color: '#022E5B' }}>Técnico</span>
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{user?.nombre}</span>
          <button
            className="btn btn-outline-header btn-sm"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-body" style={{ maxWidth: '960px' }}>
        {exitoMsg && <div className="alert alert-success">{exitoMsg}</div>}
        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        {/* Tarjeta de Resumen del Incidente */}
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--c-navy)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${incidente.estado}`}>{incidente.estado.replace('_', ' ')}</span>
              <span className={`badge badge-prioridad-${incidente.prioridad}`}>Prioridad {incidente.prioridad}</span>
              <span className="badge badge-cat">📁 {incidente.categoria?.nombre || 'General'}</span>
              {(incidente.interno || incidente.usuario?.interno) && (
                <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, border: '1px solid #bae6fd' }}>
                  ☎️ Int: {incidente.interno || incidente.usuario?.interno}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Registrado el {new Date(incidente.created_at).toLocaleString()}
            </span>
          </div>

          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Descripción del Problema reportado por el Usuario
            </span>
            <p style={{ color: '#0F172A', fontSize: '1rem', lineHeight: 1.5, whiteSpace: 'pre-line', margin: 0 }}>
              {incidente.descripcion}
            </p>
          </div>

          <div className="incident-meta" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <span>👤 Solicitante: <strong>{incidente.usuario?.nombre}</strong> ({incidente.usuario?.correo})</span>
            <span>📞 Contacto directo: <strong>Int. {incidente.interno || incidente.usuario?.interno || 'Sin registrar'}</strong></span>
          </div>
        </div>

        {/* Formulario Principal de Resolución */}
        <form onSubmit={handleResolver}>
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--c-navy)', marginBottom: '1rem', fontWeight: 800 }}>
              💡 Aplicar Solución al Incidente
            </h2>

            {/* Selector de Modo de Resolución */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${modoResolucion === 'CUSTOM' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoResolucion('CUSTOM')}
                style={{ flex: '1 1 220px' }}
              >
                ✍️ Redactar Solución (Editor TipTap)
              </button>
              <button
                type="button"
                className={`btn ${modoResolucion === 'RECETA' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setModoResolucion('RECETA')}
                style={{ flex: '1 1 220px' }}
              >
                📚 Seleccionar Receta Existente ({recetas.length})
              </button>
            </div>

            {/* MODO 1: Redacción con TipTap */}
            {modoResolucion === 'CUSTOM' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="res-titulo">Título de la Solución / Guía</label>
                    <input
                      id="res-titulo"
                      type="text"
                      value={tituloReceta}
                      onChange={(e) => setTituloReceta(e.target.value)}
                      placeholder="Ej. Configuración de puertos de red o reseteo de perfil"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="res-categoria">Categoría</label>
                    <select
                      id="res-categoria"
                      value={idCategoriaReceta}
                      onChange={(e) => setIdCategoriaReceta(e.target.value)}
                      required
                    >
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Procedimiento y Pasos de Solución (TipTap Rich Text)
                  </label>
                  <RichTextEditor
                    value={solucionHtml}
                    onChange={setSolucionHtml}
                    placeholder="Detalla los pasos realizados para solucionar el caso (puedes usar listas numeradas, negritas, bloques de comandos de terminal, etc.)..."
                    minHeight="260px"
                  />
                </div>

                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💾</span>
                  <span>
                    <strong>Auto-guardado:</strong> Esta solución quedará registrada en la Base de Conocimientos para que otros técnicos y usuarios puedan consultarla.
                  </span>
                </div>
              </div>
            )}

            {/* MODO 2: Seleccionar Receta Existente */}
            {modoResolucion === 'RECETA' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="🔍 Filtrar recetas por título o palabra clave..."
                    value={busquedaReceta}
                    onChange={(e) => setBusquedaReceta(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="res-receta-select">Seleccionar Guía / Receta</label>
                  <select
                    id="res-receta-select"
                    value={recetaSeleccionadaId}
                    onChange={(e) => setRecetaSeleccionadaId(e.target.value)}
                    required
                  >
                    {recetasFiltradas.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.titulo} (Categoría: {r.categoria?.nombre || 'General'} · Usos: {r.usos})
                      </option>
                    ))}
                  </select>
                </div>

                {recetaActual ? (
                  <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--c-navy)' }}>
                        {recetaActual.titulo}
                      </strong>
                      <span className="badge badge-cat">📁 {recetaActual.categoria?.nombre || 'General'}</span>
                    </div>
                    <span style={{ fontSize: '0.775rem', color: '#047857', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                      Procedimiento registrado en la receta:
                    </span>
                    <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <RichTextViewer content={recetaActual.solucion} />
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#64748B', fontSize: '0.9rem' }}>No se encontraron recetas con ese término de búsqueda.</p>
                )}
              </div>
            )}
          </div>

          {/* Barra de Acciones */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tecnico')}
              disabled={guardando}
            >
              ← Cancelar y Volver
            </button>

            <button
              id="btn-confirmar-resolver"
              type="submit"
              className="btn btn-success"
              disabled={guardando}
              style={{ minWidth: '220px', padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              {guardando ? 'Guardando Resolución…' : '✅ Confirmar y Resolver Incidente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
