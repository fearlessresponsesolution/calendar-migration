import { render, screen } from "@testing-library/react"
import AppointmentModeBanner from "./AppointmentModeBanner"

describe("AppointmentModeBanner", () => {
  it("renders appointment mode message", () => {
    render(<AppointmentModeBanner />)
    expect(screen.getByText(/appointment view/i)).toBeInTheDocument()
    expect(screen.getByText(/← Shifts/)).toBeInTheDocument()
  })
})
