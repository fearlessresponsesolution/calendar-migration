import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const UserPatchSchema = z.object({
  role: z.enum(["admin", "member"]).optional(),
  member_id: z.string().uuid().nullable().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = UserPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (parsed.data.role !== undefined) {
    const { error: dbError } = await supabase
      .from("users")
      .update({ role: parsed.data.role })
      .eq("id", id)
    if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  if (parsed.data.member_id !== undefined) {
    await supabase.from("members").update({ user_id: null }).eq("user_id", id)
    if (parsed.data.member_id) {
      const { error: linkError } = await supabase
        .from("members")
        .update({ user_id: id })
        .eq("id", parsed.data.member_id)
      if (linkError) return NextResponse.json({ error: "Link error" }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()

  await supabase.from("members").update({ user_id: null }).eq("user_id", id)

  const { error: dbError } = await supabase.from("users").delete().eq("id", id)
  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
