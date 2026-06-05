import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarHeader from "./CalendarHeader"

const baseProps = {
  year: 2026,
  month: 5,
  conflictCount: 0,
  showAppointments: false,
  showWorkload: false,
  isAdmin: true,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onToday: jest.fn(),
  onToggleAppointments: jest.fn(),
  onToggleConflicts: jest.fn(),
  onToggleWorkload: jest.fn(),
  onOpenSettings: jest.fn(),
  onPrint: jest.fn(),
  onStartTour: jest.fn(),
}

describe("CalendarHeader", () => {
  it("renders app title", () => {
    render(<CalendarHeader {...baseProps} />)
    expect(screen.getByText("Shift Calendar")).toBeInTheDocument()
  })

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

  it("shows '👁 Appointments' when showAppointments is false", () => {
    render(<CalendarHeader {...baseProps} showAppointments={false} />)
    expect(screen.getByRole("button", { name: /appointments/i })).toHaveTextContent("👁 Appointments")
  })

  it("shows '👁 ← Shifts' when showAppointments is true", () => {
    render(<CalendarHeader {...baseProps} showAppointments={true} />)
    expect(screen.getByRole("button", { name: /shifts/i })).toHaveTextContent("👁 ← Shifts")
  })

  it("renders Workload, Print, and Tour buttons", () => {
    render(<CalendarHeader {...baseProps} />)
    expect(screen.getByRole("button", { name: /workload/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /tour/i })).toBeInTheDocument()
  })

  it("calls onToggleWorkload when Workload is clicked", async () => {
    const onToggleWorkload = jest.fn()
    render(<CalendarHeader {...baseProps} onToggleWorkload={onToggleWorkload} />)
    await userEvent.click(screen.getByRole("button", { name: /workload/i }))
    expect(onToggleWorkload).toHaveBeenCalled()
  })

  it("calls onStartTour when Tour is clicked", async () => {
    const onStartTour = jest.fn()
    render(<CalendarHeader {...baseProps} onStartTour={onStartTour} />)
    await userEvent.click(screen.getByRole("button", { name: /tour/i }))
    expect(onStartTour).toHaveBeenCalled()
  })

  it("shows Settings button for admins", () => {
    render(<CalendarHeader {...baseProps} isAdmin={true} />)
    expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument()
  })

  it("hides Settings button for non-admins", () => {
    render(<CalendarHeader {...baseProps} isAdmin={false} />)
    expect(screen.queryByRole("button", { name: /settings/i })).not.toBeInTheDocument()
  })
})
