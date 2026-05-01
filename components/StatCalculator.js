import React, { useMemo, useState } from 'react';
import { CLASSES } from '../data/class-data';
import { DESIGN } from '../lib/constants';
import { computeCharacterStats, calculateDamage, effectiveLife, totalDR } from '../lib/damage-calc';

const SECTIONS = [
  {
    title: 'Core Stats',
    stats: [
      { key: 'strength', label: 'Strength', format: v => v },
      { key: 'intelligence', label: 'Intelligence', format: v => v },
      { key: 'willpower', label: 'Willpower', format: v => v },
      { key: 'dexterity', label: 'Dexterity', format: v => v },
    ],
  },
  {
    title: 'Offensive',
    stats: [
      { key: 'mainStatDmgBonus', label: 'Main Stat Dmg Bonus', format: v => `+${v}%` },
      { key: 'critChance', label: 'Critical Hit Chance', format: v => `${v}%` },
      { key: 'critDamage', label: 'Critical Hit Damage', format: v => `+${v}%` },
      { key: 'avgHit', label: 'Avg Hit (100% skill)', format: v => v.toLocaleString() },
    ],
  },
  {
    title: 'Defensive',
    stats: [
      { key: 'life', label: 'Life', format: v => v.toLocaleString() },
      { key: 'armor', label: 'Armor', format: v => v.toLocaleString() },
      { key: 'armorDR', label: 'Physical DR', format: v => `${v}%` },
      { key: 'effectiveHP', label: 'Effective HP', format: v => v.toLocaleString() },
      { key: 'dodgeChance', label: 'Dodge Chance', format: v => `${v}%` },
    ],
  },
  {
    title: 'Resistances',
    stats: [
      { key: 'fireRes', label: '🔥 Fire', format: v => `${v}%` },
      { key: 'coldRes', label: '❄️ Cold', format: v => `${v}%` },
      { key: 'lightningRes', label: '⚡ Lightning', format: v => `${v}%` },
      { key: 'poisonRes', label: '🧪 Poison', format: v => `${v}%` },
      { key: 'shadowRes', label: '🌑 Shadow', format: v => `${v}%` },
    ],
  },
  {
    title: 'Utility',
    stats: [
      { key: 'moveSpeed', label: 'Movement Speed', format: v => `${v}%` },
      { key: 'cooldownReduction', label: 'Cooldown Reduction', format: v => `${v}%` },
    ],
  },
];

export default function StatCalculator({ equipment, characterClass }) {
  const [monsterLevel, setMonsterLevel] = useState(100);

  const classData = useMemo(
    () => CLASSES.find((c) => c.id === characterClass) || CLASSES[0],
    [characterClass]
  );

  const allStats = useMemo(() => {
    // Collect equipped items as array
    const items = Object.values(equipment).filter(Boolean);

    // Compute full stat sheet
    const stats = computeCharacterStats(characterClass, classData.baseStats, items);

    // Calculate average hit with 100% skill multiplier
    const dmg = calculateDamage({
      baseDamage: 100,
      skillMultiplier: 100,
      classId: characterClass,
      mainStatValue: stats.mainStat,
      additiveBonuses: stats.additiveDmgSources,
      multiBonuses: stats.multiDmgSources,
      critChance: stats.critChance / 100,
      critDamage: stats.critDamage,
    });

    // Effective HP (physical)
    const ehp = Math.round(effectiveLife(stats.life, stats.armorDR / 100));

    return { ...stats, avgHit: dmg.avgHit, effectiveHP: ehp };
  }, [equipment, characterClass, classData]);

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

      {/* Class badge */}
      <div style={{
        padding: '12px 15px',
        background: `linear-gradient(135deg, ${classData.color}18, ${classData.color}08)`,
        border: `1px solid ${classData.color}44`,
        borderRadius: '4px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontFamily: DESIGN.fonts.heading, fontSize: '14px', color: classData.color }}>
          {classData.name}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: DESIGN.fonts.body }}>
          Main stat: {allStats.mainStatKey.toUpperCase()} ({allStats.mainStat})
        </div>
      </div>

      {/* Stat sections */}
      <div style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '16px',
        maxHeight: '600px',
        overflowY: 'auto',
      }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: '18px' }}>
            <div style={{
              fontFamily: DESIGN.fonts.heading,
              fontSize: '11px',
              color: DESIGN.gold,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(212,175,55,0.15)',
            }}>
              {section.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {section.stats.map(stat => {
                const val = allStats[stat.key];
                return (
                  <div
                    key={stat.key}
                    style={{
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(212,175,55,0.04)',
                      borderRadius: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: DESIGN.fonts.body,
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.6)',
                    }}>
                      {stat.label}
                    </span>
                    <span style={{
                      fontFamily: DESIGN.fonts.body,
                      fontSize: '12px',
                      color: DESIGN.gold,
                      fontWeight: 'bold',
                    }}>
                      {val != null ? stat.format(val) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Equipped items summary */}
        {Object.values(equipment).filter(Boolean).length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{
              fontFamily: DESIGN.fonts.heading,
              fontSize: '11px',
              color: DESIGN.gold,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '10px',
            }}>
              Equipped ({Object.values(equipment).filter(Boolean).length}/13)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.values(equipment).filter(Boolean).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)',
                    padding: '5px 8px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '2px',
                    borderLeft: `3px solid ${item.rarity === 'mythic' ? '#ff4500' : item.rarity === 'unique' ? '#c99f4b' : item.rarity === 'legendary' ? '#bf642f' : DESIGN.gold + '44'}`,
                    fontFamily: DESIGN.fonts.body,
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
