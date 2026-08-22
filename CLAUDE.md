# LEGION — Project Intelligence Brief
**CLASSIFICATION: INTERNAL USE ONLY**
**DOCUMENT TYPE: DEVELOPMENT DIRECTIVE**
**LAST UPDATED: 2026-08-21**

---

## MISSION OVERVIEW

LEGION is a web application that surfaces League of Legends statistics specifically
for groups of players (called CELLs) who play together. Unlike op.gg or Porofessor
that track individuals, LEGION focuses exclusively on group dynamics — win rates,
champion synergies, and behavioral patterns that only emerge when 2+ players from
a CELL are in the same game.

The aesthetic and copy tone is Cold War classified dossier / CIA intelligence
briefing — minimalist, clinical, authoritative. Every UI element should feel
like it belongs in a redacted intelligence report. Less is more. Negative space
is intentional. Typography carries the weight.

Target users: Friend groups (2-5 players) who play League of Legends regularly
and want insight into how they perform *together*, not just individually.

---

## TERMINOLOGY (USE THESE EVERYWHERE — UI, COPY, VARIABLE NAMES)

| Concept | LEGION Term | Notes |
|---|---|---|
| Friend group | CELL | Up to 10 operators |
| Member of a group | OPERATOR | Linked to a Riot account via PUUID |
| Cell creator / admin | HANDLER | Can manage members, invite codes, dissolve cell |
| Register / sign up | ENLIST | — |
| Create or join a cell | OPEN NEW FILE | The intake process |
| Dashboard / stats page | BRIEFING | All stats live here — there is no separate "Field Report" page |
| Match history | OPERATION LOG | Filtered to joint deployments only |
| Profile page | DOSSIER | Per-operator (reserved — no page yet; `GET /api/operators/:puuid` exists for it) |
| Login | AUTHENTICATE | — |
| Logout | DISENGAGE | — |
| Password | PASSCODE | Form labels, buttons, and errors all say passcode |
| Settings | DIRECTIVES | — |
| Match with 2+ cell members on the same team | JOINT DEPLOYMENT | Core concept — this is what LEGION tracks |
| Season trend chart | CAMPAIGN RECORD | Rolling 20-game WR over joint deployments, game-time axis |
| Analyst-written stat observations | FIELD ASSESSMENT | Templated, severity-coded cards |
| Parent agency (lore) | ZOO | See Lore section below |

---

## LORE: ZOO

ZOO is LEGION's fictional parent agency. It exists purely for thematic flavor
and is never explained in the UI.

**Rules:**
- ZOO is mentioned exactly **twice** across the entire site:
  1. About page hero lead paragraph (`LEGION operates under ZOO directive ████`)
  2. About page glossary entry — partially redacted BY DESIGN (decided
     2026-08-19): it reads `████. Parent agency. ████.` and nothing more,
     since the hero mention already establishes the relationship (a trailing
     "one of several initiatives" sentence was removed 2026-08-21 as an
     unsanctioned expansion)
- Always partially or fully redacted when referenced
- Never expanded, never explained — what ZOO is, stands for, or does stays a
  deliberate mystery. "Parent agency" is the only sanctioned descriptor
- Do not add new ZOO references without explicit approval. This includes
  placeholders and fixtures: the Intake placeholder is `e.g. NIGHT SHIFT` and
  the dev-only mock cell is named `NIGHT SHIFT`
- Users are *petitioners* voluntarily submitting their cell for surveillance,
  not LEGION or ZOO employees

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite (rolldown) + Tailwind CSS 4 |
| Routing | React Router 7 |
| Backend | Node.js 20+ + Express 5 |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email + password) |
| League Data | Riot Games API (official) |
| Deployment | Vercel — static client + the Express app as one serverless function (`api/[...path].js`); Supabase hosts db/auth |
| CI | GitHub Actions (`.github/workflows/ci.yml`): client lint + build, server tests, on every push and PR |

**Dev conventions:**
- Always use Supabase client library for DB and auth calls
- Never write raw SQL unless explicitly asked
- Always use async/await, never .then() chains
- All API route handlers use the shared `requireAuth()` middleware
  (`server/middleware/auth.js`, JWT verification). Sole public exceptions:
  `/api/health` and `/api/operators/validate-riot-id`
- Every `/api/cells/:id…` route also validates the UUID params (400) and the
  caller's cell membership (403) before touching data
- Client pages never import `lib/mockData.js` statically — only through the
  `import.meta.env.DEV` gate in `lib/devMock.js` (see Dev Preview below)
- Keep lint and tests green: `npm run lint` in `client/`, `npm test` in
  `server/` (`node --test`, 32 tests). CI runs both. Node >= 20 (`.nvmrc`)
- `.editorconfig` is the formatting contract: two-space indent, LF, UTF-8

---

## DESIGN SYSTEM

### Palette (source of truth: `mockups/dossier.css`)

#### Base palette (aged paper / dossier)
```
--bg:            #f5f1e8      /* warm aged-paper background */
--bg-alt:        #efeae0      /* alternate background */
--surface:       #eae4d6      /* panel surfaces */
--surface-2:     #e3dcc9      /* secondary surfaces */
--surface-dark:  #161616      /* dark surfaces (header) */
--card:          #fbf8f0      /* card backgrounds */
--border:        #d4ccb8      /* tan borders */
--border-light:  #e5dfd0      /* lighter borders */
--text:          #1a1a1a      /* near-black text */
--text-inverse:  #f7f3e9      /* text on dark backgrounds */
--muted:         #6b6558      /* secondary text */
--muted-light:   #9a9388      /* tertiary — decorative only, never for text (contrast) */
--ink:           #1a1a1a      /* black accent */
```

#### Semantic colors (used for data visualization, NOT as brand colors)
```
--green:         #15803d      /* positive / advantage / wins */
--green-mid:     #22c55e      /* medium green */
--green-bg:      #dcfce7      /* green tint (win cards) */
--green-dark:    #14532d      /* dark green */
--red:           #b91c1c      /* negative / concerning / losses */
--red-mid:       #ef4444      /* medium red */
--red-bg:        #fee2e2      /* red tint (loss cards) */
--red-dark:      #7f1d1d      /* dark red */
--amber:         #b45309      /* anomaly / monitor */
--amber-mid:     #f59e0b      /* medium amber */
--amber-bg:      #fef3c7      /* amber tint */
--blue:          #1d4ed8      /* neutral observation / info */
--blue-mid:      #3b82f6      /* medium blue */
--blue-bg:       #dbeafe      /* blue tint */
```

#### Neutral slate (no semantic meaning — heatmaps, monochrome scales)
```
--slate-1:       #d9d4c8
--slate-2:       #a8a194
--slate-3:       #6d665a
--slate-4:       #3f3a31
--slate-5:       #1a1a1a
```

> **Note:** Red, green, amber, and blue are semantic data colors only.
> The brand accent is black (`--ink`). Do not use semantic colors for
> non-data UI elements like buttons, links, navigation, or decorative stamps
> (the OG card's DECLASSIFIED stamp is ink for this reason).

### Typography (source of truth: `mockups/dossier.css`)
```
--font-display:  'Space Grotesk'     /* headers, nav, titles — modern sans-serif */
--font-stat:     'Courier Prime'     /* stat numbers, body text — typewriter dossier feel */
--font-mono:     'IBM Plex Mono'     /* data tables, descriptions — monospaced, clinical */
```

- **Display / Headers / Nav:** `Space Grotesk` — clean, modern, readable at size
- **Body text / Stat numbers:** `Courier Prime` — typewriter dossier feel
- **Data / Descriptions:** `IBM Plex Mono` — monospaced, clinical
- **Classification labels:** ALL CAPS, tracked wide, small size
- **DO NOT USE:** Inter, Roboto, or any generic sans-serif defaults
- Fonts load via `<link rel="preconnect">` + stylesheet `<link>` in
  `client/index.html` (not a CSS `@import`) so the request starts with the HTML

### UI Rules
- Minimalist first — every element must earn its place (unused CSS is removed,
  not kept "for later" — `index.css` carries only rules the JSX references)
- Border radius: `6px` (`--radius: 6px` in CSS)
- Thin borders (1px) using `--border` color
- Generous whitespace / negative space between sections
- Use uppercase sparingly but intentionally for labels and classifications
- Redacted bars (black inline rectangles) for decorative empty states — no "REDACTED" label inside (gov-doc convention)
- Elevation via subtle box shadows, not heavy borders
- Grid background pattern (`body.bg-grid-page`) on all pages — faint slate grid, fixed attachment
- Text never relies on reduced opacity for hierarchy — use `--muted` ink
  (WCAG 1.4.3; the 2026-08-21 pass replaced the last three opacity-dimmed labels)

### Redaction Conventions
- One shared component, `components/Redacted.jsx`: `<Redacted w h />` (inline
  bar; `pad={false}` for flush stat placeholders; `block` for table cells) and
  `<RedactedBar />` (full-width panel placeholder). Each renders the bar
  `aria-hidden` plus an sr-only "[redacted]" so screen readers never hear a
  dangling label
- CSS: `.redacted-inline`, `.redacted-block`, `.redacted-bar`, `.redacted`
  (roster "CELL WR WITHOUT" column)
- Redactions appear in: footer refs, oversight IDs, classification eyebrows,
  ZOO citations, glossary ZOO entry, one to three of six analyst observations
  (count seeded by the data), and every placeholder while data is loading

### Copy Tone
Write all UI copy as if authored by a Cold War intelligence analyst.

**Voice rules:**
- Dry, clinical, authoritative — Frank IC analyst voice
- No exclamation points. Ever.
- Passive voice is acceptable and even preferred in places
- Numbers >= 10 use figures, numbers < 10 spell out (CIA style guide)
- Solo activity is "out of scope" — not a limitation, a feature
- Estimative language for assessments: `HIGH CONFIDENCE`, `MODERATE CONFIDENCE`,
  `LOW CONFIDENCE`, `ALMOST CERTAINLY`, `PROBABLY`, `LIKELY`, `UNLIKELY`
- Third-party error strings are translated, never surfaced raw: Supabase
  Auth messages map through `AUTH_ERROR_COPY` in `Authenticate.jsx`
  (e.g. "Invalid login credentials" -> `CREDENTIALS NOT RECOGNIZED. VERIFY
  EMAIL AND PASSCODE.`)

**Example translations:**
| Instead of | Write |
|---|---|
| "Welcome back!" | IDENTITY CONFIRMED. |
| "No data yet" | INSUFFICIENT FIELD DATA. OPERATIONS PENDING. |
| "Your group" | CELL DESIGNATION: [name] |
| "Stats loading..." | RETRIEVING CLASSIFIED FIELD REPORTS... |
| "Error: player not found" | INTAKE FAILED. RIOT ID NOT FOUND. |
| "Logged in successfully" | IDENTITY CONFIRMED. ROUTING TO CASE FILE. |
| "Group is full" | CELL AT MAXIMUM CAPACITY. |
| "Invalid invite code" | INVITE CODE INVALID OR EXPIRED. |
| "Page crashed" | RETRIEVAL FAULT. (ErrorBoundary card) |

**Sanctioned exceptions (on record 2026-08-19 — do not re-flag in reviews):**
1. **Plain-language layer** (pre-beta Task 3, deliberate): exactly three
   civilian-voice strings exist so first-time visitors understand what the
   product is — the Landing `tagline-plain` paragraph, the About hero's
   plain-first lead paragraph, and the Authenticate form subtitle. These may
   say "friends", "group", "stats tracker". Do not extend the plain layer to
   new surfaces without approval. (The `<meta name="description">` and Open
   Graph copy in `index.html` are part of this layer — they face search
   engines and chat-app link previews, not the dossier.)
2. **Landing stats strip, pre-launch state:** all three volume stats
   (Matches Filed, Cells Under Surveillance, Operators on File) currently
   render fully redacted `[CLASSIFIED]`; only `Solo Reports Filed: 0` shows a
   figure. Sanctioned while no real match volume exists. At public launch,
   Matches Filed switches to the real figure per the Landing spec below.
3. **About glossary ZOO entry** is partially redacted by design — see LORE: ZOO.

---

## DATA MODEL

### `operators` table
One row per registered user, linked to their League account.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK -> `auth.users`, unique, cascade delete |
| `puuid` | text | Unique. Riot's permanent player ID (never changes even if name changes) |
| `riot_game_name` | text | Riot's canonical casing, e.g. "Doublelift" — stored from Riot's response, never from what the user typed |
| `riot_tag_line` | text | e.g. "NA1" (the part after #) |
| `is_verified` | boolean | True once Riot API confirms the account exists |
| `created_at` | timestamptz | |

### `cells` table
A named friend group. One cell has many members.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | text | The group's chosen name (1-64 chars, server-validated) |
| `invite_code` | text | Unique. One reusable, non-expiring code per cell, format `LGN-XXXX-XXXX` (ambiguous characters excluded). Generated server-side at cell creation with `crypto.randomInt` — treat as a bearer credential |
| `created_by` | UUID | FK -> `auth.users`, ON DELETE SET NULL (this user is the HANDLER; the cell survives its creator's account deletion, simply handler-less). Indexed |
| `created_at` | timestamptz | |

### `cell_members` table
Many-to-many membership.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `cell_id` | UUID | FK -> `cells`, cascade delete |
| `user_id` | UUID | FK -> `auth.users`, cascade delete |
| `joined_at` | timestamptz | |

Unique constraint on `(cell_id, user_id)`; btree indexes on `cell_id` and `user_id`.

### `matches` table
Cache for Riot API match data — stored after first fetch, never re-fetched.

| Column | Type | Notes |
|---|---|---|
| `match_id` | text | Primary key (e.g. "NA1_1234567890") |
| `match_data` | jsonb | Full raw Riot API match payload (NOT NULL) |
| `participants_puuids` | text[] | Array of PUUIDs for fast overlap queries (NOT NULL, default `{}`) |
| `fetched_at` | timestamptz | |

GIN index on `participants_puuids` for fast array-overlap queries. Reads page
with a keyset cursor on `match_id` (see Stats Engine).

### Row-Level Security (RLS)
Hardened 2026-08-19 (audit remediation Phase 1, live migration
`phase1_security_hardening`; `supabase_schema.sql` and the live DB are in
sync). **Security model:** the browser client talks to Supabase for AUTH ONLY.
Every table write goes through the Express server (service role key, bypassing
RLS), which performs its own membership and handler checks. RLS therefore
grants end users read access plus two delete paths, and deliberately defines
**no insert/update policies** for `cells`, `cell_members`, or `matches` — a
client-side write must be denied.

The six policies (every `auth.uid()` wrapped in `(select ...)` so Postgres
evaluates it once per query, not per row; membership checks go through
`is_member_of_cell()`, a `security definer` helper that avoids RLS recursion):

- **operators:** users can read/write their own row only
- **cells:** members or the creator can read; the creator (handler) can
  delete (dissolve)
- **cell_members:** visible to members of that cell; delete by the handler or
  by the member themselves (leave)
- **matches:** readable by any authenticated user (public game data)

Additional hardening: the `anon` role has no table access at all (and cannot
execute `is_member_of_cell()`); the former `join_cell_by_invite_code` RPC was
dropped from the live DB. The 2026-08-19 audit's SEC-01/02 findings (open
self-insert into any cell; client-writable match cache) are **CLOSED**.

Supabase advisor state (re-checked 2026-08-21): only informational items
remain — tables visible to signed-in users in GraphQL (expected under the
read model), `is_member_of_cell` callable by `authenticated` (required by the
policies; it only answers for the caller), two unused indexes
(`idx_cells_created_by`, `idx_operators_user_id` — the latter is redundant
with the unique constraint; dropping it is a DB change, so it waits for
approval) — plus the one pending dashboard toggle (see Current Status).

---

## AUTH & REGISTRATION FLOW

### Enlistment (registration)
1. User fills out: email, passcode (eight characters minimum, enforced
   client-side), Riot Game Name, Riot Tag Line
2. Client pre-validates the Riot ID via `POST /api/operators/validate-riot-id`
   (public, unauthenticated) before the account is created. The response
   carries Riot's canonical `gameName`/`tagLine`; the client enlists with
   THOSE, not the typed spelling, so every later identity match agrees with
   what the server stores
3. Client calls `supabase.auth.signUp()` with the canonical Riot ID in user metadata
4. Supabase sends confirmation email
5. User sees the `IDENTITY LOGGED` notice: "Confirmation transmitted to the
   provided address. Verify your identity to complete intake. Check your email."
6. After email confirmation, user can authenticate

### Authentication (login)
1. User enters email + passcode on `/authenticate`
2. Client calls `supabase.auth.signInWithPassword()`
3. On success: redirect based on cell membership (see Login Routing below)

### Riot ID Linking
`POST /api/operators/link` handles linking a Riot account:
1. Receives `riotGameName` and `riotTagLine` (shape-checked: 3-16 / 3-5 chars)
2. Calls Riot API to confirm account exists and fetch PUUID
3. Upserts `operators` row with `is_verified: true`; answers 409 if that PUUID
   already belongs to another operator (each Riot ID may be claimed once)

Linking short-circuits on both sides (audit Phase 3): the client keeps a
localStorage guard (`legion_linked:<userId>`) and the server skips the Riot
call when the stored Riot ID already matches — the Riot API is no longer hit
on every page load. `POST /api/cells/:id/ingest` additionally auto-links any
cell member who has no `operators` row yet, from their auth metadata.

### Password Reset
1. "Forgot passcode?" on the Sign In tab requests a reset directive via
   `supabase.auth.resetPasswordForEmail()` (redirects back to `/authenticate`;
   button `TRANSMIT RESET DIRECTIVE`, notice `DIRECTIVE TRANSMITTED`)
2. The emailed link raises Supabase's `PASSWORD_RECOVERY` event; the
   Authenticate page holds the session in recovery mode and shows the
   `NEW PASSCODE` / `CONFIRM PASSCODE` form (`supabase.auth.updateUser()`,
   button `SET NEW PASSCODE`)

### Login Routing
After successful authentication:
- A validated `return_to` query param (set by `ProtectedRoute`) wins. It is
  resolved against the current origin and must stay same-origin — a prefix
  check alone is not enough, because browsers read `/\evil.com` as a
  cross-origin URL (`safeReturnTo()` in `Authenticate.jsx`)
- **Operator with cells** -> `/briefing` (last-viewed cell restored from
  localStorage `legion_active_cell`, falling back to the first cell)
- **Operator with zero cells** -> `/intake`
- **Cell list failed to load** -> `/briefing`, whose overlay offers a retry
  (never `/intake` — that would steer a user who already has a cell into
  creating a duplicate)

### Auth Middleware (server)
Every protected route uses `requireAuth()` from `server/middleware/auth.js`:
1. Reads `Authorization: Bearer <token>` header
2. Calls `supabase.auth.getUser(token)` to verify JWT
3. Attaches `req.user` to the request
4. Returns 401 if missing or invalid — but 503 `CLEARANCE SERVICE UNAVAILABLE`
   when Supabase Auth itself is unreachable, so a transient outage is not
   mistaken for an expired session

### Client session handling
- On a 401 from any data fetch, the `FetchFault` card's RE-AUTHENTICATE action
  clears the local session FIRST, then routes to `/authenticate?return_to=…`
  (otherwise the cached session bounces straight back to the same 401)
- The session is re-validated when the tab regains visibility (sleep/wake)

### Dev preview (DEV_MOCK)
In `vite dev` with no real session, `useAuth` signs in a fake operator on a
fully populated mock cell (`NIGHT SHIFT`, five operators) so every page can be
inspected without an account. Everything that touches `lib/mockData.js` sits
behind the literal `import.meta.env.DEV` gate and a dynamic `import()`, so the
module (and the fixtures it generates at import time) is tree-shaken out of
production builds — verified by grepping `dist/` after `vite build`.

---

## FRONTEND PAGES & ROUTES

| Route | Page Component | Auth Required | Description |
|---|---|---|---|
| `/` | `Landing.jsx` | No | Public marketing page: hero, stats strip, feature cards |
| `/about` | `About.jsx` | No | Public info: intake procedure, glossary, ZOO lore |
| `/authenticate` | `Authenticate.jsx` | No | Sign-in / New Operator tabs |
| `/intake` | `Intake.jsx` | Yes | Cell creation (new case) or join (invite code) |
| `/briefing` | `Briefing.jsx` | Yes | Cell dashboard — ALL stats live here |
| `/oplog` | `OperationLog.jsx` | Yes | Joint match history with filters |
| `*` | — | — | Redirects to `/` |

> **Note:** There is no separate `/field-report` route. "Field Report" is a
> terminology concept — the Briefing page IS the stats page.

`App.jsx` also provides: per-route `document.title` (`BRIEFING // LEGION`
etc. via `TitleSync`), a `<main>` landmark, and an `ErrorBoundary` around the
routes so a render fault shows a `RETRIEVAL FAULT` card (with RELOAD) under a
still-usable header instead of a blank page. `robots.txt` disallows
`/briefing`, `/oplog`, `/intake`, `/api/`; `sitemap.xml` lists the three
public routes.

---

## SITE-WIDE CHROME

### Dark Site Header
Sticky to viewport top on all pages. Left-to-right:

1. **LEGION wordmark** — links to `/`
2. **Cell switcher** (`.cell-switcher`):
   - Logged in: active cell name + chevron (`NO ACTIVE CELL`, dimmed, when
     the account has no cells). Dropdown: `CASE FILES` (or `NO ACTIVE CASE
     FILES`) — one row per cell with a `HANDLER` badge if the viewer handles
     it or `HANDLER: <name>` otherwise, a check on the active cell, and
     `N OPERATOR(S)`; on cells the viewer handles, a `▾` "Manage operators"
     button opens an inline `OPERATORS ON FILE` panel (each operator with
     `REMOVE`, the viewer marked `YOU`) ending in `DISSOLVE CELL`; then a
     divider and `+ Open New File` (-> `/intake`). Escape and click-outside
     close it
   - Logged out: disabled state — redacted bar, no dropdown, `pointer-events: none`
3. **Nav links:** Briefing, Operation Log, About (active state for current page).
   When logged out, Briefing and OpLog route to authenticate first
4. **Right slot:**
   - Logged out: `Authenticate` CTA (hidden while already on `/authenticate`)
   - Logged in: user badge (`riot name #tag`), `Disengage` button

Handler actions (dissolve cell, remove operator) confirm through the
type-the-name `ConfirmModal` (dialog semantics, focus trap, Escape). A failed
action reports inside the dialog (`.confirm-error`, `role=alert`) and keeps it
open; the CONFIRM button reads `EXECUTING...` and blocks double-submits while
the request is out. Never `alert()`.

### Sticky Page Header (Briefing + Operation Log only)
Shared component `components/PageHeader.jsx`, sticky below the dark header:
- Eyebrow: `• CELL BRIEFING — ACTIVE` / `• OPERATION LOG — ACTIVE`
  (`— INACTIVE` with no active cell)
- H1: active cell name
- Meta line: `N operators // region NA // established DATE // case LGN-███`
- Inline `+ Sync Intel` button (`SYNCING...` while busy) — triggers match
  ingest. The result line (`role=status`) has one sentence per ingest
  outcome: `INGEST COMPLETE — N new matches filed, M already on record`,
  `INGEST IN PROGRESS — … pending. Sync again to continue.`, `SYNC HALTED —
  no operator in this cell has a linked Riot ID on file.`, `SYNC COMPLETE —
  Riot returned no matches…`, `SYNC FAILED: …`

### Footer
Every page: `DOCUMENT REF: LGN-2026-<CODE>███ // ORIGINATING OFFICE: <office>
// OVERSIGHT: ████ // DISTRIBUTION LIMITED // DECLASSIFY ON: ████`.
Per page: Landing `LGN-2026-███` / LEGION/OPS; Briefing `BRIEF-`; OpLog
`OPLOG-`; Intake `INTAKE-` / LEGION/INTAKE with tail `DECLASSIFY ON: CASE
CLOSURE`; Authenticate `AUTH-` / LEGION/AUTH; About `ABOUT-` / LEGION/ANALYSIS
with tail `CLEARED FOR EXTERNAL DISTRIBUTION`.

---

## PAGE FEATURES (DETAILED)

### Landing (`/`)
1. **Hero** — wordmark, tagline, plain-language subline (sanctioned — see
   Copy Tone exceptions), sub-tagline, two CTAs:
   - Primary: `Open a New File` -> `/authenticate`
   - Secondary: `Already on file? Authenticate ->` -> `/authenticate`
2. **Stats strip** — four stat blocks:
   - `Matches Filed: ████ [CLASSIFIED]` (pre-launch state, sanctioned —
     switches to the real figure once real volume exists at public launch)
   - `Cells Under Surveillance: ████ [CLASSIFIED]` (always redacted — flavor)
   - `Operators on File: ████ [CLASSIFIED]` (always redacted — flavor)
   - `Solo Reports Filed: 0` (real data — always zero, reinforces group focus)
3. **Feature cards** — intro (`• FILE CONTENTS` / "Intelligence compiled at
   the cell level.") + two REPORT cards:
   - `REPORT-01 · BRIEFING · ███` — cell intelligence summary (cites the
     campaign record, not the retired Tilt Index)
   - `REPORT-02 · OPERATION LOG` — joint deployments, indexed
4. Footer

### About (`/about`)
1. **Hero** — doc-stamp + H1 `About LEGION` + three lead paragraphs: plain-language
   first (sanctioned — see Copy Tone exceptions), ZOO mention #1 in the second
2. **Intake Procedure** — four-step informational list (step 3: operators are
   appended via the cell's invite code — there is no append-by-Riot-ID path)
3. **Glossary of Field Terms** — nine named entries (CELL, OPERATOR, OPEN NEW
   FILE, AUTHENTICATE, BRIEFING, OPERATION LOG, JOINT DEPLOYMENT, CAMPAIGN
   RECORD, ZOO) plus one fully redacted decorative row; the ZOO entry
   (mention #2) is `████. Parent agency. ████.` per LORE: ZOO
4. **CTA section** — `Open New File` + `Return to Home` buttons
5. Footer

### Authenticate (`/authenticate`)
Single centered form card with a plain-language subtitle (sanctioned — see
Copy Tone exceptions) and tab toggle (`role=tablist`):
- **Sign In tab (default):** EMAIL + PASSCODE, `AUTHENTICATE` button,
  `Forgot passcode?` link into the reset flow (request form; set-new-passcode
  form when arriving from the recovery email)
- **New Operator tab:** EMAIL + PASSCODE (min 8) + RIOT GAME NAME + TAG,
  `OPEN OPERATOR FILE` button. On success the card shows the `IDENTITY LOGGED`
  notice (email confirmation required); after confirming and signing in, a
  zero-cell operator is routed to `/intake`
- Errors render as `ACCESS DENIED: <dossier line>` (`role=alert`), translated
  from Supabase's raw strings

### Intake (`/intake`)
Cell designation flow (account setup already happened on authenticate page).
- Classification banner: `CONFIDENTIAL // CELL INTAKE // HANDLE WITH CARE`
- H1: `Open a New File`
- Two radio options (real radio inputs — keyboard and screen-reader operable):
  - **Open a New Case:** reveals Cell Name field (placeholder `e.g. NIGHT
    SHIFT`, maxLength 64; server rejects empty / >64 with 400)
  - **Join an Existing Case:** reveals Invite Code field (`LGN-XXXX-XXXX`,
    auto-uppercase, format-validated client-side, maxLength 13)
- Client-side errors: `CELL NAME IS REQUIRED.`, `INVITE CODE IS REQUIRED.`,
  `INVITE CODE INVALID OR EXPIRED.`; busy label `PROCESSING...`
- Submit: `OPEN NEW FILE`; both paths land on `/briefing` with the new or
  joined cell active

### Briefing (`/briefing`)
Main dashboard — ALL stats live here. The page remounts per active cell
(`key={activeCell.id}`): every piece of per-cell state starts fresh, and a
slow response or a still-running sync for the PREVIOUS cell lands on an
unmounted instance instead of overwriting the current one. Sections
top-to-bottom:

1. **Sticky page header** (see chrome section)
2. **Fault cards** (conditional, top of the dashboard): `RIOT LINK FAULT`
   (the sign-in Riot link failed; not dismissible — it is actionable) and the
   shared `FetchFault` card (`CLEARANCE EXPIRED` with RE-AUTHENTICATE, or
   `RETRIEVAL FAULT` with RE-ATTEMPT RETRIEVAL / `RETRYING...`)
3. **Invite code banner** — collapsible `CELL INTAKE CODE` strip: the cell's
   `LGN-XXXX-XXXX` code with a COPY button that confirms as `COPIED` for ~1.6 s
   (`hooks/useClipboard.js`), collapsible to a slim reopenable bar
4. **Cell Members card:**
   - Summary strip: Joint WR (delta badge `↑/↓ X.X pts vs. without you`),
     WR Without You (`joint games without you`), Deployments (`Season YYYY`),
     Recent Form (10 W/L boxes, `last 10 deployments`, latest emphasised)
   - Operator table: `OPERATOR | STATUS | GAMES (SEASON) | WIN RATE | CELL WR
     WITHOUT —`. Rows arrive server-sorted (win rate desc, then games);
     STATUS is `Active` when `last_played` is within seven days of the fetch;
     zero-game members show `—`; the WITHOUT column shows a value only on the
     viewer's row (every other row is a redacted block)
   - Viewing operator highlighted with `YOU` badge — matched by `user_id`
     first (Riot names change; ids never do), display name as fallback
5. **Game Mode Breakdown card:**
   - Horizontal bars per mode. All six staple modes always render (Ranked,
     Ranked Flex, Normal, ARAM, ARAM Mayhem, Arena — 0-game rows show
     `no data` / `—`), then rotating modes under a `Featured / Rotating` divider
   - 5-tier color scale: `>=62%` deep green, `>50%` medium green, `=50%` gray, `>=40%` medium red, `<40%` deep red
   - WR text color matches bar tier (dark tiers only — contrast)
   - Card ends with the ARAM Mayhem advisory (`ARAM: Mayhem match data is
     withheld from Riot API by directive…`)
6. **Two-column row:**
   - **Link Analysis** (left): SVG ring network graph (`role=group` — it
     contains focusable nodes — with a per-pair text summary). Active
     operators (>= 5 joint games, max 10 nodes) sit on the ring; inactive
     ones orbit as faint markers. Every pair with shared games is drawn as a
     line (color = pair WR tier, width 1px + up to 2.5px by share of the
     busiest pair, dashed under 10 shared games) with a small WR pill at the
     midpoint; pairs with no shared games are faint dashed lines that read
     `UNLINKED` on hover. Hovering, focusing, tapping, or pressing Enter/Space
     on an operator isolates them: their pills enlarge to add `N OPS` and the
     bond class (`CORE` / `STABLE` / `VOLATILE` / `STRAINED` / `EMERGING`),
     unrelated edges fade to 7% and other nodes to 50%
   - **Activity Heatmap** (right): 7-day x 24-hour grid, shifted from UTC to
     the viewer's timezone and reordered Monday-first (`role=img`, computed
     summary). Subtitle shows the tz abbreviation and `// PEAK <DAY> <HOUR>`;
     cells tooltip `<DAY> <hour>: N games`. Slate scale `h-0` through `h-5`
7. **Campaign Record card (full width, `components/CampaignRecord.jsx`):**
   - Season trend chart on a GAME-TIME axis: one step per joint deployment,
     so the line never breaks during idle spells
   - Line = rolling 20-game win rate; faded dashed 50% reference line
   - Idle periods of 7+ days render as hatched "dark period" bands (width
     scales with idle length, capped at 30px, and all bands together may
     claim at most 35% of the plot so a sparse season can't invert the axis);
     line and barcode break around them
   - W/L barcode strip under the axis: wins tick UP from the baseline (green),
     losses tick DOWN (red) — the direction carries the information, color
     only reinforces it (WCAG 1.4.1)
   - Month labels along the bottom, spaced by activity (busy months are wider)
   - Streak annotations for runs/slumps of 3+ (longest win run in green,
     longest loss slump in red) with paper-halo text so gridlines never cover them
   - Records footnote: best run, worst slump, peak weekly volume, with dates
   - Hover/tap: black dashed crosshair + tooltip (game #, date, result, rolling WR)
   - Placeholder grid under two games. Data source: `timeline` array
     ({ts, win} per joint match) in the stats payload
8. **Behavioral Intelligence section header** (eyebrow `ANALYST NOTES`) —
   umbrella over the remaining analyst cards (Champion Pools + Analyst Observations)
9. **Champion Pools card** (`• Operator Profiles`):
   - One row per rostered operator, in server order (win rate desc, then
     games) — zero-game or unlinked members included, rendering `NO FIELD
     DATA` bars and "Profile pending additional deployments."
   - Each row splits into three theater sub-bars — `SUMMONER'S RIFT`,
     `HOWLING ABYSS`, `RINGS OF WRATH` — each with `N OPS`, a class badge
     (`SPECIALIST`, `ONE-TRICK`, `NARROW`, `ROLE-LOCKED`, `CHAOTIC`;
     `INCONCLUSIVE` under five games in that theater) and a segmented bar of
     the top five champions by pick share (monochrome `s-1`..`s-5`, `+N more`
     remainder, tooltip `<champ> — X% pick rate // Y% WR (W-L)`, sr-only summary)
   - The Summoner's Rift header additionally carries one profile badge from
     the server's `profile_tags` when SR games >= 5 — role (`BOT SPECIALIST`,
     `MID / TOP FLEX`, `FILL AGENT`), class (`PRECISION DOCTRINE`, …), gender
     (`ALL-MALE ROSTER` / `ALL-FEMALE ROSTER`), or trait (`EDGELORD BIAS`,
     `HIGH MOBILITY BIAS`, …) — from `server/data/champions.js`
   - Terse bureaucratic note: two templated sentences plus an optional
     profile line, seeded by the operator name
10. **Analyst Observations (Field Assessments)** (`• Field Assessment`):
    - 6 cards in 2-column grid
    - Each: severity stripe (green/red/amber/blue/black), code (`OBS-NN`),
      title (in the code line and as the colored tag badge), subject line,
      analyst-voice note (1-3 sentences)
    - One to three of six are heavily redacted (decorative; count and
      positions seeded by joint-match count), tagged `CLASSIFIED`
    - Analyst signature footer (`.analyst-signature`): ANALYST OF RECORD /
      VERIFIED BY / FILED date, redacted

### Operation Log (`/oplog`)
Joint match history. Remounts per active cell like the Briefing. Sections:

1. **Sticky page header** (matching Briefing)
2. **Fault card** (conditional): shared `FetchFault`
3. **Summary strip** — Joint Win Rate (`across N matches`; `—` when the
   filters match nothing), Total Wins, Total Losses (`current selection`),
   Avg. Duration (`per deployment`). Reflects the filtered set
4. **Filter bar:**
   - **Theater** (single-select): All + every game mode in the log
   - **Outcome** (single-select): All / Wins / Losses
   - **Operators:** a `Full Dossier` chip (default — every joint deployment)
     plus one chip per operator, sorted by win rate. Clicking an operator
     leaves Full Dossier and selects only them; further clicks toggle. In
     roster scope a match shows only when its cell participants exactly equal
     the selected set. With exactly one operator selected the list is replaced
     by the `SINGLE OPERATOR SELECTED` notice (`Solo Reports Filed: 0`)
   - Reset button (enabled only when filters are dirty)
5. **Match list** (`Deployment History` title + `SHOWING N OF [total]`
   counter, `role=status`):
   - Day-grouped: `[Date] — N deployments` headers
   - Each match: result tag (WIN/LOSS color-coded), mode pill (rotating modes
     styled distinctly), Arena placement tag `1ST OF 8` …, duration, time
   - Per-operator table: `Operator | Champion | KDA | Damage | Gold`, rows
     ordered TOP -> JUNGLE -> MID -> BOT -> SUPPORT on Summoner's Rift (from
     `teamPosition`), otherwise by operator WR order; `12.3k` number format
   - Viewing operator marked with `YOU` suffix — by `user_id` (the
     `/operations` payload carries it), name as fallback
   - Card tinted: light green for wins, light red for losses
   - `NO MATCHING DEPLOYMENTS` notice when the filters exclude everything
6. **Filter logic:**
   - Day headers hide when no matches visible under them
   - Per-day counts update dynamically
   - Remakes are excluded server-side so the log agrees with the Briefing

### Empty States (zero-cell user)
When authenticated but belonging to zero cells:
- Cell switcher trigger reads `NO ACTIVE CELL` (dimmed); dropdown shows
  `NO ACTIVE CASE FILES`, a divider, and `+ Open New File`
- Page header renders its redacted equivalent (`— INACTIVE`)
- Body shows a centered `CellOverlay` card pointing to `/intake` (OPEN NEW
  FILE / JOIN WITH INVITE CODE)

Solo cells (one member on file) get a second `CellOverlay` state: a
dismissible overlay surfacing the cell's invite code (COPY CODE -> `COPIED`)
so the handler can recruit. Dismissal is remembered per cell in localStorage
(`legion_invite_dismissed_<cellId>`).

### Error States (fetch failures)
- Stats/operations fetch failures render the shared dossier-toned
  `FetchFault` card; expired sessions clear the local session and route back
  to `/authenticate?return_to=…`
- A failed cell-list fetch is distinct from "zero cells" — `CellOverlay`
  shows a `Records Unavailable` retry card instead of the create/join pitch
- Riot link failures surface as the `RIOT LINK FAULT` alert card on the Briefing
- Render faults anywhere under the header show the `ErrorBoundary` card

---

## BACKEND API ENDPOINTS

All routes prefixed `/api`. All require a valid JWT except `/api/health` and
`/api/operators/validate-riot-id`. Every response is JSON, including faults:
unknown routes -> 404 `NO SUCH FILE`; malformed or oversized (>16 kB) bodies
-> 400/413 `MALFORMED REQUEST`; unexpected errors -> 500 `INTERNAL ERROR`
(the stack is logged, never sent). `X-Powered-By` is disabled. Every
`/api/cells/:id…` route validates UUID params (400 `MALFORMED IDENTIFIER`)
and, except the handler-only DELETEs, cell membership (403 `ACCESS DENIED —
NOT A MEMBER OF THIS CELL`).

### Cells
| Method | Path | Description |
|---|---|---|
| GET | `/api/cells` | List user's cells: `id, name, invite_code, created_by, created_at, member_count, handler_name` |
| POST | `/api/cells` | Create new cell (name 1-64 chars, 400 otherwise; creator auto-added as handler — the cell is rolled back if that insert fails; invite code generated server-side) |
| GET | `/api/cells/:id` | Cell details + members with Riot IDs and PUUIDs |
| POST | `/api/cells/join-by-code` | Join the cell matching the submitted invite code. Per-user throttle (10/min -> 429 `TOO MANY INTAKE ATTEMPTS…`); malformed and unknown codes both answer 404 `INVITE CODE INVALID OR EXPIRED` so they cannot be told apart (by design); 400 `OPERATOR ALREADY ENLISTED IN CELL`; 400 `CELL AT MAXIMUM CAPACITY` (10); 200 `{cell_id, cell_name, status}` |
| DELETE | `/api/cells/:id/members/:userId` | Remove an operator from the cell (handler only; 400 `HANDLER CANNOT SELF-REMOVE…`; 404 when the target is not a member) |
| DELETE | `/api/cells/:id` | Dissolve a cell (handler only) |
| POST | `/api/cells/:id/ingest` | Pull match data from Riot API, cache in DB (see Ingest below) |
| GET | `/api/cells/:id/stats` | `computeCellStats` payload + `season_year` (see Stats Engine). Nothing cross-cell — an earlier `adjacent_cells` field that returned other cells' names and rosters to non-members was removed 2026-08-21 |
| GET | `/api/cells/:id/operations` | Joint match history, newest first, same joint rule as the engine (same team / same Arena subteam, remakes excluded). Each row: `match_id, game_mode, queue_id, game_duration, game_end_timestamp, cell_members, cell_members_won, placement (Arena), participants[{user_id, name, champion, kills, deaths, assists, damage, gold, win, role}]` |

**Ingest** (`POST /api/cells/:id/ingest`): auto-links unlinked members; walks
up to 500 season match IDs per operator (`startTime` = season start); checks
which are already stored in chunks of 500 ids (a single `.in()` would be
capped at PostgREST's 1000-row limit and make old matches look new forever);
stores at most 40 new match payloads per call (one Riot call each) and stops
early at a 45 s budget so Vercel's 60 s limit never kills it mid-loop; returns
`{status: INGEST_COMPLETE | INGEST_PARTIAL | NO_MATCHES_FOUND |
NO_LINKED_OPERATORS, total_discovered, skipped, fetched, remaining,
fetch_window_start, message}` — `remaining` is everything not yet on file,
and the UI says "Sync again to continue" while it is > 0.

> There is deliberately no `POST /api/cells/:id/join` — joining by raw cell
> UUID was removed so cells cannot be entered by guessing IDs; the invite code
> is the only join path.

### Operators
| Method | Path | Description |
|---|---|---|
| POST | `/api/operators/validate-riot-id` | **No auth** — public pre-signup check that a Riot ID exists; returns Riot's canonical `{valid, gameName, tagLine}`. Shape-checked (game name 3-16 chars, tag 3-5 -> 400 otherwise); per-IP throttle (10/min) + five-minute result cache guard the Riot quota; 404 `RIOT_ID_NOT_FOUND` / 429 / 503 `RIOT_UNAVAILABLE` |
| POST | `/api/operators/link` | Link/update Riot account for current user (short-circuits when the stored ID already matches; 409 if the PUUID belongs to another operator) |
| GET | `/api/operators/:puuid` | Operator dossier by PUUID: `riot_game_name, riot_tag_line, is_verified, created_at` (reserved for the DOSSIER page; no client caller yet) |

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: 'OPERATIONAL', classification: 'UNCLASSIFIED' }` |

---

## RIOT API INTEGRATION

### Endpoints Used
1. **Account lookup:** `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
   (`routes/operators.js` performs this one with Node `https` directly, with
   an 8 s timeout — kept since commit 546facc fixed a Vercel `fetch` failure
   that way; ingest's auto-link uses `services/riot.js`)
2. **Match IDs:** `GET /lol/match/v5/matches/by-puuid/{puuid}/ids?start={n}&count=100&startTime={seasonStartEpoch}`,
   paginated up to 500 IDs per operator
3. **Match data:** `GET /lol/match/v5/matches/{matchId}`

### Rate Limiting (`services/riot.js`)
- Dev key limits: 20 req/sec, 100 req/2min
- Continuous-refill token-bucket rate limiter with a FIFO queue
- Every request carries an 8 s `AbortSignal.timeout` so a hung upstream
  connection cannot consume the serverless budget
- In-memory response cache, 5-minute TTL, capped at 500 entries; match
  payloads are NOT cached (they go straight to the DB and are never re-read)
- Auto-retry on 429 honoring `Retry-After` (NaN-safe, capped at 10 s, two retries)
- Limiter and cache are in-memory and therefore PER WARM SERVERLESS INSTANCE
  on Vercel: they bound one instance's bursts, they are not a global guarantee
- Match data persisted to `matches` table — never re-fetched

### Key Technical Note
Riot IDs (GameName + TagLine) can change. PUUIDs never do. The database stores
PUUIDs as the permanent identifier. All lookups use PUUID after initial resolution.

---

## STATS ENGINE

`computeCellStats(matches, cellPuuids, memberRoster = [])` in
`services/stats.js` (also exports `isRemake`, `getSameTeamCellGroup`). The
roster `{id, puuid, riot_game_name}` supplies `user_id` and pads zero-game or
unlinked members. Two corrections applied before any computation (audit
Phase 2): remakes (early-surrender voids / under-five-minute games) are dropped
entirely, and Arena (CHERRY) matches group cell members by `playerSubteamId`
instead of `teamId` — Arena stamps only two teamIds, so same-teamId members
can be opponents. `getSameTeamCellGroup` is the single joint-deployment rule,
shared with the `/operations` route.

**Season window** (`services/season.js`, pure + tested): the most recent
January 10 UTC. During Jan 1-9 that is LAST year's boundary — the old code
pointed at a future date and blanked every cell for nine days each January.
`season_year` is the year the window starts in.

**Reads** (`getStoredMatches` in `routes/cells.js`): season-filtered on
`match_data->info->gameStartTimestamp`, paged past PostgREST's 1000-row cap
with a keyset cursor on `match_id` (offset paging on a non-unique column could
double-count or drop rows when an ingest landed between pages); a query fault
throws instead of returning a truncated season as a 200.

Returns:

- **`total_games`** — total matches in dataset (after remake exclusion)
- **`games_together`** — matches where 2+ cell members on same team/subteam
- **`games_apart`** — matches where only 1 cell member played (members on
  opposite teams count in neither)
- **`win_rate_together`** — win rate in joint matches (null if no data)
- **`win_rate_apart`** — win rate in solo matches (null if no data)
- **`champion_synergies`** — top 10 champion combos by frequency, keyed by
  sorted `puuid:champion` so participant order never splits an entry; each
  with operators, champions, games, wins, win rate, delta vs. overall
- **`game_mode_breakdown`** — per mode (queueId first, gameMode fallback):
  games played and win rate, sorted by games
- **`operator_stats`** — per-operator rows feeding the roster table and
  Champion Pools: `puuid, user_id, name, games, wins, win_rate (null for
  zero-game members), wr_without (null when present in every joint game),
  top_champions (<= 5), unique_champions, theaters {SUMMONER'S RIFT | HOWLING
  ABYSS | RINGS OF WRATH -> games, wins, win_rate, top_champions,
  unique_champions}, last_played, role_distribution, class_distribution,
  profile_tags (<= 3 {label, category: role|class|gender|trait, strength}),
  primary_role, primary_class`; sorted by win rate desc then games. Theater
  mapping: ARAM / ARAM Mayhem -> HOWLING ABYSS, Arena -> RINGS OF WRATH,
  everything else -> SUMMONER'S RIFT. Profiles come from
  `data/champions.js analyzeProfile` (empty under three games)
- **`duo_stats`** — per-pair `{puuids[2], names[2], games, wins, win_rate}`,
  same-team pairs only, sorted by games (feeds Link Analysis)
- **`heatmap`** — 7-day x 24-hour activity grid in UTC, bucketed by game end
- **`recent_form`** — last 10 joint results `{win, timestamp, mode}`, newest first
- **`timeline`** — `{ts, win}` per joint deployment, ascending (feeds Campaign Record)
- **`assessments`** — the six Analyst Observations cards: 16 generator
  archetypes (SYNERGY IDENTIFIED, COMPATIBILITY CONCERN, THEATER PREFERENCE,
  THEATER VULNERABILITY, HIGH-VALUE OPERATOR, PERFORMANCE DEFICIT, SESSION
  DISCIPLINE, ONE-TRICK EXPOSURE, THEATER DIVERGENCE, THEATER SPECIALIST,
  CROSS-THEATER CONSISTENCY, OPERATIONAL CEILING, TEMPORAL ANOMALY, TEMPORAL
  VARIANCE, COMPOSITION LOCK, FLAWLESS OPERATION), three copy variants each,
  candidates need >= 3 joint games; top four by weight, padded with PATTERN
  ANALYSIS, one to three decorative redacted slots, and CONTINUED
  SURVEILLANCE for any remaining slot. Card shape `{code, severity, title,
  subject, note, redacted?, redactedVariant?}`

A tilt heuristic (post-loss WR, loss streaks, late-session decay) is computed
server-side to feed the SESSION DISCIPLINE observation only; it is **not**
part of the payload (no UI consumes it).

**Tests** (`npm test`, `node --test`, 32): `stats.test.js` (audit set —
Arena, remakes, roster padding), `stats.engine.test.js` (timeline, duo links,
WR-without, mode breakdown, heatmap, recent form, synergies, remake
boundaries, mixed teams, payload shape), `season.test.js` (boundary cases);
builders in `test-helpers.js`.

---

## V1 FEATURE SCOPE

Build only these features in V1. Do not add scope.

1. **Enlistment** — User registration with Riot ID linkage
2. **Cell creation + invite codes** — Create a named cell, generate invite codes
   (`LGN-XXXX-XXXX`), others join via code on the Intake page
3. **Handler role** — Cell creator has handler privileges (manage members,
   regenerate invite codes, dissolve cell)
4. **Briefing** — Full dashboard with ALL sections:
   - Cell Members (summary strip + operator table)
   - Game Mode Breakdown (horizontal bars, 5-tier color scale)
   - Link Analysis (ring network graph of pair WRs; hover to isolate an operator)
   - Activity Heatmap (7-day x 24-hour)
   - Champion Pools (per-operator, per-theater distribution bars + class badges)
   - Campaign Record (full-width season trend: game-time rolling WR, dark periods, streak records)
   - Analyst Observations (6 field assessment cards)
5. **Operation Log** — Joint match history with theater/outcome/operator filters
6. **Cell switcher** — Header dropdown to switch between cells
7. **Empty states** — Redacted UI for zero-cell authenticated users

**NOT in V1 (future phases):**
- Cross-CELL competition / leaderboards
- Social feed / posts
- Direct messaging
- Public CELL profiles
- OAuth providers (Discord, Riot)

---

## OPEN QUESTIONS (to be resolved during build)

Still open:
- **Field Assessment templates:** 16 archetypes ship in `stats.js` (see Stats
  Engine). The full 30-50 archetype library with trigger conditions, slot
  specs, prose templates, and severity tags is still to be authored.
- **Campaign Record time ranges:** Chart currently shows the full season at
  per-game resolution. A 30D / SPLIT / SEASON range selector (with per-night
  resolution at 30D) was designed but deliberately cut — revisit if cells with
  long histories find the chart crowded.
- **Invite code regeneration:** scoped to the handler role in V1 but unbuilt —
  no endpoint or UI exists to rotate a cell's code.
- **Leaving a cell / handler-less cells:** a non-handler has no way to leave
  (`DELETE /members/:self` is handler-only) and a cell whose creator deleted
  their account (`created_by` NULL) can never be managed or dissolved. Needs
  a decision — e.g. allow self-removal for members and promote the earliest
  remaining member to handler.
- **LICENSE:** the public repo has no license file; both `package.json`s are
  `private` / `UNLICENSED` until one is chosen.

Resolved during build (on record so they are not re-litigated):
- **Invite code lifecycle — RESOLVED:** one reusable, non-expiring code per
  cell, generated at creation and stored on `cells.invite_code`. Surfaced on
  the Briefing banner and the solo-cell overlay; redeemed on Intake via
  `POST /api/cells/join-by-code`.
- **Empty-state visuals — RESOLVED:** built as `CellOverlay` (zero-cell
  create/join card; solo-cell invite prompt) plus redacted header and switcher
  states.
- **Handler UI surface — RESOLVED:** no separate Directives page. Handler
  actions (dissolve cell, remove operator) live in the cell switcher's
  per-cell manage panel behind type-the-name `ConfirmModal` confirmations.
- **Redacted observation count — RESOLVED:** one to three of six, seeded by
  the data (deliberately varied so the card set feels different as matches
  come in).

---

## FILE STRUCTURE (CURRENT STATE)

```
LEGION/
├── CLAUDE.md                              <- THIS FILE (single source of truth)
├── README.md                              <- public GitHub readme (OG banner, CI badge, quickstart, env table)
├── supabase_schema.sql                    <- database schema (re-runnable; in sync with the live DB since Phase 1)
├── vercel.json                            <- Vercel build + rewrites (/api/* -> function, SPA fallback) + asset caching + security headers
├── .env.example                           <- server env template (project URL prefilled)
├── .editorconfig                          <- two-space / LF / UTF-8 contract
├── .nvmrc                                 <- Node 20
├── .gitignore
├── .github/workflows/ci.yml               <- CI: client lint + build, server tests
├── .claude/launch.json                    <- dev launch configs: client :5173, server :3001 (nodemon), mockups :3333
│
├── api/                                   <- VERCEL SERVERLESS WRAPPER
│   └── [...path].js                       <- exports server/index.js as one Vercel function — NEVER DELETE
│
├── mockups/                               <- STATIC HTML/CSS REFERENCE DESIGNS
│   ├── dossier.css                        <- shared design system (COLOR + TYPE source of truth)
│   ├── landing.html
│   ├── about.html
│   ├── authenticate.html                  <- sign-in + new operator tabs
│   ├── intake.html                        <- cell creation/join form
│   ├── briefing.html                      <- cell dashboard (full layout)
│   ├── match-history.html                 <- operation log (full layout)
│   └── package.json                       <- `npm run dev` -> http-server :3333
│
├── client/                                <- REACT FRONTEND (Vite)
│   ├── .env                               <- Supabase keys (gitignored, local only)
│   ├── .env.example
│   ├── package.json                       <- legion-client: React 19, Vite 8, Tailwind 4, React Router 7; Node >= 20
│   ├── vite.config.js                     <- React + Tailwind plugins, /api proxy, vendor chunk groups
│   ├── eslint.config.js
│   ├── index.html                         <- meta description, Open Graph / Twitter cards, font <link>s, icons
│   ├── public/
│   │   ├── favicon.svg                    <- ink square, paper "L"
│   │   ├── apple-touch-icon.png           <- 180px render of the favicon
│   │   ├── og.png                         <- 1200x630 link-preview card (dossier cover)
│   │   ├── icons.svg                      <- icon sprite
│   │   ├── robots.txt                     <- public routes indexable; case files and /api disallowed
│   │   └── sitemap.xml
│   └── src/
│       ├── main.jsx                       <- app entry point
│       ├── App.jsx                        <- routes, TitleSync, <main>, ErrorBoundary
│       ├── index.css                      <- Tailwind + LEGION design tokens (no dead rules)
│       ├── lib/
│       │   ├── supabase.js                <- Supabase client init (fails fast on missing env)
│       │   ├── api.js                     <- authenticated API wrapper (err.status / err.code on failures)
│       │   ├── modes.js                   <- STAPLE_MODES, resolveMode, isRotating (shared by both pages)
│       │   ├── devMock.js                 <- DEV_MOCK gate + isMockCell (the only static mock import)
│       │   └── mockData.js                <- dev-only NIGHT SHIFT cell fixtures (dynamically imported, never in prod)
│       ├── hooks/
│       │   ├── useAuth.jsx                <- auth context: session, cells, link, reset (DEV_MOCK fakes a session in dev)
│       │   └── useClipboard.js            <- copy + "COPIED" confirmation
│       ├── components/
│       │   ├── Header.jsx                 <- site nav, cell switcher with per-cell manage panel (remove operator / dissolve cell)
│       │   ├── PageHeader.jsx             <- sticky page header + Sync Intel + result line (Briefing, OpLog)
│       │   ├── FetchFault.jsx             <- retrieval-failure card; 401 clears the session before re-auth
│       │   ├── ErrorBoundary.jsx          <- render-fault card with reload
│       │   ├── Redacted.jsx               <- <Redacted> / <RedactedBar> (aria-hidden + sr-only "[redacted]")
│       │   ├── Footer.jsx                 <- classified doc footer
│       │   ├── ProtectedRoute.jsx         <- auth guard (redirect to /authenticate?return_to=…)
│       │   ├── CellOverlay.jsx            <- zero-cell create/join overlay, retry card, solo-cell invite prompt
│       │   ├── ConfirmModal.jsx           <- type-to-confirm dialog (error line, busy state)
│       │   └── CampaignRecord.jsx         <- full-width season trend chart (Briefing)
│       └── pages/
│           ├── Landing.jsx
│           ├── About.jsx
│           ├── Authenticate.jsx           <- sign-in / new operator / passcode reset; safeReturnTo; error copy map
│           ├── Intake.jsx                 <- cell creation or join
│           ├── Briefing.jsx               <- cell dashboard (remounts per cell)
│           └── OperationLog.jsx           <- joint match history (remounts per cell)
│
└── server/                                <- EXPRESS BACKEND
    ├── .env                               <- Supabase + Riot API keys (gitignored, local only)
    ├── .env.example
    ├── package.json                       <- legion-server: Express 5, Supabase, cors, dotenv; `npm test` = node --test; Node >= 20
    ├── index.js                           <- entry: CORS, 16 kB JSON limit, routes, JSON 404 + error handlers
    ├── middleware/
    │   └── auth.js                        <- requireAuth (401 / 503 on Auth outage)
    ├── data/
    │   └── champions.js                   <- champion metadata (classes, roles, traits) keyed by Riot championName
    ├── db/
    │   └── supabase.js                    <- Supabase client init (service role key, fail-fast)
    ├── routes/
    │   ├── cells.js                       <- cells CRUD, join-by-code, ingest, stats, operations (UUID guards, keyset reads)
    │   └── operators.js                   <- validate Riot ID, link Riot ID, get dossier
    └── services/
        ├── riot.js                        <- rate-limited, timeout-guarded Riot API calls + bounded cache
        ├── season.js                      <- season window helpers (pure)
        ├── stats.js                       <- group-level stats computation
        ├── test-helpers.js                <- match/participant builders for tests
        ├── stats.test.js                  <- audit-set tests (Arena, remakes, roster padding)
        ├── stats.engine.test.js           <- payload coverage (timeline, duos, modes, heatmap, …)
        └── season.test.js                 <- season boundary tests
```

---

## GROUND RULES FOR DEVELOPMENT

1. **Ask before touching auth or DB schema** — confirm before modifying
   Supabase tables or auth configuration
2. **Never commit secrets** — API keys go in `.env` only, always in `.gitignore`
3. **Mobile-first** — all components must work on mobile before desktop polish
4. **One feature at a time** — complete and test each feature before starting the next
5. **Comment non-obvious logic** — especially Riot API or stat math
6. **Preserve the tone** — all user-facing strings must match the dossier copy style.
   When drafting new copy, ask: "Would a Cold War intelligence analyst write this?"
7. **Cache Riot API responses** — store match data in DB after first fetch,
   never re-fetch what you already have
8. **Mockups are the visual source of truth** — `mockups/` contains the reference
   designs. When in doubt about layout, spacing, or styling, consult the mockups.
   Run `npm run dev` in `mockups/` for http-server on port 3333.
9. **Build vertically, not horizontally** — complete one full slice end-to-end
   before starting the next. Don't scaffold broadly.
10. **Verify in browser** — every completed slice should work in `npm run dev`.
    If the browser doesn't show the expected behavior, it's not done.
11. **Keep CI green** — `npm run lint` (client) and `npm test` (server) must
    pass before a push; a push to `master` is a production deploy.

---

## CURRENT STATUS

**Phase:** V1 built and deployed — all pages implemented, live in production.
Audit remediation Phases 1-4 shipped (Phases 1-3 in `e1e468a`, Phase 4
accessibility in `9194eb2`; DB migration `phase1_security_hardening` applied
live). Button-up pass 2026-08-21 (see Session Log) — lint clean, 32/32 tests,
CI workflow in place.
**Live site:** `https://legion-pi-nine.vercel.app` (GitHub: `Lee-John-J/LEGION`;
pushes to `master` trigger a Vercel production deploy)
**Supabase project:** `https://kulnpqrnyjxzdegzcivf.supabase.co`

**What exists:**
- All six pages implemented to the mockups; Briefing and Operation Log fully featured
- Full backend: cells/operators routes, Riot API service (rate limiter,
  timeouts, bounded cache), stats engine emitting the full payload (see Stats Engine)
- Invite code system: generated at cell creation, `join-by-code` endpoint,
  Intake join field, Briefing banner, solo-cell overlay
- Handler actions: dissolve cell + remove operator, type-to-confirm modals
  with in-dialog error reporting, reached via the cell switcher's manage panel
- Empty states (`CellOverlay` + redacted chrome), fetch error/retry states,
  error boundary, cell switcher, Vercel serverless deployment (`api/[...path].js`)
- Audit Phases 1-3 (2026-08-19): RLS hardened + schema re-synced, throttled
  public endpoints, crypto invite codes, Arena/remake/season stats corrections,
  race-guarded fetches with dossier-toned error states, working password-reset
  flow, accessible Intake radios
- Phase 4 (2026-08-20): WCAG 2.1 AA pass — keyboard-operable switcher/manage
  toggle and Link Analysis nodes, dialog semantics + focus trap, per-route
  titles, `<main>`, real heading tree, live-region announcements, W/L barcode
  shape cue, heatmap peak caption, sr-only redactions, contrast token pass,
  320/375 px reflow, reduced-motion coverage
- Button-up (2026-08-21): season-window bug (Jan 1-9 blackout) fixed; ingest
  existence check chunked + time-budgeted; keyset match reads; Riot fetch
  timeouts; `adjacent_cells` leak removed; transient-auth 503; UUID/body
  validation; shared `requireAuth`; JSON 404/error handlers; sync-after-switch
  race fixed by per-cell remount; `return_to` hardened; mock data out of prod;
  vendor chunking; CI; OG/meta/robots/sitemap; on-brand favicon; dead CSS and
  template leftovers removed; 20 new tests; docs re-synced

**What's needed before public launch:**
1. **Manual Supabase dashboard step (still pending as of 2026-08-21):**
   enable leaked-password protection (Authentication -> Sign In / Providers
   -> Passwords). The advisor still reports it off
2. **Phase 5 — public exposure:** JSONB egress (`match_participants` table or
   a trimmed `summary` column — a DB change, so it needs a go-ahead; today
   `/stats` and `/operations` load every full match payload per page view),
   shared rate limiter + production Riot key, privacy/ToS/account deletion,
   monitoring, invite links, a LICENSE decision, and optionally a repo
   social-preview image (the OG card in `client/public/og.png` is ready for it)

Also outstanding: Field Assessment full template library, invite code
regeneration, leave-cell / handler-less cells (see Open Questions).

---

## SESSION LOG

| Date | What was done |
|---|---|
| 2026-04-05 | Full V1 scaffold: React+Vite+Tailwind frontend, Express backend, all pages, Riot API service, stats engine, Supabase schema |
| 2026-05-13 | CLAUDE.md audit + consolidation: merged project-summary.md and mockup-feature-reference.md into single source of truth, fixed color palette, typography, terminology, routes, and feature scope to match actual mockups |
| 2026-08-14 | Campaign Record replaces Tilt Index on the Briefing: new full-width season trend chart (game-time rolling 20-game WR, hatched dark periods, W/L barcode, streak records) placed before Champion Pools. Server stats now emit a `timeline` array; Tilt UI removed (tilt heuristics retained server-side to feed Analyst Observations). Mockup briefing.html re-synced with the live app (Link Analysis in top row, Duo Win Rates matrix removed, ARAM Mayhem advisory added) |
| 2026-08-19 | Full-scope audit completed (seven review agents + live-site, build, and Supabase advisor checks): ~70 findings, verdict structurally sound; two critical RLS defects flagged (SEC-01/02), remediation Phase 1 pending go-ahead. Findings register filed as the "LEGION Inspection Report" artifact. CLAUDE.md re-synced to the codebase: file tree (Vercel `api/` wrapper, new components, mockData/champions), API endpoint table (join-by-code, DELETE routes, public validate-riot-id), invite-code data model, RLS policies as written + known defects, sanctioned copy exceptions recorded, ZOO glossary ruling (partially redacted by design), current status rewritten (V1 live at legion-pi-nine.vercel.app) |
| 2026-08-19 | Audit remediation Phases 1-3 shipped (commit `e1e468a`, deployed to production; DB migration `phase1_security_hardening` applied live). Phase 1: RLS reduced to a six-policy read/delete-only model (all writes server-side via service role), anon grants revoked, `join_cell_by_invite_code` RPC dropped, `created_by` ON DELETE SET NULL, service-key fail-fast, validate-riot-id per-IP throttle + result cache, crypto.randomInt invite codes + join throttle. Phase 2: Arena subteam grouping, remake exclusion, real season filter + pagination past the 1000-row cap, null WR for zero-game members, first test suite (`stats.test.js`, 12 tests, `npm test`), node-fetch dropped, Node >= 20. Phase 3: race-guarded fetches + per-cell state reset, dossier-toned error/retry states, Riot-link short-circuit + failure banner, full password-reset flow, keyboard-operable Intake radios + `NIGHT SHIFT` placeholder (ZOO lore violation cleared) |
| 2026-08-20 | Audit remediation Phase 4 — accessibility, WCAG 2.1 AA pass (commit `9194eb2`): per-route titles + `<main>` + real heading tree; ConfirmModal dialog semantics, focus trap and restore; keyboard-reachable manage toggle (real sibling button, aria-expanded, Escape); Link Analysis nodes focusable and touch-operable, role/summary, dark text tiers, 7 -> 10 node cap; Campaign Record barcode wins-up/losses-down + tap crosshair; heatmap role=img + computed summary + visible PEAK caption; pool-bar sr-only summaries; `--muted-light` retired from text; profile badges re-tinted; redaction helpers aria-hidden + sr-only "[redacted]"; OpLog chips aria-pressed + role=group; tables th scope=col in `.table-scroll`; reduced-motion extended; 320/375 px reflow; Landing REPORT-01 and About glossary Tilt -> Campaign Record |
| 2026-08-21 | Button-up pass (code, presentation, GitHub). Harvested four uncommitted worktrees (docs re-sync, Tilt copy purge in README + mockups, dead `.tilt-*`/matrix CSS). Server: season window falls back to last year's boundary Jan 1-9 (`services/season.js`, tested); ingest existence check chunked (PostgREST 1000-row cap) + 45 s time budget + auto-link error check; keyset pagination on `match_id`; Riot fetch 8 s timeout, bounded cache, match payloads uncached; `adjacent_cells` cross-cell disclosure removed from `/stats`; `/operations` uses `getSameTeamCellGroup` and emits `user_id`; shared `middleware/auth.js` (503 on Auth outage); UUID param guards, body-absent guards, Riot ID shape checks, cache bound; JSON 404 + error middleware, `x-powered-by` off, 16 kB body limit; `tilt_index` dropped from the payload; dead code removed; 20 new tests (32 total). Client: Briefing/OpLog remount per cell (fixes the sync-after-switch race and the new react-hooks lint); shared PageHeader / FetchFault / Redacted / ErrorBoundary / modes; `return_to` same-origin resolution (backslash bypass); 401 re-auth clears the session first; canonical Riot ID at sign-up; YOU by `user_id` everywhere; OpLog chip sort bug (`op.result`) fixed; sync banner covers every ingest status; empty-filter notice; Campaign Record gap cap; ConfirmModal error/busy states replace `alert()`; copy-to-clipboard confirmation; Supabase Auth error copy map; PASSCODE labels; ZOO glossary trimmed to the ruling; About "by Riot ID" copy fixed; contrast fixes; Link Analysis `role=group`; mock data dynamically imported behind `import.meta.env.DEV` (out of prod); vendor chunks (entry 525 -> 97 kB); fonts via `<link>`; meta description + Open Graph/Twitter cards + 1200x630 OG card + apple-touch-icon; on-brand favicon; robots.txt + sitemap.xml; Vercel asset caching + security headers; 32 dead CSS selectors removed; Vite template leftovers deleted. Repo: deps updated (0 vulnerabilities), package metadata (`legion-client` / `legion-server`, private, Node >= 20), `.nvmrc`, `.editorconfig`, GitHub Actions CI, README rewritten (OG banner, CI badge, env table, deployment notes), CLAUDE.md re-synced, GitHub topics set |
