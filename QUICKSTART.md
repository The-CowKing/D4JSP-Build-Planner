# Quick Start — D4JSP Build Planner

## Installation & Running

```bash
cd C:\Users\Owner\D4JSP-Build-Planner

# Install dependencies
npm install

# Start dev server on port 3001
npm run dev

# Open http://localhost:3001 in browser
```

## What You Get

### 1. BuildPlanner.js (Main Component)
- 5-tab character selector at top
- Class picker (7 D4 classes)
- Responsive 2-column grid layout
- Character state management (equipment, class selection)

### 2. PaperDoll.js (Equipment Visualizer)
- 13 gear slots positioned on SVG body outline
- Click slot → opens ItemSearch modal
- Shows equipped item name/rarity with color coding
- Remove button for each equipped item
- Hover effects and transitions

### 3. ItemSearch.js (Item Picker Modal)
- Real-time autocomplete search against d4_equipment table
- Filters by slot type
- Shows item name, type, rarity
- Rarity color gradient backgrounds
- Smooth transitions and keyboard focus handling

### 4. StatCalculator.js (Stats Display)
- Class base stats display (STR/INT/WIL/DEX)
- Computed derived stats (Attack Power, Defense, Life, Resistances, etc.)
- Stat categories: Offensive, Defensive, Mobility
- Equipped items summary panel

### 5. Data Files
- **gear-slots.js** — 13 slot definitions with x/y positioning
- **class-data.js** — 7 class definitions with base stats and colors

### 6. Design System
- **constants.js** — All design tokens (colors, fonts, rarity colors, stat categories)
- **supabase.js** — Supabase client initialization
- Inline CSS throughout (no external stylesheets)

## Environment Variables

Already configured in `.env.local` and `.env.production`:

```
NEXT_PUBLIC_SUPABASE_URL=https://isjkdbmfxpxuuloqosib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_uCx4acFHox_vF-rsmV-IlA_sESk1y-J
```

## Database Integration

Queries live from:
- **d4_equipment** (3393 items) — name, type, rarity
  - ItemSearch.js uses: `.ilike('name', '%query%')` for autocomplete
- **d4_affixes** (4475 affixes) — for future stat scaling

## Styling

All components use inline styles matching D4JSP design:
- Background: #080608 (pure dark)
- Gold accents: #D4AF37 (Diablo gold)
- Card gradient: linear-gradient(135deg, #0e0c10, #111018)
- Fonts: Cinzel (headings), Barlow Condensed (body)
- Rarity colors: Common/Magic/Rare/Legendary/Unique/Mythic

## Development Tips

### Add a New Stat
Edit `components/StatCalculator.js`:
1. Add stat name to `STAT_CATEGORIES` in `lib/constants.js`
2. Add computation in `computedStats` useMemo
3. It auto-renders in the correct section

### Customize a Gear Slot
Edit `data/gear-slots.js`:
- Change `x` and `y` percentages to reposition
- Update `label` for display name
- Adjust `type` filter in ItemSearch

### Add Another Class
Edit `data/class-data.js`:
1. Add entry to CLASSES array
2. Include id, name, color, baseStats
3. Auto-available in BuildPlanner class picker

### Modify Rarity Colors
Edit `lib/constants.js` → RARITY_COLORS object

## Testing

1. Start dev server: `npm run dev`
2. Open http://localhost:3001
3. Select a class
4. Click a gear slot
5. Search for "shako" or other item names
6. Watch stats update in real-time
7. Switch character tabs to test state persistence

## Production Build

```bash
npm run build
npm start
```

Runs on port 3001 in production.

## Embedding in Main D4JSP

When ready to integrate with the main site, use dynamic import:

```jsx
import dynamic from 'next/dynamic';

const BuildPlanner = dynamic(
  () => import('/path/to/D4JSP-Build-Planner/components/BuildPlanner'),
  { loading: () => <div>Loading planner...</div>, ssr: false }
);

// Use in your page:
<BuildPlanner />
```

Or iframe it directly:
```html
<iframe src="http://localhost:3001" width="100%" height="1000" />
```

## Troubleshooting

**Port 3001 already in use?**
```bash
npm run dev -- -p 3002
```

**Supabase connection error?**
- Check environment variables in `.env.local`
- Verify network access to isjkdbmfxpxuuloqosib.supabase.co

**Items not loading in search?**
- Open browser DevTools → Network tab
- Check API call to supabase
- Verify `d4_equipment` table exists and has data

**Stat calculation seems off?**
- Edit `StatCalculator.js` computedStats useMemo
- Base stats pull from selected class in `class-data.js`
- Affixes from equipped items apply +3-5% bonus per item

## Next Steps

1. Test end-to-end locally
2. Deploy to same VPS as main D4JSP (or Vercel)
3. Add `/api/export-build` endpoint to save builds
4. Add Supabase realtime sync for multi-user build sharing
5. Integrate with main D4JSP via lazy-load or iframe
