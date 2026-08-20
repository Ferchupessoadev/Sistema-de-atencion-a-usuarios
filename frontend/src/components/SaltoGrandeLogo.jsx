import React from 'react';

export default function SaltoGrandeLogo({ size = 36, showText = false, light = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {/* Arco Rojo Superior */}
        <path
          d="M 22 45 A 34 34 0 0 1 78 45"
          stroke="#D92525"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Olas Azules Estilizadas Salto Grande */}
        {/* Ola 1 (Superior / Celeste Claro) */}
        <path
          d="M 38 43 C 48 38, 56 46, 68 41 C 60 47, 50 43, 38 43 Z"
          fill="#7BB3E8"
        />
        {/* Ola 2 (Celeste Medio) */}
        <path
          d="M 32 49 C 44 43, 54 53, 72 46 C 62 53, 48 48, 32 49 Z"
          fill="#4A90E2"
        />
        {/* Ola 3 (Azul Intenso) */}
        <path
          d="M 26 55 C 40 48, 52 60, 75 52 C 64 60, 46 54, 26 55 Z"
          fill="#205493"
        />
        {/* Ola 4 (Azul Marino Profundo #022E5B) */}
        <path
          d="M 21 61 C 36 53, 50 67, 78 58 C 66 67, 44 60, 21 61 Z"
          fill="#022E5B"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: "'Segoe UI', Roboto, sans-serif",
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '0.08em',
              color: light ? '#FFFFFF' : '#022E5B',
              lineHeight: 1.1,
            }}
          >
            SALTO GRANDE
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.18em',
              color: light ? '#93C5FD' : '#64748B',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Argentina - Uruguay · Sistema de Soluciones
          </span>
        </div>
      )}
    </div>
  );
}
