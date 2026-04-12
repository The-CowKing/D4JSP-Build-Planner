# D4JSP Build Planner

A Next.js 14 (pages router) Diablo 4 Build Planner module for the main D4JSP site.

## Features

- **5 Character Slots** — Manage multiple builds
- **Paper Doll UI** — Visual 13-slot equipment layout with Diablo 4 positioning
- **Item Search** — Real-time autocomplete search against d4_equipment Supabase table
- **Class Selection** — Choose from 7 D4 classes with unique base stats
- **Stat Calculator** — Auto-computed stats based on equipped items and class
- **Dark Diablo 4 Theme** — Gold accents, gradient cards, Gothic aesthetic

## Tech Stack

- Next.js 14 (pages router)
- React 18
- Supabase (isjkdbmfxpxuuloqosib)
- Framer Motion (for animations)
- Inline CSS (no external CSS dependencies)

## Project Structure

```
C:\Users\Owner\D4JSP-Build-Planner/
├── pages/
│   ├── _app.js          # App wrapper with global styles
│   └── index.js         # Home page
├── components/
│   ├── BuildPlanner.js   # Main component with character tabs
│   ├── PaperDoll.js      # Visual equipment layout
│   ├── ItemSearch.js     # Item search modal
│   └── StatCalculator.js # Stats display
├── lib/
│   ├── supabase.js       # Supabase client
│   └── constants.js      # Design system + rarity colors
├── data/
│   ├── gear-slots.js     # 13 gear slot definitions
│   └── class-data.js     # 7 D4 class definitions
├── public/               # Static assets
├── .env.local
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3001`

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://isjkdbmfxpxuuloqosib.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_uCx4acFHox_vF-rsmV-IlA_sESk1y-J
```

## Design System

- **Background:** #080608
- **Gold Accent:** #D4AF37
- **Card Gradient:** linear-gradient(135deg, #0e0c10, #111018)
- **Border:** 1px solid rgba(212,175,55,0.06)
- **Heading Font:** Cinzel, Georgia, serif
- **Body Font:** Barlow Condensed, sans-serif

### Rarity Colors

- Common: #9d9d9d
- Magic: #6969ff
- Rare: #ffd700
- Legendary: #bf642f
- Unique: #c99f4b
- Mythic: #ff4500

## Embedding in Main D4JSP

When ready to embed, lazy-load this module in the main site:

```jsx
const BuildPlanner = dynamic(
  () => import('./modules/D4JSP-Build-Planner/components/BuildPlanner'),
  { loading: () => <div>Loading...</div> }
);
```

## Database Tables

- `d4_equipment` — 3393 items (id, name, type, rarity, image_url, affixes)
- `d4_affixes` — 4475 affixes (id, name, type, stat_value)

## Notes

- Paper Doll uses SVG outline + positioned slot boxes
- Item search filters by rarity colors from database
- Stats are computed in real-time based on equipped items
- No external UI library — all inline styles match D4JSP design system
