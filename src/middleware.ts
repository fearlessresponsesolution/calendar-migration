import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin")

  if (isAdminRoute && req.auth.user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 })
  }
})

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
