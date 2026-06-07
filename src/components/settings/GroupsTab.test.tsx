import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import GroupsTab from "./GroupsTab"
import type { DbGroup } from "@/types"

const group1: DbGroup = { id: "g1", name: "Day Team", created_at: "" }
const group2: DbGroup = { id: "g2", name: "Night Team", created_at: "" }

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
})

describe("GroupsTab", () => {
  const baseProps = {
    groups: [group1, group2],
    onMutateGroups: jest.fn(),
  }

  it("renders all group names", () => {
    render(<GroupsTab {...baseProps} />)
    expect(screen.getByText("Day Team")).toBeInTheDocument()
    expect(screen.getByText("Night Team")).toBeInTheDocument()
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
})
