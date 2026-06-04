import { auth } from "@/auth"
import type { Session } from "next-auth"

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: Response }

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session) {
    return {
      session: null,
      error: jsonResponse({ error: "Unauthorized" }, 401),
    }
  }
  return { session, error: null }
}

export async function requireAdmin(): Promise<AuthResult> {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (session!.user.role !== "admin") {
    return {
      session: null,
      error: jsonResponse({ error: "Forbidden" }, 403),
    }
  }
  return { session: session!, error: null }
}
