import React, { useState } from 'react';
import PaperDoll from './PaperDoll';
import StatCalculator from './StatCalculator';
import { CLASSES } from '../data/class-data';
import { DESIGN } from '../lib/constants';

export default function BuildPlanner() {
  const [activeCharacter, setActiveCharacter] = useState(0);
  const [characters, setCharacters] = useState(
    Array(5).fill(null).map((_, i) => ({
      id: i,
      name: `Character ${i + 1}`,
      class: CLASSES[0].id,
      gender: 'male',
      equipment: {},
      transmog: {},
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
    const { [slotId]: _eq, ...restEquip } = updated[activeCharacter].equipment;
    const { [slotId]: _tx, ...restTransmog } = updated[activeCharacter].transmog;
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      equipment: restEquip,
      transmog: restTransmog,
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

  const handleGenderChange = (gender) => {
    const updated = [...characters];
    updated[activeCharacter] = { ...updated[activeCharacter], gender };
    setCharacters(updated);
  };

  const handleTransmogChange = (slotId, appearanceKey) => {
    const updated = [...characters];
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      transmog: {
        ...updated[activeCharacter].transmog,
        [slotId]: appearanceKey,
      },
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

      {/* Class + Gender Selector */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Class buttons */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
                onMouseEnter={(e) => { e.target.style.borderColor = cls.color; }}
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

        {/* Gender toggle */}
        <div>
          <label style={{
            display: 'block',
            fontFamily: DESIGN.fonts.heading,
            color: DESIGN.gold,
            fontSize: '13px',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Gender
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['male', 'female'].map((g) => (
              <button
                key={g}
                onClick={() => handleGenderChange(g)}
                style={{
                  padding: '8px 16px',
                  background: currentChar.gender === g
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))'
                    : 'rgba(212,175,55,0.04)',
                  border: currentChar.gender === g
                    ? `1px solid ${DESIGN.gold}`
                    : DESIGN.border,
                  color: currentChar.gender === g ? DESIGN.gold : 'rgba(255,255,255,0.5)',
                  fontFamily: DESIGN.fonts.body,
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = DESIGN.gold; }}
                onMouseLeave={(e) => {
                  if (currentChar.gender !== g) {
                    e.target.style.borderColor = 'rgba(212,175,55,0.06)';
                  }
                }}
              >
                {g}
              </button>
            ))}
          </div>
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
            characterClass={currentChar.class}
            gender={currentChar.gender}
            equipment={currentChar.equipment}
            transmog={currentChar.transmog}
            onEquip={handleEquipItem}
            onUnequip={handleUnequipItem}
            onTransmogChange={handleTransmogChange}
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
