/**
 * @jest-environment node
 */
import { GET, POST } from "./route"

const mockOrder = jest.fn()
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

jest.mock("@/lib/api-utils", () => ({
  requireAuth: jest.fn(),
}))

import { requireAuth } from "@/lib/api-utils"
const mockRequireAuth = requireAuth as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockOrder.mockResolvedValue({ data: [], error: null })
  mockSingle.mockResolvedValue({ data: { id: "m1" }, error: null })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert })
})

describe("GET /api/appointments", () => {
  it("returns 200 for authenticated member", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    // First from() call: look up linked member
    const single1 = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const eq2 = jest.fn().mockReturnValue({ single: single1 })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const select1 = jest.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValueOnce({ select: select1 })

    // Second from() call: fetch appointments
    mockFrom.mockReturnValueOnce({ select: mockSelect })

    const req = new Request("http://localhost/api/appointments")
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it("returns 401 when not authenticated", async () => {
    const errorResponse = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    mockRequireAuth.mockResolvedValue({ session: null, error: errorResponse })

    const req = new Request("http://localhost/api/appointments")
    const res = await GET(req)
    expect(res.status).toBe(401)
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
