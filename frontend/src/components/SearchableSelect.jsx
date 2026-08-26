import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchableSelect – Componente reutilizable de selección con búsqueda.
 *
 * Props:
 *   options        – Array de { value, label, sublabel?, badge? }
 *   value          – Valor seleccionado actualmente (controlled)
 *   onChange        – Callback(value) al seleccionar
 *   placeholder     – Texto del input cuando está vacío
 *   allowFreeText   – Si true, permite ingresar texto libre (no sólo opciones)
 *   onTextChange    – Callback(text) cuando allowFreeText && cambia el texto escrito
 *   emptyMessage    – Mensaje cuando no hay coincidencias
 *   renderOption    – (option) => JSX   Override para renderizar cada opción
 *   inputId         – id HTML del input
 *   required        – Si es requerido
 *   disabled        – Si está deshabilitado
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  allowFreeText = false,
  onTextChange,
  emptyMessage = 'No se encontraron resultados.',
  renderOption,
  inputId,
  required = false,
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync display text with selected value
  useEffect(() => {
    if (!allowFreeText && value) {
      const selected = options.find(o => String(o.value) === String(value));
      if (selected) {
        setQuery(selected.label);
      }
    }
  }, [value, options, allowFreeText]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-searchable-item]');
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const filtered = options.filter(opt => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.keywords && opt.keywords.toLowerCase().includes(q))
    );
  });

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setIsOpen(true);
    setHighlightIndex(0);

    if (allowFreeText && onTextChange) {
      onTextChange(text);
    }
  };

  const handleSelect = (option) => {
    setQuery(option.label);
    onChange(option.value);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!allowFreeText && query) {
      // Select all text on focus for easy re-search
      inputRef.current?.select();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
      default:
        break;
    }
  };

  const defaultRenderOption = (opt, isHighlighted) => (
    <div
      style={{
        padding: '0.6rem 0.85rem',
        cursor: 'pointer',
        background: isHighlighted ? '#EFF6FF' : 'transparent',
        borderBottom: '1px solid #F1F5F9',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={() => {}}
    >
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B' }}>
        {opt.label}
      </div>
      {opt.sublabel && (
        <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.15rem' }}>
          {opt.sublabel}
        </div>
      )}
      {opt.badge && (
        <span
          style={{
            display: 'inline-block',
            marginTop: '0.2rem',
            fontSize: '0.7rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            background: '#DBEAFE',
            color: '#1E40AF',
            fontWeight: 600,
          }}
        >
          {opt.badge}
        </span>
      )}
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.95rem',
            color: '#94A3B8',
            pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          style={{
            paddingLeft: '2.2rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              if (allowFreeText && onTextChange) onTextChange('');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#94A3B8',
              padding: '0.15rem',
              lineHeight: 1,
            }}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '260px',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1000,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: '#94A3B8',
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.value}
                data-searchable-item
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightIndex(idx)}
                style={{ cursor: 'pointer' }}
              >
                {renderOption
                  ? renderOption(opt, idx === highlightIndex)
                  : defaultRenderOption(opt, idx === highlightIndex)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
