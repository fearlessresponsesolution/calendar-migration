import type { Adapter, AdapterUser, VerificationToken } from "@auth/core/adapters"
import { createAdminClient } from "./supabase/server"

export function createSupabaseAdapter(): Adapter {
  return {
    async createUser(user) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("users")
        .insert({ email: user.email, role: "member" })
        .select("id, email")
        .single()
      return {
        id: data?.id ?? crypto.randomUUID(),
        email: data?.email ?? (user.email as string),
        emailVerified: null,
      }
    },
    async getUser(id) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", id)
        .single()
      if (!data) return null
      return { id: data.id, email: data.email, emailVerified: null }
    },
    async getUserByEmail(email) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single()
      if (!data) return null
      return { id: data.id, email: data.email, emailVerified: null }
    },
    async getUserByAccount() {
      return null
    },
    async updateUser(user) {
      return user as AdapterUser
    },
    async linkAccount() {
      return undefined
    },
    async createSession(session) {
      return session
    },
    async getSessionAndUser() {
      return null
    },
    async updateSession() {
      return undefined
    },
    async deleteSession() {
      return undefined
    },
    async createVerificationToken(verificationToken: VerificationToken) {
      const supabase = createAdminClient()
      await supabase.from("verification_tokens").insert({
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires.toISOString(),
      })
      return verificationToken
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token)
        .select()
        .single()
      if (!data) return null
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      }
    },
  }
}
