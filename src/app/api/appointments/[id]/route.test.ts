/**
 * @jest-environment node
 */
import { PUT, DELETE } from "./route"

const mockSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockFrom = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))

jest.mock("@/lib/api-utils", () => ({
  requireAuth: jest.fn(),
}))

import { requireAuth } from "@/lib/api-utils"
const mockRequireAuth = requireAuth as jest.Mock

const adminSession = {
  user: { userId: "admin-1", role: "admin", email: "admin@test.com" },
}

const memberSession = {
  user: { userId: "user-1", role: "member", email: "m@test.com" },
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()

  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  })
})

describe("PUT /api/appointments/[id]", () => {
  it("allows admin to update any appointment", async () => {
    mockRequireAuth.mockResolvedValue({ session: adminSession, error: null })

    // update returns the updated row
    const mockUpdateSingle = jest.fn().mockResolvedValue({ data: { id: "appt-1" }, error: null })
    const mockUpdateEq = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockUpdateSingle }) })
    mockUpdate.mockReturnValue({ eq: mockUpdateEq })

    const req = new Request("http://localhost/api/appointments/appt-1", {
      method: "PUT",
      body: JSON.stringify({ note: "Updated note" }),
    })
    const res = await PUT(req, makeParams("appt-1"))
    expect(res.status).toBe(200)
  })

  it("allows member to edit appointment they created (created_by_user match)", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    // First from(): getAppointmentMeta — returns created_by_user = user-1
    const metaSingle = jest.fn().mockResolvedValue({
      data: { created_by_user: "user-1", member_id: "m-other" },
      error: null,
    })
    const metaEq = jest.fn().mockReturnValue({ single: metaSingle })
    const metaSelect = jest.fn().mockReturnValue({ eq: metaEq })

    // Second from(): getLinkedMemberId — returns member id
    const linkedSingle = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const linkedEq = jest.fn().mockReturnValue({ single: linkedSingle })
    const linkedSelect = jest.fn().mockReturnValue({ eq: linkedEq })

    // Third from(): update
    const updateSingle = jest.fn().mockResolvedValue({ data: { id: "appt-1" }, error: null })
    const updateSelectInner = jest.fn().mockReturnValue({ single: updateSingle })
    const updateEq = jest.fn().mockReturnValue({ select: updateSelectInner })
    const updateFn = jest.fn().mockReturnValue({ eq: updateEq })

    mockFrom
      .mockReturnValueOnce({ select: metaSelect })
      .mockReturnValueOnce({ select: linkedSelect })
      .mockReturnValueOnce({ update: updateFn })

    const req = new Request("http://localhost/api/appointments/appt-1", {
      method: "PUT",
      body: JSON.stringify({ note: "My note" }),
    })
    const res = await PUT(req, makeParams("appt-1"))
    expect(res.status).toBe(200)
  })

  it("allows member to edit appointment they are linked to even when created_by_user is null", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    // Appointment has created_by_user = null (migrated), but member_id matches linked member
    const metaSingle = jest.fn().mockResolvedValue({
      data: { created_by_user: null, member_id: "m-linked" },
      error: null,
    })
    const metaEq = jest.fn().mockReturnValue({ single: metaSingle })
    const metaSelect = jest.fn().mockReturnValue({ eq: metaEq })

    const linkedSingle = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const linkedEq = jest.fn().mockReturnValue({ single: linkedSingle })
    const linkedSelect = jest.fn().mockReturnValue({ eq: linkedEq })

    const updateSingle = jest.fn().mockResolvedValue({ data: { id: "appt-1" }, error: null })
    const updateSelectInner = jest.fn().mockReturnValue({ single: updateSingle })
    const updateEq = jest.fn().mockReturnValue({ select: updateSelectInner })
    const updateFn = jest.fn().mockReturnValue({ eq: updateEq })

    mockFrom
      .mockReturnValueOnce({ select: metaSelect })
      .mockReturnValueOnce({ select: linkedSelect })
      .mockReturnValueOnce({ update: updateFn })

    const req = new Request("http://localhost/api/appointments/appt-1", {
      method: "PUT",
      body: JSON.stringify({ note: "Migrated note" }),
    })
    const res = await PUT(req, makeParams("appt-1"))
    expect(res.status).toBe(200)
  })

  it("returns 403 when non-owner, non-linked-member tries to edit appointment", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    // Appointment belongs to a different user and a different member
    const metaSingle = jest.fn().mockResolvedValue({
      data: { created_by_user: "user-other", member_id: "m-other" },
      error: null,
    })
    const metaEq = jest.fn().mockReturnValue({ single: metaSingle })
    const metaSelect = jest.fn().mockReturnValue({ eq: metaEq })

    // Linked member for current user is m-linked, not m-other
    const linkedSingle = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const linkedEq = jest.fn().mockReturnValue({ single: linkedSingle })
    const linkedSelect = jest.fn().mockReturnValue({ eq: linkedEq })

    mockFrom
      .mockReturnValueOnce({ select: metaSelect })
      .mockReturnValueOnce({ select: linkedSelect })

    const req = new Request("http://localhost/api/appointments/appt-1", {
      method: "PUT",
      body: JSON.stringify({ note: "Should not work" }),
    })
    const res = await PUT(req, makeParams("appt-1"))
    expect(res.status).toBe(403)
  })

  it("returns 401 when not authenticated", async () => {
    const errorResponse = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    mockRequireAuth.mockResolvedValue({ session: null, error: errorResponse })

    const req = new Request("http://localhost/api/appointments/appt-1", {
      method: "PUT",
      body: JSON.stringify({ note: "x" }),
    })
    const res = await PUT(req, makeParams("appt-1"))
    expect(res.status).toBe(401)
  })
})

describe("DELETE /api/appointments/[id]", () => {
  it("allows admin to delete any appointment", async () => {
    mockRequireAuth.mockResolvedValue({ session: adminSession, error: null })

    const deleteEq = jest.fn().mockResolvedValue({ error: null })
    const deleteFn = jest.fn().mockReturnValue({ eq: deleteEq })
    mockFrom.mockReturnValueOnce({ delete: deleteFn })

    const req = new Request("http://localhost/api/appointments/appt-1", { method: "DELETE" })
    const res = await DELETE(req, makeParams("appt-1"))
    expect(res.status).toBe(204)
  })

  it("allows member to delete appointment they are linked to even when created_by_user is null", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    const metaSingle = jest.fn().mockResolvedValue({
      data: { created_by_user: null, member_id: "m-linked" },
      error: null,
    })
    const metaEq = jest.fn().mockReturnValue({ single: metaSingle })
    const metaSelect = jest.fn().mockReturnValue({ eq: metaEq })

    const linkedSingle = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const linkedEq = jest.fn().mockReturnValue({ single: linkedSingle })
    const linkedSelect = jest.fn().mockReturnValue({ eq: linkedEq })

    const deleteEq = jest.fn().mockResolvedValue({ error: null })
    const deleteFn = jest.fn().mockReturnValue({ eq: deleteEq })

    mockFrom
      .mockReturnValueOnce({ select: metaSelect })
      .mockReturnValueOnce({ select: linkedSelect })
      .mockReturnValueOnce({ delete: deleteFn })

    const req = new Request("http://localhost/api/appointments/appt-1", { method: "DELETE" })
    const res = await DELETE(req, makeParams("appt-1"))
    expect(res.status).toBe(204)
  })

  it("returns 403 when non-owner, non-linked-member tries to delete appointment", async () => {
    mockRequireAuth.mockResolvedValue({ session: memberSession, error: null })

    const metaSingle = jest.fn().mockResolvedValue({
      data: { created_by_user: "user-other", member_id: "m-other" },
      error: null,
    })
    const metaEq = jest.fn().mockReturnValue({ single: metaSingle })
    const metaSelect = jest.fn().mockReturnValue({ eq: metaEq })

    const linkedSingle = jest.fn().mockResolvedValue({ data: { id: "m-linked" }, error: null })
    const linkedEq = jest.fn().mockReturnValue({ single: linkedSingle })
    const linkedSelect = jest.fn().mockReturnValue({ eq: linkedEq })

    mockFrom
      .mockReturnValueOnce({ select: metaSelect })
      .mockReturnValueOnce({ select: linkedSelect })

    const req = new Request("http://localhost/api/appointments/appt-1", { method: "DELETE" })
    const res = await DELETE(req, makeParams("appt-1"))
    expect(res.status).toBe(403)
  })
})
