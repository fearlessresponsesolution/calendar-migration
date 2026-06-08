import { googleSignIn, resendSignIn } from "./actions"

interface LoginPageProps {
  searchParams: Promise<{ reason?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason, error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="p-8 rounded-lg shadow-lg w-full max-w-md" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Shift Calendar</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>Sign in to view the schedule</p>

        {reason === "expired" && (
          <div className="mb-4 p-3 rounded text-sm" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--warn)", color: "var(--warn)" }}>
            Your session expired. Please sign in again.
          </div>
        )}

        {error === "AccessDenied" && (
          <div className="mb-4 p-3 rounded text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid var(--danger)", color: "var(--danger-text)" }}>
            Access denied. Contact your administrator.
          </div>
        )}

        <form action={googleSignIn}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </form>

        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            Or sign in with email
          </p>
          <form action={resendSignIn}>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg mb-3 text-sm"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              className="w-full font-medium py-3 px-4 rounded-lg transition-colors"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Send magic link
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}
