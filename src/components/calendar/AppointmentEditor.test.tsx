import { render, screen } from "@testing-library/react"
import AppointmentEditor from "./AppointmentEditor"

const baseProps = {
  date: "2026-06-10",
  linkedMemberId: "m1",
  appointments: [],
  isAdmin: false,
  onMutate: jest.fn(),
}

describe("AppointmentEditor", () => {
  it("renders the date in the heading", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByText(/june 10, 2026/i)).toBeInTheDocument()
  })

  it("shows 'No appointments' when list is empty", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByText(/no appointments/i)).toBeInTheDocument()
  })

  it("shows the add form when linkedMemberId is present", () => {
    render(<AppointmentEditor {...baseProps} />)
    expect(screen.getByPlaceholderText(/note/i)).toBeInTheDocument()
  })
})
