import React, { useState, useEffect } from 'react';
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

  // 2026-05-02 (Adam: WP build-guide "Add to Builder" button). The trade-app
  // AppShell receives ?load_build=<slug>, calls /api/builder/save-from-guide
  // which inserts into user_builds, then redirects here as
  // /builder/?load=<row_id>&slot=<N>. We fetch that row by id (RLS-gated:
  // user must own it), overwrite the local slot N state with its contents,
  // and switch the active tab to N. ?cap=1 (alone) signals 5-cap reached —
  // surface a one-time toast. Params are stripped after read so refresh
  // doesn't re-fire the load.
  const [loadToast, setLoadToast] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const loadId = params.get('load');
    const slotStr = params.get('slot');
    const cap = params.get('cap');
    const stripParams = () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('load');
        url.searchParams.delete('slot');
        url.searchParams.delete('cap');
        window.history.replaceState({}, '', url.pathname + (url.search || ''));
      } catch (_) {}
    };
    if (cap === '1' && !loadId) {
      setLoadToast({ type: 'cap', message: "You're at the 5-build limit. Clear a slot before adding more." });
      setTimeout(() => setLoadToast(null), 5000);
      stripParams();
      return;
    }
    if (!loadId) return;
    const slotIdx = Math.max(0, Math.min(4, parseInt(slotStr, 10) || 0));
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadToast({ type: 'err', message: 'Sign in to load builds' });
          setTimeout(() => setLoadToast(null), 4000);
          stripParams();
          return;
        }
        const { data: row, error } = await supabase
          .from('user_builds')
          .select('id, slot, name, character_class, equipment, build_data')
          .eq('id', loadId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (error || !row) {
          setLoadToast({ type: 'err', message: 'Build not found' });
          setTimeout(() => setLoadToast(null), 4000);
          stripParams();
          return;
        }
        const targetSlot = (typeof row.slot === 'number') ? row.slot : slotIdx;
        const bd = row.build_data || {};
        setCharacters((prev) => {
          const next = [...prev];
          next[targetSlot] = {
            id: targetSlot,
            name: row.name || `Character ${targetSlot + 1}`,
            class: row.character_class || bd.class || CLASSES[0].id,
            gender: bd.gender || 'male',
            equipment: row.equipment || bd.equipment || {},
            transmog: bd.transmog || {},
            stats: bd.stats || {},
            notifyTrade: !!bd.notifyTrade,
          };
          return next;
        });
        setActiveCharacter(targetSlot);
        setLoadToast({ type: 'ok', message: `Loaded "${row.name || 'build'}" into slot ${targetSlot + 1}` });
        setTimeout(() => setLoadToast(null), 4000);
      } catch (e) {
        console.error('[BuildPlanner] load-by-id error:', e);
        setLoadToast({ type: 'err', message: 'Error loading build' });
        setTimeout(() => setLoadToast(null), 4000);
      } finally {
        stripParams();
      }
    })();
  }, []);

  // 2026-04-28 (builder save fix): the prior handler wrote to a non-existent
  // table 'builds' with the wrong column names and no user_id. The real
  // table is `user_builds` (migration 047) with: user_id, slot_number, name,
  // character_class, equipment, build_data jsonb, is_pinned. RLS-gated so
  // user_id MUST equal auth.uid(). Per agent-outputs/investigations/builder_save.md.
  const handleSave = async () => {
    setSaveState('saving');
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Sign in to save builds');

      const { error } = await supabase
        .from('user_builds')
        .upsert({
          user_id: user.id,
          slot_number: activeCharacter,
          name: currentChar.name,
          character_class: currentChar.class,
          equipment: currentChar.equipment,
          build_data: {
            class: currentChar.class,
            gender: currentChar.gender,
            equipment: currentChar.equipment,
            transmog: currentChar.transmog,
            stats: currentChar.stats,
            notify_trade: canNotify && currentChar.notifyTrade,
          },
          is_pinned: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,slot_number' });

      if (error) throw error;

      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);

      // 2026-04-28: notify any embedding parent (Map iframe) that builds
      // changed, so the cache-invalidation listener there can refetch.
      // Safe in standalone use too — postMessage to non-embedded window.parent
      // === window is a no-op.
      try {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'd4jsp:build-saved', userId: user.id }, '*');
        }
      } catch (_) { /* postMessage failure is non-fatal */ }
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

      {/* 2026-05-02 — load-from-WP-button toast (?load / ?cap) */}
      {loadToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 3000, padding: '10px 18px',
            fontFamily: DESIGN.fonts.heading || 'Cinzel, serif',
            fontSize: 14, letterSpacing: '0.5px',
            color: loadToast.type === 'err' ? '#fff' : '#0d0b0f',
            background:
              loadToast.type === 'ok'  ? DESIGN.gold :
              loadToast.type === 'cap' ? '#e0a800' :
                                          '#c0392b',
            border: '1px solid rgba(0,0,0,0.4)',
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {loadToast.message}
        </div>
      )}

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

      {/* Main Content Grid — auto-stacks to single column on viewports
          where each column would be < 380px (i.e. < ~790px viewport).
          Fixes mobile overflow where the 1fr/1fr split squeezed PaperDoll
          (intrinsic ~394px wide) into ~150px columns and clipped slots
          off the right edge. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}>
        <div style={{ minWidth: 0 }}>
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
        <div style={{ minWidth: 0 }}>
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
