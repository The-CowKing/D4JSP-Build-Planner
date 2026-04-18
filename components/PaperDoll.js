import React, { useState, useEffect, useCallback } from 'react';
import ItemSearch from './ItemSearch';
import { GEAR_SLOTS } from '../data/gear-slots';
import { DESIGN, RARITY_COLORS } from '../lib/constants';
import {
  generateBasePlaceholder,
  getBaseCharacterPath,
  CLASS_COLORS,
} from '../lib/paperdoll-assets';

// ─── Utility ──────────────────────────────────────────────────────────────────
function hexRgb(hex) {
  if (!hex || hex.length < 6) return '212,175,55';
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}

function getRarityColor(rarity) {
  const key = rarity?.toLowerCase().split(' ')[0] || 'common';
  return RARITY_COLORS[key] || RARITY_COLORS.common;
}

// ─── Slot icon ────────────────────────────────────────────────────────────────
// Shows tooltip_image_url when equipped, or a D4-style placeholder when empty.
function SlotIcon({ slot, equipped, onClick, onUnequip, size = 56 }) {
  const [imgError, setImgError] = useState(false);

  // Reset error state when a different item is equipped
  useEffect(() => {
    setImgError(false);
  }, [equipped?.cache_key]);

  const rarityColor = equipped ? getRarityColor(equipped.rarity) : null;
  const rgb = rarityColor ? hexRgb(rarityColor) : '212,175,55';

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <div
        onClick={onClick}
        title={equipped ? equipped.name : `Equip ${slot.label}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: equipped
            ? `rgba(${rgb}, 0.14)`
            : 'rgba(6,4,8,0.82)',
          border: equipped
            ? `1px solid rgba(${rgb}, 0.65)`
            : '1px solid rgba(212,175,55,0.18)',
          borderRadius: '2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          boxShadow: equipped
            ? `0 0 14px rgba(${rgb}, 0.28), inset 0 0 10px rgba(0,0,0,0.55)`
            : 'inset 0 0 10px rgba(0,0,0,0.65)',
          transition: 'all 0.15s ease',
          backdropFilter: 'blur(3px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = rarityColor ?? DESIGN.gold;
          e.currentTarget.style.boxShadow = `0 0 20px rgba(${rgb}, 0.45), inset 0 0 10px rgba(0,0,0,0.55)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = equipped
            ? `rgba(${rgb}, 0.65)`
            : 'rgba(212,175,55,0.18)';
          e.currentTarget.style.boxShadow = equipped
            ? `0 0 14px rgba(${rgb}, 0.28), inset 0 0 10px rgba(0,0,0,0.55)`
            : 'inset 0 0 10px rgba(0,0,0,0.65)';
        }}
      >
        {equipped && equipped.tooltip_image_url && !imgError ? (
          <img
            src={equipped.tooltip_image_url}
            alt={equipped.name}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        ) : equipped ? (
          <div style={{
            color: rarityColor,
            fontSize: '8px',
            fontFamily: DESIGN.fonts.body,
            textAlign: 'center',
            padding: '3px',
            lineHeight: 1.2,
          }}>
            <div style={{ fontWeight: 700, fontSize: '9px' }}>
              {equipped.name.length > 7 ? equipped.name.substring(0, 6) + '…' : equipped.name}
            </div>
            <div style={{ opacity: 0.6, textTransform: 'capitalize', fontSize: '7px' }}>
              {equipped.rarity}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: Math.round(size * 0.42) + 'px',
              height: Math.round(size * 0.42) + 'px',
              borderRadius: '1px',
              border: '1px dashed rgba(212,175,55,0.22)',
              opacity: 0.5,
            }} />
            <span style={{
              fontSize: '7px',
              color: 'rgba(212,175,55,0.38)',
              fontFamily: DESIGN.fonts.body,
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: `${size - 6}px`,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {slot.label}
            </span>
          </div>
        )}
      </div>

      {equipped && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnequip(); }}
          title="Remove"
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '14px',
            height: '14px',
            background: 'rgba(20,4,4,0.95)',
            border: '1px solid rgba(255,80,80,0.45)',
            color: '#ff6666',
            fontSize: '7px',
            cursor: 'pointer',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            lineHeight: 1,
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(160,20,20,0.95)';
            e.currentTarget.style.borderColor = '#ff6666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(20,4,4,0.95)';
            e.currentTarget.style.borderColor = 'rgba(255,80,80,0.45)';
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Silhouette canvas with body slots overlaid ───────────────────────────────
// Portrait: 240 × 480px (SVG viewBox 220×440, scaled 1.09×)
//
// Slot positions are tuned to anatomical landmarks on the generated SVG silhouette.
// SVG scale factor ≈ 1.09 (240/220). Key body centers in render-px:
//   head   ≈ (120, 63)   chest ≈ (120, 195)  hands ≈ (23, 336) / (217, 336)
//   thighs ≈ (120, 310)  feet  ≈ (120, 472 → clamped to 428 for 52px slot)
const PORTRAIT_W = 240;
const PORTRAIT_H = 480;

const BODY_SLOTS = ['helm', 'chest', 'gloves', 'legs', 'boots'];

const BODY_SLOT_POS = {
  helm:   { top: '8%',  left: '50%',  tx: '-50%' },
  chest:  { top: '35%', left: '50%',  tx: '-50%' },
  gloves: { top: '55%', left: '72%',  tx: '0'    }, // right-arm area
  legs:   { top: '61%', left: '50%',  tx: '-50%' },
  boots:  { top: '85%', left: '50%',  tx: '-50%' },
};

// Subtle line connectors from body-slot corners to the slot edge, giving a
// D4 inventory "wire" feel. These are pure CSS border lines from the absolute
// slot position to the silhouette edge — we approximate with a small tail div.
function SlotConnector({ side }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      [side === 'right' ? 'left' : 'right']: '100%',
      width: '10px',
      height: '1px',
      background: 'rgba(212,175,55,0.25)',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
    }} />
  );
}

function Silhouette({ characterClass, gender, equipment, onSlotClick, onUnequip }) {
  const [baseError, setBaseError] = useState(false);

  useEffect(() => {
    setBaseError(false);
  }, [characterClass, gender]);

  const classColor = CLASS_COLORS[characterClass] || '#888888';
  const classRgb = hexRgb(classColor);

  const baseSrc = baseError
    ? generateBasePlaceholder(characterClass, gender)
    : getBaseCharacterPath(characterClass, gender);

  const bodySlotDefs = GEAR_SLOTS.filter((s) => BODY_SLOTS.includes(s.id));

  return (
    <div style={{
      position: 'relative',
      width: `${PORTRAIT_W}px`,
      height: `${PORTRAIT_H}px`,
      flexShrink: 0,
    }}>
      {/* Atmospheric class-tinted glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 38%, rgba(${classRgb},0.10) 0%, rgba(8,6,8,0.0) 65%)`,
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Dark silhouette — brightness reduced to create inventory-screen look */}
      <img
        key={`base-${characterClass}-${gender}`}
        src={baseSrc}
        alt={characterClass}
        onError={() => setBaseError(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center bottom',
          zIndex: 1,
          filter: 'brightness(0.28) saturate(0.55)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom vignette for depth */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(to bottom, transparent, rgba(8,6,8,0.85))',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Body gear slots — absolutely positioned over silhouette */}
      {bodySlotDefs.map((slot) => {
        const pos = BODY_SLOT_POS[slot.id];
        const equipped = equipment[slot.id];
        const isOffCenter = pos.tx === '0'; // gloves — off to right

        return (
          <div
            key={slot.id}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: pos.tx !== '0' ? `translateX(${pos.tx})` : undefined,
              zIndex: 10,
            }}
          >
            {/* Connector line toward silhouette center for off-center slots */}
            {isOffCenter && (
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '100%',
                width: '12px',
                height: '1px',
                background: 'rgba(212,175,55,0.2)',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
            )}
            <SlotIcon
              slot={slot}
              equipped={equipped}
              onClick={() => onSlotClick(slot)}
              onUnequip={() => onUnequip(slot.id)}
              size={52}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Weapon column (left) ─────────────────────────────────────────────────────
function WeaponColumn({ equipment, onSlotClick, onUnequip }) {
  const slots = GEAR_SLOTS.filter((s) => ['mainhand', 'offhand'].includes(s.id));
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      paddingTop: '32px',
    }}>
      <div style={{
        fontSize: '8px',
        color: 'rgba(212,175,55,0.3)',
        fontFamily: DESIGN.fonts.body,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '2px',
      }}>
        Weapons
      </div>
      {slots.map((slot) => (
        <SlotIcon
          key={slot.id}
          slot={slot}
          equipped={equipment[slot.id]}
          onClick={() => onSlotClick(slot)}
          onUnequip={() => onUnequip(slot.id)}
          size={58}
        />
      ))}
    </div>
  );
}

// ─── Jewelry column (right) ───────────────────────────────────────────────────
function JewelryColumn({ equipment, onSlotClick, onUnequip }) {
  const slots = GEAR_SLOTS.filter((s) => ['amulet', 'ring1', 'ring2'].includes(s.id));
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      paddingTop: '32px',
    }}>
      <div style={{
        fontSize: '8px',
        color: 'rgba(212,175,55,0.3)',
        fontFamily: DESIGN.fonts.body,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '2px',
      }}>
        Jewelry
      </div>
      {slots.map((slot) => (
        <SlotIcon
          key={slot.id}
          slot={slot}
          equipped={equipment[slot.id]}
          onClick={() => onSlotClick(slot)}
          onUnequip={() => onUnequip(slot.id)}
          size={52}
        />
      ))}
    </div>
  );
}

// ─── Main PaperDoll component ─────────────────────────────────────────────────
export default function PaperDoll({
  characterClass,
  gender = 'male',
  equipment,
  transmog,         // kept for API compat — transmog UI not rendered in this design
  onEquip,
  onUnequip,
  onTransmogChange, // kept for API compat
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

  const handleClose = useCallback(() => {
    setShowSearch(false);
    setSelectedSlot(null);
  }, []);

  const classColor = CLASS_COLORS[characterClass] || '#888888';

  return (
    <div>
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

      <div style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '20px 12px 16px',
        marginBottom: '20px',
      }}>
        {/* 3-column: weapons | silhouette | jewelry */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '10px',
        }}>
          <WeaponColumn
            equipment={equipment}
            onSlotClick={handleSlotClick}
            onUnequip={onUnequip}
          />

          <Silhouette
            characterClass={characterClass}
            gender={gender}
            equipment={equipment}
            onSlotClick={handleSlotClick}
            onUnequip={onUnequip}
          />

          <JewelryColumn
            equipment={equipment}
            onSlotClick={handleSlotClick}
            onUnequip={onUnequip}
          />
        </div>

        {/* Class label beneath silhouette */}
        <div style={{
          textAlign: 'center',
          marginTop: '10px',
          fontSize: '10px',
          color: `rgba(${hexRgb(classColor)}, 0.45)`,
          fontFamily: DESIGN.fonts.heading,
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
        }}>
          {characterClass}
        </div>
      </div>

      {/* Item search modal */}
      {showSearch && selectedSlot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,6,8,0.86)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleClose}
        >
          <ItemSearch
            slotType={selectedSlot.type}
            onSelect={handleItemSelect}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
