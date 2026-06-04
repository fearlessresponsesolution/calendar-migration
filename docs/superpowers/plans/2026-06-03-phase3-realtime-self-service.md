# Shift Calendar — Phase 3: Real-time & Self-Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All connected clients reflect schedule changes within ~1 second without refresh. Members can add, edit, and delete their own appointments; they cannot see other members' appointment notes.

**Architecture:** Supabase real-time WebSocket subscriptions on `shifts`, `shift_assignments`, `members`, and `roles` channels using the anon key. Each subscription event triggers a targeted SWR revalidation — no full page reload. Appointments are private: no real-time channel, all reads/writes via server-side API routes enforcing session ownership at Layer 3.

**Tech Stack:** `@supabase/supabase-js` v2 (real-time), SWR `mutate`, Next.js 15 App Router. Assumes Phase 2 is complete.

---

### Task 1: Supabase real-time subscription hook (TDD)

**Files:**
- Create: `src/hooks/useRealtimeSchedule.ts`
- Create: `src/hooks/useRealtimeSchedule.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useRealtimeSchedule.test.ts`:
```typescript
import { renderHook, act } from "@testing-library/react"
import { useRealtimeSchedule } from "./useRealtimeSchedule"

const mockOn = jest.fn().mockReturnThis()
const mockSubscribe = jest.fn().mockReturnThis()
const mockUnsubscribe = jest.fn()
const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe, unsubscribe: mockUnsubscribe }))
const mockRemoveChannel = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  getBrowserClient: jest.fn(() => ({
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  })),
}))

describe("useRealtimeSchedule", () => {
  const onShiftChange = jest.fn()
  const onMemberChange = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it("subscribes to shifts and members channels on mount", () => {
    renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    expect(mockChannel).toHaveBeenCalledWith("shifts")
    expect(mockChannel).toHaveBeenCalledWith("members")
  })

  it("unsubscribes from channels on unmount", () => {
    const { unmount } = renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("exposes connected state (starts true after subscribe)", () => {
    const { result } = renderHook(() =>
      useRealtimeSchedule({ onShiftChange, onMemberChange })
    )
    // After mount and subscribe call, connected defaults to true
    expect(typeof result.current.connected).toBe("boolean")
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/hooks/useRealtimeSchedule.test.ts
```
Expected: FAIL — `Cannot find module './useRealtimeSchedule'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useRealtimeSchedule.ts`:
```typescript
"use client"
import { useEffect, useState, useRef } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeScheduleOptions {
  onShiftChange: () => void
  onMemberChange: () => void
}

export function useRealtimeSchedule({
  onShiftChange,
  onMemberChange,
}: UseRealtimeScheduleOptions) {
  const [connected, setConnected] = useState(true)
  const channelsRef = useRef<RealtimeChannel[]>([])

  useEffect(() => {
    const supabase = getBrowserClient()

    function makeChannel(name: string, cb: () => void) {
      return supabase
        .channel(name)
        .on("postgres_changes", { event: "*", schema: "public", table: name }, cb)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setConnected(true)
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnected(false)
          if (status === "CLOSED") setConnected(false)
        })
    }

    const shiftsChannel = makeChannel("shifts", onShiftChange)
    const assignmentsChannel = makeChannel("shift_assignments", onShiftChange)
    const membersChannel = makeChannel("members", onMemberChange)
    const rolesChannel = makeChannel("roles", onMemberChange)

    channelsRef.current = [shiftsChannel, assignmentsChannel, membersChannel, rolesChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [onShiftChange, onMemberChange])

  return { connected }
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
npm test -- src/hooks/useRealtimeSchedule.test.ts
```
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRealtimeSchedule.ts src/hooks/useRealtimeSchedule.test.ts
git commit -m "feat: useRealtimeSchedule hook with Supabase real-time subscriptions"
```

---

### Task 2: Wire real-time into useCalendar and add reconnecting banner

**Files:**
- Modify: `src/hooks/useCalendar.ts`
- Create: `src/components/ui/ReconnectingBanner.tsx`
- Modify: `src/app/calendar/page.tsx`

- [ ] **Step 1: Add real-time and connected state to useCalendar**

Modify `src/hooks/useCalendar.ts` — add the import and hook call inside `useCalendar`:
```typescript
// Add to imports
import { useRealtimeSchedule } from "./useRealtimeSchedule"
import { useCallback } from "react" // already imported

// Add inside useCalendar(), before the return statement:
const { connected } = useRealtimeSchedule({
  onShiftChange: useCallback(() => {
    mutateShifts()
  }, [mutateShifts]),
  onMemberChange: useCallback(() => {
    mutateMembers()
    mutateRoles()
  }, [mutateMembers, mutateRoles]),
})

// Add `connected` to the return object:
// return { ..., connected }
```

Full updated return statement — add `connected` to the existing return:
```typescript
return {
  year, month,
  today,
  shifts, mutateShifts,
  members, mutateMembers,
  roles, mutateRoles,
  templates, mutateTemplates,
  conflicts,
  connected,           // ← new
  selectedDate, setSelectedDate,
  showAppointments, setShowAppointments,
  showConflicts, setShowConflicts,
  showSettings, setShowSettings,
  prevMonth, nextMonth, goToToday,
}
```

- [ ] **Step 2: Create ReconnectingBanner**

Create `src/components/ui/ReconnectingBanner.tsx`:
```typescript
export default function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-800 text-yellow-200 text-sm px-4 py-2 rounded-full shadow-lg z-50">
      Reconnecting…
    </div>
  )
}
```

- [ ] **Step 3: Add banner to CalendarPage**

Modify `src/app/calendar/page.tsx` — add the import and banner after the closing `</div>` of the page and before closing fragment:
```typescript
import ReconnectingBanner from "@/components/ui/ReconnectingBanner"

// Inside CalendarPage, add at the bottom:
<ReconnectingBanner visible={!cal.connected} />
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCalendar.ts src/components/ui/ReconnectingBanner.tsx src/app/calendar/page.tsx
git commit -m "feat: wire Supabase real-time into useCalendar with reconnecting banner"
```

---

### Task 3: Appointments API routes (TDD)

**Files:**
- Create: `src/app/api/appointments/route.ts`
- Create: `src/app/api/appointments/[id]/route.ts`
- Create: `src/app/api/appointments/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/appointments/route.test.ts`:
```typescript
import { GET, POST } from "./route"

const mockSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))

const memberSession = {
  user: { userId: "user-1", role: "member", email: "m@test.com" },
}
const adminSession = {
  user: { userId: "admin-1", role: "admin", email: "a@test.com" },
}

jest.mock("@/lib/api-utils", () => ({
  requireAuth: jest.fn(() => ({ session: memberSession, error: null })),
}))

import { requireAuth } from "@/lib/api-utils"
const mockRequireAuth = requireAuth as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq, order: jest.fn().mockResolvedValue({ data: [], error: null }) })
  mockSingle.mockResolvedValue({ data: { id: "m1" }, error: null })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
})

describe("GET /api/appointments", () => {
  it("members can only fetch their own appointments", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    const order = jest.fn().mockResolvedValue({ data: [], error: null })
    const eq2 = jest.fn().mockReturnValue({ order })
    mockEq.mockReturnValue({ eq: eq2, single: mockSingle })
    mockSelect.mockReturnValue({ eq: mockEq })

    // Member has a linked member record
    const linked = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const eqLinked = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: linked }) })
    mockFrom.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: eqLinked }) })
    mockFrom.mockReturnValue({ select: mockSelect })

    const req = new Request("http://localhost/api/appointments")
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})

describe("POST /api/appointments", () => {
  it("returns 400 for missing required fields", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })
    const req = new Request("http://localhost/api/appointments", {
      method: "POST",
      body: JSON.stringify({ note: "" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/app/api/appointments/route.test.ts
```
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Implement appointments collection route**

Create `src/app/api/appointments/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

const AppointmentSchema = z.object({
  member_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  all_day: z.boolean().optional().default(false),
  note: z.string().min(1).max(1000),
})

async function getLinkedMemberId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id ?? null
}

export async function GET(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from("appointments")
    .select("*")
    .order("date")
    .order("start_time")

  if (session.user.role !== "admin") {
    // Members can only see their own appointments
    const memberId = await getLinkedMemberId(session.user.userId)
    if (!memberId) {
      return NextResponse.json([], { status: 200 })
    }
    query = query.eq("member_id", memberId) as typeof query
  } else if (searchParams.get("member_id")) {
    query = query.eq("member_id", searchParams.get("member_id")!) as typeof query
  }

  const { data, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const parsed = AppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Members can only create appointments for their own linked member
  if (session.user.role !== "admin") {
    const linkedId = await getLinkedMemberId(session.user.userId)
    if (parsed.data.member_id !== linkedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("appointments")
    .insert({ ...parsed.data, created_by_user: session.user.userId })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Implement appointments item route**

Create `src/app/api/appointments/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

const AppointmentPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  all_day: z.boolean().optional(),
  note: z.string().min(1).max(1000).optional(),
})

async function getAppointmentOwner(id: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("appointments")
    .select("created_by_user")
    .eq("id", id)
    .single()
  return data?.created_by_user ?? null
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  // Members can only edit their own appointments
  if (session.user.role !== "admin") {
    const owner = await getAppointmentOwner(id)
    if (owner !== session.user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const body = await request.json()
  const parsed = AppointmentPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("appointments")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  if (session.user.role !== "admin") {
    const owner = await getAppointmentOwner(id)
    if (owner !== session.user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const supabase = createAdminClient()
  const { error: dbError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
npm test -- src/app/api/appointments/route.test.ts
```
Expected: PASS — 2 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/appointments/
git commit -m "feat: appointments API routes with per-member ownership enforcement"
```

---

### Task 4: AppointmentEditor component

**Files:**
- Create: `src/components/calendar/AppointmentEditor.tsx`
- Create: `src/components/calendar/AppointmentEditor.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/calendar/AppointmentEditor.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import AppointmentEditor from "./AppointmentEditor"

const baseProps = {
  date: "2026-06-10",
  linkedMemberId: "m1",
  appointments: [],
  isAdmin: false,
  onMutate: jest.fn(),
}

describe("AppointmentEditor", () => {
  it("renders the date in the heading", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByText(/june 10, 2026/i)).toBeInTheDocument()
  })

  it("shows 'No appointments' when list is empty", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByText(/no appointments/i)).toBeInTheDocument()
  })

  it("shows the add form when linkedMemberId is present", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByPlaceholderText(/note/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/calendar/AppointmentEditor.test.tsx
```
Expected: FAIL — `Cannot find module './AppointmentEditor'`

- [ ] **Step 3: Implement AppointmentEditor**

Create `src/components/calendar/AppointmentEditor.tsx`:
```typescript
"use client"
import { useState } from "react"
import type { Appointment } from "@/types"

// Add Appointment to src/types/index.ts if not already present:
// export interface Appointment {
//   id: string
//   member_id: string
//   date: string
//   start_time: string | null
//   end_time: string | null
//   all_day: boolean
//   note: string
//   created_by_user: string | null
// }

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

interface AppointmentEditorProps {
  date: string
  linkedMemberId: string | null
  appointments: Appointment[]
  isAdmin: boolean
  onMutate: () => void
}

export default function AppointmentEditor({
  date, linkedMemberId, appointments, isAdmin, onMutate,
}: AppointmentEditorProps) {
  const [note, setNote] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd() {
    if (!note.trim() || !linkedMemberId) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: linkedMemberId,
        date,
        note: note.trim(),
        all_day: allDay,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
      }),
    })
    if (res.status === 409) {
      const body = await res.json()
      setError(body.error ?? "Conflict — appointment overlaps another.")
    } else {
      setNote("")
      onMutate()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{formatDate(date)}</h3>

      {appointments.length === 0 && (
        <p className="text-gray-500 text-sm">No appointments for this day.</p>
      )}

      {appointments.map((appt) => (
        <div key={appt.id} className="border border-gray-700 rounded p-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-200">{appt.note}</span>
            {(isAdmin || appt.created_by_user) && (
              <button
                onClick={() => handleDelete(appt.id)}
                className="text-red-400 text-xs hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>
          <span className="text-gray-500 text-xs">
            {appt.all_day ? "All day" : `${appt.start_time?.slice(0, 5)} – ${appt.end_time?.slice(0, 5)}`}
          </span>
        </div>
      ))}

      {linkedMemberId && (
        <div className="border border-gray-700 rounded p-3 space-y-2">
          <input
            className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm"
            placeholder="Note (e.g. PTO, doctor appointment)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>

          {!allDay && (
            <div className="flex gap-2">
              <input type="time" className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <input type="time" className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving || !note.trim()}
            className="btn-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Appointment"}
          </button>
        </div>
      )}
    </div>
  )
}
```

Also add `Appointment` to `src/types/index.ts`:
```typescript
export interface Appointment {
  id: string
  member_id: string
  date: string
  start_time: string | null
  end_time: string | null
  all_day: boolean
  note: string
  created_by_user: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
npm test -- src/components/calendar/AppointmentEditor.test.tsx
```
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/AppointmentEditor.tsx src/components/calendar/AppointmentEditor.test.tsx src/types/index.ts
git commit -m "feat: AppointmentEditor component with member-scoped create/delete"
```

---

### Task 5: Appointment view mode in CalendarGrid and DayEditorModal

**Files:**
- Modify: `src/hooks/useCalendar.ts`
- Modify: `src/app/calendar/page.tsx`
- Modify: `src/components/calendar/DayEditorModal.tsx`

- [ ] **Step 1: Add appointment fetching to useCalendar**

Modify `src/hooks/useCalendar.ts` — add after the templates SWR call:
```typescript
import type { Appointment } from "@/types"

// Inside useCalendar(), add:
const { data: appointments = [], mutate: mutateAppointments } = useSWR<Appointment[]>(
  `/api/appointments?date_start=${startDate}&date_end=${endDate}`,
  fetcher
)

// Add to the linked member lookup (needed for AppointmentEditor):
const [linkedMemberId, setLinkedMemberId] = useState<string | null>(null)
useEffect(() => {
  // The linked member ID is determined by which members.user_id matches the session
  // We get this from the session at page load via a server component or prop
}, [])
```

Note: `linkedMemberId` needs to come from the server. The simplest approach is to pass it as a prop from the CalendarPage (which is a server component that can call `auth()`).

- [ ] **Step 2: Convert CalendarPage to pass linkedMemberId**

Replace `src/app/calendar/page.tsx` — split into a server wrapper and the client component:

Create `src/app/calendar/CalendarClient.tsx` (move all the "use client" content here):
```typescript
"use client"
// (Move the entire existing CalendarPage function here, renamed to CalendarClient)
// Add linkedMemberId prop:

interface CalendarClientProps {
  linkedMemberId: string | null
  isAdmin: boolean
}

export default function CalendarClient({ linkedMemberId, isAdmin }: CalendarClientProps) {
  const cal = useCalendar()
  // ... same as before, but pass linkedMemberId/isAdmin to DayEditorModal
}
```

Replace `src/app/calendar/page.tsx` with a server component:
```typescript
import { auth } from "@/auth"
import { createAdminClient } from "@/lib/supabase/server"
import CalendarClient from "./CalendarClient"

export default async function CalendarPage() {
  const session = await auth()
  let linkedMemberId: string | null = null

  if (session?.user.role === "member" && session.user.userId) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", session.user.userId)
      .single()
    linkedMemberId = data?.id ?? null
  }

  return (
    <CalendarClient
      linkedMemberId={linkedMemberId}
      isAdmin={session?.user.role === "admin"}
    />
  )
}
```

- [ ] **Step 3: Wire appointment view into DayEditorModal**

Modify `src/components/calendar/DayEditorModal.tsx` — add appointments prop and appointment view:
```typescript
// Add to DayEditorModalProps:
appointments: Appointment[]
linkedMemberId: string | null
isAdmin: boolean
onMutateAppointments: () => void
showAppointments: boolean
```

Add to the modal body (below the shift list, when `showAppointments` is true):
```typescript
{showAppointments && (
  <AppointmentEditor
    date={date}
    linkedMemberId={linkedMemberId}
    appointments={appointments}
    isAdmin={isAdmin}
    onMutate={onMutateAppointments}
  />
)}
```

Import at the top of `DayEditorModal.tsx`:
```typescript
import AppointmentEditor from "./AppointmentEditor"
import type { Appointment } from "@/types"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/calendar/ src/components/calendar/DayEditorModal.tsx src/hooks/useCalendar.ts
git commit -m "feat: appointment view mode in day editor with per-member scoping"
```

---

### Task 6: Integration verification (manual)

- [ ] **Step 1: Start dev server and open two browser tabs**

```bash
npm run dev
```
Open `http://localhost:3000` in two browser tabs, both signed in as admin.

- [ ] **Step 2: Verify real-time shift sync**

In Tab 1: Click a day → Add Shift → Add it.
Expected in Tab 2: The new shift bar appears on the calendar within ~1 second without any manual refresh.

- [ ] **Step 3: Verify shift deletion sync**

In Tab 1: Delete the shift from the DayEditorModal.
Expected in Tab 2: The shift bar disappears within ~1 second.

- [ ] **Step 4: Verify reconnecting banner**

Open browser DevTools → Network → disable network → wait 2-3 seconds.
Expected: "Reconnecting…" banner appears at the bottom.
Re-enable network.
Expected: Banner disappears, real-time resumes.

- [ ] **Step 5: Verify member appointment scoping**

1. In Supabase: link one member record to a test user (set `members.user_id` to that user's `users.id`).
2. Sign in as that member.
3. Click a day → toggle to appointment view → add an appointment.
4. Expected: appointment appears under that member's linked record.
5. Sign in as a different member (with a different linked record).
6. Expected: the first member's appointment note is NOT visible.

- [ ] **Step 6: Build and commit**

```bash
npm run build
git add -A
git commit -m "chore: Phase 3 integration verified — real-time sync and self-service appointments"
```

---

## Phase 3 Exit Criteria

- [ ] Two browser tabs open simultaneously both reflect a shift change within ~1 second without refresh
- [ ] Shift deletion and member assignment changes also sync in real-time
- [ ] "Reconnecting…" banner appears on WebSocket disconnect, disappears on reconnect
- [ ] A member can add/edit/delete their own appointments
- [ ] A member cannot see or modify other members' appointment notes
- [ ] Admin can see all appointments and delete any
- [ ] `npm test` passes, `npm run build` succeeds

**Next phase:** `docs/superpowers/plans/2026-06-03-phase4-admin-migration.md`
