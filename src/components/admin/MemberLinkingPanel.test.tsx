import { render, screen } from "@testing-library/react"
import MemberLinkingPanel from "./MemberLinkingPanel"

const members = [
  { id: "m1", name: "Alice", color: "#f00", role_id: null, user_id: null },
  { id: "m2", name: "Bob", color: "#00f", role_id: null, user_id: "u2" },
]
const users = [
  { id: "u1", email: "alice@test.com", role: "member" as const },
  { id: "u2", email: "bob@test.com", role: "member" as const },
]

describe("MemberLinkingPanel", () => {
  it("renders all members", () => {
    render(<MemberLinkingPanel members={members} users={users} onMutate={jest.fn()} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("shows warning icon for unlinked member", () => {
    render(<MemberLinkingPanel members={members} users={users} onMutate={jest.fn()} />)
    expect(screen.getByTitle(/not linked/i)).toBeInTheDocument()
  })
})
