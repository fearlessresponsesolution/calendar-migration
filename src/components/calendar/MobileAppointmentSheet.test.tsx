import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MobileAppointmentSheet from "./MobileAppointmentSheet"
import type { Appointment, ShiftWithMembers, MemberWithRole } from "@/types"

const baseProps = {
  date: "2026-06-10",
  linkedMemberId: "m1",
  appointments: [] as Appointment[],
  shifts: [] as ShiftWithMembers[],
  members: [] as MemberWithRole[],
  onClose: jest.fn(),
  onMutate: jest.fn(),
}

describe("MobileAppointmentSheet", () => {
  it("renders date heading in cell-tap mode", () => {
    render(<MobileAppointmentSheet {...baseProps} />)
    expect(screen.getByRole("heading", { name: /june 10/i })).toBeInTheDocument()
  })

  it("renders editable date input in dateEditable mode", () => {
    render(<MobileAppointmentSheet {...baseProps} dateEditable />)
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("renders note input", () => {
    render(<MobileAppointmentSheet {...baseProps} />)
    expect(screen.getByPlaceholderText(/note/i)).toBeInTheDocument()
  })

  it("Save button is disabled when note is empty", () => {
    render(<MobileAppointmentSheet {...baseProps} />)
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
  })

  it("Save button is enabled when note is filled", async () => {
    render(<MobileAppointmentSheet {...baseProps} />)
    await userEvent.type(screen.getByPlaceholderText(/note/i), "PTO")
    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled()
  })

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = jest.fn()
    render(<MobileAppointmentSheet {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = jest.fn()
    render(<MobileAppointmentSheet {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByTestId("sheet-backdrop"))
    expect(onClose).toHaveBeenCalled()
  })

  it("shows existing appointments in cell-tap mode", () => {
    const appointments: Appointment[] = [
      {
        id: "a1", member_id: "m1", date: "2026-06-10", note: "PTO",
        all_day: true, start_time: null, end_time: null,
        created_by_user: "user1", created_at: "", updated_at: "",
      },
    ]
    const members: MemberWithRole[] = [
      { id: "m1", name: "Alex Smith", color: "#76b900", role_id: null,
        user_id: null, created_at: "", role: null },
    ]
    render(<MobileAppointmentSheet {...baseProps} appointments={appointments} members={members} />)
    expect(screen.getByText("PTO")).toBeInTheDocument()
    expect(screen.getByText("Alex Smith")).toBeInTheDocument()
  })

  it("hides existing appointments in dateEditable mode", () => {
    const appointments: Appointment[] = [
      {
        id: "a1", member_id: "m1", date: "2026-06-10", note: "PTO",
        all_day: true, start_time: null, end_time: null,
        created_by_user: "user1", created_at: "", updated_at: "",
      },
    ]
    render(<MobileAppointmentSheet {...baseProps} dateEditable appointments={appointments} />)
    expect(screen.queryByText("PTO")).not.toBeInTheDocument()
  })

  it("shows time pickers when all-day is unchecked", async () => {
    render(<MobileAppointmentSheet {...baseProps} />)
    await userEvent.click(screen.getByLabelText(/all day/i))
    expect(screen.getAllByDisplayValue(/\d{2}:\d{2}/)).toHaveLength(2)
  })

  it("calls onMutate and onClose on successful save", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    const onMutate = jest.fn()
    const onClose = jest.fn()
    render(<MobileAppointmentSheet {...baseProps} onMutate={onMutate} onClose={onClose} />)
    await userEvent.type(screen.getByPlaceholderText(/note/i), "PTO")
    await userEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onMutate).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
