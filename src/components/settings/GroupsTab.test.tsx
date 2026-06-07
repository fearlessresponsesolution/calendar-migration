import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import GroupsTab from "./GroupsTab"
import type { DbGroup, MemberWithRole } from "@/types"

const group1: DbGroup = { id: "g1", name: "Day Team", created_at: "" }
const group2: DbGroup = { id: "g2", name: "Night Team", created_at: "" }

const alice: MemberWithRole = {
  id: "m1", name: "Alice", color: "#60A5FA", role_id: null, user_id: null,
  cert_level: null, created_at: "", role: null, group_id: "g1", group: group1,
}
const bob: MemberWithRole = {
  id: "m2", name: "Bob", color: "#34D399", role_id: null, user_id: null,
  cert_level: null, created_at: "", role: null, group_id: null, group: null,
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
})

describe("GroupsTab", () => {
  const baseProps = {
    groups: [group1, group2],
    members: [alice, bob],
    onMutateGroups: jest.fn(),
    onMutateMembers: jest.fn(),
  }

  it("renders all group names", () => {
    render(<GroupsTab {...baseProps} />)
    expect(screen.getByText("Day Team")).toBeInTheDocument()
    expect(screen.getByText("Night Team")).toBeInTheDocument()
  })

  it("renders member chips for members in a group", () => {
    render(<GroupsTab {...baseProps} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("calls POST /api/groups and onMutateGroups when Add Group is submitted", async () => {
    const onMutateGroups = jest.fn()
    render(<GroupsTab {...baseProps} onMutateGroups={onMutateGroups} />)
    fireEvent.change(screen.getByPlaceholderText(/group name/i), { target: { value: "Weekend Crew" } })
    fireEvent.click(screen.getByRole("button", { name: /add group/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/groups", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Weekend Crew" }),
      }))
      expect(onMutateGroups).toHaveBeenCalled()
    })
  })

  it("calls DELETE /api/groups/:id and onMutateGroups when Delete is clicked", async () => {
    const onMutateGroups = jest.fn()
    render(<GroupsTab {...baseProps} onMutateGroups={onMutateGroups} />)
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
    fireEvent.click(deleteButtons[0])
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/groups/g1", expect.objectContaining({ method: "DELETE" }))
      expect(onMutateGroups).toHaveBeenCalled()
    })
  })

  it("calls PUT /api/members/:id with group_id:null and onMutateMembers when member chip × is clicked", async () => {
    const onMutateMembers = jest.fn()
    render(<GroupsTab {...baseProps} onMutateMembers={onMutateMembers} />)
    fireEvent.click(screen.getByRole("button", { name: /remove alice/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/members/m1", expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ group_id: null }),
      }))
      expect(onMutateMembers).toHaveBeenCalled()
    })
  })

  it("calls PUT /api/members/:id with group_id and onMutateMembers when member added via dropdown", async () => {
    const onMutateMembers = jest.fn()
    render(<GroupsTab {...baseProps} onMutateMembers={onMutateMembers} />)
    const selects = screen.getAllByRole("combobox", { name: /add member/i })
    fireEvent.change(selects[0], { target: { value: "m2" } })
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/members/m2", expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ group_id: "g1" }),
      }))
      expect(onMutateMembers).toHaveBeenCalled()
    })
  })
})
