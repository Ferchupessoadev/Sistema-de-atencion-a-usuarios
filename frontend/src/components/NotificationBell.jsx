import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import RichTextViewer from './RichTextViewer';

export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data.notificaciones);
      setNoLeidas(res.data.no_leidas);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    // Poll cada 15 segundos
    const interval = setInterval(cargarNotificaciones, 15000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarcarLeida = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notificaciones/${id}/leer`);
      cargarNotificaciones();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await api.post('/notificaciones/marcar-todas');
      cargarNotificaciones();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        id="btn-campana-notificaciones"
        onClick={() => setAbierto(!abierto)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.25rem',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Centro de Notificaciones"
      >
        🔔
        {noLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              borderRadius: '999px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
            }}
          >
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '40px',
            width: '320px',
            background: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
              Notificaciones {noLeidas > 0 && `(${noLeidas})`}
            </span>
            {noLeidas > 0 && (
              <button
                onClick={handleMarcarTodas}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {cargando && notificaciones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                Cargando…
              </div>
            ) : notificaciones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                No tienes notificaciones pendientes.
              </div>
            ) : (
              notificaciones.map((n) => {
                const data = n.data || {};
                const esNoLeida = !n.read_at;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f1f5f9',
                      background: esNoLeida ? '#eff6ff' : '#ffffff',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>
                      {data.tipo === 'ALERTA_CRITICA' ? '⚠️' : '📢'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem' }}>
                        {data.titulo || 'Notificación del sistema'}
                      </p>
                      <div style={{ fontSize: '0.775rem', color: '#475569', lineHeight: 1.3 }}>
                        <RichTextViewer content={data.mensaje || JSON.stringify(data)} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                        {data.fecha || new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                    {esNoLeida && (
                      <button
                        onClick={(e) => handleMarcarLeida(n.id, e)}
                        title="Marcar como leída"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4f46e5',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '2px',
                        }}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
