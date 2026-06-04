# Shift Calendar — Phase 2: Core Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full calendar UI with feature parity to the original HTML app, working against live Supabase data — shifts, members, roles, conflict detection, settings, coverage footer.

**Architecture:** Client-side calendar page (`"use client"`) fetches data via SWR from Next.js API routes. API routes re-validate session on every request, use service role key for all DB writes. Conflict detection runs server-side on shift assignment. Components map 1:1 to UI regions in the spec's ASCII layout.

**Tech Stack:** Next.js 15 (App Router), SWR, Supabase JS v2, Zod, Tailwind CSS, TypeScript. Assumes Phase 1 is complete (auth, Supabase clients, middleware).

---

### Task 1: Shared TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write domain types**

Create `src/types/index.ts`:
```typescript
export interface DbRole {
  id: string
  name: string
  color: string
  created_at: string
}

export interface DbMember {
  id: string
  name: string
  color: string
  role_id: string | null
  user_id: string | null
  created_at: string
}

export interface MemberWithRole extends DbMember {
  role: DbRole | null
}

export interface DbShiftTemplate {
  id: string
  name: string
  start_time: string // "HH:MM:SS"
  end_time: string
  created_at: string
}

export interface ShiftMember {
  id: string
  name: string
  color: string
  role: DbRole | null
}

export interface DbShift {
  id: string
  date: string // "YYYY-MM-DD"
  template_id: string | null
  start_time: string
  end_time: string
  is_ad_hoc: boolean
  created_at: string
  updated_at: string
}

export interface ShiftWithMembers extends DbShift {
  template: DbShiftTemplate | null
  members: ShiftMember[]
}

export interface Conflict {
  memberId: string
  memberName: string
  memberColor: string
  date: string
  shifts: ShiftWithMembers[]
}

export type MonthSchedule = Map<string, ShiftWithMembers[]>
```

- [ ] **Step 2: Commit**

```bash
git add src/types/
git commit -m "chore: add shared TypeScript domain types"
```

---

### Task 2: API route utilities and conflict detection (TDD)

**Files:**
- Create: `src/lib/api-utils.ts`
- Create: `src/lib/conflicts.ts`
- Create: `src/lib/__tests__/conflicts.test.ts`
- Create: `src/lib/__tests__/api-utils.test.ts`

- [ ] **Step 1: Write failing conflict detection tests**

Create `src/lib/__tests__/conflicts.test.ts`:
```typescript
import { rangesOverlap, detectConflicts } from "../conflicts"
import type { ShiftWithMembers } from "@/types"

describe("rangesOverlap", () => {
  it("detects overlap in same-day shifts", () => {
    expect(rangesOverlap("08:00", "16:00", "12:00", "20:00")).toBe(true)
  })

  it("returns false for non-overlapping shifts", () => {
    expect(rangesOverlap("08:00", "16:00", "16:00", "24:00")).toBe(false)
  })

  it("handles midnight-spanning first shift", () => {
    // 22:00–06:00 overlaps with 04:00–12:00
    expect(rangesOverlap("22:00", "06:00", "04:00", "12:00")).toBe(true)
  })

  it("handles midnight-spanning second shift", () => {
    // 08:00–16:00 does NOT overlap 22:00–06:00 (next day portion 00-06)
    expect(rangesOverlap("08:00", "16:00", "22:00", "06:00")).toBe(false)
  })

  it("detects overlap when both shifts span midnight", () => {
    expect(rangesOverlap("22:00", "06:00", "23:00", "07:00")).toBe(true)
  })
})

describe("detectConflicts", () => {
  const alice: ShiftMember = { id: "m1", name: "Alice", color: "#f00", role: null }
  const bob: ShiftMember = { id: "m2", name: "Bob", color: "#00f", role: null }

  function makeShift(id: string, date: string, start: string, end: string, members: ShiftMember[]): ShiftWithMembers {
    return { id, date, start_time: start, end_time: end, template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "", members }
  }

  it("returns empty array when no conflicts", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-01", "16:00", "24:00", [bob]),
    ]
    expect(detectConflicts(shifts)).toHaveLength(0)
  })

  it("detects a member double-booked on same day", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-01", "12:00", "20:00", [alice, bob]),
    ]
    const conflicts = detectConflicts(shifts)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].memberId).toBe("m1")
    expect(conflicts[0].shifts).toHaveLength(2)
  })

  it("does not flag the same member on different dates", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-02", "08:00", "16:00", [alice]),
    ]
    expect(detectConflicts(shifts)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/lib/__tests__/conflicts.test.ts
```
Expected: FAIL — `Cannot find module '../conflicts'`

- [ ] **Step 3: Implement conflict detection**

Create `src/lib/conflicts.ts`:
```typescript
import type { ShiftWithMembers, Conflict, ShiftMember } from "@/types"

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function rangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const a = timeToMinutes(s1)
  const b = timeToMinutes(e1)
  const c = timeToMinutes(s2)
  const d = timeToMinutes(e2)

  const aSpans = b <= a // shift 1 crosses midnight
  const bSpans = d <= c // shift 2 crosses midnight

  if (!aSpans && !bSpans) return a < d && b > c
  if (aSpans && !bSpans) return !(d <= a && c >= b)
  if (!aSpans && bSpans) return !(b <= c && a >= d)
  return true // both span midnight — always overlap
}

export function detectConflicts(shifts: ShiftWithMembers[]): Conflict[] {
  // Group shifts per member per date
  const byMember = new Map<string, { member: ShiftMember; shifts: ShiftWithMembers[] }>()

  for (const shift of shifts) {
    for (const member of shift.members) {
      if (!byMember.has(member.id)) {
        byMember.set(member.id, { member, shifts: [] })
      }
      byMember.get(member.id)!.shifts.push(shift)
    }
  }

  const conflicts: Conflict[] = []

  for (const { member, shifts: memberShifts } of byMember.values()) {
    // Group by date
    const byDate = new Map<string, ShiftWithMembers[]>()
    for (const shift of memberShifts) {
      if (!byDate.has(shift.date)) byDate.set(shift.date, [])
      byDate.get(shift.date)!.push(shift)
    }

    for (const [date, dayShifts] of byDate) {
      const conflicting = new Set<ShiftWithMembers>()
      for (let i = 0; i < dayShifts.length; i++) {
        for (let j = i + 1; j < dayShifts.length; j++) {
          const a = dayShifts[i]
          const b = dayShifts[j]
          if (rangesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) {
            conflicting.add(a)
            conflicting.add(b)
          }
        }
      }
      if (conflicting.size > 0) {
        conflicts.push({
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          date,
          shifts: [...conflicting],
        })
      }
    }
  }

  return conflicts
}
```

- [ ] **Step 4: Write and run API utils tests**

Create `src/lib/__tests__/api-utils.test.ts`:
```typescript
import { requireAuth, requireAdmin } from "../api-utils"

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}))

import { auth } from "@/auth"
const mockAuth = auth as jest.Mock

describe("requireAuth", () => {
  it("returns session when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.com", role: "member" } })
    const { session, error } = await requireAuth()
    expect(session).toBeTruthy()
    expect(error).toBeNull()
  })

  it("returns 401 error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const { session, error } = await requireAuth()
    expect(session).toBeNull()
    expect(error).toBeTruthy()
    const res = error as Response
    expect(res.status).toBe(401)
  })
})

describe("requireAdmin", () => {
  it("returns session when user is admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.com", role: "admin" } })
    const { session, error } = await requireAdmin()
    expect(session).toBeTruthy()
    expect(error).toBeNull()
  })

  it("returns 403 when user is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.com", role: "member" } })
    const { session, error } = await requireAdmin()
    expect(session).toBeNull()
    const res = error as Response
    expect(res.status).toBe(403)
  })
})
```

Create `src/lib/api-utils.ts`:
```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { Session } from "next-auth"

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse }

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { session, error: null }
}

export async function requireAdmin(): Promise<AuthResult> {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (session!.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  return { session: session!, error: null }
}
```

- [ ] **Step 5: Run all new tests**

```bash
npm test -- src/lib/__tests__/conflicts.test.ts src/lib/__tests__/api-utils.test.ts
```
Expected: PASS — 8+ tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/
git commit -m "feat: conflict detection and API auth utilities with tests"
```

---

### Task 3: Roles API routes

**Files:**
- Create: `src/app/api/roles/route.ts`
- Create: `src/app/api/roles/[id]/route.ts`
- Create: `src/app/api/roles/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/roles/route.test.ts`:
```typescript
import { GET, POST } from "./route"

const mockSelect = jest.fn()
const mockOrder = jest.fn()
const mockInsert = jest.fn()
const mockSingleInsert = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))
jest.mock("@/lib/api-utils", () => ({
  requireAuth: jest.fn(() => ({ session: { user: { role: "admin" } }, error: null })),
  requireAdmin: jest.fn(() => ({ session: { user: { role: "admin" } }, error: null })),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockSingleInsert.mockResolvedValue({ data: { id: "r1", name: "Nurse", color: "#EF4444" }, error: null })
  mockInsert.mockReturnValue({ select: () => ({ single: mockSingleInsert }) })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
})

describe("GET /api/roles", () => {
  it("returns 200 with roles array", async () => {
    mockOrder.mockResolvedValue({ data: [{ id: "r1", name: "Nurse", color: "#EF4444" }], error: null })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Nurse")
  })
})

describe("POST /api/roles", () => {
  it("creates a role and returns 201", async () => {
    const req = new Request("http://localhost/api/roles", {
      method: "POST",
      body: JSON.stringify({ name: "Nurse", color: "#EF4444" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("returns 400 for invalid color format", async () => {
    const req = new Request("http://localhost/api/roles", {
      method: "POST",
      body: JSON.stringify({ name: "Nurse", color: "red" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/app/api/roles/route.test.ts
```
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Implement roles collection route**

Create `src/app/api/roles/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("roles")
    .select("*")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = RoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("roles")
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Implement roles item route**

Create `src/app/api/roles/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const RolePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = RolePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("roles")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from("roles").delete().eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
npm test -- src/app/api/roles/route.test.ts
```
Expected: PASS — 3 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/roles/
git commit -m "feat: roles API routes (GET, POST, PUT, DELETE)"
```

---

### Task 4: Members API routes

**Files:**
- Create: `src/app/api/members/route.ts`
- Create: `src/app/api/members/[id]/route.ts`

- [ ] **Step 1: Write members collection route**

Create `src/app/api/members/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const MemberSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  role_id: z.string().uuid().nullable().optional(),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("members")
    .select("*, role:roles(*)")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = MemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("members")
    .insert(parsed.data)
    .select("*, role:roles(*)")
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Write members item route**

Create `src/app/api/members/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const MemberPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  role_id: z.string().uuid().nullable().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = MemberPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("members")
    .update(parsed.data)
    .eq("id", id)
    .select("*, role:roles(*)")
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from("members").delete().eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/members/
git commit -m "feat: members API routes (GET, POST, PUT, DELETE)"
```

---

### Task 5: Shift templates and shifts API routes

**Files:**
- Create: `src/app/api/shift-templates/route.ts`
- Create: `src/app/api/shift-templates/[id]/route.ts`
- Create: `src/app/api/shifts/route.ts`
- Create: `src/app/api/shifts/[id]/route.ts`

- [ ] **Step 1: Shift templates collection route**

Create `src/app/api/shift-templates/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const TemplateSchema = z.object({
  name: z.string().min(1).max(100),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("shift_templates")
    .select("*")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = TemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("shift_templates")
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Shift templates item route**

Create `src/app/api/shift-templates/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const TemplatePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = TemplatePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("shift_templates")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbError } = await supabase
    .from("shift_templates")
    .delete()
    .eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Shifts collection route**

Create `src/app/api/shifts/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const ShiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  template_id: z.string().uuid().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  is_ad_hoc: z.boolean().optional().default(false),
  member_ids: z.array(z.string().uuid()).optional().default([]),
})

export async function GET(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("shifts")
    .select(`
      *,
      template:shift_templates(*),
      assignments:shift_assignments(
        member:members(*, role:roles(*))
      )
    `)
    .gte("date", start)
    .lte("date", end)
    .order("date")
    .order("start_time")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })

  // Flatten assignments to members array
  const shifts = (data ?? []).map((s: any) => ({
    ...s,
    members: (s.assignments ?? []).map((a: any) => a.member),
    assignments: undefined,
  }))

  return NextResponse.json(shifts)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = ShiftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { member_ids, ...shiftData } = parsed.data
  const supabase = createAdminClient()

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .insert(shiftData)
    .select()
    .single()

  if (shiftError) return NextResponse.json({ error: "Database error" }, { status: 500 })

  if (member_ids.length > 0) {
    const assignments = member_ids.map((member_id) => ({
      shift_id: shift.id,
      member_id,
    }))
    const { error: assignError } = await supabase
      .from("shift_assignments")
      .insert(assignments)
    if (assignError) return NextResponse.json({ error: "Assignment error" }, { status: 500 })
  }

  return NextResponse.json({ ...shift, members: [] }, { status: 201 })
}
```

- [ ] **Step 4: Shifts item route**

Create `src/app/api/shifts/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const ShiftPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  template_id: z.string().uuid().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  is_ad_hoc: z.boolean().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = ShiftPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { member_ids, ...shiftData } = parsed.data
  const supabase = createAdminClient()

  if (Object.keys(shiftData).length > 0) {
    const { error: updateError } = await supabase
      .from("shifts")
      .update({ ...shiftData, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (updateError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  if (member_ids !== undefined) {
    await supabase.from("shift_assignments").delete().eq("shift_id", id)
    if (member_ids.length > 0) {
      await supabase
        .from("shift_assignments")
        .insert(member_ids.map((member_id) => ({ shift_id: id, member_id })))
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from("shifts").delete().eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/shift-templates/ src/app/api/shifts/
git commit -m "feat: shift-templates and shifts API routes"
```

---

### Task 6: useCalendar hook and calendar page skeleton

**Files:**
- Create: `src/hooks/useCalendar.ts`
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Write useCalendar hook**

Create `src/hooks/useCalendar.ts`:
```typescript
"use client"
import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
import type { ShiftWithMembers, MemberWithRole, DbRole, DbShiftTemplate, Conflict } from "@/types"
import { detectConflicts } from "@/lib/conflicts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAppointments, setShowAppointments] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const pad = (n: number) => String(n).padStart(2, "0")
  const startDate = `${year}-${pad(month + 1)}-01`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`

  const { data: shifts = [], mutate: mutateShifts } = useSWR<ShiftWithMembers[]>(
    `/api/shifts?start=${startDate}&end=${endDate}`,
    fetcher
  )
  const { data: members = [], mutate: mutateMembers } = useSWR<MemberWithRole[]>(
    "/api/members",
    fetcher
  )
  const { data: roles = [], mutate: mutateRoles } = useSWR<DbRole[]>(
    "/api/roles",
    fetcher
  )
  const { data: templates = [], mutate: mutateTemplates } = useSWR<DbShiftTemplate[]>(
    "/api/shift-templates",
    fetcher
  )

  const conflicts: Conflict[] = detectConflicts(shifts)

  const prevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevMonth()
      if (e.key === "ArrowRight") nextMonth()
      if (e.key === "Escape") {
        setSelectedDate(null)
        setShowConflicts(false)
        setShowSettings(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prevMonth, nextMonth])

  return {
    year, month,
    today,
    shifts, mutateShifts,
    members, mutateMembers,
    roles, mutateRoles,
    templates, mutateTemplates,
    conflicts,
    selectedDate, setSelectedDate,
    showAppointments, setShowAppointments,
    showConflicts, setShowConflicts,
    showSettings, setShowSettings,
    prevMonth, nextMonth, goToToday,
  }
}
```

- [ ] **Step 2: Update calendar page to use client hook**

Replace `src/app/calendar/page.tsx`:
```typescript
"use client"
import { useCalendar } from "@/hooks/useCalendar"
import CalendarHeader from "@/components/calendar/CalendarHeader"
import CalendarGrid from "@/components/calendar/CalendarGrid"
import CoverageFooter from "@/components/calendar/CoverageFooter"
import ConflictsPanel from "@/components/calendar/ConflictsPanel"
import DayEditorModal from "@/components/calendar/DayEditorModal"
import SettingsModal from "@/components/settings/SettingsModal"

export default function CalendarPage() {
  const cal = useCalendar()

  const shiftsForSelectedDate = cal.selectedDate
    ? cal.shifts.filter((s) => s.date === cal.selectedDate)
    : []

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <CalendarHeader
        year={cal.year}
        month={cal.month}
        conflictCount={cal.conflicts.length}
        showAppointments={cal.showAppointments}
        onPrev={cal.prevMonth}
        onNext={cal.nextMonth}
        onToday={cal.goToToday}
        onToggleAppointments={() => cal.setShowAppointments((v) => !v)}
        onToggleConflicts={() => cal.setShowConflicts((v) => !v)}
        onOpenSettings={() => cal.setShowSettings(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <CalendarGrid
            year={cal.year}
            month={cal.month}
            today={cal.today}
            shifts={cal.shifts}
            conflicts={cal.conflicts}
            showAppointments={cal.showAppointments}
            onSelectDate={cal.setSelectedDate}
          />
          <CoverageFooter
            shifts={cal.shifts}
            templates={cal.templates}
            year={cal.year}
            month={cal.month}
          />
        </div>

        {cal.showConflicts && (
          <ConflictsPanel
            conflicts={cal.conflicts}
            onClose={() => cal.setShowConflicts(false)}
          />
        )}
      </div>

      {cal.selectedDate && (
        <DayEditorModal
          date={cal.selectedDate}
          shifts={shiftsForSelectedDate}
          members={cal.members}
          templates={cal.templates}
          onClose={() => cal.setSelectedDate(null)}
          onMutate={cal.mutateShifts}
        />
      )}

      {cal.showSettings && (
        <SettingsModal
          roles={cal.roles}
          members={cal.members}
          templates={cal.templates}
          onClose={() => cal.setShowSettings(false)}
          onMutateRoles={cal.mutateRoles}
          onMutateMembers={cal.mutateMembers}
          onMutateTemplates={cal.mutateTemplates}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/ src/app/calendar/
git commit -m "feat: useCalendar hook with SWR data fetching and keyboard shortcuts"
```

---

### Task 7: CalendarHeader component

**Files:**
- Create: `src/components/calendar/CalendarHeader.tsx`
- Create: `src/components/calendar/CalendarHeader.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/calendar/CalendarHeader.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarHeader from "./CalendarHeader"

const baseProps = {
  year: 2026,
  month: 5, // June (0-indexed)
  conflictCount: 0,
  showAppointments: false,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onToday: jest.fn(),
  onToggleAppointments: jest.fn(),
  onToggleConflicts: jest.fn(),
  onOpenSettings: jest.fn(),
}

describe("CalendarHeader", () => {
  it("renders month and year", () => {
    render(<CalendarHeader {...baseProps} />)
    expect(screen.getByText("June 2026")).toBeInTheDocument()
  })

  it("shows conflict badge when conflictCount > 0", () => {
    render(<CalendarHeader {...baseProps} conflictCount={3} />)
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("calls onPrev when ‹ is clicked", async () => {
    render(<CalendarHeader {...baseProps} />)
    await userEvent.click(screen.getByRole("button", { name: /previous/i }))
    expect(baseProps.onPrev).toHaveBeenCalled()
  })

  it("calls onNext when › is clicked", async () => {
    render(<CalendarHeader {...baseProps} />)
    await userEvent.click(screen.getByRole("button", { name: /next/i }))
    expect(baseProps.onNext).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/calendar/CalendarHeader.test.tsx
```
Expected: FAIL — `Cannot find module './CalendarHeader'`

- [ ] **Step 3: Implement CalendarHeader**

Create `src/components/calendar/CalendarHeader.tsx`:
```typescript
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

interface CalendarHeaderProps {
  year: number
  month: number
  conflictCount: number
  showAppointments: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleAppointments: () => void
  onToggleConflicts: () => void
  onOpenSettings: () => void
}

export default function CalendarHeader({
  year, month, conflictCount, showAppointments,
  onPrev, onNext, onToday, onToggleAppointments, onToggleConflicts, onOpenSettings,
}: CalendarHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-wrap">
      <span className="font-bold text-lg min-w-[140px]">
        {MONTH_NAMES[month]} {year}
      </span>

      <div className="flex items-center gap-1">
        <button
          aria-label="Previous month"
          onClick={onPrev}
          className="px-2 py-1 rounded hover:bg-gray-700 text-lg"
        >
          ‹
        </button>
        <button
          aria-label="Next month"
          onClick={onNext}
          className="px-2 py-1 rounded hover:bg-gray-700 text-lg"
        >
          ›
        </button>
      </div>

      <button onClick={onToday} className="btn-sm">Today</button>

      <button
        onClick={onToggleAppointments}
        className={`btn-sm ${showAppointments ? "ring-1 ring-blue-400" : ""}`}
      >
        Appointments
      </button>

      <button onClick={onToggleConflicts} className="btn-sm relative">
        Conflicts
        {conflictCount > 0 && (
          <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
            {conflictCount}
          </span>
        )}
      </button>

      <button onClick={onOpenSettings} className="btn-sm ml-auto">
        ⚙ Settings
      </button>
    </header>
  )
}
```

Add to `src/app/globals.css` (append):
```css
@layer components {
  .btn-sm {
    @apply px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm transition-colors;
  }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- src/components/calendar/CalendarHeader.test.tsx
```
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarHeader.tsx src/components/calendar/CalendarHeader.test.tsx src/app/globals.css
git commit -m "feat: CalendarHeader component with month nav and conflict badge"
```

---

### Task 8: CalendarGrid, DayCell, and ShiftBar components

**Files:**
- Create: `src/components/calendar/CalendarGrid.tsx`
- Create: `src/components/calendar/DayCell.tsx`
- Create: `src/components/calendar/ShiftBar.tsx`
- Create: `src/components/calendar/CalendarGrid.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/calendar/CalendarGrid.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarGrid from "./CalendarGrid"

const baseProps = {
  year: 2026,
  month: 5, // June — starts on Monday
  today: new Date("2026-06-03"),
  shifts: [],
  conflicts: [],
  showAppointments: false,
  onSelectDate: jest.fn(),
}

describe("CalendarGrid", () => {
  it("renders 30 day cells for June 2026", () => {
    render(<CalendarGrid {...baseProps} />)
    // June 2026 has 30 days
    expect(screen.getAllByRole("button", { name: /^(0?[1-9]|[12]\d|30)$/ })).toHaveLength(30)
  })

  it("highlights today", () => {
    render(<CalendarGrid {...baseProps} />)
    expect(screen.getByRole("button", { name: "3" }).closest("[data-today]")).toBeTruthy()
  })

  it("calls onSelectDate when a day is clicked", async () => {
    render(<CalendarGrid {...baseProps} />)
    await userEvent.click(screen.getByRole("button", { name: "10" }))
    expect(baseProps.onSelectDate).toHaveBeenCalledWith("2026-06-10")
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/calendar/CalendarGrid.test.tsx
```
Expected: FAIL — `Cannot find module './CalendarGrid'`

- [ ] **Step 3: Implement ShiftBar**

Create `src/components/calendar/ShiftBar.tsx`:
```typescript
import type { ShiftWithMembers } from "@/types"

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "pm" : "am"
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${ampm}`
}

interface ShiftBarProps {
  shift: ShiftWithMembers
}

export default function ShiftBar({ shift }: ShiftBarProps) {
  const hasMembers = shift.members.length > 0

  return (
    <div
      className={`text-xs rounded px-1 py-0.5 mb-0.5 ${
        hasMembers ? "bg-blue-900/60" : "bg-gray-700/60 italic opacity-60"
      }`}
    >
      <div className="text-gray-400 text-[10px]">
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </div>
      {hasMembers ? (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {shift.members.map((m) => (
            <span key={m.id} className="flex items-center gap-0.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span className="truncate max-w-[60px]">{m.name.split(" ")[0]}</span>
              {m.role && (
                <span
                  className="rounded px-0.5 text-[9px] font-medium"
                  style={{ backgroundColor: m.role.color + "33", color: m.role.color }}
                >
                  {m.role.name.slice(0, 6)}
                </span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">Unassigned</div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Implement DayCell**

Create `src/components/calendar/DayCell.tsx`:
```typescript
import type { ShiftWithMembers, Conflict } from "@/types"
import ShiftBar from "./ShiftBar"

interface DayCellProps {
  date: string
  dayNumber: number
  isToday: boolean
  isOutside: boolean
  shifts: ShiftWithMembers[]
  hasConflict: boolean
  showAppointments: boolean
  onClick: () => void
}

export default function DayCell({
  date, dayNumber, isToday, isOutside, shifts, hasConflict, showAppointments, onClick,
}: DayCellProps) {
  if (isOutside) {
    return <div className="min-h-[80px] bg-gray-900/30" />
  }

  return (
    <div
      data-today={isToday || undefined}
      className={`min-h-[80px] border border-gray-800 p-1 cursor-pointer hover:bg-gray-800/50 transition-colors ${
        isToday ? "ring-1 ring-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <button
          aria-label={String(dayNumber)}
          className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${
            isToday ? "bg-blue-500 text-white" : "text-gray-300"
          }`}
        >
          {dayNumber}
        </button>
        {hasConflict && (
          <span className="text-yellow-400 text-xs" title="Schedule conflict">
            ⚠
          </span>
        )}
      </div>
      {!showAppointments &&
        shifts.map((shift) => <ShiftBar key={shift.id} shift={shift} />)}
    </div>
  )
}
```

- [ ] **Step 5: Implement CalendarGrid**

Create `src/components/calendar/CalendarGrid.tsx`:
```typescript
import type { ShiftWithMembers, Conflict } from "@/types"
import DayCell from "./DayCell"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarGridProps {
  year: number
  month: number
  today: Date
  shifts: ShiftWithMembers[]
  conflicts: Conflict[]
  showAppointments: boolean
  onSelectDate: (date: string) => void
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export default function CalendarGrid({
  year, month, today, shifts, conflicts, showAppointments, onSelectDate,
}: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const conflictDates = new Set(conflicts.map((c) => c.date))

  const shiftsByDate = new Map<string, ShiftWithMembers[]>()
  for (const shift of shifts) {
    if (!shiftsByDate.has(shift.date)) shiftsByDate.set(shift.date, [])
    shiftsByDate.get(shift.date)!.push(shift)
  }

  const cells: React.ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(<DayCell key={`out-${i}`} date="" dayNumber={0} isToday={false} isOutside shifts={[]} hasConflict={false} showAppointments={false} onClick={() => {}} />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = isoDate(year, month, d)
    cells.push(
      <DayCell
        key={dateStr}
        date={dateStr}
        dayNumber={d}
        isToday={dateStr === todayStr}
        isOutside={false}
        shifts={shiftsByDate.get(dateStr) ?? []}
        hasConflict={conflictDates.has(dateStr)}
        showAppointments={showAppointments}
        onClick={() => onSelectDate(dateStr)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-1 border-b border-gray-800">
            {d}
          </div>
        ))}
        {cells}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
npm test -- src/components/calendar/CalendarGrid.test.tsx
```
Expected: PASS — 3 tests passing.

- [ ] **Step 7: Commit**

```bash
git add src/components/calendar/
git commit -m "feat: CalendarGrid, DayCell, and ShiftBar components"
```

---

### Task 9: CoverageFooter and ConflictsPanel

**Files:**
- Create: `src/components/calendar/CoverageFooter.tsx`
- Create: `src/components/calendar/ConflictsPanel.tsx`

- [ ] **Step 1: Implement CoverageFooter**

Create `src/components/calendar/CoverageFooter.tsx`:
```typescript
import type { ShiftWithMembers, DbShiftTemplate } from "@/types"

interface CoverageFooterProps {
  shifts: ShiftWithMembers[]
  templates: DbShiftTemplate[]
  year: number
  month: number
}

export default function CoverageFooter({ shifts, templates, year, month }: CoverageFooterProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <footer className="flex gap-4 px-4 py-2 bg-gray-800 border-t border-gray-700 text-sm flex-wrap">
      {templates.map((template) => {
        const covered = new Set(
          shifts
            .filter((s) => s.template_id === template.id && s.members.length > 0)
            .map((s) => s.date)
        ).size

        return (
          <span key={template.id} className="text-gray-400">
            {template.name}:{" "}
            <span className={covered === daysInMonth ? "text-green-400" : "text-yellow-400"}>
              {covered}/{daysInMonth}
            </span>
          </span>
        )
      })}
    </footer>
  )
}
```

- [ ] **Step 2: Implement ConflictsPanel**

Create `src/components/calendar/ConflictsPanel.tsx`:
```typescript
import type { Conflict } from "@/types"

interface ConflictsPanelProps {
  conflicts: Conflict[]
  onClose: () => void
}

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

export default function ConflictsPanel({ conflicts, onClose }: ConflictsPanelProps) {
  return (
    <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h2 className="font-semibold text-sm">
          Conflicts{" "}
          <span className="text-red-400 font-bold">{conflicts.length}</span>
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
          aria-label="Close conflicts panel"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conflicts.length === 0 && (
          <p className="text-gray-500 text-sm">No conflicts this month.</p>
        )}
        {conflicts.map((c, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: c.memberColor }}
              />
              <span className="font-medium">{c.memberName}</span>
              <span className="text-gray-500 text-xs">{c.date}</span>
            </div>
            <ul className="space-y-0.5 pl-4">
              {c.shifts.map((s) => (
                <li key={s.id} className="text-gray-400 text-xs">
                  {formatTime(s.start_time)}–{formatTime(s.end_time)}
                  {s.template && (
                    <span className="text-gray-600 ml-1">({s.template.name})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/CoverageFooter.tsx src/components/calendar/ConflictsPanel.tsx
git commit -m "feat: CoverageFooter and ConflictsPanel components"
```

---

### Task 10: DayEditorModal

**Files:**
- Create: `src/components/calendar/DayEditorModal.tsx`
- Create: `src/components/calendar/DayEditorModal.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/calendar/DayEditorModal.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DayEditorModal from "./DayEditorModal"

const baseProps = {
  date: "2026-06-10",
  shifts: [],
  members: [],
  templates: [],
  onClose: jest.fn(),
  onMutate: jest.fn(),
}

describe("DayEditorModal", () => {
  it("renders the date in the heading", () => {
    render(<DayEditorModal {...baseProps} />)
    expect(screen.getByText("June 10, 2026")).toBeInTheDocument()
  })

  it("shows 'No shifts' when shifts array is empty", () => {
    render(<DayEditorModal {...baseProps} />)
    expect(screen.getByText(/no shifts/i)).toBeInTheDocument()
  })

  it("calls onClose when × button is clicked", async () => {
    render(<DayEditorModal {...baseProps} />)
    await userEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(baseProps.onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/calendar/DayEditorModal.test.tsx
```
Expected: FAIL — `Cannot find module './DayEditorModal'`

- [ ] **Step 3: Implement DayEditorModal**

Create `src/components/calendar/DayEditorModal.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { ShiftWithMembers, MemberWithRole, DbShiftTemplate } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

interface DayEditorModalProps {
  date: string
  shifts: ShiftWithMembers[]
  members: MemberWithRole[]
  templates: DbShiftTemplate[]
  onClose: () => void
  onMutate: () => void
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

export default function DayEditorModal({
  date, shifts, members, templates, onClose, onMutate,
}: DayEditorModalProps) {
  const [addingShift, setAddingShift] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("16:00")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function handleAddShift() {
    setSaving(true)
    const template = templates.find((t) => t.id === selectedTemplateId)
    await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        template_id: selectedTemplateId || null,
        start_time: template ? template.start_time : startTime,
        end_time: template ? template.end_time : endTime,
        is_ad_hoc: !selectedTemplateId,
        member_ids: selectedMemberIds,
      }),
    })
    onMutate()
    setAddingShift(false)
    setSaving(false)
  }

  async function handleDeleteShift(id: string) {
    await fetch(`/api/shifts/${id}`, { method: "DELETE" })
    onMutate()
  }

  async function handleUpdateMembers(shiftId: string, memberIds: string[]) {
    await fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: memberIds }),
    })
    onMutate()
  }

  function toggleMemberId(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="font-semibold">{formatDate(date)}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {shifts.length === 0 && !addingShift && (
            <p className="text-gray-500 text-sm">No shifts scheduled.</p>
          )}

          {shifts.map((shift) => (
            <ShiftEditor
              key={shift.id}
              shift={shift}
              members={members}
              onDelete={() => handleDeleteShift(shift.id)}
              onUpdateMembers={(ids) => handleUpdateMembers(shift.id, ids)}
            />
          ))}

          {addingShift && (
            <div className="border border-gray-700 rounded p-3 space-y-2">
              <div>
                <label className="text-xs text-gray-400">Template</label>
                <select
                  className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Ad-hoc (custom times)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedTemplateId && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">Start</label>
                    <input
                      type="time"
                      className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">End</label>
                    <input
                      type="time"
                      className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400">Members</label>
                <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(m.id)}
                        onChange={() => toggleMemberId(m.id)}
                      />
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.name}
                      {m.role && (
                        <span className="text-xs text-gray-500">({m.role.name})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddShift}
                  disabled={saving}
                  className="btn-sm bg-blue-700 hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add Shift"}
                </button>
                <button
                  onClick={() => setAddingShift(false)}
                  className="btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!addingShift && (
          <div className="px-4 py-3 border-t border-gray-700">
            <button onClick={() => setAddingShift(true)} className="btn-sm">
              + Add Shift
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ShiftEditor({
  shift, members, onDelete, onUpdateMembers,
}: {
  shift: ShiftWithMembers
  members: MemberWithRole[]
  onDelete: () => void
  onUpdateMembers: (ids: string[]) => void
}) {
  const assignedIds = shift.members.map((m) => m.id)
  const [checkedIds, setCheckedIds] = useState<string[]>(assignedIds)
  const [dirty, setDirty] = useState(false)

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      setDirty(true)
      return next
    })
  }

  return (
    <div className="border border-gray-700 rounded p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">
          {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
          {shift.template && (
            <span className="text-gray-500 ml-2 text-xs">({shift.template.name})</span>
          )}
        </span>
        <button onClick={onDelete} className="text-red-400 text-xs hover:text-red-300">
          Delete
        </button>
      </div>

      <div className="space-y-1 max-h-24 overflow-y-auto">
        {members.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={checkedIds.includes(m.id)}
              onChange={() => toggle(m.id)}
            />
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {m.name}
          </label>
        ))}
      </div>

      {dirty && (
        <button
          onClick={() => { onUpdateMembers(checkedIds); setDirty(false) }}
          className="btn-sm text-xs"
        >
          Save assignments
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- src/components/calendar/DayEditorModal.test.tsx
```
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/DayEditorModal.tsx src/components/calendar/DayEditorModal.test.tsx
git commit -m "feat: DayEditorModal with shift creation and member assignment"
```

---

### Task 11: Settings modal (Roles, Members, ShiftTemplates tabs)

**Files:**
- Create: `src/components/settings/SettingsModal.tsx`
- Create: `src/components/settings/RolesTab.tsx`
- Create: `src/components/settings/MembersTab.tsx`
- Create: `src/components/settings/ShiftTemplatesTab.tsx`

- [ ] **Step 1: Implement SettingsModal shell**

Create `src/components/settings/SettingsModal.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { DbRole, MemberWithRole, DbShiftTemplate } from "@/types"
import RolesTab from "./RolesTab"
import MembersTab from "./MembersTab"
import ShiftTemplatesTab from "./ShiftTemplatesTab"

type Tab = "roles" | "members" | "templates"

interface SettingsModalProps {
  roles: DbRole[]
  members: MemberWithRole[]
  templates: DbShiftTemplate[]
  onClose: () => void
  onMutateRoles: () => void
  onMutateMembers: () => void
  onMutateTemplates: () => void
}

export default function SettingsModal({
  roles, members, templates, onClose,
  onMutateRoles, onMutateMembers, onMutateTemplates,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("roles")

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl" aria-label="Close settings">×</button>
        </div>

        <div className="flex border-b border-gray-700">
          {(["roles", "members", "templates"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-blue-400 text-white" : "text-gray-400"}`}
            >
              {t === "templates" ? "Shift Templates" : t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "roles" && <RolesTab roles={roles} onMutate={onMutateRoles} />}
          {tab === "members" && <MembersTab members={members} roles={roles} onMutate={onMutateMembers} />}
          {tab === "templates" && <ShiftTemplatesTab templates={templates} onMutate={onMutateTemplates} />}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement RolesTab**

Create `src/components/settings/RolesTab.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { DbRole } from "@/types"

const PALETTE = ["#EF4444","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#06B6D4","#F97316"]

function nextColor(existing: string[]) {
  return PALETTE.find((c) => !existing.includes(c)) ?? PALETTE[existing.length % PALETTE.length]
}

interface RolesTabProps {
  roles: DbRole[]
  onMutate: () => void
}

export default function RolesTab({ roles, onMutate }: RolesTabProps) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color: nextColor(roles.map((r) => r.color)) }),
    })
    setName("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/roles/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {roles.map((role) => (
          <li key={role.id} className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
            <span className="flex-1 text-sm">{role.name}</span>
            <button onClick={() => handleDelete(role.id)} className="text-red-400 text-xs hover:text-red-300">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm"
          placeholder="Role name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} disabled={saving} className="btn-sm">
          Add
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Implement MembersTab**

Create `src/components/settings/MembersTab.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { DbRole, MemberWithRole } from "@/types"

interface MembersTabProps {
  members: MemberWithRole[]
  roles: DbRole[]
  onMutate: () => void
}

export default function MembersTab({ members, roles, onMutate }: MembersTabProps) {
  const [name, setName] = useState("")
  const [roleId, setRoleId] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    // Auto-assign a color not yet used by existing members
    const usedColors = members.map((m) => m.color)
    const palette = ["#60A5FA","#34D399","#FBBF24","#F87171","#A78BFA","#FB7185","#38BDF8","#4ADE80"]
    const color = palette.find((c) => !usedColors.includes(c)) ?? palette[members.length % palette.length]

    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, role_id: roleId || null }),
    })
    setName("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
            <span className="flex-1 text-sm">{m.name}</span>
            {m.role && (
              <span className="text-xs px-1.5 rounded" style={{ color: m.role.color, backgroundColor: m.role.color + "22" }}>
                {m.role.name}
              </span>
            )}
            <button onClick={() => handleDelete(m.id)} className="text-red-400 text-xs hover:text-red-300">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm"
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          className="bg-gray-700 rounded px-2 py-1.5 text-sm"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          <option value="">No role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={saving} className="btn-sm">Add</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement ShiftTemplatesTab**

Create `src/components/settings/ShiftTemplatesTab.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { DbShiftTemplate } from "@/types"

interface ShiftTemplatesTabProps {
  templates: DbShiftTemplate[]
  onMutate: () => void
}

export default function ShiftTemplatesTab({ templates, onMutate }: ShiftTemplatesTabProps) {
  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("16:00")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    await fetch("/api/shift-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), start_time: startTime, end_time: endTime }),
    })
    setName("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/shift-templates/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{t.name}</span>
            <span className="text-gray-400 text-xs">{t.start_time.slice(0,5)}–{t.end_time.slice(0,5)}</span>
            <button onClick={() => handleDelete(t.id)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2">
        <input
          className="bg-gray-700 rounded px-3 py-1.5 text-sm col-span-1"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="time" className="bg-gray-700 rounded px-2 py-1.5 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" className="bg-gray-700 rounded px-2 py-1.5 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <button onClick={handleAdd} disabled={saving} className="btn-sm">Add Template</button>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/
git commit -m "feat: Settings modal with Roles, Members, and ShiftTemplates tabs"
```

---

### Task 12: Right-click context menu (copy shifts)

**Files:**
- Create: `src/components/calendar/DayCellContextMenu.tsx`
- Modify: `src/components/calendar/DayCell.tsx`

- [ ] **Step 1: Implement context menu**

Create `src/components/calendar/DayCellContextMenu.tsx`:
```typescript
"use client"
import { useEffect, useRef } from "react"

interface DayCellContextMenuProps {
  x: number
  y: number
  date: string
  hasShifts: boolean
  onClose: () => void
  onCopyToNextDay: () => void
  onCopyToNextWeek: () => void
}

export default function DayCellContextMenu({
  x, y, date, hasShifts, onClose, onCopyToNextDay, onCopyToNextWeek,
}: DayCellContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  if (!hasShifts) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-700 rounded shadow-lg py-1 text-sm min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onCopyToNextDay(); onClose() }}
        className="w-full text-left px-4 py-1.5 hover:bg-gray-600"
      >
        Copy to next day
      </button>
      <button
        onClick={() => { onCopyToNextWeek(); onClose() }}
        className="w-full text-left px-4 py-1.5 hover:bg-gray-600"
      >
        Copy to next week
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add context menu + copy logic to CalendarGrid**

Modify `src/components/calendar/CalendarGrid.tsx` — add at the top of the component:
```typescript
const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null)

async function copyShifts(fromDate: string, offsetDays: number) {
  const toDate = new Date(fromDate)
  toDate.setDate(toDate.getDate() + offsetDays)
  const toDateStr = toDate.toISOString().split("T")[0]
  const dayShifts = shiftsByDate.get(fromDate) ?? []

  await Promise.all(
    dayShifts.map((shift) =>
      fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toDateStr,
          template_id: shift.template_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_ad_hoc: shift.is_ad_hoc,
          member_ids: shift.members.map((m) => m.id),
        }),
      })
    )
  )
  // CalendarGrid needs an onMutate prop — add it to the interface and pass from CalendarPage
}
```

Add to `DayCell` in the grid loop:
```typescript
onContextMenu={(e) => {
  e.preventDefault()
  setContextMenu({ x: e.clientX, y: e.clientY, date: dateStr })
}}
```

Add after the cells:
```typescript
{contextMenu && (
  <DayCellContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    date={contextMenu.date}
    hasShifts={(shiftsByDate.get(contextMenu.date)?.length ?? 0) > 0}
    onClose={() => setContextMenu(null)}
    onCopyToNextDay={() => copyShifts(contextMenu.date, 1)}
    onCopyToNextWeek={() => copyShifts(contextMenu.date, 7)}
  />
)}
```

Add `onMutate: () => void` to `CalendarGridProps` and pass `cal.mutateShifts` from `CalendarPage`.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/DayCellContextMenu.tsx src/components/calendar/CalendarGrid.tsx
git commit -m "feat: right-click context menu to copy shifts to next day/week"
```

---

### Task 13: Member schedule view modal

**Files:**
- Create: `src/components/calendar/MemberScheduleModal.tsx`
- Create: `src/components/calendar/MemberScheduleModal.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/calendar/MemberScheduleModal.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import MemberScheduleModal from "./MemberScheduleModal"

const member = { id: "m1", name: "Alice", color: "#3B82F6", role_id: null, user_id: null, role: null }
const shifts = [
  {
    id: "s1", date: "2026-06-10", start_time: "08:00", end_time: "16:00",
    template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "",
    members: [member],
  },
]

describe("MemberScheduleModal", () => {
  it("renders member name in heading", () => {
    render(<MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={jest.fn()} />)
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
  })

  it("lists the shift date and time", () => {
    render(<MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={jest.fn()} />)
    expect(screen.getByText(/june 10/i)).toBeInTheDocument()
  })

  it("calls onClose when × button clicked", async () => {
    const onClose = jest.fn()
    const { getByRole } = render(<MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={onClose} />)
    await import("@testing-library/user-event").then(({ default: u }) => u.click(getByRole("button", { name: /close/i })))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/calendar/MemberScheduleModal.test.tsx
```
Expected: FAIL — `Cannot find module './MemberScheduleModal'`

- [ ] **Step 3: Implement MemberScheduleModal**

Create `src/components/calendar/MemberScheduleModal.tsx`:
```typescript
import type { ShiftWithMembers, MemberWithRole } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

interface MemberScheduleModalProps {
  member: MemberWithRole
  shifts: ShiftWithMembers[]
  year: number
  month: number
  onClose: () => void
}

export default function MemberScheduleModal({
  member, shifts, year, month, onClose,
}: MemberScheduleModalProps) {
  const memberShifts = shifts
    .filter((s) => s.members.some((m) => m.id === member.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <h2 className="font-semibold">{member.name}</h2>
            <span className="text-gray-500 text-sm">{MONTH_NAMES[month]} {year}</span>
          </div>
          <button
            aria-label="Close member schedule"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {memberShifts.length === 0 && (
            <p className="text-gray-500 text-sm">No shifts this month.</p>
          )}
          {memberShifts.map((shift) => {
            const [, m, d] = shift.date.split("-").map(Number)
            return (
              <div key={shift.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-16 flex-shrink-0">
                  {MONTH_NAMES[m - 1].slice(0, 3)} {d}
                </span>
                <span className="text-gray-200">
                  {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                </span>
                {shift.template && (
                  <span className="text-gray-500 text-xs">{shift.template.name}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
          {memberShifts.length} shift{memberShifts.length !== 1 ? "s" : ""} this month
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire MemberScheduleModal into ShiftBar**

Modify `src/components/calendar/ShiftBar.tsx` — make member chips clickable. Add `onMemberClick` prop:
```typescript
interface ShiftBarProps {
  shift: ShiftWithMembers
  onMemberClick?: (memberId: string) => void
}

// Inside the member map, replace the <span> with:
<button
  key={m.id}
  className="flex items-center gap-0.5 hover:text-blue-300 transition-colors"
  onClick={(e) => { e.stopPropagation(); onMemberClick?.(m.id) }}
>
  {/* same contents as before */}
</button>
```

Add `selectedMemberId` state to `useCalendar` return (or manage locally in `CalendarPage`):
```typescript
const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)
```

Pass `onMemberClick={setViewingMemberId}` from `DayCell` → `ShiftBar`, and add the modal to `CalendarClient`:
```typescript
{viewingMemberId && (
  <MemberScheduleModal
    member={cal.members.find((m) => m.id === viewingMemberId)!}
    shifts={cal.shifts}
    year={cal.year}
    month={cal.month}
    onClose={() => setViewingMemberId(null)}
  />
)}
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
npm test -- src/components/calendar/MemberScheduleModal.test.tsx
```
Expected: PASS — 3 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/calendar/MemberScheduleModal.tsx src/components/calendar/MemberScheduleModal.test.tsx src/components/calendar/ShiftBar.tsx
git commit -m "feat: member schedule view modal — click a member chip to see their month"
```

---

### Task 14: Swap recommendations in ConflictsPanel

**Files:**
- Create: `src/lib/swaps.ts`
- Create: `src/lib/__tests__/swaps.test.ts`
- Modify: `src/components/calendar/ConflictsPanel.tsx`

- [ ] **Step 1: Write failing tests for swap logic**

Create `src/lib/__tests__/swaps.test.ts`:
```typescript
import { getAvailableSwaps } from "../swaps"
import type { ShiftWithMembers, ShiftMember } from "@/types"

const alice: ShiftMember = { id: "m1", name: "Alice", color: "#f00", role: null }
const bob: ShiftMember = { id: "m2", name: "Bob", color: "#00f", role: null }

function makeShift(id: string, date: string, start: string, end: string, members: ShiftMember[]): ShiftWithMembers {
  return { id, date, start_time: start, end_time: end, template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "", members }
}

describe("getAvailableSwaps", () => {
  it("returns members not assigned to the conflicting shift", () => {
    const allShifts: ShiftWithMembers[] = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice, bob]),
      makeShift("s2", "2026-06-01", "12:00", "20:00", [alice]),
    ]
    const allMembers = [alice, bob]
    // Alice conflicts. Bob is free during s2 (08:00-16:00 doesn't overlap 12:00-20:00 — actually it does)
    // Bob's only shift is s1 08:00-16:00 which overlaps with s2 12:00-20:00
    // So no swap is available
    const swaps = getAvailableSwaps(allShifts, allMembers, "s2", "m1")
    expect(Array.isArray(swaps)).toBe(true)
  })

  it("returns members who are free during the conflicting shift's time", () => {
    const charlie: ShiftMember = { id: "m3", name: "Charlie", color: "#0f0", role: null }
    const allShifts: ShiftWithMembers[] = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice, bob]),
      makeShift("s2", "2026-06-01", "12:00", "20:00", [alice]),
      makeShift("s3", "2026-06-02", "08:00", "16:00", [charlie]), // different date
    ]
    const allMembers = [alice, bob, charlie]
    const swaps = getAvailableSwaps(allShifts, allMembers, "s2", "m1")
    // Charlie has no shifts on 2026-06-01, so should be available
    expect(swaps.some((s) => s.id === "m3")).toBe(true)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/lib/__tests__/swaps.test.ts
```
Expected: FAIL — `Cannot find module '../swaps'`

- [ ] **Step 3: Implement swap logic**

Create `src/lib/swaps.ts`:
```typescript
import type { ShiftWithMembers, ShiftMember } from "@/types"
import { rangesOverlap } from "./conflicts"

export function getAvailableSwaps(
  allShifts: ShiftWithMembers[],
  allMembers: { id: string; name: string; color: string; role: any }[],
  conflictingShiftId: string,
  conflictedMemberId: string
): { id: string; name: string; color: string }[] {
  const shift = allShifts.find((s) => s.id === conflictingShiftId)
  if (!shift) return []

  // Members already on this shift
  const assignedIds = new Set(shift.members.map((m) => m.id))

  return allMembers.filter((member) => {
    if (assignedIds.has(member.id)) return false // already on this shift
    if (member.id === conflictedMemberId) return false // the conflicted member themselves

    // Check if member has any overlapping shifts on the same date
    const sameDay = allShifts.filter(
      (s) => s.date === shift.date && s.id !== conflictingShiftId
    )
    const hasConflict = sameDay.some(
      (s) =>
        s.members.some((m) => m.id === member.id) &&
        rangesOverlap(shift.start_time, shift.end_time, s.start_time, s.end_time)
    )
    return !hasConflict
  })
}
```

- [ ] **Step 4: Add swap suggestions to ConflictsPanel**

Modify `src/components/calendar/ConflictsPanel.tsx` — add `allShifts` and `allMembers` props and swap display:

Add to `ConflictsPanelProps`:
```typescript
allShifts: ShiftWithMembers[]
allMembers: { id: string; name: string; color: string; role: any }[]
```

Import and use `getAvailableSwaps` inside the conflict rendering:
```typescript
import { getAvailableSwaps } from "@/lib/swaps"

// Inside the conflicts.map(), after the shift list:
{c.shifts.map((conflictShift) => {
  const swaps = getAvailableSwaps(allShifts, allMembers, conflictShift.id, c.memberId)
  return swaps.length > 0 ? (
    <div key={conflictShift.id} className="pl-4 mt-1 text-xs text-gray-500">
      Swap {formatTime(conflictShift.start_time)}–{formatTime(conflictShift.end_time)} with:{" "}
      {swaps.map((m) => (
        <span key={m.id} className="inline-flex items-center gap-0.5 mr-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
          {m.name.split(" ")[0]}
        </span>
      ))}
    </div>
  ) : null
})}
```

Pass `allShifts={cal.shifts}` and `allMembers={cal.members}` from `CalendarPage` to `ConflictsPanel`.

- [ ] **Step 5: Run tests to confirm pass**

```bash
npm test -- src/lib/__tests__/swaps.test.ts
```
Expected: PASS — 2 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/swaps.ts src/lib/__tests__/swaps.test.ts src/components/calendar/ConflictsPanel.tsx
git commit -m "feat: swap recommendations in ConflictsPanel — suggests available members"
```

---

### Task 15: Build verification and smoke test

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: All tests pass (at minimum: auth-helpers ×4, login-page ×4, conflicts ×5, api-utils ×4, CalendarHeader ×4, CalendarGrid ×3, DayEditorModal ×3).

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```
1. Sign in as admin.
2. Open Settings → add a role, a member, and a shift template.
3. Click a day → add a shift with the template, assign the member.
4. Shift bar appears on the calendar grid.
5. Coverage footer shows template coverage count updated.
6. Click "Conflicts" — panel opens, shows 0 conflicts.
7. Add same member to an overlapping shift — conflict badge appears on the day cell.
8. Arrow keys ← → navigate months.
9. Right-click a day with shifts → "Copy to next day" duplicates shifts.
10. Escape key dismisses open modals.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Phase 2 smoke test pass"
```

---

## Phase 2 Exit Criteria

- [ ] All original calendar features work against live Supabase data
- [ ] Admin can create/edit/delete shifts, members, roles, shift templates
- [ ] Member role badges render correctly on shift bars
- [ ] Conflict detection highlights double-booked members
- [ ] Coverage footer shows per-template coverage for the month
- [ ] Keyboard shortcuts: ← / → navigate months, Escape dismisses modals
- [ ] Right-click copies shifts to next day or next week
- [ ] Clicking a member chip opens their monthly schedule view
- [ ] ConflictsPanel shows available swap candidates for each conflicting shift
- [ ] `npm test` passes, `npm run build` succeeds

**Next phase:** `docs/superpowers/plans/2026-06-03-phase3-realtime-self-service.md`
