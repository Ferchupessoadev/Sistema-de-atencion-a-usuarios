import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';
import RecetasManager from '../components/RecetasManager';
import DashboardResponsiveStyles from '../components/DashboardResponsiveStyles';
import RichTextEditor from '../components/RichTextEditor';
import RichTextViewer from '../components/RichTextViewer';
import SearchableSelect from '../components/SearchableSelect';

export default function DashboardTecnico() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Áreas predefinidas para derivación
  const AREAS_DERIVACION = [
    { value: 'AICO - Atención a Usuarios', label: 'AICO - Atención a Usuarios', sublabel: 'Mesa de ayuda y soporte de primer nivel' },
    { value: 'Redes e Internet', label: 'Redes e Internet', sublabel: 'Conectividad, switches, cableado estructurado, VPN' },
    { value: 'WIFI y Conectividad', label: 'WIFI y Conectividad', sublabel: 'Access points, cobertura inalámbrica, autenticación' },
    { value: 'Telefonía e Internos', label: 'Telefonía e Internos', sublabel: 'Centrales telefónicas, internos, VoIP' },
    { value: 'K2B y Sistemas ERP', label: 'K2B y Sistemas ERP', sublabel: 'Módulos K2B, GeneXus, sistemas de gestión' },
    { value: 'Software y Aplicaciones', label: 'Software y Aplicaciones', sublabel: 'Instalación, licencias, actualizaciones de software' },
    { value: 'Computadora y Hardware', label: 'Computadora y Hardware', sublabel: 'PCs, notebooks, monitores, periféricos' },
    { value: 'Impresoras y Fotocopiadoras', label: 'Impresoras y Fotocopiadoras', sublabel: 'Impresoras de red, tóner, escaneo, fotocopiadoras' },
    { value: 'Accesos y Seguridad', label: 'Accesos y Seguridad', sublabel: 'Cuentas de usuario, permisos, Active Directory, firewall' },
    { value: 'Infraestructura y Servidores', label: 'Infraestructura y Servidores', sublabel: 'Servidores físicos y virtuales, datacenter, backups' },
    { value: 'Desarrollo y Sistemas', label: 'Desarrollo y Sistemas', sublabel: 'Desarrollo de software interno, APIs, bases de datos' },
    { value: 'Soporte Externo / Proveedores', label: 'Soporte Externo / Proveedores', sublabel: 'Escalado a proveedores externos y garantías' },
  ];

  const [seccionActiva, setSeccionActiva] = useState('INCIDENTES'); // 'INCIDENTES' | 'RECETAS' | 'ALERTAS' | 'USUARIOS'

  // Panel de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [incidentes, setIncidentes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [alertasCriticas, setAlertasCriticas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');

  // Modal Derivar
  const [modalDerivar, setModalDerivar] = useState(null);
  const [unidadEspecializada, setUnidadEspecializada] = useState('');
  const [motivoDerivacion, setMotivoDerivacion] = useState('');

  // Modal Nuevo Incidente (Técnico)
  const [modalNuevoIncidente, setModalNuevoIncidente] = useState(false);
  const [nuevoIncCategoria, setNuevoIncCategoria] = useState('');
  const [nuevoIncPrioridad, setNuevoIncPrioridad] = useState('MEDIA');
  const [nuevoIncInterno, setNuevoIncInterno] = useState('');
  const [nuevoIncDescripcion, setNuevoIncDescripcion] = useState('');
  const [nuevoIncUsuarioId, setNuevoIncUsuarioId] = useState('');
  const [errorNuevoInc, setErrorNuevoInc] = useState('');

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

  const handleTomarIncidente = async (incidente) => {
    try {
      await api.put(`/incidentes/${incidente.id}`, {
        id_tecnico: user.id,
        estado: 'EN_CURSO',
      });
      setMensajeExito(`Te has asignado el incidente #${incidente.id}.`);
      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'Error al tomar el incidente.');
    }
  };

  const handleCambiarPrioridad = async (incidente, nuevaPrioridad) => {
    try {
      await api.put(`/incidentes/${incidente.id}`, { prioridad: nuevaPrioridad });
      setMensajeExito(`Prioridad del incidente #${incidente.id} actualizada a ${nuevaPrioridad}.`);
      await cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      setErrorAccion(err.response?.data?.message || 'Error al cambiar la prioridad.');
    }
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

  // Derivar incidente
  const handleDerivarIncidente = async (e) => {
    e.preventDefault();
    setErrorAccion('');

    const motivoLimpio = motivoDerivacion.replace(/<[^>]*>/g, '').trim();
    if (!motivoDerivacion || motivoLimpio.length < 5) {
      setErrorAccion('Por favor ingresa un motivo de derivación detallado (mínimo 5 caracteres).');
      return;
    }

    setGuardando(true);

    try {
      const res = await api.put(`/incidentes/${modalDerivar.id}/derivar`, {
        unidad_especializada: unidadEspecializada || 'Área Técnica Especializada',
        motivo: motivoDerivacion,
      });

      setMensajeExito(`Incidente #${modalDerivar.id} derivado correctamente. Notificación enviada a ${res.data.notificacion?.destinatario || 'usuario'}.`);
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

  // Crear incidente desde consola técnica
  const handleCrearIncidenteTecnico = async (e) => {
    e.preventDefault();
    setErrorNuevoInc('');

    const textoLimpio = nuevoIncDescripcion.replace(/<[^>]*>/g, '').trim();
    if (!nuevoIncDescripcion || textoLimpio.length < 5) {
      setErrorNuevoInc('Por favor escribe una descripción del problema (mínimo 5 caracteres).');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id_categoria: nuevoIncCategoria || (categorias[0]?.id ?? ''),
        descripcion: nuevoIncDescripcion,
        prioridad: nuevoIncPrioridad,
        interno: nuevoIncInterno || null,
      };
      if (nuevoIncUsuarioId) {
        payload.id_usuario = nuevoIncUsuarioId;
      }

      await api.post('/incidentes', payload);

      setMensajeExito('¡Incidente registrado exitosamente en el sistema!');
      setModalNuevoIncidente(false);
      setNuevoIncDescripcion('');
      setNuevoIncInterno('');
      setNuevoIncUsuarioId('');
      cargarDatos();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.errors?.id_usuario?.[0]
        || err.response?.data?.errors?.descripcion?.[0]
        || err.response?.data?.message
        || 'Error al registrar el incidente.';
      setErrorNuevoInc(msg);
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
      <DashboardResponsiveStyles />
      <nav className="dashboard-nav">
        <div className="dashboard-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🛠️</span>
          <div>
            <h1>Sistema de Soluciones</h1>
            <span style={{ fontSize: '0.725rem', color: '#93C5FD', letterSpacing: '0.04em', fontWeight: 600 }}>
              Consola Técnica de Gestión {user?.interno && `· Int. ${user.interno}`}
            </span>
          </div>
        </div>
        <div className="dashboard-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            id="btn-mi-perfil-tecnico"
            className="btn btn-outline-header btn-sm"
            onClick={() => navigate('/perfil')}
            title="Mi Perfil"
          >
            👤 Mi Perfil
          </button>
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
            className="dashboard-alert alert alert-error"
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
              🚨 <strong>Atención:</strong> Hay {alertasCriticas.length} incidente(s) de ALTA prioridad con más de 2 horas sin resolver.
            </div>
            <span style={{ textDecoration: 'underline', fontSize: '0.8rem' }}>Ver Alertas &gt;</span>
          </div>
        )}

        {/* Pestañas de Navegación del Panel Técnico */}
        <div className="dashboard-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="dashboard-tabs-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              ⚠️ Incidentes Críticos {alertasCriticas.length > 0 && `(${alertasCriticas.length})`}
            </button>
            <button
              className={`btn ${seccionActiva === 'USUARIOS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => {
                setSeccionActiva('USUARIOS');
                if (usuarios.length === 0) {
                  api.get('/users').then(res => setUsuarios(res.data)).catch(() => {});
                }
              }}
            >
              👥 Usuarios
            </button>
          </div>

          <div className="dashboard-tabs-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              id="btn-tecnico-nuevo-incidente"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setErrorNuevoInc('');
                if (categorias.length > 0 && !nuevoIncCategoria) {
                  setNuevoIncCategoria(categorias[0].id);
                }
                if (usuarios.length === 0) {
                  api.get('/users').then(res => setUsuarios(res.data)).catch(() => {});
                }
                setModalNuevoIncidente(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              title="Registrar un nuevo incidente en la Mesa de Ayuda"
            >
              ➕ Registrar Incidente
            </button>
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
        </div>

        {seccionActiva === 'RECETAS' ? (
          <RecetasManager />
        ) : seccionActiva === 'USUARIOS' ? (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--c-navy)', marginBottom: '0.25rem' }}>
                👥 Usuarios Registrados ({usuarios.length})
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                Listado de todos los usuarios del sistema.
              </p>
              <input
                type="text"
                placeholder="Buscar por nombre o correo…"
                value={busquedaUsuario}
                onChange={e => setBusquedaUsuario(e.target.value)}
                style={{ maxWidth: '400px' }}
              />
            </div>

            <div className="user-cards-grid">
              {usuarios
                .filter(u => {
                  if (!busquedaUsuario.trim()) return true;
                  const q = busquedaUsuario.toLowerCase();
                  return u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
                })
                .map(u => (
                  <div key={u.id} className="user-card card">
                    <div className="user-card-avatar">
                      {u.nombre ? u.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                    </div>
                    <div className="user-card-info">
                      <h3 className="user-card-name">{u.nombre}</h3>
                      <p className="user-card-email">📧 {u.correo}</p>
                      {u.interno && <p className="user-card-interno">📞 Int. {u.interno}</p>}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {u.roles?.map(r => (
                          <span key={r} className={`badge ${r === 'tecnico' ? 'badge-tecnico' : r === 'representante_de_area' ? 'badge-tecnico' : 'badge-usuario'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                      <p className="user-card-date">
                        Registrado: {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {usuarios.length === 0 && (
              <div className="portal-empty">
                <div className="portal-empty-icon">👥</div>
                <h3 className="portal-empty-title">Sin usuarios</h3>
                <p className="portal-empty-text">No se encontraron usuarios registrados.</p>
              </div>
            )}
          </div>
        ) : seccionActiva === 'ALERTAS' ? (
          <div>
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #ef4444' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#991b1b', marginBottom: '0.25rem' }}>
                🚨 Monitor de Incidentes Críticos
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Incidentes de <strong>Prioridad ALTA</strong> pendientes de resolución hace más de 2 horas.
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

                  <div style={{ color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <RichTextViewer content={inc.descripcion} />
                  </div>

                  <div className="incident-meta">
                    <span>👤 Afectado: <strong>{inc.usuario?.nombre}</strong> ({inc.usuario?.correo})</span>
                    <span>☎️ Contacto: <strong>Int. {inc.interno || inc.usuario?.interno || 'S/D'}</strong></span>
                    <span>🛠️ Responsable: <strong>{inc.tecnico ? inc.tecnico.nombre : '⚠️ Sin asignar'}</strong></span>
                  </div>

                  <div className="dashboard-action-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {!inc.tecnico && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTomarIncidente(inc)}
                      >
                        ✋ Tomar Caso
                      </button>
                    )}
                    {inc.tecnico?.id === user.id && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => navigate(`/tecnico/incidentes/${inc.id}/resolver`)}
                      >
                        ✅ Resolver Caso Urgente
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}
            {errorAccion && !modalDerivar && <div className="alert alert-error">{errorAccion}</div>}

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
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Prioridad</label>
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

                    <div style={{ color: '#1e293b', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                      <RichTextViewer content={inc.descripcion} />
                    </div>

                    {inc.receta && (
                      <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#166534' }}>💡 Solución aplicada (Receta #{inc.receta.id}):</strong> {inc.receta.titulo}
                        <div style={{ marginTop: '0.35rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <RichTextViewer content={inc.receta.solucion} />
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
                      <div className="dashboard-action-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {!inc.tecnico && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleTomarIncidente(inc)}
                          >
                            ✋ Tomar Caso
                          </button>
                        )}

                        {inc.tecnico?.id === user.id && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => navigate(`/tecnico/incidentes/${inc.id}/resolver`)}
                          >
                            ✅ Resolver
                          </button>
                        )}

                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => {
                            setErrorAccion('');
                            setModalDerivar(inc);
                          }}
                        >
                          ↗️ Derivar
                        </button>

                        {/* Selector rápido de prioridad */}
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

        {/* Modal Derivar Incidente con TipTap */}
        {modalDerivar && (
          <div className="modal-overlay">
            <div className="modal-content modal-lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>↗️</span>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--c-navy)', fontWeight: 800, margin: 0 }}>
                      Derivar Incidente #{modalDerivar.id}
                    </h2>
                    <span style={{ fontSize: '0.785rem', color: '#64748B' }}>
                      Transferencia técnica a unidad especializada con notificación automática al usuario
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDerivar(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {errorAccion && <div className="alert alert-error">{errorAccion}</div>}

              {/* Resumen del Incidente */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: '#475569' }}>
                    👤 Solicitante: <strong>{modalDerivar.usuario?.nombre}</strong> ({modalDerivar.usuario?.correo})
                  </span>
                  <span className={`badge badge-prioridad-${modalDerivar.prioridad}`}>
                    Prioridad {modalDerivar.prioridad}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#1E293B', marginTop: '0.35rem' }}>
                  <RichTextViewer content={modalDerivar.descripcion} />
                </div>
              </div>

              <form onSubmit={handleDerivarIncidente}>
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label htmlFor="modal-unidad" style={{ fontWeight: 600, color: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span>Unidad o Área Especializada de Destino <span style={{ color: '#EF4444' }}>*</span></span>
                    <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 400 }}>Escribe para buscar o selecciona</span>
                  </label>
                  <SearchableSelect
                    inputId="modal-unidad"
                    options={AREAS_DERIVACION}
                    value={unidadEspecializada}
                    onChange={setUnidadEspecializada}
                    allowFreeText={true}
                    onTextChange={setUnidadEspecializada}
                    placeholder="Escribe el nombre del área (ej. Redes, K2B, Telefonía...)"
                    emptyMessage="No hay áreas coincidentes. Puedes escribir el nombre manualmente."
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 600, color: '#1E293B' }}>
                    <span>Motivo y Justificación Técnica de la Derivación <span style={{ color: '#EF4444' }}>*</span></span>
                    <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 400 }}>Editor con formato enriquecido</span>
                  </label>
                  <RichTextEditor
                    value={motivoDerivacion}
                    onChange={setMotivoDerivacion}
                    placeholder="Detalla las razones técnicas del traspaso, diagnóstico preliminar y notas para el área receptora..."
                    minHeight="160px"
                  />
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setModalDerivar(null)}
                    disabled={guardando}
                  >
                    ← Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    style={{ flex: 1.5, padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
                    disabled={guardando}
                  >
                    {guardando ? 'Derivando…' : '↗️ Confirmar Derivación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Registrar Nuevo Incidente desde Consola Técnica */}
        {modalNuevoIncidente && (
          <div className="modal-overlay">
            <div className="modal-content modal-lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>🎫</span>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--c-navy)', fontWeight: 800, margin: 0 }}>
                      Registrar Incidente en Mesa de Ayuda
                    </h2>
                    <span style={{ fontSize: '0.785rem', color: '#64748B' }}>
                      Carga de incidente técnico con asignación directa de categoría y nivel de prioridad
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNuevoIncidente(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94A3B8' }}
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              {errorNuevoInc && <div className="alert alert-error">{errorNuevoInc}</div>}

              <form onSubmit={handleCrearIncidenteTecnico}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="tec-modal-cat" style={{ fontWeight: 600, color: '#1E293B' }}>
                      Categoría <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      id="tec-modal-cat"
                      value={nuevoIncCategoria}
                      onChange={(e) => setNuevoIncCategoria(e.target.value)}
                      required
                    >
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="tec-modal-prioridad" style={{ fontWeight: 600, color: '#1E293B' }}>
                      Prioridad Inicial <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      id="tec-modal-prioridad"
                      value={nuevoIncPrioridad}
                      onChange={(e) => setNuevoIncPrioridad(e.target.value)}
                      required
                    >
                      <option value="BAJA">BAJA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="ALTA">ALTA (Crítica)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="tec-modal-usuario" style={{ fontWeight: 600, color: '#1E293B' }}>
                      Usuario Solicitante / Afectado (Opcional)
                    </label>
                    <select
                      id="tec-modal-usuario"
                      value={nuevoIncUsuarioId}
                      onChange={(e) => setNuevoIncUsuarioId(e.target.value)}
                    >
                      <option value="">A mi nombre ({user?.nombre})</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.correo}) {u.interno ? `· Int. ${u.interno}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="tec-modal-interno" style={{ fontWeight: 600, color: '#1E293B' }}>
                      Interno de Contacto
                    </label>
                    <input
                      id="tec-modal-interno"
                      type="text"
                      value={nuevoIncInterno}
                      onChange={(e) => setNuevoIncInterno(e.target.value)}
                      placeholder="Ej. 3105, 3777..."
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 600, color: '#1E293B' }}>
                    <span>Descripción Detallada del Incidente <span style={{ color: '#EF4444' }}>*</span></span>
                    <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 400 }}>Editor con formato enriquecido</span>
                  </label>
                  <RichTextEditor
                    value={nuevoIncDescripcion}
                    onChange={setNuevoIncDescripcion}
                    placeholder="Describe detalladamente el incidente técnico (síntomas, equipos involucrados, mensajes de error en pantalla, etc.)..."
                    minHeight="200px"
                  />
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setModalNuevoIncidente(false)}
                    disabled={guardando}
                  >
                    ← Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1.5, padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
                    disabled={guardando}
                  >
                    {guardando ? 'Guardando Incidente…' : '✅ Registrar Incidente'}
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
