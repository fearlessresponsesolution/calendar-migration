/**
 * @jest-environment node
 */
import { requireAuth, requireAdmin } from "../api-utils"

jest.mock("@/auth", () => ({ auth: jest.fn() }))
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
    expect((error as Response).status).toBe(401)
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
    expect((error as Response).status).toBe(403)
  })
})
