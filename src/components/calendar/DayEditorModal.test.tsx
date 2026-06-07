import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DayEditorModal from "./DayEditorModal"

const shift = {
  id: "s1",
  date: "2026-06-10",
  start_time: "07:30:00",
  end_time: "15:30:00",
  is_ad_hoc: false,
  template_id: null,
  template: null,
  members: [],
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
}

const baseProps = {
  date: "2026-06-10",
  shifts: [],
  members: [],
  templates: [],
  appointments: [],
  groups: [],
  linkedMemberId: null,
  isAdmin: false,
  showAppointments: false,
  onClose: jest.fn(),
  onMutate: jest.fn(),
  onMutateAppointments: jest.fn(),
}

describe("DayEditorModal", () => {
  it("renders the formatted date in the heading", () => {
    render(<DayEditorModal {...baseProps} />)
    expect(screen.getByText("June 10, 2026")).toBeInTheDocument()
  })

  it("shows 'No shifts' message when shifts array is empty", () => {
    render(<DayEditorModal {...baseProps} />)
    expect(screen.getByText(/no shifts scheduled/i)).toBeInTheDocument()
  })

  it("calls onClose when × button is clicked", async () => {
    const onClose = jest.fn()
    render(<DayEditorModal {...baseProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: /close modal/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it("shows shift time in shifts view (admin)", () => {
    render(<DayEditorModal {...baseProps} shifts={[shift]} isAdmin={true} showAppointments={false} />)
    expect(screen.getByText("07:30–15:30")).toBeInTheDocument()
  })

  it("hides shift section in appointment view for admins", () => {
    render(<DayEditorModal {...baseProps} shifts={[shift]} isAdmin={true} showAppointments={true} />)
    expect(screen.queryByText("07:30–15:30")).not.toBeInTheDocument()
  })

  it("hides shift section in appointment view for members", () => {
    render(<DayEditorModal {...baseProps} shifts={[shift]} isAdmin={false} showAppointments={true} />)
    expect(screen.queryByText("07:30–15:30")).not.toBeInTheDocument()
  })

  it("includes group_id in POST body when group is selected", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    const group = { id: "g1", name: "Day Team", created_at: "" }
    render(
      <DayEditorModal
        {...baseProps}
        isAdmin={true}
        groups={[group]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: /add shift/i }))
    const groupSelect = screen.getByRole("combobox", { name: /group/i })
    await userEvent.selectOptions(groupSelect, "g1")
    await userEvent.click(screen.getByRole("button", { name: /^add shift$/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/shifts", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"group_id":"g1"'),
      }))
    })
  })
})
