import React, { useState } from 'react';
import PaperDoll from './PaperDoll';
import StatCalculator from './StatCalculator';
import { CLASSES } from '../data/class-data';
import { DESIGN, RARITY_COLORS } from '../lib/constants';

export default function BuildPlanner() {
  const [activeCharacter, setActiveCharacter] = useState(0);
  const [characters, setCharacters] = useState(
    Array(5).fill(null).map((_, i) => ({
      id: i,
      name: `Character ${i + 1}`,
      class: CLASSES[0].id,
      equipment: {},
      stats: {},
    }))
  );

  const currentChar = characters[activeCharacter];

  const handleEquipItem = (slotId, item) => {
    const updated = [...characters];
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      equipment: {
        ...updated[activeCharacter].equipment,
        [slotId]: item,
      },
    };
    setCharacters(updated);
  };

  const handleUnequipItem = (slotId) => {
    const updated = [...characters];
    const { [slotId]: removed, ...rest } = updated[activeCharacter].equipment;
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      equipment: rest,
    };
    setCharacters(updated);
  };

  const handleClassChange = (classId) => {
    const updated = [...characters];
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      class: classId,
    };
    setCharacters(updated);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontFamily: DESIGN.fonts.heading,
          fontSize: '36px',
          color: DESIGN.gold,
          textShadow: '0 0 20px rgba(212,175,55,0.3)',
          marginBottom: '10px',
        }}>
          Build Planner
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          Optimize your Diablo 4 character gear and stats
        </p>
      </div>

      {/* Character Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: DESIGN.border,
        paddingBottom: '15px',
        overflowX: 'auto',
      }}>
        {characters.map((char, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCharacter(idx)}
            style={{
              padding: '8px 16px',
              background: activeCharacter === idx ? DESIGN.cardGradient : 'transparent',
              border: activeCharacter === idx ? `1px solid ${DESIGN.gold}` : DESIGN.border,
              color: activeCharacter === idx ? DESIGN.gold : 'rgba(255,255,255,0.6)',
              fontFamily: DESIGN.fonts.body,
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (activeCharacter !== idx) {
                e.target.style.borderColor = DESIGN.gold;
                e.target.style.color = DESIGN.gold;
              }
            }}
            onMouseLeave={(e) => {
              if (activeCharacter !== idx) {
                e.target.style.borderColor = 'rgba(212,175,55,0.06)';
                e.target.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            {char.name}
          </button>
        ))}
      </div>

      {/* Class Selector */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{
          display: 'block',
          fontFamily: DESIGN.fonts.heading,
          color: DESIGN.gold,
          fontSize: '13px',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Select Class
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CLASSES.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleClassChange(cls.id)}
              style={{
                padding: '8px 14px',
                background: currentChar.class === cls.id 
                  ? `linear-gradient(135deg, ${cls.color}, ${cls.color}33)`
                  : 'rgba(212,175,55,0.06)',
                border: currentChar.class === cls.id 
                  ? `1px solid ${cls.color}`
                  : DESIGN.border,
                color: currentChar.class === cls.id ? cls.color : 'rgba(255,255,255,0.6)',
                fontFamily: DESIGN.fonts.body,
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = cls.color;
              }}
              onMouseLeave={(e) => {
                if (currentChar.class !== cls.id) {
                  e.target.style.borderColor = 'rgba(212,175,55,0.06)';
                }
              }}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '30px',
      }}>
        {/* Paper Doll */}
        <div>
          <PaperDoll
            equipment={currentChar.equipment}
            onEquip={handleEquipItem}
            onUnequip={handleUnequipItem}
          />
        </div>

        {/* Stat Calculator */}
        <div>
          <StatCalculator
            equipment={currentChar.equipment}
            characterClass={currentChar.class}
          />
        </div>
      </div>
    </div>
  );
}
