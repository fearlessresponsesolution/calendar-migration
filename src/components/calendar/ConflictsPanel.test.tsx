import { render, screen } from "@testing-library/react"
import ConflictsPanel from "./ConflictsPanel"
import type { Conflict, ShiftWithMembers, MemberWithRole } from "@/types"

jest.mock("@/lib/swaps", () => ({
  getAvailableSwaps: jest.fn(() => []),
}))

const alice: MemberWithRole = {
  id: "m1", name: "Alice", color: "#3b82f6", role_id: "r1", user_id: null, created_at: "",
  role: { id: "r1", name: "Nurse", color: "#3b82f6", created_at: "" },
}

const shift: ShiftWithMembers = {
  id: "s1", date: "2026-06-10", start_time: "08:00", end_time: "16:00",
  template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "",
  members: [{ id: "m1", name: "Alice", color: "#3b82f6", role: null }],
}

const conflict: Conflict = {
  memberId: "m1", memberName: "Alice", memberColor: "#3b82f6",
  date: "2026-06-10", shifts: [shift],
}

function renderPanel(isAdmin: boolean) {
  return render(
    <ConflictsPanel
      conflicts={[conflict]}
      allShifts={[shift]}
      allMembers={[alice]}
      onClose={jest.fn()}
      onMutate={jest.fn()}
      isAdmin={isAdmin}
    />
  )
}

describe("ConflictsPanel", () => {
  it("renders conflict list for everyone", () => {
    renderPanel(false)
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("renders close button for everyone", () => {
    renderPanel(false)
    expect(screen.getByLabelText("Close conflicts panel")).toBeInTheDocument()
  })

  it("hides swap select for non-admins", () => {
    renderPanel(false)
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("shows swap controls (or no-swap message) for admins", () => {
    // getAvailableSwaps returns [] so expect the "No available" text
    renderPanel(true)
    expect(screen.getByText("No available same-role swaps")).toBeInTheDocument()
  })
})
