# Victory Growth OS — Marketing Engine (Frontend)

Apple liquid-glass UI for the Victory Energy Marketing Engine. React + Vite + TypeScript.
Dummy data only — **no Supabase, no auth wired yet** (by design).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Stack
- React 18 + TypeScript + Vite
- React Router v6
- Tailwind CSS + custom liquid-glass token layer (`src/index.css`)
- Framer Motion (card stagger)
- Recharts (analytics)
- lucide-react (icons)

## Structure
- `src/index.css` — design system: dark "Midnight Glass" + light "Frosted Daylight" themes, `.liquid-card`, sidebar, badges, metric tiles.
- `src/components/AppShell.tsx` — frosted sidebar + topbar + theme toggle.
- `src/components/ui.tsx` — LiquidCard, MetricTile, StatusBadge, PlatformIcon, PageHeader.
- `src/data/dummy.ts` — all mock data (swap for Supabase later).
- `src/pages/` — Dashboard, Clients, BusinessProfile, Trends, Calendar, Publishing, Analytics, Settings.

## Next (when ready)
- Replace `data/dummy.ts` reads with Supabase queries (TanStack Query).
- Add Supabase Auth + roles (Admin / Client / Designer).
- Wire publishing actions to existing n8n webhooks.
