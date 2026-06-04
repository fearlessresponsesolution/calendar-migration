import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CalendarGrid from "./CalendarGrid"

const baseProps = {
  year: 2026,
  month: 5, // June — starts on Monday (first day index = 1)
  today: new Date("2026-06-03"),
  shifts: [],
  conflicts: [],
  showAppointments: false,
  onSelectDate: jest.fn(),
  onMutate: jest.fn(),
}

describe("CalendarGrid", () => {
  it("renders day number buttons for each day of June 2026 (30 days)", () => {
    render(<CalendarGrid {...baseProps} />)
    // June has 30 days — each day renders a button with aria-label = day number
    for (let d = 1; d <= 30; d++) {
      expect(screen.getByRole("button", { name: String(d) })).toBeInTheDocument()
    }
  })

  it("highlights today (June 3)", () => {
    render(<CalendarGrid {...baseProps} />)
    const todayBtn = screen.getByRole("button", { name: "3" })
    expect(todayBtn).toHaveClass("bg-blue-500")
  })

  it("calls onSelectDate with ISO date string when a day is clicked", async () => {
    const onSelectDate = jest.fn()
    render(<CalendarGrid {...baseProps} onSelectDate={onSelectDate} />)
    await userEvent.click(screen.getByRole("button", { name: "10" }))
    expect(onSelectDate).toHaveBeenCalledWith("2026-06-10")
  })
})
