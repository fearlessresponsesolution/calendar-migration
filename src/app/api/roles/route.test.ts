/**
 * @jest-environment node
 */
import { GET, POST } from "./route"

const mockSingle = jest.fn()
const mockOrder = jest.fn()
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder })
const mockInsert = jest.fn()
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
  mockSingle.mockResolvedValue({ data: { id: "r1", name: "Nurse", color: "#EF4444" }, error: null })
  mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) })
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
