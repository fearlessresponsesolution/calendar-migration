import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MemberScheduleModal from "./MemberScheduleModal"
import type { MemberWithRole, ShiftWithMembers } from "@/types"

const member: MemberWithRole = {
  id: "m1", name: "Alice", color: "#3B82F6",
  role_id: null, user_id: null, created_at: "", role: null,
}

const shifts: ShiftWithMembers[] = [
  {
    id: "s1", date: "2026-06-10", start_time: "08:00:00", end_time: "16:00:00",
    template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "",
    members: [member],
  },
]

describe("MemberScheduleModal", () => {
  it("renders member name in heading", () => {
    render(
      <MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={jest.fn()} />
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("lists the shift with its date", () => {
    render(
      <MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={jest.fn()} />
    )
    expect(screen.getByText(/jun 10/i)).toBeInTheDocument()
  })

  it("calls onClose when × button clicked", async () => {
    const onClose = jest.fn()
    render(
      <MemberScheduleModal member={member} shifts={shifts} year={2026} month={5} onClose={onClose} />
    )
    await userEvent.click(screen.getByRole("button", { name: /close member schedule/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
