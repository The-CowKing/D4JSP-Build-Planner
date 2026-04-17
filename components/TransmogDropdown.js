import React, { useState, useEffect, useRef } from 'react';
import { DESIGN } from '../lib/constants';
import { getAvailableAppearances } from '../lib/paperdoll-assets';

// Small ◈ button per equipped slot that opens a popover listing
// available cosmetic appearances. Selecting one calls onSelect(appearanceKey).
export default function TransmogDropdown({ slotId, characterClass, selectedKey = 'base', onSelect }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const appearances = getAvailableAppearances(slotId, characterClass);
  const current = appearances.find(a => a.key === selectedKey) || appearances[0];

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        title={`Appearance: ${current?.label}`}
        style={{
          padding: '1px 5px',
          background: open ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.10)',
          border: `1px solid rgba(212,175,55,${open ? '0.65' : '0.30'})`,
          color: DESIGN.gold,
          fontSize: '10px',
          fontFamily: DESIGN.fonts.body,
          cursor: 'pointer',
          borderRadius: '2px',
          lineHeight: 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212,175,55,0.22)';
          e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.10)';
          e.currentTarget.style.borderColor = `rgba(212,175,55,${open ? '0.65' : '0.30'})`;
        }}
      >
        ◈
      </button>

      {/* Appearance popover */}
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(160deg, #0e0c10, #111018)',
            border: '1px solid rgba(212,175,55,0.30)',
            borderRadius: '3px',
            minWidth: '150px',
            zIndex: 200,
            boxShadow: '0 6px 20px rgba(0,0,0,0.7)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '5px 9px',
            fontSize: '9px',
            color: DESIGN.gold,
            fontFamily: DESIGN.fonts.heading,
            borderBottom: '1px solid rgba(212,175,55,0.15)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Appearance
          </div>

          {/* Appearance list */}
          {appearances.map((app) => {
            const isSelected = app.key === selectedKey;
            return (
              <button
                key={app.key}
                onClick={() => { onSelect(app.key); setOpen(false); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 9px',
                  background: isSelected ? 'rgba(212,175,55,0.14)' : 'transparent',
                  border: 'none',
                  borderLeft: isSelected ? `2px solid ${DESIGN.gold}` : '2px solid transparent',
                  color: isSelected ? DESIGN.gold : 'rgba(255,255,255,0.72)',
                  fontSize: '11px',
                  fontFamily: DESIGN.fonts.body,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212,175,55,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected ? 'rgba(212,175,55,0.14)' : 'transparent';
                }}
              >
                {app.label}
                {app.source !== 'base_drop' && (
                  <span style={{
                    marginLeft: '6px',
                    fontSize: '9px',
                    opacity: 0.5,
                    textTransform: 'capitalize',
                  }}>
                    {app.source.replace('_', ' ')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
