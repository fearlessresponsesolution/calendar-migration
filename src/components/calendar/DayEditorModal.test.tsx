import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DayEditorModal from "./DayEditorModal"

const baseProps = {
  date: "2026-06-10",
  shifts: [],
  members: [],
  templates: [],
  appointments: [],
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
})
