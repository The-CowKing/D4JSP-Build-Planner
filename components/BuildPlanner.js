import React, { useState, useEffect } from 'react';
import PaperDoll from './PaperDoll';
import StatCalculator from './StatCalculator';
import { CLASSES } from '../data/class-data';
import { DESIGN } from '../lib/constants';
import { supabase } from '../lib/supabase';

// Ask the parent app (trade app) for its Supabase session via postMessage.
// Times out after 3 s — returns null if not embedded or parent doesn't respond.
function requestSessionFromParent() {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      console.log('[BUILD-SAVE] postMessage auth: no response from parent within 3 s');
      resolve(null);
    }, 3000);

    function handler(event) {
      if (event.data?.type !== 'D4JSP_AUTH_SESSION') return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      const { access_token, refresh_token } = event.data;
      console.log('[BUILD-SAVE] postMessage auth: received session from parent');
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ data }) => resolve(data.session ?? null));
    }

    window.addEventListener('message', handler);
    // Tell the parent we're ready and need the auth session.
    window.parent.postMessage({ type: 'D4JSP_REQUEST_AUTH' }, '*');
    console.log('[BUILD-SAVE] postMessage auth: sent D4JSP_REQUEST_AUTH to parent');
  });
}

const DEFAULT_CHARACTERS = Array(5).fill(null).map((_, i) => ({
  id: i,
  name: `Character ${i + 1}`,
  class: CLASSES[0].id,
  gender: 'male',
  equipment: {},
  transmog: {},
  stats: {},
}));

export default function BuildPlanner() {
  const [activeCharacter, setActiveCharacter] = useState(0);
  const [characters, setCharacters] = useState(DEFAULT_CHARACTERS);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [userId, setUserId] = useState(null);

  // Acquire the user's real auth session then load saved builds.
  // Priority order:
  //   1. Existing session in localStorage (same-domain embedding, or already logged in)
  //   2. postMessage handshake with the parent trade app (iframe cross-domain)
  //   3. No session → saves disabled, read-only mode
  useEffect(() => {
    async function initAndLoad() {
      let { data: { session } } = await supabase.auth.getSession();
      console.log('[BUILD-SAVE] getSession result:', session ? `user_id=${session.user.id}` : 'none');

      if (!session) {
        session = await requestSessionFromParent();
      }

      if (!session) {
        console.warn('[BUILD-SAVE] No auth session — running read-only. Saves are disabled until the parent app provides a session.');
        return;
      }

      const uid = session.user.id;
      console.log('[BUILD-SAVE] Session ready — user_id:', uid);
      setUserId(uid);

      if (!uid) return;

      console.log('[BUILD-SAVE] Fetching saved builds for user');
      const { data, error } = await supabase
        .from('user_builds')
        .select('slot, name, character_class, gender, equipment, transmog, stats')
        .eq('user_id', uid);

      if (error) {
        console.error('[BUILD-SAVE] Load error — table missing, column mismatch, or RLS blocking SELECT:', {
          code: error.code, message: error.message, details: error.details, hint: error.hint,
        });
        return;
      }
      if (!data?.length) {
        console.log('[BUILD-SAVE] Load: no saved builds found for this user');
        return;
      }
      console.log('[BUILD-SAVE] Load: received', data.length, 'builds:', data.map(r => ({ slot: r.slot, name: r.name })));
      setCharacters((prev) => {
        const next = [...prev];
        data.forEach((row) => {
          next[row.slot] = {
            id: row.slot,
            name: row.name,
            class: row.character_class,
            gender: row.gender,
            equipment: row.equipment ?? {},
            transmog: row.transmog ?? {},
            stats: row.stats ?? {},
          };
        });
        return next;
      });
    }
    initAndLoad();
  }, []);

  const currentChar = characters[activeCharacter];

  const handleEquipItem = (slotId, item) => {
    const updated = [...characters];
    updated[activeCharacter] = {
      ...updated[activeCharacter],
      equipment: { ...updated[activeCharacter].equipment, [slotId]: item },
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
    updated[activeCharacter] = { ...updated[activeCharacter], class: classId };
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

  const handleSave = async () => {
    if (!userId) {
      console.error('[BUILD-SAVE] Save blocked — no user session yet');
      return;
    }
    setSaveState('saving');

    console.log('[BUILD-SAVE] Save triggered:', {
      table: 'user_builds',
      user_id: userId,
      slot: activeCharacter,
      name: currentChar.name,
      character_class: currentChar.class,
      gender: currentChar.gender,
      equipmentSlots: Object.keys(currentChar.equipment).length,
    });

    try {
      const payload = {
        user_id: userId,
        slot: activeCharacter,
        name: currentChar.name,
        character_class: currentChar.class,
        gender: currentChar.gender,
        equipment: currentChar.equipment,
        transmog: currentChar.transmog,
        stats: currentChar.stats,
        updated_at: new Date().toISOString(),
      };

      console.log('[BUILD-SAVE] Calling supabase.from("user_builds").upsert()');

      const { data, error } = await supabase
        .from('user_builds')
        .upsert(payload, { onConflict: 'user_id,slot' })
        .select();

      if (error) {
        console.error('[BUILD-SAVE] Supabase upsert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log('[BUILD-SAVE] Upsert success — rows affected:', data?.length ?? 0);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err) {
      console.error('[BUILD-SAVE] Save failed (full error):', err);
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const saveLabel = {
    idle:   'Save Build',
    saving: 'Saving…',
    saved:  'Saved!',
    error:  'Save Failed',
  }[saveState];

  const saveBg = {
    idle:   DESIGN.gold,
    saving: 'rgba(212,175,55,0.5)',
    saved:  '#4caf50',
    error:  '#e53935',
  }[saveState];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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

        {/* Save button */}
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
            flexShrink: 0,
          }}
        >
          {saveLabel}
        </button>
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
    </div>
  );
}
