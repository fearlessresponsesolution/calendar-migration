import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import MembersTab from "./MembersTab"
import type { MemberWithRole, DbRole } from "@/types"

const mockRole: DbRole = { id: "r1", name: "Nurse", color: "#3b82f6", created_at: "" }
const mockMember: MemberWithRole = {
  id: "m1", name: "Alice", color: "#3b82f6", role_id: "r1", user_id: null, created_at: "", role: mockRole,
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
})

describe("MembersTab", () => {
  it("renders a color input with the member's current color", () => {
    render(<MembersTab members={[mockMember]} roles={[mockRole]} onMutate={jest.fn()} />)
    const colorInput = screen.getByDisplayValue("#3b82f6")
    expect(colorInput).toBeInTheDocument()
    expect(colorInput).toHaveAttribute("type", "color")
  })

  it("calls PUT /api/members/:id with new color on change", async () => {
    const onMutate = jest.fn()
    render(<MembersTab members={[mockMember]} roles={[mockRole]} onMutate={onMutate} />)
    const colorInput = screen.getByDisplayValue("#3b82f6")
    fireEvent.change(colorInput, { target: { value: "#ff0000" } })
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/members/m1", expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ color: "#ff0000" }),
      }))
    })
    expect(onMutate).toHaveBeenCalled()
  })
})
