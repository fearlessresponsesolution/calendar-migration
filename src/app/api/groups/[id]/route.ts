import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const GroupPatchSchema = z.object({
  name: z.string().min(1).max(80),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = GroupPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("groups")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from("groups").delete().eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new Response(null, { status: 204 })
}
