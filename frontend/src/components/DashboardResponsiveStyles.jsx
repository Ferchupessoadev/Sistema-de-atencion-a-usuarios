import React from 'react';

export default function DashboardResponsiveStyles() {
  return (
    <style>{`
      .dashboard-nav-brand,
      .dashboard-nav-actions,
      .dashboard-tabs,
      .dashboard-tabs-list,
      .dashboard-content-toolbar,
      .dashboard-action-row,
      .modal-actions {
        min-width: 0;
      }

      .dashboard-nav-brand h1,
      .dashboard-nav-brand > div,
      .dashboard-nav-actions > span {
        min-width: 0;
      }

      .dashboard-nav-brand h1,
      .dashboard-nav-brand span,
      .dashboard-nav-actions > span {
        overflow-wrap: anywhere;
      }

      .dashboard-action-row > button,
      .dashboard-content-toolbar > button,
      .modal-actions > button {
        min-width: 0;
      }

      @media (max-width: 700px) {
        .dashboard-nav {
          align-items: stretch;
          flex-direction: column;
          gap: 0.8rem;
          padding: 0.85rem 1rem;
        }

        .dashboard-nav-brand {
          gap: 0.6rem !important;
        }

        .dashboard-nav-brand h1 {
          font-size: 1rem;
        }

        .dashboard-nav-actions {
          flex-wrap: wrap;
          gap: 0.5rem !important;
          justify-content: flex-start;
        }

        .dashboard-nav-actions > span:last-of-type {
          flex: 1 1 120px;
          font-size: 0.8rem !important;
        }

        .dashboard-body {
          margin: 1rem auto;
          padding: 0 0.75rem;
        }

        .dashboard-tabs {
          align-items: stretch !important;
          flex-direction: column;
          margin-bottom: 1rem !important;
        }

        .dashboard-tabs-list {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }

        .dashboard-tabs-list .btn,
        .dashboard-tabs > .btn,
        .dashboard-tabs-actions > .btn {
          min-height: 2.6rem;
          width: 100%;
        }

        .dashboard-tabs-actions {
          width: 100%;
        }

        .dashboard-alert {
          align-items: flex-start !important;
          flex-direction: column;
          gap: 0.45rem;
        }

        .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .stat-box {
          padding: 0.8rem 0.5rem;
        }

        .stat-number {
          font-size: 1.3rem;
        }

        .stat-label {
          font-size: 0.67rem;
          line-height: 1.25;
        }

        .incident-card {
          padding: 0.9rem;
        }

        .incident-header > span:last-child {
          width: 100%;
          font-size: 0.72rem !important;
        }

        .incident-meta {
          flex-direction: column;
          gap: 0.4rem;
        }

        .dashboard-content-toolbar,
        .dashboard-action-row {
          align-items: stretch !important;
          flex-direction: column;
        }

        .dashboard-content-toolbar > *,
        .dashboard-action-row > button,
        .dashboard-action-row > div {
          width: 100%;
        }

        .dashboard-action-row > div[style*="marginLeft"] {
          align-items: stretch !important;
          flex-wrap: wrap;
          margin-left: 0 !important;
        }

        .dashboard-action-row > div[style*="marginLeft"] > button {
          flex: 1 1 30%;
        }

        .modal-overlay {
          align-items: flex-start;
          overflow-y: auto;
          padding: 0.75rem;
        }

        .modal-content {
          margin: auto 0;
          max-height: calc(100vh - 1.5rem);
          padding: 1.1rem;
        }

        .modal-actions {
          flex-direction: column;
        }

        .modal-actions > button {
          flex: none !important;
          width: 100%;
        }

        .dashboard-radio-options {
          flex-direction: column;
          gap: 0.75rem !important;
        }

        .dashboard-step-row {
          align-items: stretch !important;
        }
      }

      @media (max-width: 420px) {
        .dashboard-tabs-list {
          grid-template-columns: 1fr;
        }

        .dashboard-nav-actions .badge {
          order: 3;
        }

        .dashboard-nav-actions > span:last-of-type {
          order: 2;
          flex-basis: calc(100% - 4.5rem);
        }

        .dashboard-nav-actions > button {
          font-size: 0.75rem;
          padding: 0.4rem 0.6rem;
        }

        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }

        .incident-badges .badge {
          font-size: 0.67rem;
          padding: 0.22rem 0.45rem;
        }
      }
    `}</style>
  );
}
