import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import './DashboardNavbar.css';

export const DashboardNavbar = ({
    role = 'usuario', // 'tecnico', 'usuario' o 'administrador'
    user,
    onLogout,
    // Props opcionales para personalizar el header en sub-páginas
    title,        // Título personalizado (ej: "Mi Perfil", "Resolver Incidente #5")
    subtitle,     // Subtítulo personalizado
    icon,         // Ícono personalizado (emoji)
    backButton,   // { label: '← Volver', to: '/tecnico' } o null
    extraActions, // Elementos React extra para poner antes del dropdown
}) => {
    const navigate = useNavigate();
    const isTecnico = role === 'tecnico';
    
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const config = {
        icon: icon || (isTecnico ? '🛠️' : '🎫'),
        title: title || 'Sistema de Soluciones',
        subtitle: subtitle || (isTecnico ? 'Consola Técnica de Gestión' : 'Portal de Usuario'),
        badgeText: isTecnico ? 'Técnico' : 'Usuario',
        badgeStyle: isTecnico
            ? { background: '#DBEAFE', color: '#022E5B' }
            : { background: '#CCFBF1', color: '#0F766E' }
    };

    // Cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="dashboard-nav">
            {/* Brand / Logo */}
            <div className="dashboard-nav-brand">
                <span className="dashboard-nav-icon">{config.icon}</span>
                <div>
                    <h1>{config.title}</h1>
                    <span className="dashboard-nav-subtitle">
                        {config.subtitle} {user?.interno && `· Int. ${user.interno}`}
                    </span>
                </div>
            </div>

            {/* Actions / Right side */}
            <div className="dashboard-nav-actions">

                {/* Botón "Volver" personalizado (para sub-páginas) */}
                {backButton && (
                    <button
                        className="btn btn-outline-header btn-sm"
                        onClick={backButton.onClick || (() => navigate(backButton.to))}
                        title={backButton.label}
                    >
                        {backButton.label}
                    </button>
                )}
                
                {/* Botón extra solo para el usuario común (en dashboards principales) */}
                {!backButton && !isTecnico && (
                    <button
                        id="btn-portal-publico"
                        className="btn btn-outline-header btn-sm"
                        onClick={() => navigate('/')}
                        title="Volver al Portal Público"
                    >
                        🏠 Portal
                    </button>
                )}

                {/* Acciones extra inyectadas por la página */}
                {extraActions}

                {/* Campana de Notificaciones */}
                <NotificationBell />


                {/* Menú Desplegable de Usuario (Estilo Facebook) */}
                <div className="user-dropdown-container" ref={dropdownRef}>
                    <div 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="user-menu-trigger"
                    >
                        <div className="user-avatar">
                            {user?.foto_url ? (
                                <img src={user.foto_url} alt={user.nombre} className="navbar-avatar-img" />
                            ) : (
                                <span className="navbar-avatar-initials">
                                    {user?.nombre ? user.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                                </span>
                            )}
                        </div>
                        <span className="user-name">
                            {user?.nombre} <span className="dropdown-arrow">▾</span>
                        </span>
                    </div>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="user-dropdown-menu">
                            <div className="user-dropdown-header">
                                <p className="user-dropdown-title" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {user?.nombre} 
                                    <span className={`badge ${isTecnico ? 'badge-tecnico' : 'badge-usuario'}`} style={{...config.badgeStyle, width: 'max-content'}}>
                                        {config.badgeText}
                                    </span>
                                </p>
                                <p className="user-dropdown-subtitle">{user?.email || config.subtitle}</p>
                            </div>

                            <button
                                id={isTecnico ? "btn-mi-perfil-tecnico" : "btn-mi-perfil-usuario"}
                                className="dropdown-item"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    navigate('/perfil');
                                }}
                            >
                                👤 Mi Perfil
                            </button>

                            <button
                                id={isTecnico ? "btn-logout-tecnico" : "btn-logout-usuario"}
                                className="dropdown-item logout"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    onLogout();
                                }}
                            >
                                🚪 Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </nav>
    );
};
