import { auth } from "@/auth"
import { createAdminClient } from "@/lib/supabase/server"
import CalendarClient from "./CalendarClient"

export default async function CalendarPage() {
  const session = await auth()
  let linkedMemberId: string | null = null

  if (session?.user.role === "member" && session.user.userId) {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", session.user.userId)
      .single()
    linkedMemberId = data?.id ?? null
  }

  return (
    <CalendarClient
      linkedMemberId={linkedMemberId}
      isAdmin={session?.user.role === "admin"}
    />
  )
}
