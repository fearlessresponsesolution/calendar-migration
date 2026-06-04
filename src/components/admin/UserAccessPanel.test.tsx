import { render, screen } from "@testing-library/react"
import UserAccessPanel from "./UserAccessPanel"

const users = [
  { id: "u1", email: "admin@test.com", role: "admin" as const },
  { id: "u2", email: "member@test.com", role: "member" as const },
]

describe("UserAccessPanel", () => {
  it("renders all users", () => {
    render(<UserAccessPanel users={users} onMutate={jest.fn()} />)
    expect(screen.getByText("admin@test.com")).toBeInTheDocument()
    expect(screen.getByText("member@test.com")).toBeInTheDocument()
  })

  it("renders the add user form", () => {
    render(<UserAccessPanel users={users} onMutate={jest.fn()} />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
  })
})
