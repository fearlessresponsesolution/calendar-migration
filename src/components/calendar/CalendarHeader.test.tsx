import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarHeader from "./CalendarHeader"

const baseProps = {
  year: 2026,
  month: 5, // June (0-indexed)
  conflictCount: 0,
  showAppointments: false,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onToday: jest.fn(),
  onToggleAppointments: jest.fn(),
  onToggleConflicts: jest.fn(),
  onOpenSettings: jest.fn(),
}

describe("CalendarHeader", () => {
  it("renders month and year", () => {
    render(<CalendarHeader {...baseProps} />)
    expect(screen.getByText("June 2026")).toBeInTheDocument()
  })

  it("shows conflict badge when conflictCount > 0", () => {
    render(<CalendarHeader {...baseProps} conflictCount={3} />)
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("calls onPrev when ‹ is clicked", async () => {
    const onPrev = jest.fn()
    render(<CalendarHeader {...baseProps} onPrev={onPrev} />)
    await userEvent.click(screen.getByRole("button", { name: /previous/i }))
    expect(onPrev).toHaveBeenCalled()
  })

  it("calls onNext when › is clicked", async () => {
    const onNext = jest.fn()
    render(<CalendarHeader {...baseProps} onNext={onNext} />)
    await userEvent.click(screen.getByRole("button", { name: /next/i }))
    expect(onNext).toHaveBeenCalled()
  })
})
