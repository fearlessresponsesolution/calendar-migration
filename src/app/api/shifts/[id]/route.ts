import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const ShiftPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  template_id: z.string().uuid().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  is_ad_hoc: z.boolean().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
  group_id: z.string().uuid().nullable().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()
  const parsed = ShiftPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { member_ids, ...shiftData } = parsed.data
  const supabase = createAdminClient()

  if (Object.keys(shiftData).length > 0) {
    const { error: updateError } = await supabase
      .from("shifts")
      .update({ ...shiftData, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (updateError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  if (member_ids !== undefined) {
    const { error: deleteError } = await supabase
      .from("shift_assignments")
      .delete()
      .eq("shift_id", id)
    if (deleteError) return NextResponse.json({ error: "Assignment error" }, { status: 500 })

    if (member_ids.length > 0) {
      const { error: insertError } = await supabase
        .from("shift_assignments")
        .insert(member_ids.map((member_id) => ({ shift_id: id, member_id })))
      if (insertError) return NextResponse.json({ error: "Assignment error" }, { status: 500 })
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
  const { error: dbError } = await supabase.from("shifts").delete().eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new Response(null, { status: 204 })
}
