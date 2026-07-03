# LEGION

Group stats for League of Legends. LEGION tracks how a **group of friends performs when they play together** — not individual stats (op.gg and Porofessor already do that), but the win rates, duo synergies, and behavioral patterns that only show up when 2+ of you are in the same game.

**→ Live: [legion-pi-nine.vercel.app](https://legion-pi-nine.vercel.app)**

The entire app is themed as a Cold War classified intelligence dossier — aged paper, typewriter fonts, classification stamps, redacted text blocks. Friend groups are **cells**, players are **operators**, the dashboard is a **briefing**.

## What you get

- **Combined win rate** across games your group played together
- **Duo win rates** — which pairs of you actually win
- **Champion pools** per player, with playstyle classification (ONE-TRICK, SPECIALIST, CHAOTIC, etc.)
- **Activity heatmap** — when your group is most active (7-day × 24-hour grid)
- **Behavioral read** on how the group holds up after losses (Tilt Index, Link Analysis)
- **Operation Log** — filterable joint match history grouped by day
- Match data pulled from the **official Riot Games API**

Solo games are out of scope. LEGION only cares about the games you play together.

## Run it locally

Prerequisites: Node 18+, a [Supabase](https://supabase.com) project with `supabase_schema.sql` applied, and a [Riot Games API key](https://developer.riotgames.com) (dev keys expire every 24 hours).

```bash
# Backend
cd server
npm install
cp ../.env.example .env     # fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RIOT_API_KEY
node index.js               # http://localhost:3001

# Frontend (separate terminal)
cd client
npm install
cp .env.example .env        # fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev                 # http://localhost:5173, proxies /api to :3001
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email + password) |
| External API | Riot Games API v5 |
| Deployment | Vercel (static frontend + serverless API via `api/[...path].js`) |

## Project structure

```
LEGION/
├── client/                 React frontend (Vite)
│   └── src/
│       ├── pages/          6 page components (Briefing is ~1,350 lines)
│       ├── components/     Reusable UI (Header, ConfirmModal, etc.)
│       ├── hooks/          Auth context + session management
│       └── lib/            Supabase client, API wrapper, mock data
│
├── server/                 Express backend
│   ├── routes/             REST endpoints (cells, operators)
│   └── services/           Riot API client (rate limiter + cache), stats engine
│
├── api/                    Vercel serverless entry point (wraps server/)
├── mockups/                Static HTML/CSS reference designs
├── supabase_schema.sql     Database schema (4 tables, 9 RLS policies, GIN index)
├── CLAUDE.md               Project spec and development guide
└── vercel.json             Deployment configuration
```

## Design system

The visual language is defined in `mockups/dossier.css` and implemented in `client/src/index.css`:

- **Palette:** Aged-paper backgrounds, near-black text, semantic data colors (green/red/amber/blue for stats only)
- **Typography:** Space Grotesk (headers), Courier Prime (stats — typewriter feel), IBM Plex Mono (data tables)
- **Redactions:** Three styles of decorative black bars for empty states and classified flavor
- **Animations:** Declassification reveal on page load, scanner sweep loading states

## Key terminology

| Normal | LEGION |
|---|---|
| Friend group | Cell |
| Player | Operator |
| Group admin | Handler |
| Dashboard | Briefing |
| Match history | Operation Log |
| Register | Enlist |
| Login | Authenticate |
| Match with 2+ members on same team | Joint Deployment |

## Built with

This project was built collaboratively using [Claude Code](https://claude.ai/code) (Anthropic's AI development tool). The full project spec that guided development is in [`CLAUDE.md`](CLAUDE.md).
