import React, { useState } from 'react';
import ItemSearch from './ItemSearch';
import { GEAR_SLOTS } from '../data/gear-slots';
import { DESIGN, RARITY_COLORS } from '../lib/constants';

export default function PaperDoll({ equipment, onEquip, onUnequip }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowSearch(true);
  };

  const handleItemSelect = (item) => {
    if (selectedSlot) {
      onEquip(selectedSlot.id, item);
      setShowSearch(false);
      setSelectedSlot(null);
    }
  };

  const handleUnequip = (slotId, e) => {
    e.stopPropagation();
    onUnequip(slotId);
  };

  const getRarityColor = (rarity) => {
    const rarityKey = rarity?.toLowerCase().split(' ')[0] || 'common';
    return RARITY_COLORS[rarityKey] || RARITY_COLORS.common;
  };

  return (
    <div>
      {/* Header */}
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

      {/* Paper Doll Container */}
      <div style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '30px',
        position: 'relative',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        {/* Paper Doll Figure */}
        <div style={{ position: 'relative', width: '200px', height: '400px' }}>
          {/* Armor/Body Outline */}
          <svg
            viewBox="0 0 100 200"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.3,
            }}
          >
            {/* Head */}
            <circle cx="50" cy="20" r="12" fill="none" stroke={DESIGN.gold} strokeWidth="1" />
            {/* Torso */}
            <path d="M 35 35 L 35 80 L 65 80 L 65 35 Z" fill="none" stroke={DESIGN.gold} strokeWidth="1" />
            {/* Arms */}
            <line x1="35" y1="45" x2="15" y2="70" stroke={DESIGN.gold} strokeWidth="1" />
            <line x1="65" y1="45" x2="85" y2="70" stroke={DESIGN.gold} strokeWidth="1" />
            {/* Legs */}
            <line x1="40" y1="80" x2="35" y2="140" stroke={DESIGN.gold} strokeWidth="1" />
            <line x1="60" y1="80" x2="65" y2="140" stroke={DESIGN.gold} strokeWidth="1" />
          </svg>

          {/* Gear Slots */}
          {GEAR_SLOTS.map((slot) => {
            const equipped = equipment[slot.id];
            return (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Slot Box */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    background: equipped
                      ? `linear-gradient(135deg, ${getRarityColor(equipped.rarity)}, ${getRarityColor(equipped.rarity)}22)`
                      : 'rgba(212,175,55,0.06)',
                    border: equipped
                      ? `2px solid ${getRarityColor(equipped.rarity)}`
                      : `1px dashed rgba(212,175,55,0.3)`,
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = DESIGN.gold;
                    e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = equipped
                      ? `2px solid ${getRarityColor(equipped.rarity)}`
                      : '1px dashed rgba(212,175,55,0.3)';
                    e.currentTarget.style.background = equipped
                      ? `linear-gradient(135deg, ${getRarityColor(equipped.rarity)}, ${getRarityColor(equipped.rarity)}22)`
                      : 'rgba(212,175,55,0.06)';
                  }}
                >
                  {equipped ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      color: getRarityColor(equipped.rarity),
                      fontSize: '10px',
                      fontFamily: DESIGN.fonts.body,
                      textAlign: 'center',
                      padding: '4px',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                        {equipped.name.substring(0, 8)}
                      </div>
                      <div style={{ fontSize: '9px', opacity: 0.7 }}>
                        {equipped.rarity}
                      </div>
                    </div>
                  ) : (
                    <span style={{
                      fontSize: '10px',
                      color: 'rgba(212,175,55,0.4)',
                      textAlign: 'center',
                      fontFamily: DESIGN.fonts.body,
                    }}>
                      {slot.label}
                    </span>
                  )}
                </div>

                {/* Unequip Button */}
                {equipped && (
                  <button
                    onClick={(e) => handleUnequip(slot.id, e)}
                    style={{
                      marginTop: '4px',
                      padding: '2px 6px',
                      background: 'rgba(255,100,100,0.2)',
                      border: '1px solid rgba(255,100,100,0.5)',
                      color: '#ff6464',
                      fontSize: '9px',
                      fontFamily: DESIGN.fonts.body,
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,100,100,0.4)';
                      e.target.style.borderColor = '#ff6464';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,100,100,0.2)';
                      e.target.style.borderColor = 'rgba(255,100,100,0.5)';
                    }}
                  >
                    Remove
                  </button>
                )}

                {/* Tooltip Label */}
                <div style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: DESIGN.fonts.body,
                  whiteSpace: 'nowrap',
                }}>
                  {slot.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Search Overlay */}
      {showSearch && selectedSlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8,6,8,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <ItemSearch
            slotType={selectedSlot.type}
            onSelect={handleItemSelect}
            onClose={() => {
              setShowSearch(false);
              setSelectedSlot(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
