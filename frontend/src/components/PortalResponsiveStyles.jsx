import React from 'react';

export default function PortalResponsiveStyles() {
  return (
    <style>{`
      .portal-publico,
      .portal-publico * {
        min-width: 0;
      }

      .portal-header-brand,
      .portal-header-titles,
      .portal-header-actions,
      .portal-receta-card,
      .portal-receta-footer,
      .portal-receta-votos {
        min-width: 0;
      }

      .portal-header-titles,
      .portal-header-title,
      .portal-header-subtitle,
      .portal-header-user,
      .portal-receta-titulo,
      .portal-receta-solucion,
      .portal-cta-text {
        overflow-wrap: anywhere;
      }

      .portal-search-input-wrap,
      .portal-search-select,
      .portal-receta-solucion {
        min-width: 0;
      }

      .portal-search-input-wrap {
        position: relative;
        display: block;
        width: 100%;
      }

      .portal-search-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        z-index: 1;
      }

      @media (max-width: 700px) {
        .portal-header-inner {
          align-items: stretch;
          flex-direction: column;
          gap: 0.7rem;
          padding: 0.75rem 1rem;
        }

        .portal-header-brand {
          gap: 0.55rem;
        }

        .portal-header-title {
          font-size: 1rem;
        }

        .portal-header-actions {
          align-items: stretch;
          flex-wrap: wrap;
          gap: 0.45rem;
          justify-content: flex-start;
        }

        .portal-header-actions .btn {
          flex: 1 1 9rem;
        }

        .portal-header-user {
          flex: 1 1 100%;
          font-size: 0.8rem;
          margin-right: 0;
        }

        .portal-hero {
          padding: 2rem 1rem 1.5rem;
        }

        .portal-hero-title {
          font-size: 1.35rem;
        }

        .portal-hero-subtitle {
          font-size: 0.875rem;
          margin-bottom: 1.15rem;
        }

        .portal-search-bar {
          flex-direction: column;
          gap: 0.55rem;
        }

        .portal-search-input,
        .portal-search-select {
          min-height: 3rem;
        }

        .portal-body {
          padding: 1.1rem 0.85rem 2.5rem;
        }

        .portal-results-header {
          align-items: stretch;
          flex-direction: column;
          margin-bottom: 1rem;
        }

        .portal-results-header .btn {
          width: 100%;
        }

        .portal-recetas-grid {
          grid-template-columns: minmax(0, 1fr);
          gap: 0.8rem;
        }

        .portal-receta-card {
          padding: 1rem;
        }

        .portal-receta-footer {
          align-items: stretch;
          flex-direction: column;
        }

        .portal-receta-votos {
          flex-wrap: wrap;
        }

        .portal-receta-footer > span {
          line-height: 1.35;
        }

        .portal-empty {
          padding: 2.5rem 1rem;
        }

        .portal-cta {
          margin-top: 1.75rem;
        }

        .portal-cta-inner {
          padding: 1.5rem 1rem;
        }

        .portal-cta-inner .btn {
          width: 100%;
        }
      }

      @media (max-width: 380px) {
        .portal-header-actions .btn {
          flex-basis: 100%;
        }

        .portal-receta-votos {
          align-items: stretch;
        }

        .portal-receta-votos .portal-voto-btn {
          flex: 1 1 5rem;
          justify-content: center;
        }
      }
    `}</style>
  );
}
