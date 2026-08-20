import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import RecetasManager from '../components/RecetasManager';

export default function DashboardTecnico() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState('INCIDENTES'); // 'INCIDENTES' | 'RECETAS' | 'ALERTAS'
  const [incidentes, setIncidentes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');

  // Modal Resolver (RN-002)
  const [modalResolver, setModalResolver] = useState(null); // incidente seleccionado
  const [tipoSolucion, setTipoSolucion] = useState('RECETA'); // 'RECETA' o 'TEXTO'
  const [recetaSeleccionada, setRecetaSeleccionada] = useState('');
  
  // Solución Personalizada (Lista Ordenada & Título)
  const [tituloReceta, setTituloReceta] = useState('');
  const [pasos, setPasos] = useState(['', '', '']);

  // Modal Derivar (RN-003)
  const [modalDerivar, setModalDerivar] = useState(null);
  const [unidadEspecializada, setUnidadEspecializada] = useState('');
  const [motivoDerivacion, setMotivoDerivacion] = useState('');

  // Mensajes y estados
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [exportando, setExportando] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resInc, resCat, resRec, resCriticas] = await Promise.all([
        api.get('/incidentes'),
        api.get('/categorias'),
        api.get('/recetas'),
        api.get('/alertas/criticas'),
      ]);
      setIncidentes(resInc.data);
      setCategorias(resCat.data);
      setRecetas(resRec.data);
      setAlertasCriticas(resCriticas.data.incidentes || []);
      if (resRec.data.length > 0 && !recetaSeleccionada) {
        setRecetaSeleccionada(resRec.data[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Exportar reporte de incidentes en CSV
  const handleExportarReporte = async () => {
    try {
      setExportando(true);
      const res = await api.get('/reportes/incidentes/exportar', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_incidentes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMensajeExito('Reporte de incidentes exportado correctamente a CSV / Excel.');
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      console.error('Error al exportar reporte:', err);
      setErrorAccion('Error al exportar el reporte de incidentes.');
    } finally {
      setExportando(false);
    }
  };

  // Manejo de pasos en solución personalizada
  const handleCambiarPaso = (index, valor) => {
    const nuevosPasos = [...pasos];
    nuevosPasos[index] = valor;
    setPasos(nuevosPasos);
  };

  const handleAgregarPaso = () => {
    setPasos([...pasos, '']);
  };

  const handleEliminarPaso = (index) => {
    if (pasos.length <= 1) return;
    const nuevosPasos = pasos.filter((_, i) => i !== index);
    setPasos(nuevosPasos);
  };

  // Abrir modal resolver
  const abrirModalResolver = (inc) => {
    setErrorAccion('');
    setModalResolver(inc);
    setTipoSolucion('RECETA');
    setTituloReceta(`Solución: ${inc.descripcion.substring(0, 45)}${inc.descripcion.length > 45 ? '...' : ''}`);
    setPasos(['', '', '']);
    if (recetas.length > 0) {
      setRecetaSeleccionada(recetas[0].id);
    }
  };

  // Tomar incidente (asignarse a sí mismo)
  const handleTomarIncidente = async (incidente) => {
    try {
      await api.put(`/incidentes/${incidente.id}`, {
        id_tecnico: user.id,
        estado: 'EN_CURSO',
      });
      setMensajeExito(`Te has asignado el incidente #${incidente.id}.`);
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'Error al tomar el incidente.');
    }
  };

  // Cambiar prioridad (RN-001)
  const handleCambiarPrioridad = async (incidente, nuevaPrioridad) => {
    try {
      await api.put(`/incidentes/${incidente.id}`, {
        prioridad: nuevaPrioridad,
      });
      setMensajeExito(`Prioridad del incidente #${incidente.id} actualizada a ${nuevaPrioridad}.`);
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'Error al cambiar la prioridad.');
    }
  };

  // Resolver incidente (RN-002 y guardado de receta)
  const handleResolverIncidente = async (e) => {
    e.preventDefault();
    setErrorAccion('');
    setGuardando(true);

    try {
      const payload = {
        estado: 'RESUELTO',
      };

      if (tipoSolucion === 'RECETA') {
        payload.id_receta = recetaSeleccionada;
      } else {
        const pasosValidos = pasos.map(p => p.trim()).filter(p => p.length > 0);
        if (pasosValidos.length === 0) {
          setErrorAccion('Debes ingresar al menos un paso para la solución.');
          setGuardando(false);
          return;
        }

        payload.titulo_receta = tituloReceta || `Solución para Incidente #${modalResolver.id}`;
        payload.solucion_texto = pasosValidos.map((p, i) => `${i + 1}. ${p}`).join('\n');
      }

      await api.put(`/incidentes/${modalResolver.id}`, payload);

      setMensajeExito(
        tipoSolucion === 'TEXTO'
          ? `¡Incidente #${modalResolver.id} resuelto y solución guardada como nueva Receta en la Base de Conocimientos!`
          : `¡Incidente #${modalResolver.id} marcado como RESUELTO!`
      );

      setModalResolver(null);
      setPasos(['', '', '']);
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 5000);
    } catch (err) {
      const msg = err.response?.data?.errors?.resolucion?.[0]
               || err.response?.data?.message
               || 'Error al resolver el incidente.';
      setErrorAccion(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Derivar incidente (RN-003)
  const handleDerivarIncidente = async (e) => {
    e.preventDefault();
    setErrorAccion('');
    setGuardando(true);

    try {
      const res = await api.put(`/incidentes/${modalDerivar.id}/derivar`, {
        unidad_especializada: unidadEspecializada || 'Área Técnica Especializada',
        motivo: motivoDerivacion,
      });

      setMensajeExito(`Incidente #${modalDerivar.id} derivado correctamente. Notificación enviada a ${res.data.notificacion.destinatario} (RN-003).`);
      setModalDerivar(null);
      setMotivoDerivacion('');
      setUnidadEspecializada('');
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 5000);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'Error al derivar el incidente.');
    } finally {
      setGuardando(false);
    }
  };

  // Estadísticas
  const totalAbiertos  = incidentes.filter(i => i.estado === 'ABIERTO').length;
  const totalEnCurso   = incidentes.filter(i => i.estado === 'EN_CURSO').length;
  const totalResueltos = incidentes.filter(i => i.estado === 'RESUELTO').length;
  const totalAlta      = incidentes.filter(i => i.prioridad === 'ALTA' && i.estado !== 'RESUELTO').length;

  // Filtrado
  const incidentesFiltrados = incidentes.filter(i => {
    if (filtroEstado !== 'TODOS' && i.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'TODAS' && i.prioridad !== filtroPrioridad) return false;
    if (filtroCategoria !== 'TODAS' && String(i.id_categoria) !== String(filtroCategoria)) return false;
    return true;
  });

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🛠️</span>
          <div>
            <h1>Sistema de Soluciones</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Consola Técnica de Gestión {user?.interno && `· Int. ${user.interno}`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationBell />
          <span className="badge badge-tecnico" style={{ background: '#DBEAFE', color: '#022E5B' }}>Técnico</span>
          <span style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>{user?.nombre}</span>
          <button
            id="btn-logout-tecnico"
            className="btn btn-outline-header btn-sm"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* Banner de Alerta Crítica RN-004 si hay casos vencidos > 2h */}
        {alertasCriticas.length > 0 && (
          <div
            className="alert alert-error"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={() => setSeccionActiva('ALERTAS')}
          >
            <div>
              🚨 <strong>Alerta RN-004:</strong> Hay {alertasCriticas.length} incidente(s) de ALTA prioridad con más de 2 horas sin resolver.
            </div>
            <span style={{ textDecoration: 'underline', fontSize: '0.8rem' }}>Ver Alertas &gt;</span>
          </div>
        )}

        {/* Pestañas de Navegación del Panel Técnico */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${seccionActiva === 'INCIDENTES' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSeccionActiva('INCIDENTES')}
            >
              🛠️ Incidentes del Sistema ({incidentes.length})
            </button>
            <button
              className={`btn ${seccionActiva === 'RECETAS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSeccionActiva('RECETAS')}
            >
              📚 Base de Conocimientos ({recetas.length})
            </button>
            <button
              className={`btn ${seccionActiva === 'ALERTAS' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
              onClick={() => setSeccionActiva('ALERTAS')}
            >
              ⚠️ Alertas Críticas RN-004 {alertasCriticas.length > 0 && `(${alertasCriticas.length})`}
            </button>
          </div>

          <button
            id="btn-exportar-csv"
            className="btn btn-secondary btn-sm"
            onClick={handleExportarReporte}
            disabled={exportando}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
            title="Descargar historial de incidentes y tiempos de atención en formato CSV / Excel"
          >
            {exportando ? 'Generando CSV…' : '📥 Exportar Incidentes (CSV)'}
          </button>
        </div>

        {seccionActiva === 'RECETAS' ? (
          <RecetasManager />
        ) : seccionActiva === 'ALERTAS' ? (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #ef4444' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                🚨 Monitor de Alertas Críticas (Regla de Negocio RN-004)
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Incidentes de <strong>Prioridad ALTA</strong> que han superado el umbral de <strong>2 horas</strong> sin haber sido marcados como RESUELTOS.
              </p>
            </div>

            {alertasCriticas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#047857', background: '#f0fdf4' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>✅ Excelente: No hay incidentes críticos vencidos.</p>
                <p style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '0.25rem' }}>
                  Todos los casos de alta prioridad están siendo atendidos dentro del SLA de 2 horas.
                </p>
              </div>
            ) : (
              alertasCriticas.map(inc => (
                <div key={inc.id} className="incident-card" style={{ borderLeft: '4px solid #ef4444' }}>
                  <div className="incident-header">
                    <div className="incident-badges">
                      <span className="badge badge-prioridad-ALTA">⚠️ ALTA PRIORIDAD VENCIDA</span>
                      <span className={`badge badge-${inc.estado}`}>{inc.estado}</span>
                      <span className="badge badge-cat">📁 {inc.categoria?.nombre}</span>
                      {(inc.interno || inc.usuario?.interno) && (
                        <span style={{ fontSize: '0.75rem', background: '#fef2f2', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca' }}>
                          ☎️ Int: {inc.interno || inc.usuario?.interno}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700 }}>
                      Abierto hace {Math.round((new Date() - new Date(inc.created_at)) / (1000 * 60 * 60))} horas
                    </span>
                  </div>

                  <p style={{ color: '#1e293b', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {inc.descripcion}
                  </p>

                  <div className="incident-meta">
                    <span>👤 Afectado: <strong>{inc.usuario?.nombre}</strong> ({inc.usuario?.correo})</span>
                    <span>☎️ Contacto: <strong>Int. {inc.interno || inc.usuario?.interno || 'S/D'}</strong></span>
                    <span>🛠️ Responsable: <strong>{inc.tecnico ? inc.tecnico.nombre : '⚠️ Sin asignar'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => {
                        setSeccionActiva('INCIDENTES');
                        abrirModalResolver(inc);
                      }}
                    >
                      ✅ Resolver Caso Urgente
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}
            {errorAccion && !modalResolver && !modalDerivar && <div className="alert alert-error">{errorAccion}</div>}

            {/* Métricas rápidas */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{incidentes.length}</div>
                <div className="stat-label">Total Sistema</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#b45309' }}>{totalAbiertos}</div>
                <div className="stat-label">Sin Asignar / Abiertos</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#1d4ed8' }}>{totalEnCurso}</div>
                <div className="stat-label">En Atención</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#b91c1c' }}>{totalAlta}</div>
                <div className="stat-label">Prioridad Alta Activos</div>
              </div>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#047857' }}>{totalResueltos}</div>
                <div className="stat-label">Resueltos</div>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="ABIERTO">ABIERTO</option>
                    <option value="EN_CURSO">EN CURSO</option>
                    <option value="RESUELTO">RESUELTO</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 160px' }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Prioridad (RN-001)</label>
                  <select
                    value={filtroPrioridad}
                    onChange={(e) => setFiltroPrioridad(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  >
                    <option value="TODAS">Todas las Prioridades</option>
                    <option value="ALTA">ALTA</option>
                    <option value="MEDIA">MEDIA</option>
                    <option value="BAJA">BAJA</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  >
                    <option value="TODAS">Todas las Categorías</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de incidentes */}
            {loading ? (
              <div className="spinner">Cargando consola técnica…</div>
            ) : incidentesFiltrados.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron incidentes con los filtros seleccionados</p>
              </div>
            ) : (
              <div>
                {incidentesFiltrados.map(inc => (
                  <div key={inc.id} className="incident-card">
                    <div className="incident-header">
                      <div className="incident-badges">
                        <span className={`badge badge-${inc.estado}`}>{inc.estado.replace('_', ' ')}</span>
                        <span className={`badge badge-prioridad-${inc.prioridad}`}>Prioridad {inc.prioridad}</span>
                        <span className="badge badge-cat">📁 {inc.categoria?.nombre || 'General'}</span>
                        {(inc.interno || inc.usuario?.interno) && (
                          <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, border: '1px solid #bae6fd' }}>
                            ☎️ Int: {inc.interno || inc.usuario?.interno}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        #{inc.id} · {new Date(inc.created_at).toLocaleDateString()} {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                      {inc.descripcion}
                    </p>

                    {inc.receta && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#166534' }}>💡 Solución aplicada (Receta #{inc.receta.id}):</strong> {inc.receta.titulo}
                        <div style={{ marginTop: '0.35rem', color: '#334155', whiteSpace: 'pre-line', lineHeight: 1.5, background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          {inc.receta.solucion}
                        </div>
                      </div>
                    )}

                    <div className="incident-meta">
                      <span>👤 Usuario: <strong>{inc.usuario?.nombre}</strong> ({inc.usuario?.correo})</span>
                      <span>☎️ Interno: <strong>{inc.interno || inc.usuario?.interno || 'Sin registrar'}</strong></span>
                      <span>
                        🛠️ Técnico: <strong>{inc.tecnico ? inc.tecnico.nombre : 'Sin asignar'}</strong>
                        {inc.tecnico?.id === user.id && <span style={{ color: '#4f46e5', marginLeft: '4px' }}>(Tú)</span>}
                      </span>
                      {inc.resolucion && (
                        <span style={{ color: '#047857' }}>
                          ✅ Resuelto el: {new Date(inc.resolucion).toLocaleDateString()} {new Date(inc.resolucion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Acciones del técnico */}
                    {inc.estado !== 'RESUELTO' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {inc.tecnico?.id !== user.id && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTomarIncidente(inc)}
                          >
                            ✋ Tomar Caso
                          </button>
                        )}

                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => abrirModalResolver(inc)}
                        >
                          ✅ Resolver (RN-002)
                        </button>

                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => {
                            setErrorAccion('');
                            setModalDerivar(inc);
                          }}
                        >
                          ↗️ Derivar (RN-003)
                        </button>

                        {/* Selector rápido de prioridad (RN-001) */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Prioridad:</span>
                          {['BAJA', 'MEDIA', 'ALTA'].map(p => (
                            <button
                              key={p}
                              disabled={inc.prioridad === p}
                              className={`btn btn-sm ${inc.prioridad === p ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleCambiarPrioridad(inc, p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Resolver Incidente (RN-002) */}
        {modalResolver && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#022E5B', fontWeight: 800 }}>Resolver Incidente #{modalResolver.id}</h2>
                <button
                  onClick={() => setModalResolver(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              </div>

              <div className="alert alert-info" style={{ fontSize: '0.825rem', marginBottom: '1.25rem' }}>
                ℹ️ <strong>Regla de Negocio RN-002:</strong> Puedes seleccionar una receta existente de la base de conocimientos o redactar una solución personalizada que se <strong>guardará automáticamente como nueva receta</strong> para futuros casos.
              </div>

              {errorAccion && <div className="alert alert-error">{errorAccion}</div>}

              <form onSubmit={handleResolverIncidente}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ marginBottom: '0.5rem' }}>Tipo de Solución</label>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                      <input
                        type="radio"
                        name="tipoSolucion"
                        value="RECETA"
                        checked={tipoSolucion === 'RECETA'}
                        onChange={() => setTipoSolucion('RECETA')}
                        style={{ width: 'auto' }}
                      />
                      📚 Usar Receta Existente
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                      <input
                        type="radio"
                        name="tipoSolucion"
                        value="TEXTO"
                        checked={tipoSolucion === 'TEXTO'}
                        onChange={() => setTipoSolucion('TEXTO')}
                        style={{ width: 'auto' }}
                      />
                      ✨ Solución Personalizada (Nueva Receta)
                    </label>
                  </div>
                </div>

                {tipoSolucion === 'RECETA' ? (
                  <div className="form-group">
                    <label htmlFor="modal-receta">Seleccionar Guía / Receta</label>
                    <select
                      id="modal-receta"
                      value={recetaSeleccionada}
                      onChange={(e) => setRecetaSeleccionada(e.target.value)}
                      required
                    >
                      {recetas.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.titulo} (Usos: {r.usos} · {r.categoria?.nombre})
                        </option>
                      ))}
                    </select>
                    {recetas.find(r => String(r.id) === String(recetaSeleccionada)) && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.825rem', color: '#334155', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        <strong style={{ color: '#047857' }}>Procedimiento a aplicar:</strong>
                        <div style={{ marginTop: '0.25rem' }}>
                          {recetas.find(r => String(r.id) === String(recetaSeleccionada)).solucion}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    {/* Título de la Solución */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="modal-titulo-receta" style={{ color: '#1e293b' }}>
                        Título de la Nueva Receta / Solución
                      </label>
                      <input
                        id="modal-titulo-receta"
                        type="text"
                        value={tituloReceta}
                        onChange={(e) => setTituloReceta(e.target.value)}
                        placeholder="Ej. Configuración de puertos y VLAN para switch HP"
                        required
                      />
                    </div>

                    {/* Lista Ordenada de Pasos */}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
                        <span>Pasos de la Solución (Lista Ordenada)</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                          {pasos.filter(p => p.trim()).length} paso(s) definidos
                        </span>
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {pasos.map((paso, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#022E5B',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={paso}
                              onChange={(e) => handleCambiarPaso(index, e.target.value)}
                              placeholder={`Paso ${index + 1}: Detalle de la acción realizada...`}
                              required={index === 0}
                              style={{ flex: 1 }}
                            />
                            {pasos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleEliminarPaso(index)}
                                title="Eliminar este paso"
                                style={{
                                  background: '#fee2e2',
                                  border: 'none',
                                  color: '#dc2626',
                                  borderRadius: '6px',
                                  width: '28px',
                                  height: '28px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAgregarPaso}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.75rem', width: '100%' }}
                      >
                        ➕ Agregar Siguiente Paso
                      </button>
                    </div>

                    <div style={{ fontSize: '0.775rem', color: '#047857', background: '#ecfdf5', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                      💾 <strong>Auto-guardado:</strong> Esta solución quedará registrada en la Base de Conocimientos con 1 uso y podrá ser seleccionada en futuros incidentes de la categoría <strong>{modalResolver.categoria?.nombre || 'General'}</strong>.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setModalResolver(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando…' : 'Confirmar Resolución'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Derivar Incidente (RN-003) */}
        {modalDerivar && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#022E5B', fontWeight: 800 }}>Derivar Incidente #{modalDerivar.id}</h2>
                <button
                  onClick={() => setModalDerivar(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              </div>

              <div className="alert alert-info" style={{ fontSize: '0.825rem' }}>
                ℹ️ <strong>Regla de Negocio RN-003:</strong> Al derivar el incidente se registrará el motivo y se enviará una notificación automática al usuario ({modalDerivar.usuario?.correo}).
              </div>

              {errorAccion && <div className="alert alert-error">{errorAccion}</div>}

              <form onSubmit={handleDerivarIncidente}>
                <div className="form-group">
                  <label htmlFor="modal-unidad">Unidad o Área Especializada de Destino</label>
                  <input
                    id="modal-unidad"
                    type="text"
                    value={unidadEspecializada}
                    onChange={(e) => setUnidadEspecializada(e.target.value)}
                    placeholder="Ej. Redes y Comunicaciones, Sistemas ERP K2B, Infraestructura"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-motivo">Motivo de la Derivación</label>
                  <textarea
                    id="modal-motivo"
                    rows="3"
                    value={motivoDerivacion}
                    onChange={(e) => setMotivoDerivacion(e.target.value)}
                    placeholder="Justificación técnica por la cual se transfiere el caso a otra área..."
                    required
                    minLength={5}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setModalDerivar(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    style={{ flex: 1 }}
                    disabled={guardando}
                  >
                    {guardando ? 'Derivando…' : 'Confirmar Derivación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
