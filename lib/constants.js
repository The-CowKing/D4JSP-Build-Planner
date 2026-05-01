// Design System — matches main D4JSP site
export const DESIGN = {
  background: '#080608',
  gold: '#D4AF37',
  cardGradient: 'linear-gradient(135deg, #0e0c10, #111018)',
  border: '1px solid rgba(212,175,55,0.06)',
  fonts: {
    heading: "'Cinzel', 'Georgia', serif",
    body: "'Barlow Condensed', sans-serif",
  },
};

// Rarity Colors
export const RARITY_COLORS = {
  common: '#9d9d9d',
  magic: '#6969ff',
  rare: '#ffd700',
  legendary: '#bf642f',
  unique: '#c99f4b',
  mythic: '#ff4500',
};

// Affix types that map to calculation engine
export const AFFIX_TYPES = {
  // Core stats
  STRENGTH:     'strength',
  INTELLIGENCE: 'intelligence',
  WILLPOWER:    'willpower',
  DEXTERITY:    'dexterity',
  ALL_STATS:    'all_stats',
  // Offense
  ADDITIVE_DMG: 'additive_damage',
  MULTI_DMG:    'multi_damage',
  CRIT_CHANCE:  'crit_chance',
  CRIT_DAMAGE:  'crit_damage',
  // Defense
  ARMOR:        'armor',
  ARMOR_PCT:    'armor_pct',
  LIFE:         'life',
  LIFE_PCT:     'life_pct',
  ALL_RES:      'all_res',
  FIRE_RES:     'fire_res',
  COLD_RES:     'cold_res',
  LIGHT_RES:    'lightning_res',
  POISON_RES:   'poison_res',
  SHADOW_RES:   'shadow_res',
  // Utility
  MOVE_SPEED:   'move_speed',
  CDR:          'cooldown_reduction',
};
