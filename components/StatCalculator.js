import React, { useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CLASSES } from '../data/class-data';
import { DESIGN, STAT_CATEGORIES } from '../lib/constants';

export default function StatCalculator({ equipment, characterClass }) {
  const classData = useMemo(
    () => CLASSES.find((c) => c.id === characterClass) || CLASSES[0],
    [characterClass]
  );

  const computedStats = useMemo(() => {
    // Base stats from class
    const baseStats = {
      strength: classData.baseStats.strength || 0,
      intelligence: classData.baseStats.intelligence || 0,
      willpower: classData.baseStats.willpower || 0,
      dexterity: classData.baseStats.dexterity || 0,
    };

    // Derived stats (simplified calculation)
    const stats = {
      'Attack Power': Math.round((baseStats.strength * 1.2 + baseStats.dexterity * 0.5) * 10),
      'Defense': Math.round((baseStats.willpower * 1.5 + baseStats.strength * 0.3) * 8),
      'Life': Math.round((baseStats.willpower * 15 + baseStats.strength * 8) + 100),
      'Fire Resistance': Math.round(baseStats.willpower * 2),
      'Cold Resistance': Math.round(baseStats.willpower * 2),
      'Lightning Resistance': Math.round(baseStats.intelligence * 2),
      'Poison Resistance': Math.round(baseStats.intelligence * 2),
      'Shadow Resistance': Math.round(baseStats.intelligence * 1.5),
      'Critical Hit Chance': Math.round(baseStats.dexterity * 0.8),
      'Critical Hit Damage': Math.round(baseStats.dexterity * 1.2 + 20),
      'Movement Speed': Math.round(baseStats.dexterity * 0.5 + 10),
      'Cooldown Reduction': Math.round(baseStats.intelligence * 0.3),
    };

    // Add affixes from equipped items (simplified - in production would query d4_affixes)
    Object.values(equipment).forEach((item) => {
      if (item && item.rarity) {
        const multiplier = item.rarity.toLowerCase() === 'legendary' ? 0.05 : 0.03;
        stats['Attack Power'] += Math.round(stats['Attack Power'] * multiplier);
        stats['Defense'] += Math.round(stats['Defense'] * multiplier);
      }
    });

    return stats;
  }, [equipment, classData]);

  const renderStatSection = (title, statNames) => (
    <div key={title} style={{ marginBottom: '20px' }}>
      <h3 style={{
        fontFamily: DESIGN.fonts.heading,
        fontSize: '12px',
        color: DESIGN.gold,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `1px solid rgba(212,175,55,0.2)`,
      }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {statNames.map((statName) => (
          <div
            key={statName}
            style={{
              padding: '10px',
              background: 'rgba(0,0,0,0.2)',
              border: DESIGN.border,
              borderRadius: '2px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{
              fontFamily: DESIGN.fonts.body,
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
            }}>
              {statName}
            </span>
            <span style={{
              fontFamily: DESIGN.fonts.body,
              fontSize: '13px',
              color: DESIGN.gold,
              fontWeight: 'bold',
            }}>
              {computedStats[statName] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

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
        Character Stats
      </h2>

      {/* Class Info */}
      <div style={{
        padding: '15px',
        background: `linear-gradient(135deg, ${classData.color}, ${classData.color}11)`,
        border: `1px solid ${classData.color}`,
        borderRadius: '4px',
        marginBottom: '20px',
      }}>
        <div style={{
          fontFamily: DESIGN.fonts.heading,
          fontSize: '14px',
          color: classData.color,
          marginBottom: '8px',
        }}>
          {classData.name}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          fontSize: '11px',
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>STR</div>
            <div style={{ color: classData.color, fontWeight: 'bold' }}>
              {classData.baseStats.strength}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>INT</div>
            <div style={{ color: classData.color, fontWeight: 'bold' }}>
              {classData.baseStats.intelligence}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>WIL</div>
            <div style={{ color: classData.color, fontWeight: 'bold' }}>
              {classData.baseStats.willpower}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>DEX</div>
            <div style={{ color: classData.color, fontWeight: 'bold' }}>
              {classData.baseStats.dexterity}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Container */}
      <div style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '20px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}>
        {renderStatSection('Offensive', STAT_CATEGORIES.offensive)}
        {renderStatSection('Defensive', STAT_CATEGORIES.defensive)}
        {renderStatSection('Mobility', STAT_CATEGORIES.mobility)}

        {/* Equipped Items Summary */}
        {Object.keys(equipment).length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: DESIGN.border }}>
            <h3 style={{
              fontFamily: DESIGN.fonts.heading,
              fontSize: '12px',
              color: DESIGN.gold,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}>
              Equipped Items
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(equipment).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '6px 8px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '2px',
                    borderLeft: `3px solid ${item.rarity ? '#D4AF37' : 'rgba(212,175,55,0.3)'}`,
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
