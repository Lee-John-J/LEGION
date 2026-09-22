# LEGION — Launch Tracker
**DOCUMENT TYPE: LAUNCH DIRECTIVE**
**LAST UPDATED: 2026-09-22**

Open this file at the start of every session until public launch. Update it
in place, the same way as `CLAUDE.md`: change a row's status the moment it
changes, and do not start a new copy.

> **This repository is public.** Credentials, API keys, recovery codes, and
> 2FA secrets belong in the password manager, never here. Think before you
> write a login email in this file too: anything committed is published.

---

## 1. ACCOUNTS & THIRD PARTIES

| Service | Purpose | Login email | Plan / tier | Status | Date | Notes |
|---|---|---|---|---|---|---|
| Registrar | Custom domain (none yet; the site runs on `legion-pi-nine.vercel.app`) | TBD | TBD | NOT REGISTERED | — | Pick a registrar and a domain, then point the DNS at Vercel |
| Vercel | Hosting: static client + `api/[...path].js` function | TBD | TBD (confirm Hobby or Pro) | ACTIVE | 2026-04-05 (approx. first deploy) | Pushes to `master` deploy to production. Hobby does not allow commercial use and has a 60 s function limit |
| Supabase | Postgres + Auth, project `kulnpqrnyjxzdegzcivf` | TBD | TBD (confirm Free or Pro) | ACTIVE, one dashboard step pending | 2026-08-19 (Phase 1 migration applied) | Leaked-password protection is still off. Free-tier projects pause after a week with no activity |
| Riot Developer Portal | League data (account, match-v5) | TBD | Development key (20 req/s, 100 req/2 min; expires every 24 h) | DEV KEY ONLY | TBD | A production key needs an approved app registration with a live product URL |
| Contact email | Public contact address for the privacy policy, ToS, and the Riot application | TBD | — | NOT SET UP | — | Use a dedicated address, not a personal inbox |

**Status values:** `NOT REGISTERED` / `NOT SET UP` / `PENDING` / `ACTIVE` /
`DEV KEY ONLY` / `APPROVED`. **Date** is the date the status last changed.

---

## 2. CHECKLIST

Rules:
- One commit per item. Record its short hash in the **Commit** column when
  it lands (`—` for dashboard-only items with no code change; record where
  the change was made instead).
- An item is done only when it has been **verified in the browser** on the
  live site (or the dashboard, for account items). Write what was checked,
  not just "yes".
- Tick the box in the same commit that does the work, or in a follow-up
  commit right after the hash is known.

| # | Done | Item | Commit | Verified in browser |
|---|---|---|---|---|
| 1 | [ ] | _Awaiting the item list_ | — | — |

<!--
Seed candidates from CLAUDE.md "What's needed before public launch"
(kept here as a reference until the real list is filled in):
- Enable Supabase leaked-password protection (Authentication -> Sign In / Providers -> Passwords)
- JSONB egress: match_participants table or trimmed summary column (DB change, needs go-ahead)
- Shared rate limiter + production Riot key
- Privacy policy, ToS, account deletion
- Monitoring
- Invite links
- LICENSE decision
- Repo social-preview image (client/public/og.png is ready)
-->
