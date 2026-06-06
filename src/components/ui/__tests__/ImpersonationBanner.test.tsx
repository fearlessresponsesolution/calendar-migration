import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ImpersonationBanner from "../ImpersonationBanner"
import type { MemberWithRole } from "@/types"

const baseMember: MemberWithRole = {
  id: "m1",
  name: "Sarah M.",
  color: "#a855f7",
  role_id: "r1",
  user_id: null,
  cert_level: null,
  created_at: "2024-01-01T00:00:00Z",
  role: {
    id: "r1",
    name: "Nurse",
    color: "#60a5fa",
    created_at: "2024-01-01T00:00:00Z",
  },
}

describe("ImpersonationBanner", () => {
  it("renders member name in the banner", () => {
    render(<ImpersonationBanner member={baseMember} onExit={() => {}} />)
    expect(screen.getByText("Sarah M.")).toBeInTheDocument()
  })

  it("renders cert badge when cert_level is set", () => {
    const member: MemberWithRole = { ...baseMember, cert_level: "Master" }
    render(<ImpersonationBanner member={member} onExit={() => {}} />)
    expect(screen.getByText("Master")).toBeInTheDocument()
  })

  it("does NOT render cert badge when cert_level is null", () => {
    render(<ImpersonationBanner member={baseMember} onExit={() => {}} />)
    expect(screen.queryByText("Master")).not.toBeInTheDocument()
    expect(screen.queryByText("Senior")).not.toBeInTheDocument()
    expect(screen.queryByText("Basic")).not.toBeInTheDocument()
  })

  it("renders role name when member has a role", () => {
    render(<ImpersonationBanner member={baseMember} onExit={() => {}} />)
    expect(screen.getByText(/· Nurse/)).toBeInTheDocument()
  })

  it("calls onExit when Exit Member View button is clicked", async () => {
    const onExit = jest.fn()
    render(<ImpersonationBanner member={baseMember} onExit={onExit} />)
    await userEvent.click(screen.getByRole("button", { name: /exit member view/i }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
