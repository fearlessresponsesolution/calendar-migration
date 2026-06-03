# Shift Calendar — Next.js Migration Design Spec
**Date:** 2026-06-03
**Status:** Approved

---

## Overview

Migrate the existing single-file offline HTML shift calendar to a full-stack Next.js web application. The new app replaces manual PDF exports with real-time schedule syncing, adds Google-authenticated self-service for all team members, and introduces admin tools for shared schedule management, role tagging, and permission allocation.

**Source project:** `git@github.com:fearlessresponsesolution/calendar.git`
**New project:** New GitHub repository → auto-deployed to Vercel

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
- Members can only write their own appointments (`created_by_user_id` must match session user). Admin operations require `role === 'admin'` check at the route level.
- Service role key used for all DB writes. Never exposed outside server-side code.

### Layer 4 — Supabase Row-Level Security
- RLS enabled on every table. Default DENY — no policy means no access, even for the anon key.
- **Shifts / shift_assignments / members / roles / shift_templates:** `SELECT` allowed for authenticated users. `INSERT` / `UPDATE` / `DELETE` via service role only (server-side API routes).
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
  color        text not null,  -- member dot color, distinct from role color
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
Members can open any day cell and add an appointment (time-off, PTO, personal note) for themselves. They can edit and delete their own appointments. They cannot see other members' appointment notes (privacy by RLS).

### For Admins

**Shared Schedule Management**
Any admin can create, edit, and delete shifts and shift assignments. No single point of failure for scheduling.

**Work Role Tags**
Each role is auto-assigned a color from a fixed palette on creation. Role badges appear as colored pills next to each member's name in every shift bar across the calendar. Badge label uses the role name (truncated to ~6 chars if needed). Badge color is consistent across the entire calendar for fast scanning.

**Permission Allocation (Admin tab in Settings)**

*User Access panel (left):*
- Scrollable list of all allowlisted emails showing: avatar initial, email, linked member name (or "⚠ Not yet linked"), role dropdown (Admin/Member), remove button.
- Add user form: email input + role selector + "Add User" button.
- Role changes take effect on the user's next login.

*Member Linking panel (right):*
- Roster of all schedule members, each with a dropdown listing allowlisted emails + "— unlinked —" option.
- Linking connects a login account to a schedule member, enabling self-service appointments for that member.
- Unlinked members remain on the schedule and visible to all; they just cannot log in.

---

## UI Layout

Preserves the existing dark theme and calendar grid layout. Changes from the original:

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  Shift Calendar  ◄  June 2026  ►  [Today]                        │
│  [👁 Appointments] [⚠ Conflicts N] [⚙ Settings] [👤 Name ▾]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         CALENDAR GRID  (identical layout to original)            │
│         Shift bars now show role badge pills next to names       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Coverage summary per shift template                     │
└─────────────────────────────────────────────────────────────────┘
```

**Header changes:**
- Print button (🖨) removed — PDF export is eliminated by design.
- User avatar/name dropdown replaces it, showing the signed-in user's name with a sign-out option.

**Settings modal — new Admin tab:**
- Visible only when `session.user.role === 'admin'`. Members never see this tab.
- Contains User Access + Member Linking panels (see admin panel design above).

**Member self-service appointments:**
- Members in appointment view see only their own appointments. Admins see all.
- A member opening a day cell in appointment view sees a pre-selected form for their own linked member record (no member dropdown — they can only add for themselves).

---

## Data Migration

A one-time migration tool accessible at `/admin/migrate` (admin only, hidden from nav after use).

**Flow:**
1. Admin exports the existing app data: opens the old app, clicks "Export for Migration" (a new button we add to the old app), downloads a `migration.json` file.
2. Admin goes to `/admin/migrate` in the new app, uploads `migration.json`.
3. Migration API route validates the JSON shape, maps old string IDs to UUIDs, inserts all rows in dependency order: roles → members → shift_templates → shifts → shift_assignments → appointments.
4. Summary page shows counts of imported records and any skipped/invalid rows.
5. After confirmed success, admin can delete the old HTML file.

**Export format** (added to old app as a one-shot download):
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
/                    → redirect to /calendar
/login               → Google sign-in page (public)
/calendar            → main calendar view (authenticated)
/admin               → redirect to /admin/users
/admin/users         → user access + member linking (admin only)
/admin/migrate       → one-time migration tool (admin only)
/api/auth/[...nextauth] → Auth.js handler
/api/shifts          → GET, POST
/api/shifts/[id]     → PUT, DELETE
/api/appointments    → GET, POST (members: own only; admins: all)
/api/appointments/[id] → PUT, DELETE (members: own only)
/api/admin/users     → GET, POST, DELETE (admin only)
/api/admin/users/[id] → PUT role/link (admin only)
/api/admin/migrate   → POST import (admin only)
```

---

## Error Handling

- **Not on allowlist:** Clear "Access denied — contact your administrator" on the login page. No generic 401.
- **Session expired:** Middleware redirects to `/login` with a `?reason=expired` param — login page shows "Your session expired, please sign in again."
- **Real-time disconnected:** A subtle "Reconnecting..." banner appears; the client auto-reconnects via Supabase's built-in retry logic.
- **Conflict on appointment save:** API returns 409 with a human-readable message ("You already have an appointment on this day") — shown inline in the form.
- **Migration validation failure:** Per-row error list shown in the migration summary; valid rows are still imported.

---

## Out of Scope

- Print/PDF export (eliminated by design — replaced by real-time sharing)
- Email notifications
- Mobile-native app
- Calendar sync (Google Calendar integration)
- Multiple organisations / tenancy
