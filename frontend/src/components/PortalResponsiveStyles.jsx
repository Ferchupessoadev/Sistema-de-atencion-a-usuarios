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

      .portal-voto-btn.active {
        box-shadow: 0 0 0 2px currentColor;
      }

      .portal-voto-actual {
        font-size: 0.75rem;
        color: #334155;
        font-weight: 700;
      }

      .portal-receta-vote-area {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        flex-wrap: wrap;
      }

      .portal-receta-vote-label {
        color: #475569;
        font-size: 0.78rem;
        font-weight: 700;
      }

      .portal-receta-votos {
        gap: 0.35rem;
        padding: 0.2rem;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        background: #F8FAFC;
      }

      .portal-voto-btn {
        align-items: center;
        border: 1px solid transparent;
        border-radius: 8px;
        gap: 0.45rem;
        min-height: 2.3rem;
        min-width: 4.9rem;
        padding: 0.35rem 0.6rem;
        transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
      }

      .portal-voto-btn:not(:disabled):hover {
        transform: translateY(-1px);
      }

      .portal-voto-btn:not(:disabled):focus-visible {
        outline: 3px solid rgba(74, 144, 226, 0.35);
        outline-offset: 1px;
      }

      .portal-voto-icon {
        font-size: 1.05rem;
        line-height: 1;
      }

      .portal-voto-copy {
        align-items: flex-start;
        display: inline-flex;
        flex-direction: column;
        font-size: 0.7rem;
        line-height: 1.1;
      }

      .portal-voto-copy strong {
        font-size: 0.78rem;
        margin-top: 0.15rem;
      }

      .portal-voto-util.active {
        background: #DCFCE7;
        border-color: #22C55E;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.18);
      }

      .portal-voto-no-util.active {
        background: #FEE2E2;
        border-color: #EF4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.16);
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

        .portal-receta-vote-area {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.4rem;
          width: 100%;
        }

        .portal-receta-votos {
          width: 100%;
        }

        .portal-voto-btn {
          flex: 1 1 0;
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
