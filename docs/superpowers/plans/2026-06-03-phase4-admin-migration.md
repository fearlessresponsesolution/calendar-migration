# Shift Calendar — Phase 4: Admin Panel & Data Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can add/remove users and link them to member records via the UI (no code or Supabase dashboard required). Existing data from the old HTML app imports cleanly via a one-time migration tool.

**Architecture:** Admin panel lives in a new Settings modal "Admin" tab (visible only when `isAdmin` is true). User management goes through `/api/admin/users` routes (admin-only). Migration at `/admin/migrate` accepts a `migration.json` upload, inserts rows in dependency order, and hides itself after the first successful import (tracked via a `settings` table row). The export button is added to the old HTML app at `/home/whati/calendar/index.html`.

**Tech Stack:** Next.js 15 (App Router), Supabase JS v2, Zod, React state, TypeScript. Assumes Phases 1–3 are complete.

---

### Task 1: Admin users API routes (TDD)

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/api/admin/users/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/admin/users/route.test.ts`:
```typescript
import { GET, POST } from "./route"

const mockOrder = jest.fn()
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
const mockInsert = jest.fn()
const mockSingleInsert = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))
jest.mock("@/lib/api-utils", () => ({
  requireAdmin: jest.fn(() => ({ session: { user: { role: "admin" } }, error: null })),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockSingleInsert.mockResolvedValue({ data: { id: "u1", email: "new@test.com", role: "member" }, error: null })
  mockInsert.mockReturnValue({ select: () => ({ single: mockSingleInsert }) })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
})

describe("GET /api/admin/users", () => {
  it("returns 200 with users list", async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: "u1", email: "a@test.com", role: "admin" }],
      error: null,
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].email).toBe("a@test.com")
  })
})

describe("POST /api/admin/users", () => {
  it("creates a user and returns 201", async () => {
    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: "new@test.com", role: "member" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it("returns 400 for invalid email", async () => {
    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email", role: "member" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid role", async () => {
    const req = new Request("http://localhost/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: "good@test.com", role: "superuser" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/app/api/admin/users/route.test.ts
```
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Implement admin users collection route**

Create `src/app/api/admin/users/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const UserCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("users")
    .select("id, email, role, created_at, created_by")
    .order("email")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = UserCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check for duplicate email
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .single()
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 })
  }

  const { data, error: dbError } = await supabase
    .from("users")
    .insert(parsed.data)
    .select("id, email, role")
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4: Implement admin users item route**

Create `src/app/api/admin/users/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const UserPatchSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  member_id: z.string().uuid().nullable().optional(), // for member linking
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = UserPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (parsed.data.role !== undefined) {
    const { error: dbError } = await supabase
      .from("users")
      .update({ role: parsed.data.role })
      .eq("id", id)
    if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  if (parsed.data.member_id !== undefined) {
    // Unlink any member previously pointing to this user
    await supabase
      .from("members")
      .update({ user_id: null })
      .eq("user_id", id)

    // Link the new member record (or unlink if null)
    if (parsed.data.member_id) {
      const { error: linkError } = await supabase
        .from("members")
        .update({ user_id: id })
        .eq("id", parsed.data.member_id)
      if (linkError) return NextResponse.json({ error: "Link error" }, { status: 500 })
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

  // Unlink any member before deleting
  await supabase.from("members").update({ user_id: null }).eq("user_id", id)

  const { error: dbError } = await supabase.from("users").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
npm test -- src/app/api/admin/users/route.test.ts
```
Expected: PASS — 4 tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/users/
git commit -m "feat: admin users API routes — list, create, update role/link, delete"
```

---

### Task 2: UserAccessPanel component

**Files:**
- Create: `src/components/admin/UserAccessPanel.tsx`
- Create: `src/components/admin/UserAccessPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/admin/UserAccessPanel.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import UserAccessPanel from "./UserAccessPanel"

const users = [
  { id: "u1", email: "admin@test.com", role: "admin" },
  { id: "u2", email: "member@test.com", role: "member" },
]

describe("UserAccessPanel", () => {
  it("renders all users", () => {
    render(<UserAccessPanel users={users} onMutate={jest.fn()} />)
    expect(screen.getByText("admin@test.com")).toBeInTheDocument()
    expect(screen.getByText("member@test.com")).toBeInTheDocument()
  })

  it("renders the add user form", () => {
    render(<UserAccessPanel users={users} onMutate={jest.fn()} />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/admin/UserAccessPanel.test.tsx
```
Expected: FAIL — `Cannot find module './UserAccessPanel'`

- [ ] **Step 3: Implement UserAccessPanel**

Create `src/components/admin/UserAccessPanel.tsx`:
```typescript
"use client"
import { useState } from "react"

interface User {
  id: string
  email: string
  role: "admin" | "member"
}

interface UserAccessPanelProps {
  users: User[]
  onMutate: () => void
}

export default function UserAccessPanel({ users, onMutate }: UserAccessPanelProps) {
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "member">("member")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd() {
    if (!newEmail.trim()) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? "Failed to add user")
    } else {
      setNewEmail("")
      onMutate()
    }
    setSaving(false)
  }

  async function handleRoleChange(id: string, role: "admin" | "member") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    onMutate()
  }

  async function handleRemove(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">User Access</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 text-sm">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold uppercase"
            >
              {user.email[0]}
            </span>
            <span className="flex-1 truncate">{user.email}</span>
            <select
              className="bg-gray-700 rounded px-2 py-1 text-xs"
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as "admin" | "member")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => handleRemove(user.id)}
              className="text-red-400 text-xs hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-3 space-y-2">
        <p className="text-xs text-gray-500">Add user</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm"
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            className="bg-gray-700 rounded px-2 py-1.5 text-sm"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAdd} disabled={saving} className="btn-sm">
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- src/components/admin/UserAccessPanel.test.tsx
```
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/UserAccessPanel.tsx src/components/admin/UserAccessPanel.test.tsx
git commit -m "feat: UserAccessPanel component — list users, add, change role, remove"
```

---

### Task 3: MemberLinkingPanel component

**Files:**
- Create: `src/components/admin/MemberLinkingPanel.tsx`
- Create: `src/components/admin/MemberLinkingPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/admin/MemberLinkingPanel.test.tsx`:
```typescript
import { render, screen } from "@testing-library/react"
import MemberLinkingPanel from "./MemberLinkingPanel"

const members = [
  { id: "m1", name: "Alice", color: "#f00", role_id: null, user_id: null },
  { id: "m2", name: "Bob", color: "#00f", role_id: null, user_id: "u2" },
]
const users = [
  { id: "u1", email: "alice@test.com", role: "member" as const },
  { id: "u2", email: "bob@test.com", role: "member" as const },
]

describe("MemberLinkingPanel", () => {
  it("renders all members", () => {
    render(<MemberLinkingPanel members={members} users={users} onMutate={jest.fn()} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("shows warning icon for unlinked member", () => {
    render(<MemberLinkingPanel members={members} users={users} onMutate={jest.fn()} />)
    expect(screen.getByTitle(/not linked/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/admin/MemberLinkingPanel.test.tsx
```
Expected: FAIL — `Cannot find module './MemberLinkingPanel'`

- [ ] **Step 3: Implement MemberLinkingPanel**

Create `src/components/admin/MemberLinkingPanel.tsx`:
```typescript
"use client"

interface Member {
  id: string
  name: string
  color: string
  role_id: string | null
  user_id: string | null
}

interface User {
  id: string
  email: string
  role: "admin" | "member"
}

interface MemberLinkingPanelProps {
  members: Member[]
  users: User[]
  onMutate: () => void
}

export default function MemberLinkingPanel({
  members, users, onMutate,
}: MemberLinkingPanelProps) {
  async function handleLink(userId: string, memberId: string | null) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Member Linking</h3>
      <p className="text-xs text-gray-500">
        Link login accounts to schedule members to enable self-service appointments.
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {members.map((member) => {
          const linkedUser = users.find((u) => u.id === member.user_id)

          return (
            <div key={member.id} className="flex items-center gap-3 text-sm">
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <span className="flex-1">{member.name}</span>
              {!linkedUser && (
                <span
                  title="Not yet linked to a login account"
                  className="text-yellow-400 text-xs"
                >
                  ⚠
                </span>
              )}
              <select
                className="bg-gray-700 rounded px-2 py-1 text-xs max-w-[180px] truncate"
                value={linkedUser?.id ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    // Unlink: find current linked user and set member_id to null
                    if (linkedUser) handleLink(linkedUser.id, null)
                  } else {
                    handleLink(e.target.value, member.id)
                  }
                }}
              >
                <option value="">— unlinked —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- src/components/admin/MemberLinkingPanel.test.tsx
```
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/MemberLinkingPanel.tsx src/components/admin/MemberLinkingPanel.test.tsx
git commit -m "feat: MemberLinkingPanel component — link login accounts to schedule members"
```

---

### Task 4: Admin tab in Settings modal

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/app/calendar/CalendarClient.tsx`

- [ ] **Step 1: Add Admin tab to SettingsModal**

Modify `src/components/settings/SettingsModal.tsx`:

Add imports:
```typescript
import UserAccessPanel from "@/components/admin/UserAccessPanel"
import MemberLinkingPanel from "@/components/admin/MemberLinkingPanel"
import useSWR from "swr"
```

Add to `SettingsModalProps`:
```typescript
isAdmin: boolean
```

Update the Tab type:
```typescript
type Tab = "roles" | "members" | "templates" | "admin"
```

Add `"admin"` to the tab buttons array (conditionally):
```typescript
{isAdmin && (
  <button
    onClick={() => setTab("admin")}
    className={`px-4 py-2 text-sm ${tab === "admin" ? "border-b-2 border-blue-400 text-white" : "text-gray-400"}`}
  >
    Admin
  </button>
)}
```

Add AdminTab content inside the tab body — after the existing `{tab === "templates" && ...}` block:
```typescript
{tab === "admin" && isAdmin && (
  <AdminTabContent />
)}
```

Add `AdminTabContent` as a component inside the file:
```typescript
function AdminTabContent() {
  const fetcher = (url: string) => fetch(url).then(r => r.json())
  const { data: users = [], mutate: mutateUsers } = useSWR("/api/admin/users", fetcher)
  const { data: members = [] } = useSWR("/api/members", fetcher)

  return (
    <div className="grid grid-cols-2 gap-6">
      <UserAccessPanel users={users} onMutate={mutateUsers} />
      <MemberLinkingPanel members={members} users={users} onMutate={mutateUsers} />
    </div>
  )
}
```

- [ ] **Step 2: Pass isAdmin from CalendarClient to SettingsModal**

Modify `src/app/calendar/CalendarClient.tsx` — update the SettingsModal call:
```typescript
{cal.showSettings && (
  <SettingsModal
    roles={cal.roles}
    members={cal.members}
    templates={cal.templates}
    isAdmin={isAdmin}              // ← add this
    onClose={() => cal.setShowSettings(false)}
    onMutateRoles={cal.mutateRoles}
    onMutateMembers={cal.mutateMembers}
    onMutateTemplates={cal.mutateTemplates}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/SettingsModal.tsx src/app/calendar/CalendarClient.tsx
git commit -m "feat: Admin tab in Settings modal with user access and member linking panels"
```

---

### Task 5: Migration API route (TDD)

**Files:**
- Create: `src/app/api/admin/migrate/route.ts`
- Create: `src/app/api/admin/migrate/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/admin/migrate/route.test.ts`:
```typescript
import { POST } from "./route"

jest.mock("@/lib/api-utils", () => ({
  requireAdmin: jest.fn(() => ({ session: { user: { role: "admin" } }, error: null })),
}))

const mockUpsert = jest.fn()
const mockInsert = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))

const validPayload = {
  version: 1,
  exportedAt: "2026-06-01T00:00:00Z",
  roles: [{ id: "r1", name: "Nurse", color: "#EF4444" }],
  members: [{ id: "m1", name: "Alice", color: "#3B82F6", roleId: "r1" }],
  shiftTemplates: [{ id: "t1", name: "Day", startTime: "08:00", endTime: "16:00" }],
  schedule: {
    "2026-06-01": [
      {
        id: "s1",
        templateId: "t1",
        startTime: "08:00",
        endTime: "16:00",
        isAdHoc: false,
        memberIds: ["m1"],
      },
    ],
  },
  appointments: {},
}

describe("POST /api/admin/migrate", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert, insert: mockInsert })
  })

  it("returns 200 with import counts for valid payload", async () => {
    const req = new Request("http://localhost/api/admin/migrate", {
      method: "POST",
      body: JSON.stringify(validPayload),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.counts.roles).toBe(1)
    expect(body.counts.members).toBe(1)
  })

  it("returns 400 for payload missing version", async () => {
    const req = new Request("http://localhost/api/admin/migrate", {
      method: "POST",
      body: JSON.stringify({ ...validPayload, version: undefined }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/app/api/admin/migrate/route.test.ts
```
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Implement migration route**

Create `src/app/api/admin/migrate/route.ts`:
```typescript
import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const MigrationSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  })),
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    roleId: z.string().nullable().optional(),
  })),
  shiftTemplates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
  schedule: z.record(z.string(), z.array(z.object({
    id: z.string(),
    templateId: z.string().nullable().optional(),
    startTime: z.string(),
    endTime: z.string(),
    isAdHoc: z.boolean().optional().default(false),
    memberIds: z.array(z.string()).optional().default([]),
  }))),
  appointments: z.record(z.string(), z.array(z.object({
    id: z.string(),
    date: z.string(),
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
    allDay: z.boolean().optional().default(false),
    note: z.string(),
  }))).optional().default({}),
})

function newId() {
  return crypto.randomUUID()
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = MigrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const supabase = createAdminClient()
  const idMap = new Map<string, string>() // old string ID → new UUID

  // Assign new UUIDs for all entities upfront
  for (const r of data.roles) idMap.set(r.id, newId())
  for (const m of data.members) idMap.set(m.id, newId())
  for (const t of data.shiftTemplates) idMap.set(t.id, newId())
  for (const shifts of Object.values(data.schedule)) {
    for (const s of shifts) idMap.set(s.id, newId())
  }

  const counts = { roles: 0, members: 0, templates: 0, shifts: 0, appointments: 0, errors: 0 }

  // 1. Roles
  const rolesRows = data.roles.map((r) => ({
    id: idMap.get(r.id)!,
    name: r.name,
    color: r.color,
  }))
  const { error: rolesErr } = await supabase.from("roles").upsert(rolesRows, { onConflict: "id" })
  if (rolesErr) counts.errors++
  else counts.roles = rolesRows.length

  // 2. Members
  const membersRows = data.members.map((m) => ({
    id: idMap.get(m.id)!,
    name: m.name,
    color: m.color,
    role_id: m.roleId ? idMap.get(m.roleId) ?? null : null,
  }))
  const { error: membersErr } = await supabase.from("members").upsert(membersRows, { onConflict: "id" })
  if (membersErr) counts.errors++
  else counts.members = membersRows.length

  // 3. Shift templates
  const templatesRows = data.shiftTemplates.map((t) => ({
    id: idMap.get(t.id)!,
    name: t.name,
    start_time: t.startTime,
    end_time: t.endTime,
  }))
  const { error: templatesErr } = await supabase.from("shift_templates").upsert(templatesRows, { onConflict: "id" })
  if (templatesErr) counts.errors++
  else counts.templates = templatesRows.length

  // 4. Shifts + assignments
  const shiftsRows: object[] = []
  const assignmentRows: object[] = []

  for (const [date, dayShifts] of Object.entries(data.schedule)) {
    for (const shift of dayShifts) {
      const newShiftId = idMap.get(shift.id)!
      shiftsRows.push({
        id: newShiftId,
        date,
        template_id: shift.templateId ? idMap.get(shift.templateId) ?? null : null,
        start_time: shift.startTime,
        end_time: shift.endTime,
        is_ad_hoc: shift.isAdHoc ?? false,
      })
      for (const memberId of shift.memberIds ?? []) {
        assignmentRows.push({
          shift_id: newShiftId,
          member_id: idMap.get(memberId) ?? memberId,
        })
      }
    }
  }

  if (shiftsRows.length > 0) {
    const { error: shiftsErr } = await supabase.from("shifts").upsert(shiftsRows, { onConflict: "id" })
    if (shiftsErr) counts.errors++
    else counts.shifts = shiftsRows.length
  }

  if (assignmentRows.length > 0) {
    await supabase.from("shift_assignments").upsert(assignmentRows, { onConflict: "shift_id,member_id" })
  }

  // 5. Appointments
  const apptRows: object[] = []
  for (const [memberId, appts] of Object.entries(data.appointments ?? {})) {
    for (const appt of appts) {
      apptRows.push({
        id: newId(),
        member_id: idMap.get(memberId) ?? memberId,
        date: appt.date,
        start_time: appt.startTime ?? null,
        end_time: appt.endTime ?? null,
        all_day: appt.allDay ?? false,
        note: appt.note,
      })
    }
  }
  if (apptRows.length > 0) {
    const { error: apptErr } = await supabase.from("appointments").insert(apptRows)
    if (apptErr) counts.errors++
    else counts.appointments = apptRows.length
  }

  // Mark migration as completed
  await supabase.from("settings").upsert({ key: "migration_completed", value: "true" }, { onConflict: "key" })

  return NextResponse.json({ counts })
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm test -- src/app/api/admin/migrate/route.test.ts
```
Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/migrate/
git commit -m "feat: migration API route — validate, map IDs, insert in dependency order"
```

---

### Task 6: Migration upload UI

**Files:**
- Create: `src/app/admin/migrate/page.tsx`

- [ ] **Step 1: Implement migration page**

Create `src/app/admin/migrate/page.tsx`:
```typescript
"use client"
import { useState, useRef } from "react"

interface ImportCounts {
  roles: number
  members: number
  templates: number
  shifts: number
  appointments: number
  errors: number
}

export default function MigratePage() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [counts, setCounts] = useState<ImportCounts | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus("uploading")
    setErrorMessage("")

    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setStatus("error")
      setErrorMessage("File is not valid JSON.")
      return
    }

    const res = await fetch("/api/admin/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    })

    const body = await res.json()

    if (!res.ok) {
      setStatus("error")
      setErrorMessage(body.error?.formErrors?.join(", ") ?? body.error ?? "Import failed.")
    } else {
      setStatus("success")
      setCounts(body.counts)
    }

    // Clear file input so same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Data Migration</h1>
        <p className="text-gray-400 mb-6">
          Export data from the old calendar app, then upload the{" "}
          <code className="bg-gray-800 px-1 rounded text-sm">migration.json</code> file here.
        </p>

        {status === "success" && counts && (
          <div className="mb-6 p-4 bg-green-900/40 border border-green-700 rounded">
            <h2 className="font-semibold text-green-400 mb-2">Import successful</h2>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>Roles: {counts.roles}</li>
              <li>Members: {counts.members}</li>
              <li>Shift templates: {counts.templates}</li>
              <li>Shifts: {counts.shifts}</li>
              <li>Appointments: {counts.appointments}</li>
              {counts.errors > 0 && (
                <li className="text-yellow-400">Errors (rows skipped): {counts.errors}</li>
              )}
            </ul>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
            {errorMessage}
          </div>
        )}

        <label className="block">
          <span className="sr-only">Choose migration.json</span>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
            disabled={status === "uploading"}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {status === "uploading" ? "Importing…" : "Click to upload migration.json"}
          </button>
        </label>

        <p className="text-xs text-gray-600 mt-4">
          Admin only. This page is hidden from navigation after a successful import.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/migrate/
git commit -m "feat: migration upload page with import summary"
```

---

### Task 7: Export button in old HTML app

**Files:**
- Modify: `/home/whati/calendar/index.html`

- [ ] **Step 1: Add exportForMigration function**

Find the `saveState` function in `/home/whati/calendar/index.html` (around line 284). Add this new function directly after `saveState`:

```javascript
function exportForMigration() {
  const st = loadStateSync(); // use the synchronous state snapshot
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    roles: st.roles.map(r => ({ id: r.id, name: r.name, color: r.color })),
    members: st.members.map(m => ({ id: m.id, name: m.name, color: m.color, roleId: m.roleId ?? null })),
    shiftTemplates: (st.shiftTemplates || []).map(t => ({
      id: t.id, name: t.name, startTime: t.startTime, endTime: t.endTime,
    })),
    schedule: Object.fromEntries(
      Object.entries(st.schedule || {}).map(([date, shifts]) => [
        date,
        shifts.map(s => ({
          id: s.id,
          templateId: s.templateId ?? null,
          startTime: s.startTime,
          endTime: s.endTime,
          isAdHoc: s.isAdHoc ?? false,
          memberIds: (s.memberIds || []),
        })),
      ])
    ),
    appointments: Object.fromEntries(
      Object.entries(st.appointments || {}).map(([memberId, appts]) => [
        memberId,
        (appts || []).map(a => ({
          id: a.id,
          date: a.date,
          startTime: a.startTime ?? null,
          endTime: a.endTime ?? null,
          allDay: a.allDay ?? false,
          note: a.note,
        })),
      ])
    ),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'migration.json';
  a.click();
  URL.revokeObjectURL(url);
}
```

Note: if the original app uses an async `loadState()` with IndexedDB, replace `loadStateSync()` with the actual state object variable (typically `state` — check the global variable name used in `render()`).

- [ ] **Step 2: Locate the state variable name**

Search `/home/whati/calendar/index.html` for the `render()` function and identify the global state variable:
```bash
grep -n "let state\|var state\|const state\|function render" /home/whati/calendar/index.html | head -10
```
Replace `loadStateSync()` in the export function with the actual state variable (e.g., `state`).

- [ ] **Step 3: Add the Export button to the header**

Find the `render()` function's header HTML (around line 514 — the `<header class="app-header">` block). Add the export button next to the print button:

Replace the print button line:
```html
<button class="btn" onclick="window.print()" id="tour-print-btn">🖨</button>
```

With:
```html
<button class="btn" onclick="window.print()" id="tour-print-btn">🖨</button>
<button class="btn" onclick="exportForMigration()" title="Export data for migration to new app">Export for Migration</button>
```

- [ ] **Step 4: Verify export works**

1. Open `/home/whati/calendar/index.html` in a browser.
2. Click "Export for Migration".
3. A `migration.json` file downloads.
4. Open the file — verify it has `version: 1`, `roles`, `members`, `shiftTemplates`, `schedule`, `appointments` keys.
5. Upload to `/admin/migrate` on the new app.
6. Verify import counts match the original data counts.

- [ ] **Step 5: Commit**

```bash
git add /home/whati/calendar/index.html
git commit -m "feat: add Export for Migration button to old HTML calendar"
```
(If the old calendar is in a separate repo, commit there instead.)

---

### Task 8: End-to-end verification and cleanup

- [ ] **Step 1: Full test suite**

```bash
cd /home/whati/calendar-migration
npm test
```
Expected: All tests pass across all phases.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: No errors.

- [ ] **Step 3: End-to-end migration test**

1. Open `/home/whati/calendar/index.html` in browser.
2. Verify some data exists (roles, members, shifts, appointments). If empty, add a few through the original app.
3. Click "Export for Migration" → `migration.json` downloads.
4. Open the new app in dev: `npm run dev`.
5. Sign in as admin.
6. Go to `http://localhost:3000/admin/migrate`.
7. Upload `migration.json`.
8. Expected: success page with non-zero counts.
9. Go to `/calendar` → verify shifts appear on the calendar.
10. Go to Settings → verify roles and members are listed.

- [ ] **Step 4: Verify migration page hides after import**

After successful import, the `settings` table has `{ key: "migration_completed", value: "true" }`.

Add a check to `src/app/admin/migrate/page.tsx` — at the top, fetch settings and redirect if already completed:
```typescript
// In the server component version — or check via API in the client component
// Simple approach: if status === "success", show "Migration complete — this page is no longer needed"
// The page is hidden from nav in Phase 4 Task 4 (Admin tab doesn't link to it)
// For now, just show a "already imported" state when re-visiting after success
```

Note: the migration page is admin-only and hidden from navigation by default. The `settings` row is set on first successful import. If you want to redirect, convert the page to a server component that checks the `settings` table:

```typescript
// src/app/admin/migrate/page.tsx (convert to server component)
import { auth } from "@/auth"
import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import MigrateClient from "./MigrateClient"

export default async function MigratePage() {
  const session = await auth()
  if (session?.user.role !== "admin") redirect("/calendar")

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "migration_completed")
    .single()

  if (data?.value === "true") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
        <p className="text-gray-400">Migration was already completed. Nothing to do.</p>
      </div>
    )
  }

  return <MigrateClient />
}
```

Move the `"use client"` component to `src/app/admin/migrate/MigrateClient.tsx`.

- [ ] **Step 5: Deploy to Vercel and final verification**

```bash
git push origin main
```
1. Wait for Vercel deployment.
2. Sign in as admin on the Vercel URL.
3. Upload `migration.json` at `/admin/migrate`.
4. Verify calendar shows imported shifts.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Phase 4 complete — admin panel and migration tool verified"
```

---

## Phase 4 Exit Criteria

- [ ] Admin can add a new user (email + role) via Settings → Admin tab — no code or Supabase dashboard required
- [ ] Admin can change a user's role; change takes effect on their next login
- [ ] Admin can link a login account to a schedule member via the Member Linking panel
- [ ] Admin can remove a user; their member record stays on the schedule, unlinked
- [ ] A full data export from the old app imports cleanly: all roles, members, templates, shifts, and appointments appear in the new app
- [ ] `/admin/migrate` shows "already completed" after the first successful import
- [ ] `npm test` passes, `npm run build` succeeds, Vercel deployment is green
