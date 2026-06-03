# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What This Is

A full-stack Next.js migration of the offline HTML shift calendar at `/home/whati/calendar`.

- **Source project (read-only reference):** `/home/whati/calendar` — single `index.html` app, IndexedDB persistence
- **This project:** Next.js + Auth.js + Supabase, deployed to Vercel via GitHub

## Design Spec

`docs/superpowers/specs/2026-06-03-nextjs-migration-design.md` — approved design spec covering stack, security model, data model, UI, and migration tool. Read this before making architectural decisions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Auth | Auth.js v5 (Google OAuth) |
| Database | Supabase (PostgreSQL + real-time) |
| Deployment | Vercel (GitHub → auto-deploy) |
| Validation | Zod |
| Styling | Tailwind CSS (dark theme) |
| Language | TypeScript |

## Security Model

Four layers of defence — see spec for full detail:
1. Browser: anon key only (RLS-locked, no writes)
2. Next.js middleware: session + role gate on every request
3. API routes: re-validate session, Zod input validation, scope checks
4. Supabase RLS: default DENY on all tables

## Key Constraints

- **Never expose the Supabase service role key or `NEXTAUTH_SECRET` to the client bundle**
- All mutations go through server-side API routes — never direct from the browser
- Appointments are private: no real-time channel, API-route access only
- Real-time subscriptions cover public schedule data only: `shifts`, `shift_assignments`, `members`, `roles`
- Two permission tiers: `admin` and `member` — no other levels

## Source Data Model (for migration reference)

The existing app stores state in IndexedDB key `shift_cal_v1`. Shape:
```js
{ members, roles, shiftTemplates, schedule: { "YYYY-MM-DD": [...] }, appointments: { memberId: [...] } }
```
The migration tool lives at `/admin/migrate` and accepts a `migration.json` export from the old app.

## Git

- Branch: `main`
- All commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
