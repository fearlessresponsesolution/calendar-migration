import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TourOverlay from "./TourOverlay"

describe("TourOverlay", () => {
  it("does not render when active is false", () => {
    render(<TourOverlay active={false} onEnd={jest.fn()} />)
    expect(screen.queryByText(/Welcome to Shift Calendar/i)).not.toBeInTheDocument()
  })

  it("renders step 1 title when active", () => {
    render(<TourOverlay active={true} onEnd={jest.fn()} />)
    expect(screen.getByText(/Welcome to Shift Calendar/i)).toBeInTheDocument()
  })

  it("advances to step 2 when Next is clicked", async () => {
    render(<TourOverlay active={true} onEnd={jest.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /next/i }))
    expect(screen.getByText(/Settings — Start Here/i)).toBeInTheDocument()
  })

  it("goes back to step 1 when Back is clicked from step 2", async () => {
    render(<TourOverlay active={true} onEnd={jest.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /next/i }))
    await userEvent.click(screen.getByRole("button", { name: /back/i }))
    expect(screen.getByText(/Welcome to Shift Calendar/i)).toBeInTheDocument()
  })

  it("calls onEnd when Escape is pressed", () => {
    const onEnd = jest.fn()
    render(<TourOverlay active={true} onEnd={onEnd} />)
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onEnd).toHaveBeenCalled()
  })

  it("calls onEnd when Done is clicked on the last step", async () => {
    const onEnd = jest.fn()
    render(<TourOverlay active={true} onEnd={onEnd} />)
    // Advance through all 11 steps
    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getByRole("button", { name: /next/i }))
    }
    await userEvent.click(screen.getByRole("button", { name: /done/i }))
    expect(onEnd).toHaveBeenCalled()
  })

  it("resets to step 1 when re-activated", async () => {
    const { rerender } = render(<TourOverlay active={true} onEnd={jest.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /next/i }))
    expect(screen.getByText(/Settings — Start Here/i)).toBeInTheDocument()
    rerender(<TourOverlay active={false} onEnd={jest.fn()} />)
    rerender(<TourOverlay active={true} onEnd={jest.fn()} />)
    expect(screen.getByText(/Welcome to Shift Calendar/i)).toBeInTheDocument()
  })
})
