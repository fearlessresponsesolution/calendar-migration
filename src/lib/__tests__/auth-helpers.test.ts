import { isEmailAllowed, getUserRecord } from "../auth-helpers"

const mockSingle = jest.fn()
const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect })

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: mockFrom })),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
})

describe("isEmailAllowed", () => {
  it("returns true when email exists in users table", async () => {
    mockSingle.mockResolvedValue({ data: { id: "uuid-1" }, error: null })
    expect(await isEmailAllowed("allowed@example.com")).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith("users")
    expect(mockEq).toHaveBeenCalledWith("email", "allowed@example.com")
  })

  it("returns false when email is not in users table", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } })
    expect(await isEmailAllowed("stranger@example.com")).toBe(false)
  })
})

describe("getUserRecord", () => {
  it("returns id and role for a known email", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "uuid-1", role: "admin" },
      error: null,
    })
    expect(await getUserRecord("admin@example.com")).toEqual({
      id: "uuid-1",
      role: "admin",
    })
  })

  it("returns null when user not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } })
    expect(await getUserRecord("nobody@example.com")).toBeNull()
  })
})
