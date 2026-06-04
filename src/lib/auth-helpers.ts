import { createAdminClient } from "./supabase/server"

export async function isEmailAllowed(email: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single()
  return !!data
}

export async function getUserRecord(
  email: string
): Promise<{ id: string; role: string } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", email)
    .single()
  return data
}
