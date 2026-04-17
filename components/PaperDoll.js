import React, { useState, useEffect, useCallback } from 'react';
import ItemSearch from './ItemSearch';
import TransmogDropdown from './TransmogDropdown';
import { GEAR_SLOTS } from '../data/gear-slots';
import { DESIGN, RARITY_COLORS } from '../lib/constants';
import {
  SLOT_ZINDEX,
  generateBasePlaceholder,
  generateGearPlaceholder,
  getBaseCharacterPath,
  getGearAppearancePath,
} from '../lib/paperdoll-assets';

// ─── Layout constants ────────────────────────────────────────────────────────
// The paper doll is a 3-column arrangement:
//   Left panel  → mainhand, gloves, ring1
//   Center      → helm + amulet above portrait, boots below, portrait canvas in middle
//   Right panel → offhand, chest, legs, ring2
//
// The portrait canvas (220 × 400) holds:
//   • One <img> for the base character silhouette
//   • One <img> per equipped slot as a full-canvas gear overlay, z-indexed
//
// Both image layers fall back to generated SVG data-URLs when the real PNGs
// haven't landed yet, so the UI is testable from day one.

const LEFT_SLOTS  = ['mainhand', 'gloves', 'ring1'];
const TOP_SLOTS   = ['helm', 'amulet'];
const BOTTOM_SLOTS = ['boots'];
const RIGHT_SLOTS = ['offhand', 'chest', 'legs', 'ring2'];

// All slots sorted by ascending z-index for overlay render order
const SLOTS_BY_ZINDEX = [...GEAR_SLOTS].sort(
  (a, b) => (SLOT_ZINDEX[a.id] ?? 0) - (SLOT_ZINDEX[b.id] ?? 0)
);

// ─── Slot button ─────────────────────────────────────────────────────────────
function SlotButton({ slot, equipped, rarityColor, onClick, onUnequip, transmog, characterClass, onTransmogChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
      {/* Clickable slot box */}
      <div
        onClick={onClick}
        title={equipped ? equipped.name : `Equip ${slot.label}`}
        style={{
          width: '56px',
          height: '56px',
          background: equipped
            ? `rgba(${hexRgb(rarityColor)}, 0.08)`
            : 'rgba(212,175,55,0.05)',
          border: equipped
            ? `1px solid rgba(${hexRgb(rarityColor)}, 0.55)`
            : '1px dashed rgba(212,175,55,0.28)',
          borderRadius: '3px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: equipped ? `0 0 10px rgba(${hexRgb(rarityColor)}, 0.18)` : 'none',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => {
          const rgb = hexRgb(rarityColor ?? DESIGN.gold);
          e.currentTarget.style.background = `rgba(${rgb}, 0.18)`;
          e.currentTarget.style.borderColor = rarityColor ?? DESIGN.gold;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = equipped
            ? `rgba(${hexRgb(rarityColor)}, 0.08)`
            : 'rgba(212,175,55,0.05)';
          e.currentTarget.style.borderColor = equipped
            ? `rgba(${hexRgb(rarityColor)}, 0.55)`
            : 'rgba(212,175,55,0.28)';
        }}
      >
        {equipped ? (
          <div style={{
            color: rarityColor,
            fontSize: '9px',
            fontFamily: DESIGN.fonts.body,
            textAlign: 'center',
            padding: '3px',
            lineHeight: 1.25,
          }}>
            <div style={{ fontWeight: 700, fontSize: '10px' }}>
              {equipped.name.length > 7 ? equipped.name.substring(0, 6) + '…' : equipped.name}
            </div>
            <div style={{ opacity: 0.65, textTransform: 'capitalize', fontSize: '8px' }}>
              {equipped.rarity}
            </div>
          </div>
        ) : (
          <span style={{
            fontSize: '9px',
            color: 'rgba(212,175,55,0.38)',
            fontFamily: DESIGN.fonts.body,
            textAlign: 'center',
            lineHeight: 1.25,
            padding: '2px',
          }}>
            {slot.label}
          </span>
        )}
      </div>

      {/* Equipped: transmog + remove row */}
      {equipped && (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <TransmogDropdown
            slotId={slot.id}
            characterClass={characterClass}
            selectedKey={transmog ?? 'base'}
            onSelect={(key) => onTransmogChange(slot.id, key)}
          />
          <button
            onClick={onUnequip}
            title="Remove"
            style={{
              padding: '1px 5px',
              background: 'rgba(255,80,80,0.14)',
              border: '1px solid rgba(255,80,80,0.38)',
              color: '#ff6666',
              fontSize: '9px',
              fontFamily: DESIGN.fonts.body,
              cursor: 'pointer',
              borderRadius: '2px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,80,80,0.32)';
              e.currentTarget.style.borderColor = '#ff6666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,80,80,0.14)';
              e.currentTarget.style.borderColor = 'rgba(255,80,80,0.38)';
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Label for empty slots */}
      {!equipped && (
        <div style={{
          fontSize: '8px',
          color: 'rgba(255,255,255,0.32)',
          fontFamily: DESIGN.fonts.body,
          whiteSpace: 'nowrap',
        }}>
          {slot.label}
        </div>
      )}
    </div>
  );
}

// ─── Portrait canvas ──────────────────────────────────────────────────────────
// Renders the base character image + one overlay per equipped slot, z-indexed.
function PortraitCanvas({ characterClass, gender, equipment, transmog }) {
  const [baseError, setBaseError] = useState(false);
  const [overlayErrors, setOverlayErrors] = useState({});

  // Reset error state whenever class or gender switches
  useEffect(() => {
    setBaseError(false);
    setOverlayErrors({});
  }, [characterClass, gender]);

  const baseSrc = baseError
    ? generateBasePlaceholder(characterClass, gender)
    : getBaseCharacterPath(characterClass, gender);

  const getOverlaySrc = (slotId) => {
    const key = transmog?.[slotId] || 'base';
    const errorKey = `${slotId}:${characterClass}:${key}`;
    return overlayErrors[errorKey]
      ? generateGearPlaceholder(slotId)
      : getGearAppearancePath(characterClass, slotId, key);
  };

  const handleOverlayError = (slotId) => {
    const key = transmog?.[slotId] || 'base';
    const errorKey = `${slotId}:${characterClass}:${key}`;
    setOverlayErrors((prev) => ({ ...prev, [errorKey]: true }));
  };

  const equippedSlots = SLOTS_BY_ZINDEX.filter((s) => equipment[s.id]);

  return (
    <div style={{
      position: 'relative',
      width: '220px',
      height: '400px',
      background: 'radial-gradient(ellipse at 50% 60%, rgba(30,24,40,0.95) 0%, rgba(8,6,8,0.98) 100%)',
      border: '1px solid rgba(212,175,55,0.10)',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
    }}>
      {/* Base character */}
      <img
        key={`base-${characterClass}-${gender}`}
        src={baseSrc}
        alt={`${characterClass} ${gender}`}
        onError={() => setBaseError(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 1,
        }}
      />

      {/* Gear overlays in z-index order */}
      {equippedSlots.map((slot) => (
        <img
          key={`${slot.id}:${characterClass}:${transmog?.[slot.id] ?? 'base'}`}
          src={getOverlaySrc(slot.id)}
          alt={slot.label}
          onError={() => handleOverlayError(slot.id)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: SLOT_ZINDEX[slot.id] ?? 10,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* "No gear" hint when nothing is equipped */}
      {equippedSlots.length === 0 && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '10px',
          color: 'rgba(212,175,55,0.28)',
          fontFamily: DESIGN.fonts.body,
          letterSpacing: '0.5px',
          pointerEvents: 'none',
        }}>
          No gear equipped
        </div>
      )}
    </div>
  );
}

// ─── Slot panel column ────────────────────────────────────────────────────────
function SlotColumn({ slotIds, equipment, transmog, characterClass, onSlotClick, onUnequip, onTransmogChange, style }) {
  const slots = GEAR_SLOTS.filter((s) => slotIds.includes(s.id));
  const getRarityColor = (rarity) => RARITY_COLORS[rarity?.toLowerCase()] ?? RARITY_COLORS.common;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', ...style }}>
      {slots.map((slot) => {
        const equipped = equipment[slot.id];
        return (
          <SlotButton
            key={slot.id}
            slot={slot}
            equipped={equipped}
            rarityColor={equipped ? getRarityColor(equipped.rarity) : null}
            onClick={() => onSlotClick(slot)}
            onUnequip={(e) => { e.stopPropagation(); onUnequip(slot.id); }}
            transmog={transmog?.[slot.id]}
            characterClass={characterClass}
            onTransmogChange={onTransmogChange}
          />
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PaperDoll({
  characterClass,
  gender = 'male',
  equipment,
  transmog,
  onEquip,
  onUnequip,
  onTransmogChange,
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleSlotClick = useCallback((slot) => {
    setSelectedSlot(slot);
    setShowSearch(true);
  }, []);

  const handleItemSelect = useCallback((item) => {
    if (selectedSlot) {
      onEquip(selectedSlot.id, item);
      setShowSearch(false);
      setSelectedSlot(null);
    }
  }, [selectedSlot, onEquip]);

  const getRarityColor = (rarity) => {
    const rarityKey = rarity?.toLowerCase().split(' ')[0] || 'common';
    return RARITY_COLORS[rarityKey] || RARITY_COLORS.common;
  };

  const sharedColumnProps = {
    equipment,
    transmog,
    characterClass,
    onSlotClick: handleSlotClick,
    onUnequip,
    onTransmogChange,
  };

  return (
    <div>
      {/* Section header */}
      <h2 style={{
        fontFamily: DESIGN.fonts.heading,
        fontSize: '18px',
        color: DESIGN.gold,
        marginBottom: '20px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        Equipment
      </h2>

      {/* Paper doll card */}
      <div style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '20px 16px',
        marginBottom: '20px',
      }}>
        {/* Top row: helm + amulet centred above portrait */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          {TOP_SLOTS.map((id) => {
            const slot = GEAR_SLOTS.find((s) => s.id === id);
            const equipped = equipment[id];
            return (
              <SlotButton
                key={id}
                slot={slot}
                equipped={equipped}
                rarityColor={equipped ? getRarityColor(equipped.rarity) : null}
                onClick={() => handleSlotClick(slot)}
                onUnequip={(e) => { e.stopPropagation(); onUnequip(id); }}
                transmog={transmog?.[id]}
                characterClass={characterClass}
                onTransmogChange={onTransmogChange}
              />
            );
          })}
        </div>

        {/* Middle row: left panel | portrait | right panel */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '16px' }}>
          {/* Left column: mainhand, gloves, ring1 */}
          <SlotColumn slotIds={LEFT_SLOTS} {...sharedColumnProps} style={{ paddingTop: '12px' }} />

          {/* Portrait canvas */}
          <PortraitCanvas
            characterClass={characterClass}
            gender={gender}
            equipment={equipment}
            transmog={transmog}
          />

          {/* Right column: offhand, chest, legs, ring2 */}
          <SlotColumn slotIds={RIGHT_SLOTS} {...sharedColumnProps} style={{ paddingTop: '12px' }} />
        </div>

        {/* Bottom row: boots centred below portrait */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          {BOTTOM_SLOTS.map((id) => {
            const slot = GEAR_SLOTS.find((s) => s.id === id);
            const equipped = equipment[id];
            return (
              <SlotButton
                key={id}
                slot={slot}
                equipped={equipped}
                rarityColor={equipped ? getRarityColor(equipped.rarity) : null}
                onClick={() => handleSlotClick(slot)}
                onUnequip={(e) => { e.stopPropagation(); onUnequip(id); }}
                transmog={transmog?.[id]}
                characterClass={characterClass}
                onTransmogChange={onTransmogChange}
              />
            );
          })}
        </div>
      </div>

      {/* Item search modal */}
      {showSearch && selectedSlot && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8,6,8,0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <ItemSearch
            slotType={selectedSlot.type}
            onSelect={handleItemSelect}
            onClose={() => { setShowSearch(false); setSelectedSlot(null); }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────
// Converts a 6-char hex colour to an "r,g,b" string for use in rgba().
function hexRgb(hex) {
  if (!hex || hex.length < 6) return '212,175,55';
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}
