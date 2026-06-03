# Shift Calendar — Next.js Migration Design Spec
**Date:** 2026-06-03
**Status:** Approved

---

## Overview

Migrate the existing single-file offline HTML shift calendar to a full-stack Next.js web application. The new app replaces manual PDF exports with real-time schedule syncing, adds Google-authenticated self-service for all team members, and introduces admin tools for shared schedule management, role tagging, and permission allocation.

**Source project:** `git@github.com:fearlessresponsesolution/calendar.git`
**New project:** `calendar-migration` → new GitHub repo → auto-deployed to Vercel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Auth | Auth.js v5 (Google OAuth provider) |
| Database | Supabase (PostgreSQL + real-time) |
| Deployment | Vercel (GitHub → auto-deploy) |
| Validation | Zod |
| Styling | Tailwind CSS (dark theme matching original) |
| Language | TypeScript |

---

## Architecture

### Delivery
Next.js App Router on Vercel. All mutations go through server-side API routes. The browser never holds the Supabase service role key or any OAuth secret.

### Real-time Sync
Supabase real-time channels (WebSocket). The browser subscribes to `shifts`, `shift_assignments`, `members`, and `roles` channels using the anon key — all public schedule data. Appointments are **not** broadcast via real-time (they are private per-member); appointment changes are fetched on demand via API route. On any real-time change event, the client re-fetches the affected data and updates the calendar UI.

### State Management
Server state via React Server Components + SWR for client-side cache invalidation on real-time events. No global client-side store needed — the Supabase subscription triggers a targeted SWR revalidation.

---

## Security — Defence in Depth

Security is enforced at four independent layers. Bypassing one layer does not grant access.

### Layer 1 — Browser
- Supabase **anon key** only. Locked by RLS to read-only real-time subscriptions for public schedule data. Cannot write anything directly.
- **HTTP-only session cookies** (Auth.js default). JavaScript cannot read or steal the session token.
- **Minimal OAuth scopes:** `email` + `profile` only. No calendar, drive, or any other Google access requested.
- No secrets (service role key, `NEXTAUTH_SECRET`, OAuth client secret) ever bundled into the client.

### Layer 2 — Next.js Middleware
- Runs before every request. Unauthenticated requests redirect to `/login` with no exceptions.
- Admin routes (`/admin/*`, `/api/admin/*`) additionally verify `session.user.role === 'admin'`. Members who guess admin URLs get a 403.
- CSRF protection via Auth.js built-in token validation on all state-changing routes.

### Layer 3 — API Routes
- Every route calls `auth()` server-side and re-validates the session. Client-supplied role claims are ignored.
- All incoming data parsed through Zod schemas before touching the database. Malformed input is rejected with a 400 before any DB call.
- Members can only write their own appointments (`created_by_user` must match session user and `member_id` must match their linked member record). Admin operations require `role === 'admin'` check at the route level.
- Service role key used for all DB writes. Never exposed outside server-side code.

### Layer 4 — Supabase Row-Level Security
- RLS enabled on every table. Default DENY — no policy means no access, even for the anon key.
- **Shifts / shift_assignments / members / roles / shift_templates:** `SELECT` allowed for authenticated-equivalent anon key requests (public schedule data). `INSERT` / `UPDATE` / `DELETE` via service role only (server-side API routes).
- **Appointments:** No direct browser access at all. RLS blocks the anon key from reading or writing appointments. All appointment reads and writes go through server-side API routes (service role key). Access control for appointments is enforced entirely at Layer 3 — not via RLS, because Auth.js session JWTs are not Supabase-issued and `auth.uid()` is not available.
- Real-time subscriptions cover only public schedule data. Appointment privacy is maintained by never putting appointment data on a real-time channel.

### Auth Flow
1. User clicks "Sign in with Google"
2. Auth.js redirects to Google OAuth (scopes: email, profile)
3. Google callback returns to `/api/auth/callback`
4. Auth.js `signIn` callback queries the `users` table for the email
5. Email not found → session denied → user sees "Access denied — contact your administrator"
6. Email found → `role` attached to JWT → HTTP-only session cookie set
7. All subsequent requests read role from the server-side session, never from the client

---

## Data Model

PostgreSQL schema on Supabase. All IDs are UUIDs.

```sql
-- Auth allowlist + app roles
users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  role         text not null default 'member',  -- 'admin' | 'member'
  created_at   timestamptz default now(),
  created_by   uuid references users(id) on delete set null
)

-- Work roles (Nurse, Technician, Coordinator, etc.)
roles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null,  -- hex, auto-assigned from palette on creation
  created_at   timestamptz default now()
)

-- Schedule members (staff)
members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null,  -- member dot color, distinct from role badge color
  role_id      uuid references roles(id) on delete set null,
  user_id      uuid references users(id) on delete set null,  -- optional login link
  created_at   timestamptz default now()
)

-- Named shift windows
shift_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  start_time   time not null,
  end_time     time not null,
  created_at   timestamptz default now()
)

-- Scheduled shift instances
shifts (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  template_id  uuid references shift_templates(id) on delete set null,
  start_time   time not null,
  end_time     time not null,
  is_ad_hoc    boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
)

-- Many-to-many: shifts ↔ members
shift_assignments (
  shift_id     uuid references shifts(id) on delete cascade,
  member_id    uuid references members(id) on delete cascade,
  primary key (shift_id, member_id)
)

-- Member time-off / personal notes
appointments (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references members(id) on delete cascade,
  date             date not null,
  start_time       time,         -- null when all_day = true
  end_time         time,         -- null when all_day = true
  all_day          boolean not null default false,
  note             text not null,
  created_by_user  uuid references users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
)
```

**Key decisions vs original:**
- `shift_assignments` is a proper join table (was an array in IndexedDB) — enables clean SQL joins for conflict detection and coverage queries.
- `users` and `members` are separate tables. A member can exist on the schedule without a login account. When linked, `members.user_id` connects them.
- `roles.color` is a dedicated color for the role badge (distinct from `members.color`, which is the member dot color).
- `appointments.created_by_user` tracks accountability for self-service submissions.
- `time` and `date` native types replace text strings from IndexedDB.
- Midnight-spanning shifts (e.g. 22:00–06:00) handled in API-layer logic identical to the original `rangesOverlap()` approach.

---

## Feature Breakdown

### For All Members

**Google Auth**
Login page at `/login` with a single "Sign in with Google" button. Non-allowlisted emails receive a clear "Access denied — contact your administrator" message. No registration flow — accounts are admin-created only.

**Dynamic Syncing**
All connected clients receive schedule changes in real time via Supabase WebSocket subscriptions. No manual refresh required.

**Self-Service Appointments**
Members can open any day cell in appointment view and add an appointment (time-off, PTO, personal note) for themselves. They can edit and delete their own appointments. They cannot see other members' appointment notes. A member opening a day in appointment view sees a pre-scoped form — no member dropdown, they can only submit for their own linked member record.

### For Admins

**Shared Schedule Management**
Any admin can create, edit, and delete shifts and shift assignments. No single point of failure for scheduling.

**Work Role Tags**
Each role is auto-assigned a color from a fixed palette on creation. Role badges appear as colored pills next to each member's name in every shift bar across the calendar. Badge color is consistent across the entire calendar for fast scanning. Badge label uses the role name (truncated to ~6 chars if needed for space).

**Permission Allocation (Admin tab in Settings)**

*User Access panel:*
- Scrollable list of all allowlisted emails: avatar initial, email, linked member name (or "⚠ Not yet linked" warning), role dropdown (Admin/Member), remove button.
- Add user form: email input + role selector + "Add User" button.
- Role changes take effect on the user's next login.

*Member Linking panel:*
- Roster of all schedule members, each with a dropdown listing allowlisted emails + "— unlinked —" option.
- Linking connects a login account to a schedule member, enabling self-service appointments.
- Unlinked members remain on the schedule and visible to all — they just cannot log in.

---

## UI Layout

Preserves the existing dark theme and calendar grid layout.

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  Shift Calendar  ◄  June 2026  ►  [Today]                        │
│  [👁 Appointments] [⚠ Conflicts N] [⚙ Settings] [👤 Name ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         CALENDAR GRID  (identical layout to original)            │
│         Shift bars show role badge pills next to member names    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Coverage summary per shift template                     │
└─────────────────────────────────────────────────────────────────┘
```

**Header changes from original:**
- Print button removed — PDF export eliminated by design.
- User avatar/name dropdown added (shows signed-in user, sign-out option).

**Settings modal — new Admin tab:**
- Visible only when `session.user.role === 'admin'`. Members never see this tab.
- Contains User Access + Member Linking panels side-by-side.

---

## Data Migration

A one-time migration tool at `/admin/migrate` (admin only, hidden from nav after successful import).

**Flow:**
1. Admin opens the old HTML app, clicks "Export for Migration" (a button added to the old app), downloads `migration.json`.
2. Admin uploads `migration.json` at `/admin/migrate` in the new app.
3. API route validates the JSON shape, maps old string IDs to UUIDs, inserts all rows in dependency order: roles → members → shift_templates → shifts → shift_assignments → appointments.
4. Summary page shows counts of imported records and any skipped/invalid rows.

**Export format (added to old HTML app):**
```json
{
  "version": 1,
  "exportedAt": "2026-06-03T...",
  "roles": [...],
  "members": [...],
  "shiftTemplates": [...],
  "schedule": { "YYYY-MM-DD": [...] },
  "appointments": { "<memberId>": [...] }
}
```

---

## Route Map

```
/                       → redirect to /calendar
/login                  → Google sign-in page (public)
/calendar               → main calendar view (authenticated)
/admin                  → redirect to /admin/users
/admin/users            → user access + member linking (admin only)
/admin/migrate          → one-time migration tool (admin only)
/api/auth/[...nextauth] → Auth.js handler
/api/shifts             → GET, POST
/api/shifts/[id]        → PUT, DELETE
/api/appointments       → GET, POST (members: own only; admins: all)
/api/appointments/[id]  → PUT, DELETE (members: own only)
/api/admin/users        → GET, POST, DELETE (admin only)
/api/admin/users/[id]   → PUT — role change or member link (admin only)
/api/admin/migrate      → POST — import migration.json (admin only)
```

---

## Implementation Phases

### Phase 1 — Foundation
*Goal: working skeleton on Vercel, auth gating in place, nothing is broken.*

- Scaffold Next.js project (TypeScript, Tailwind, App Router)
- Supabase project: create schema (all tables + RLS policies)
- Auth.js + Google OAuth provider wired up
- `signIn` callback queries `users` table; blocks non-allowlisted emails
- Next.js middleware — session gate on all routes, role gate on `/admin/*`
- Login page (`/login`) — "Sign in with Google" button, error states
- Stub `/calendar` page — authenticated, shows "Calendar coming in Phase 2"
- GitHub repo → Vercel integration, environment variables configured
- Seed one admin user row directly in Supabase dashboard to bootstrap access

**Exit criteria:** Admin can sign in via Google, non-allowlisted email is denied with a clear message, app deploys cleanly to Vercel.

---

### Phase 2 — Core Calendar
*Goal: full calendar UI working against live Supabase data, feature-parity with original.*

- API routes: `/api/shifts`, `/api/shifts/[id]`, members, roles, shift_templates (full CRUD)
- Calendar grid component (ported from original — 7-column grid, month navigation, today highlight)
- Shift bar rendering with role badge pills (per-role color)
- Day editor modal — shift CRUD, template dropdown, member checkboxes grouped by role, busy-member greying
- Settings modal — Roles tab, Members tab (with color picker), Shift Templates tab
- Coverage footer
- Conflict detection (port `rangesOverlap` / `detectConflicts` logic to server-side TypeScript)
- Conflicts dashboard panel with swap recommendations
- Member schedule view modal
- Keyboard shortcuts (Escape, arrow-key month nav)
- Right-click context menu — copy shifts to next day / next week

**Exit criteria:** An admin can manage the full schedule end-to-end. All original features work against the database.

---

### Phase 3 — Real-time & Self-Service
*Goal: all clients sync live; members can manage their own appointments.*

- Supabase real-time subscriptions (shifts, shift_assignments, members, roles channels)
- SWR integration — real-time events trigger targeted cache revalidation
- "Reconnecting…" banner on WebSocket disconnect
- Appointment view mode toggle
- Appointment editor — admin sees all members' appointments; member sees only their own and can only submit for themselves
- Member-scoped appointment API routes (`GET`/`POST`/`PUT`/`DELETE` with Layer 3 ownership check)
- Conflict badge and panel update live as appointments are added

**Exit criteria:** Two browser tabs open simultaneously both reflect a shift change within ~1 second without refresh. A member can add/edit/delete their own appointments; they cannot see or touch other members'.

---

### Phase 4 — Admin Panel & Migration
*Goal: admin can manage users and permissions; existing data is importable.*

- Admin settings tab (User Access panel + Member Linking panel)
- `/api/admin/users` routes — add/remove allowlisted emails, change roles, link to member
- `/admin/migrate` page — file upload UI, progress state, import summary
- `/api/admin/migrate` route — validates JSON, inserts in dependency order, returns per-table counts
- Export button added to old HTML calendar app (`migration.json` download)
- Hide migration route from nav after first successful import (track via a `settings` row in Supabase)
- End-to-end migration test: export from old app, import to new, verify counts

**Exit criteria:** Admin can add a new user via the UI without touching code or env vars. A full data export from the old app imports cleanly with correct record counts.

---

## Error Handling

- **Not on allowlist:** "Access denied — contact your administrator" on login page. No generic 401.
- **Session expired:** Middleware redirects to `/login?reason=expired` — login page shows "Your session expired, please sign in again."
- **Real-time disconnected:** Subtle "Reconnecting..." banner; Supabase client auto-retries.
- **Conflict on appointment save:** API returns 409 with a human-readable message shown inline in the form.
- **Migration validation failure:** Per-row error list in import summary; valid rows still import.

---

## Out of Scope

- Print/PDF export (eliminated — replaced by real-time sharing)
- Email notifications
- Mobile-native app
- Google Calendar sync
- Multiple organisations / tenancy
