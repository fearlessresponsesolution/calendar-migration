import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import WorkloadPanel from "./WorkloadPanel"
import type { ShiftWithMembers, MemberWithRole } from "@/types"

function makeShift(id: string, date: string, start: string, end: string, memberIds: string[]): ShiftWithMembers {
  return {
    id, date, start_time: start, end_time: end,
    template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "",
    members: memberIds.map((id) => ({ id, name: "M", color: "#fff", role: null })),
  }
}

const alice: MemberWithRole = { id: "m1", name: "Alice", color: "#3b82f6", role_id: "r1", user_id: null, created_at: "",
  role: { id: "r1", name: "Nurse", color: "#3b82f6", created_at: "" } }

describe("WorkloadPanel", () => {
  it("renders member name and shift count", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", ["m1"]),
      makeShift("s2", "2026-06-02", "08:00", "16:00", ["m1"]),
    ]
    render(<WorkloadPanel shifts={shifts} members={[alice]} year={2026} month={5} onClose={jest.fn()} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText(/2 shifts/)).toBeInTheDocument()
  })

  it("renders role name in meta line", () => {
    const shifts = [makeShift("s1", "2026-06-01", "08:00", "16:00", ["m1"])]
    render(<WorkloadPanel shifts={shifts} members={[alice]} year={2026} month={5} onClose={jest.fn()} />)
    expect(screen.getByText(/Nurse/)).toBeInTheDocument()
  })

  it("calls onClose when × is clicked", async () => {
    const onClose = jest.fn()
    render(<WorkloadPanel shifts={[]} members={[alice]} year={2026} month={5} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: /close workload/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
