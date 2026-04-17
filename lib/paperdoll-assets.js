// Asset path conventions and placeholder generators for the paper doll system.
// Real PNGs live at /public/paperdoll/base/{class}/{gender}.png and
// /public/paperdoll/gear/{class}/{slot}/{key}.png.
// When an image 404s, the PaperDoll component falls back to the generated
// SVG data-URLs produced by this module.

export const CLASS_COLORS = {
  barbarian:   '#c17f34',
  druid:       '#5b8a3e',
  necromancer: '#38b38a',
  rogue:       '#8a3a3a',
  sorcerer:    '#3a5a8a',
  spiritborn:  '#9b59b6',
  paladin:     '#f1c40f',
};

// z-index layering for gear overlays (lower = behind)
export const SLOT_ZINDEX = {
  ring1:    5,
  ring2:    5,
  boots:    10,
  legs:     20,
  mainhand: 25,
  offhand:  25,
  chest:    30,
  gloves:   40,
  amulet:   50,
  helm:     60,
};

// Distinctive tint per slot for placeholder overlays
const SLOT_TINTS = {
  helm:     '#8B4513',
  amulet:   '#DAA520',
  chest:    '#4169E1',
  gloves:   '#228B22',
  legs:     '#8B4513',
  boots:    '#2F4F4F',
  mainhand: '#B22222',
  offhand:  '#4B0082',
  ring1:    '#FFD700',
  ring2:    '#FF69B4',
};

// SVG shapes in a 220×440 coordinate space, one per slot.
// Each is the FULL canvas size with content only in the relevant body zone.
const SLOT_OVERLAY_SHAPES = {
  helm: `
    <ellipse cx="110" cy="60" rx="50" ry="56" fill="{c}" opacity="0.55"/>
    <ellipse cx="110" cy="32" rx="32" ry="20" fill="{c}" opacity="0.25"/>`,

  amulet: `
    <ellipse cx="110" cy="120" rx="18" ry="14" fill="{c}" opacity="0.75"/>
    <line x1="84" y1="108" x2="110" y2="120" stroke="{c}" stroke-width="3" opacity="0.65"/>
    <line x1="136" y1="108" x2="110" y2="120" stroke="{c}" stroke-width="3" opacity="0.65"/>`,

  chest: `
    <path d="M 58 108 Q 32 124 30 172 L 38 250 L 182 250 L 190 172 Q 188 124 162 108 Z"
          fill="{c}" opacity="0.45"/>`,

  gloves: `
    <ellipse cx="26"  cy="296" rx="20" ry="25" fill="{c}" opacity="0.65"/>
    <ellipse cx="194" cy="296" rx="20" ry="25" fill="{c}" opacity="0.65"/>`,

  legs: `
    <path d="M 62 248 Q 52 315 57 368 Q 65 382 88 382 Q 102 382 100 366 L 100 248 Z"
          fill="{c}" opacity="0.45"/>
    <path d="M 158 248 Q 168 315 163 368 Q 155 382 132 382 Q 118 382 120 366 L 120 248 Z"
          fill="{c}" opacity="0.45"/>`,

  boots: `
    <ellipse cx="76"  cy="422" rx="36" ry="18" fill="{c}" opacity="0.65"/>
    <ellipse cx="144" cy="422" rx="36" ry="18" fill="{c}" opacity="0.65"/>`,

  mainhand: `
    <rect  x="4"  y="176" width="30" height="130" rx="5" fill="{c}" opacity="0.55"/>
    <rect  x="0"  y="232" width="38" height="12"  rx="3" fill="{c}" opacity="0.7"/>`,

  offhand: `
    <rect  x="186" y="128" width="34" height="96" rx="6" fill="{c}" opacity="0.55"/>
    <rect  x="183" y="114" width="40" height="14" rx="3" fill="{c}" opacity="0.7"/>`,

  ring1: `
    <circle cx="16"  cy="314" r="10" fill="none" stroke="{c}" stroke-width="6" opacity="0.85"/>`,

  ring2: `
    <circle cx="204" cy="314" r="10" fill="none" stroke="{c}" stroke-width="6" opacity="0.85"/>`,
};

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generates a class-coloured humanoid silhouette as a data-URL SVG.
// Used as fallback when the real PNG base character isn't available yet.
export function generateBasePlaceholder(characterClass, gender = 'male') {
  const color = CLASS_COLORS[characterClass] || '#888888';
  // Female gets slightly narrower shoulders
  const sw = gender === 'female' ? 20 : 27;

  const svg = `<svg viewBox="0 0 220 440" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="62%">
      <stop offset="0%"   stop-color="${color}" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.60"/>
    </radialGradient>
  </defs>
  <!-- ground shadow -->
  <ellipse cx="110" cy="435" rx="60" ry="10" fill="black" opacity="0.28"/>
  <!-- head -->
  <ellipse cx="110" cy="58" rx="32" ry="38" fill="url(#g)"/>
  <!-- neck -->
  <rect x="100" y="90" width="20" height="22" fill="url(#g)"/>
  <!-- torso -->
  <path d="M 58 108 Q 32 122 30 168 L 38 250 L 182 250 L 190 168 Q 188 122 162 108 Z" fill="url(#g)"/>
  <!-- shoulder pads -->
  <ellipse cx="42"  cy="130" rx="${sw}" ry="18" fill="url(#g)"/>
  <ellipse cx="178" cy="130" rx="${sw}" ry="18" fill="url(#g)"/>
  <!-- upper arms -->
  <path d="M 18 126 Q 10 186 14 226 Q 18 236 30 236 Q 42 236 40 218 L 40 126 Z" fill="url(#g)"/>
  <path d="M 202 126 Q 210 186 206 226 Q 202 236 190 236 Q 178 236 180 218 L 180 126 Z" fill="url(#g)"/>
  <!-- forearms -->
  <path d="M 12 222 Q 6 268 14 290 Q 18 298 28 298 Q 38 298 36 284 L 30 222 Z" fill="url(#g)"/>
  <path d="M 208 222 Q 214 268 206 290 Q 202 298 192 298 Q 182 298 184 284 L 190 222 Z" fill="url(#g)"/>
  <!-- hands -->
  <ellipse cx="21"  cy="308" rx="15" ry="20" fill="url(#g)"/>
  <ellipse cx="199" cy="308" rx="15" ry="20" fill="url(#g)"/>
  <!-- pelvis -->
  <path d="M 40 245 Q 34 270 48 280 L 172 280 Q 186 270 180 245 Z" fill="url(#g)"/>
  <!-- left leg -->
  <path d="M 54 274 Q 46 332 52 374 Q 60 386 84 386 Q 98 386 97 370 L 96 274 Z" fill="url(#g)"/>
  <!-- right leg -->
  <path d="M 166 274 Q 174 332 168 374 Q 160 386 136 386 Q 122 386 123 370 L 124 274 Z" fill="url(#g)"/>
  <!-- left shin -->
  <path d="M 51 370 Q 48 412 56 430 Q 63 440 82 440 Q 95 440 95 428 L 95 370 Z" fill="url(#g)"/>
  <!-- right shin -->
  <path d="M 169 370 Q 172 412 164 430 Q 157 440 138 440 Q 125 440 125 428 L 125 370 Z" fill="url(#g)"/>
  <!-- feet -->
  <ellipse cx="73"  cy="433" rx="30" ry="12" fill="url(#g)"/>
  <ellipse cx="147" cy="433" rx="30" ry="12" fill="url(#g)"/>
</svg>`;

  return encodeSvg(svg);
}

// Generates a slot-tinted gear overlay as a data-URL SVG.
// The overlay is the full 220×440 canvas; only the relevant body zone has content.
export function generateGearPlaceholder(slotId) {
  const color = SLOT_TINTS[slotId] || '#888888';
  const shapes = (SLOT_OVERLAY_SHAPES[slotId] || '').replace(/\{c\}/g, color);

  const svg = `<svg viewBox="0 0 220 440" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
  return encodeSvg(svg);
}

// Deterministic asset paths — Next.js serves these from /public/paperdoll/
export function getBaseCharacterPath(characterClass, gender = 'male') {
  return `/paperdoll/base/${characterClass}/${gender}.png`;
}

export function getGearAppearancePath(characterClass, slotId, appearanceKey = 'base') {
  return `/paperdoll/gear/${characterClass}/${slotId}/${appearanceKey}.png`;
}

// Available transmog appearances for a slot.
// Returns hardcoded placeholder data until d4_cosmetic_appearances is populated.
// In production, swap this for a Supabase query filtered by class + slot.
export function getAvailableAppearances(slotId, characterClass) {
  return [
    { key: 'base',     label: 'Base Appearance',       source: 'base_drop' },
    { key: 'ornate',   label: 'Ornate (placeholder)',   source: 'shop' },
    { key: 'seasonal', label: 'Seasonal (placeholder)', source: 'seasonal' },
  ];
}
