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
  linkedMemberId: null,
  onPrev: jest.fn(),
  onNext: jest.fn(),
  onToday: jest.fn(),
  onToggleAppointments: jest.fn(),
  onToggleConflicts: jest.fn(),
  onToggleWorkload: jest.fn(),
  onOpenSettings: jest.fn(),
  onPrint: jest.fn(),
  onStartTour: jest.fn(),
  onAddAppointment: jest.fn(),
}

describe("CalendarHeader", () => {
  it("renders app title", () => {
    render(<CalendarHeader {...baseProps} />)
    expect(screen.getByText("SHIFT.CAL")).toBeInTheDocument()
  })

  it("renders month and year", () => {
    render(<CalendarHeader {...baseProps} />)
    // hdr-month uses two child spans (full name on desktop, abbreviated on mobile)
    const monthDisplay = document.querySelector(".hdr-month")
    expect(monthDisplay?.textContent).toMatch(/June.*2026/)
  })

  it("shows conflict badge when conflictCount > 0", () => {
    render(<CalendarHeader {...baseProps} conflictCount={3} />)
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("calls onPrev when ‹ is clicked", async () => {
    const onPrev = jest.fn()
    render(<CalendarHeader {...baseProps} onPrev={onPrev} />)
    await userEvent.click(screen.getAllByRole("button", { name: /previous/i })[0])
    expect(onPrev).toHaveBeenCalled()
  })

  it("calls onNext when › is clicked", async () => {
    const onNext = jest.fn()
    render(<CalendarHeader {...baseProps} onNext={onNext} />)
    await userEvent.click(screen.getAllByRole("button", { name: /next/i })[0])
    expect(onNext).toHaveBeenCalled()
  })

  it("shows 'Appointments' label when showAppointments is false", () => {
    render(<CalendarHeader {...baseProps} showAppointments={false} />)
    expect(screen.getByRole("button", { name: /appointments/i })).toHaveTextContent("Appointments")
  })

  it("shows '← Shifts' label when showAppointments is true", () => {
    render(<CalendarHeader {...baseProps} showAppointments={true} />)
    expect(screen.getByRole("button", { name: /shifts/i })).toHaveTextContent("← Shifts")
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

describe("CalendarHeader — mobile bar", () => {
  const mobileProps = {
    ...baseProps,
    linkedMemberId: "m1",
    onAddAppointment: jest.fn(),
  }

  it("renders a hamburger button", () => {
    render(<CalendarHeader {...mobileProps} />)
    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument()
  })

  it("renders the + button when linkedMemberId is non-null", () => {
    render(<CalendarHeader {...mobileProps} />)
    expect(screen.getByRole("button", { name: /add appointment/i })).toBeInTheDocument()
  })

  it("does not render the + button when linkedMemberId is null", () => {
    render(<CalendarHeader {...mobileProps} linkedMemberId={null} />)
    expect(screen.queryByRole("button", { name: /add appointment/i })).not.toBeInTheDocument()
  })

  it("calls onAddAppointment when + is clicked", async () => {
    const onAddAppointment = jest.fn()
    render(<CalendarHeader {...mobileProps} onAddAppointment={onAddAppointment} />)
    await userEvent.click(screen.getByRole("button", { name: /add appointment/i }))
    expect(onAddAppointment).toHaveBeenCalled()
  })

  it("opens the drawer when hamburger is clicked", async () => {
    render(<CalendarHeader {...mobileProps} />)
    await userEvent.click(screen.getByRole("button", { name: /menu/i }))
    expect(screen.getByRole("dialog", { name: /menu/i })).toBeInTheDocument()
  })

  it("drawer contains Today, Conflicts, Workload, Tour actions", async () => {
    render(<CalendarHeader {...mobileProps} />)
    await userEvent.click(screen.getByRole("button", { name: /menu/i }))
    expect(screen.getAllByRole("button", { name: /today/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: /conflicts/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: /workload/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: /tour/i }).length).toBeGreaterThan(0)
  })

  it("drawer shows Settings only for admins", async () => {
    render(<CalendarHeader {...mobileProps} isAdmin={true} />)
    await userEvent.click(screen.getByRole("button", { name: /menu/i }))
    expect(screen.getAllByRole("button", { name: /settings/i }).length).toBeGreaterThan(0)
  })

  it("drawer closes when an action is clicked", async () => {
    const onToday = jest.fn()
    render(<CalendarHeader {...mobileProps} onToday={onToday} />)
    await userEvent.click(screen.getByRole("button", { name: /menu/i }))
    const todayBtns = screen.getAllByRole("button", { name: /today/i })
    await userEvent.click(todayBtns[todayBtns.length - 1])
    expect(onToday).toHaveBeenCalled()
    expect(screen.queryByRole("dialog", { name: /menu/i })).not.toBeInTheDocument()
  })
})
