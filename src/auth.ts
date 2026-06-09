import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { isEmailAllowed, getUserRecord } from "@/lib/auth-helpers"
import { createSupabaseAdapter } from "@/lib/auth-adapter"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: createSupabaseAdapter(),
  session: { strategy: "jwt" },
  providers: [
    Google,
    Resend({ from: process.env.AUTH_RESEND_FROM }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      return isEmailAllowed(user.email)
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const record = await getUserRecord(user.email)
        if (record) {
          token.userId = record.id
          token.role = record.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.userId) session.user.userId = token.userId as string
      if (token.role) session.user.role = token.role as "admin" | "member"
      return session
    },
  },
})
