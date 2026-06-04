/**
 * @jest-environment node
 */
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
