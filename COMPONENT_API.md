# Component API Reference

## BuildPlanner (Main)

**File:** `components/BuildPlanner.js`

The root component managing character state and layout.

### Props
None — standalone component.

### State
```jsx
{
  activeCharacter: number (0-4),
  characters: [
    {
      id: number,
      name: string,
      class: string (class id),
      equipment: { [slotId]: item },
      stats: {} // reserved for future use
    }
  ]
}
```

### Handlers
- `handleEquipItem(slotId, item)` — Equips item in slot
- `handleUnequipItem(slotId)` — Removes item from slot
- `handleClassChange(classId)` — Changes character class

### Renders
- Character tab selector (5 tabs)
- Class picker (7 buttons)
- Grid with PaperDoll and StatCalculator

---

## PaperDoll

**File:** `components/PaperDoll.js`

Visual equipment layout with 13 gear slots.

### Props
```jsx
{
  equipment: { [slotId]: item },  // Currently equipped items
  onEquip: (slotId, item) => {},  // Callback when item selected
  onUnequip: (slotId) => {}       // Callback when remove clicked
}
```

### Internal State
```jsx
{
  selectedSlot: { id, label, type, x, y } | null,
  showSearch: boolean
}
```

### Renders
- SVG body outline (reference)
- 13 positioned gear slot boxes
- ItemSearch modal overlay (conditional)

### Item Object Schema
```jsx
{
  id: string,
  name: string,
  type: string (e.g., 'Helm', 'ChestArmor'),
  rarity: string (lowercase: 'common', 'magic', 'rare', etc.),
  image_url: string (optional)
}
```

---

## ItemSearch

**File:** `components/ItemSearch.js`

Modal search interface for finding and equipping items.

### Props
```jsx
{
  slotType: string,           // Gear type filter (e.g., 'Helm', 'Weapon')
  onSelect: (item) => {},     // Callback when item clicked
  onClose: () => {}           // Callback when modal closed
}
```

### Internal State
```jsx
{
  query: string,
  results: item[],
  loading: boolean,
  error: string | null
}
```

### Database Query
```sql
SELECT id, name, type, rarity, image_url
FROM d4_equipment
WHERE name ILIKE '%{query}%'
  AND type ILIKE '%{slotType}%'
LIMIT 20
```

### Features
- Real-time search with 300ms debounce
- Autocomplete filtering by slot type
- Rarity color coding in results
- Keyboard focus on mount (useRef + focus)
- Click-outside handling (modal wrapper)

---

## StatCalculator

**File:** `components/StatCalculator.js`

Displays character stats based on class and equipped items.

### Props
```jsx
{
  equipment: { [slotId]: item },  // Currently equipped items
  characterClass: string          // Class ID (e.g., 'barbarian')
}
```

### Computed Stats
All stats are calculated in `useMemo` based on:
1. **Base stats** from class definition (STR/INT/WIL/DEX)
2. **Derived stats** from formulas:
   - Attack Power = (STR * 1.2 + DEX * 0.5) * 10
   - Defense = (WIL * 1.5 + STR * 0.3) * 8
   - Life = (WIL * 15 + STR * 8) + 100
   - Resistances = (WIL/INT) * 2
   - Crit Chance = DEX * 0.8
   - Crit Damage = DEX * 1.2 + 20
   - Movement Speed = DEX * 0.5 + 10
   - Cooldown Reduction = INT * 0.3
3. **Item bonuses** — +3-5% per legendary/magic item

### Stat Categories
From `lib/constants.js`:
```jsx
STAT_CATEGORIES = {
  offensive: ['Attack Power', 'Crit Hit Chance', 'Crit Hit Damage', 'Cooldown Reduction'],
  defensive: ['Defense', 'Life', 'Fire Resistance', 'Cold Resistance', ...],
  mobility: ['Movement Speed']
}
```

### Renders
- Class info card with base stats
- Stat grid sections (Offensive, Defensive, Mobility)
- Equipped items summary (when items present)

---

## Data Modules

### gear-slots.js

```jsx
export const GEAR_SLOTS = [
  {
    id: 'helm',         // Unique slot identifier
    label: 'Helm',      // Display name
    type: 'Helm',       // Database filter type
    x: 50,              // Percentage position (left)
    y: 5                // Percentage position (top)
  },
  // ... 12 more slots
]
```

All 13 slots:
1. helm, amulet, chest, gloves, legs, boots (armor)
2. mainhand, offhand (weapons)
3. ring1, ring2 (rings)

### class-data.js

```jsx
export const CLASSES = [
  {
    id: 'barbarian',                 // Unique class ID
    name: 'Barbarian',               // Display name
    color: '#c17f34',                // UI accent color
    baseStats: {
      strength: 10,
      intelligence: 7,
      willpower: 7,
      dexterity: 8
    }
  },
  // ... 6 more classes
]
```

All 7 classes:
1. Barbarian (STR-focused)
2. Druid (WIL-focused)
3. Necromancer (INT-focused)
4. Rogue (DEX-focused)
5. Sorcerer (INT + WIL)
6. Spiritborn (balanced)
7. Paladin (STR + WIL)

---

## Design System (lib/constants.js)

### DESIGN
```jsx
{
  background: '#080608',
  gold: '#D4AF37',
  cardGradient: 'linear-gradient(135deg, #0e0c10, #111018)',
  border: '1px solid rgba(212,175,55,0.06)',
  fonts: {
    heading: "'Cinzel', 'Georgia', serif",
    body: "'Barlow Condensed', sans-serif"
  }
}
```

### RARITY_COLORS
```jsx
{
  common: '#9d9d9d',
  magic: '#6969ff',
  rare: '#ffd700',
  legendary: '#bf642f',
  unique: '#c99f4b',
  mythic: '#ff4500'
}
```

### STAT_CATEGORIES
```jsx
{
  offensive: ['Attack Power', 'Critical Hit Chance', ...],
  defensive: ['Defense', 'Life', 'Fire Resistance', ...],
  mobility: ['Movement Speed']
}
```

---

## Supabase (lib/supabase.js)

```jsx
import { supabase } from '../lib/supabase';

// Usage in components:
const { data, error } = await supabase
  .from('d4_equipment')
  .select('*')
  .ilike('name', `%${query}%`)
  .limit(20);
```

**Tables used:**
- `d4_equipment` (3393 rows)
  - id, name, type, rarity, image_url, affixes
- `d4_affixes` (4475 rows) — for future stat scaling

---

## Styling Pattern

All components use **inline styles** (no external CSS):

```jsx
<div style={{
  // Layout
  display: 'flex',
  gap: '10px',
  
  // Colors
  background: DESIGN.cardGradient,
  border: DESIGN.border,
  color: DESIGN.gold,
  
  // Typography
  fontFamily: DESIGN.fonts.heading,
  fontSize: '18px',
  
  // State
  transition: 'all 0.2s ease',
}}
onMouseEnter={(e) => {
  e.target.style.borderColor = DESIGN.gold;
}}
onMouseLeave={(e) => {
  e.target.style.borderColor = 'rgba(212,175,55,0.06)';
}}
>
```

This ensures:
- No CSS conflicts with main D4JSP site
- Self-contained component styling
- Easy theme customization via `lib/constants.js`

---

## Extension Points

### Add a New Stat
1. Edit `STAT_CATEGORIES` in `lib/constants.js`
2. Add computation in `StatCalculator.js` computedStats
3. Auto-renders in correct section

### Add a New Class
1. Edit `CLASSES` in `data/class-data.js`
2. Auto-available in BuildPlanner class picker

### Customize Gear Layout
1. Edit `GEAR_SLOTS` in `data/gear-slots.js`
2. Adjust x/y percentages for different positioning
3. Change type filters in ItemSearch

### Hook Item Affix Scaling
1. In `StatCalculator.js`, fetch item affixes from d4_affixes
2. Apply multiplier based on rarity tier
3. Add to computed stats

### Export/Save Builds
1. Add `onExport` callback to BuildPlanner
2. POST character state to `/api/save-build` endpoint
3. Store in Supabase `builds` table

### Real-time Multi-user Sync
1. Use Supabase realtime subscriptions in BuildPlanner
2. Listen on characters table changes
3. Update local state on remote updates
