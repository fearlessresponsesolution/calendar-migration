import { render, screen } from "@testing-library/react"
import LoginPage from "./page"

jest.mock("./actions", () => ({
  googleSignIn: jest.fn(),
  resendSignIn: jest.fn(),
}))

describe("LoginPage", () => {
  it("renders the sign-in button", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }))
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument()
  })

  it("shows session-expired message when reason=expired", async () => {
    render(
      await LoginPage({ searchParams: Promise.resolve({ reason: "expired" }) })
    )
    expect(screen.getByText(/your session expired/i)).toBeInTheDocument()
  })

  it("shows access-denied message when error=AccessDenied", async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ error: "AccessDenied" }),
      })
    )
    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
  })

  it("shows no error messages by default", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }))
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument()
  })

  it("renders the email input for magic link sign-in", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument()
  })

  it("renders the send magic link button", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }))
    expect(
      screen.getByRole("button", { name: /send magic link/i })
    ).toBeInTheDocument()
  })
})
