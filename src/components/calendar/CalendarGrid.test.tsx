import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarGrid from "./CalendarGrid"

const baseProps = {
  year: 2026,
  month: 5,
  today: new Date(2026, 5, 3),
  shifts: [],
  conflicts: [],
  showAppointments: false,
  appointments: [],
  linkedMemberId: null,
  members: [],
  onSelectDate: jest.fn(),
  onMutate: jest.fn(),
}

describe("CalendarGrid", () => {
  it("renders 30 day cells for June 2026", () => {
    render(<CalendarGrid {...baseProps} />)
    const cells = document.querySelectorAll("[data-date]")
    expect(cells).toHaveLength(30)
  })

  it("marks today (June 3) with data-today", () => {
    render(<CalendarGrid {...baseProps} />)
    const todayCell = document.querySelector("[data-today]")
    expect(todayCell).toBeInTheDocument()
    expect(todayCell).toHaveAttribute("data-date", "2026-06-03")
  })

  it("calls onSelectDate with ISO date string when a day is clicked", async () => {
    const onSelectDate = jest.fn()
    render(<CalendarGrid {...baseProps} onSelectDate={onSelectDate} />)
    const cell = document.querySelector("[data-date='2026-06-10']") as HTMLElement
    await userEvent.click(cell)
    expect(onSelectDate).toHaveBeenCalledWith("2026-06-10")
  })

  it("renders appointment entries in cells when showAppointments is true", () => {
    render(<CalendarGrid {...baseProps} showAppointments={true} appointments={[
      { id: "a1", member_id: "m1", date: "2026-06-10", note: "PTO",
        all_day: true, start_time: null, end_time: null, created_by_user: null, created_at: "", updated_at: "" }
    ]} members={[
      { id: "m1", name: "Alice", color: "#3b82f6", role_id: null, user_id: null, created_at: "", role: null }
    ]} />)
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0)
    expect(screen.getByText(/PTO/)).toBeInTheDocument()
  })
})
