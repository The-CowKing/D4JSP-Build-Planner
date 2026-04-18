import React, { useState } from 'react';
import PaperDoll from './PaperDoll';
import StatCalculator from './StatCalculator';
import { CLASSES } from '../data/class-data';
import { DESIGN } from '../lib/constants';
import { supabase } from '../lib/supabase';

// ─── Locked-feature overlay ───────────────────────────────────────────────────
// Soft gate: show the feature, gray it out, explain what tier unlocks it.
// Dismissable by clicking backdrop or the button.
function LockedFeatureOverlay({ featureName, tierRequired, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,8,0.84)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0e0c10, #111018)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '4px',
          padding: '36px 40px',
          maxWidth: '360px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '28px', marginBottom: '14px', opacity: 0.7 }}>🔒</div>
        <h3 style={{
          fontFamily: DESIGN.fonts.heading,
          color: DESIGN.gold,
          fontSize: '16px',
          marginBottom: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          {featureName}
        </h3>
        <p style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: '13px',
          fontFamily: DESIGN.fonts.body,
          marginBottom: '24px',
          lineHeight: 1.5,
        }}>
          Upgrade to <strong style={{ color: DESIGN.gold }}>{tierRequired}</strong> to unlock
          this build slot and access boss-farming map features.
        </p>
        <button
          onClick={onDismiss}
          style={{
            padding: '9px 24px',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.35)',
            color: DESIGN.gold,
            fontFamily: DESIGN.fonts.body,
            fontSize: '12px',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.22)';
            e.currentTarget.style.borderColor = DESIGN.gold;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(212,175,55,0.12)';
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Notification toggle ──────────────────────────────────────────────────────
// Per-build opt-in for trade listing alerts.
function NotifyToggle({ enabled, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(!enabled)}
        title={enabled ? 'Disable trade notifications' : 'Notify me when build items are listed in trade'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          background: enabled
            ? 'rgba(212,175,55,0.18)'
            : 'rgba(212,175,55,0.04)',
          border: enabled
            ? '1px solid rgba(212,175,55,0.55)'
            : '1px solid rgba(212,175,55,0.15)',
          color: enabled ? DESIGN.gold : 'rgba(255,255,255,0.4)',
          fontFamily: DESIGN.fonts.body,
          fontSize: '11px',
          cursor: 'pointer',
          borderRadius: '2px',
          transition: 'all 0.15s ease',
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = DESIGN.gold;
          e.currentTarget.style.color = DESIGN.gold;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = enabled
            ? 'rgba(212,175,55,0.55)'
            : 'rgba(212,175,55,0.15)';
          e.currentTarget.style.color = enabled ? DESIGN.gold : 'rgba(255,255,255,0.4)';
        }}
      >
        <span style={{ fontSize: '12px' }}>{enabled ? '🔔' : '🔕'}</span>
        Trade Alerts
      </button>
    </div>
  );
}

// ─── Locked notification hint ─────────────────────────────────────────────────
// Shown when the user's tier doesn't include d4_build_notify_trade.
function LockedNotifyHint() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 10px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '2px',
      color: 'rgba(255,255,255,0.22)',
      fontFamily: DESIGN.fonts.body,
      fontSize: '11px',
      cursor: 'default',
      letterSpacing: '0.5px',
    }}
    title="Upgrade to Basic or higher to unlock trade notifications"
    >
      <span style={{ fontSize: '12px', opacity: 0.4 }}>🔕</span>
      Trade Alerts
      <span style={{ fontSize: '9px', opacity: 0.5 }}>🔒</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// permissions: object from D4JSP's resolved user permissions, e.g.
//   { d4_build_slots: '3', d4_build_notify_trade: '1', d4_map_access: '1' }
// Defaults to free-tier values if omitted.
export default function BuildPlanner({ permissions = {} }) {
  const maxBuildSlots = Math.max(1, parseInt(permissions.d4_build_slots ?? '1', 10) || 1);
  const canNotify     = permissions.d4_build_notify_trade === '1';

  // Tier name shown in the locked-slot overlay (cheapest tier that unlocks 2+ slots)
  const UNLOCK_TIER = 'Basic';

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
      notifyTrade: false,
    }))
  );
  const [saveState, setSaveState] = useState('idle');
  const [lockedOverlay, setLockedOverlay] = useState(null); // { slotIdx }

  const currentChar = characters[activeCharacter];

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTabClick = (idx) => {
    if (idx >= maxBuildSlots) {
      setLockedOverlay({ slotIdx: idx });
    } else {
      setActiveCharacter(idx);
    }
  };

  const updateChar = (updater) => {
    setCharacters((prev) => {
      const next = [...prev];
      next[activeCharacter] = updater(next[activeCharacter]);
      return next;
    });
  };

  const handleEquipItem = (slotId, item) =>
    updateChar((c) => ({ ...c, equipment: { ...c.equipment, [slotId]: item } }));

  const handleUnequipItem = (slotId) =>
    updateChar((c) => {
      const { [slotId]: _eq, ...restEquip } = c.equipment;
      const { [slotId]: _tx, ...restTransmog } = c.transmog;
      return { ...c, equipment: restEquip, transmog: restTransmog };
    });

  const handleClassChange = (classId) =>
    updateChar((c) => ({ ...c, class: classId }));

  const handleGenderChange = (gender) =>
    updateChar((c) => ({ ...c, gender }));

  const handleTransmogChange = (slotId, appearanceKey) =>
    updateChar((c) => ({
      ...c,
      transmog: { ...c.transmog, [slotId]: appearanceKey },
    }));

  const handleNotifyChange = (val) =>
    updateChar((c) => ({ ...c, notifyTrade: val }));

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const payload = {
        slot: activeCharacter,
        name: currentChar.name,
        class: currentChar.class,
        gender: currentChar.gender,
        equipment: currentChar.equipment,
        transmog: currentChar.transmog,
        stats: currentChar.stats,
        notify_trade: canNotify && currentChar.notifyTrade,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('builds')
        .upsert(payload, { onConflict: 'slot' });

      if (error) throw error;

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const saveLabel = { idle: 'Save Build', saving: 'Saving…', saved: 'Saved!', error: 'Save Failed' }[saveState];
  const saveBg    = { idle: DESIGN.gold, saving: 'rgba(212,175,55,0.5)', saved: '#4caf50', error: '#e53935' }[saveState];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
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

        {/* Save row: notification toggle + save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {canNotify ? (
            <NotifyToggle
              enabled={currentChar.notifyTrade}
              onChange={handleNotifyChange}
            />
          ) : (
            <LockedNotifyHint />
          )}

          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={{
              padding: '10px 22px',
              background: saveBg,
              border: 'none',
              color: '#0a0a0a',
              fontFamily: DESIGN.fonts.heading,
              fontSize: '13px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: saveState === 'saving' ? 'wait' : 'pointer',
              borderRadius: '2px',
              transition: 'background 0.2s ease',
            }}
          >
            {saveLabel}
          </button>
        </div>
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
        {characters.map((char, idx) => {
          const locked = idx >= maxBuildSlots;
          const active = activeCharacter === idx && !locked;
          return (
            <button
              key={idx}
              onClick={() => handleTabClick(idx)}
              title={locked ? `Upgrade to ${UNLOCK_TIER} to unlock this slot` : char.name}
              style={{
                padding: '8px 16px',
                background: active ? DESIGN.cardGradient : 'transparent',
                border: active
                  ? `1px solid ${DESIGN.gold}`
                  : locked
                  ? '1px solid rgba(255,255,255,0.04)'
                  : DESIGN.border,
                color: active
                  ? DESIGN.gold
                  : locked
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0.6)',
                fontFamily: DESIGN.fonts.body,
                fontSize: '13px',
                cursor: locked ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                opacity: locked ? 0.45 : 1,
              }}
              onMouseEnter={(e) => {
                if (!active && !locked) {
                  e.currentTarget.style.borderColor = DESIGN.gold;
                  e.currentTarget.style.color = DESIGN.gold;
                }
              }}
              onMouseLeave={(e) => {
                if (!active && !locked) {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.06)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }
              }}
            >
              {char.name}
              {locked && (
                <span style={{
                  marginLeft: '5px',
                  fontSize: '9px',
                  opacity: 0.6,
                }}>
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Class + Gender Selector */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
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
        <div>
          <StatCalculator
            equipment={currentChar.equipment}
            characterClass={currentChar.class}
          />
        </div>
      </div>

      {/* Locked slot overlay — soft gate with upgrade prompt */}
      {lockedOverlay && (
        <LockedFeatureOverlay
          featureName={`Build Slot ${lockedOverlay.slotIdx + 1}`}
          tierRequired={UNLOCK_TIER}
          onDismiss={() => setLockedOverlay(null)}
        />
      )}
    </div>
  );
}
