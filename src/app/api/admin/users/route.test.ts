/**
 * @jest-environment node
 */
import { GET, POST } from "./route"

const mockOrder = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
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
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq })
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
