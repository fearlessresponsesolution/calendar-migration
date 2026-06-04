import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const ShiftSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  template_id: z.string().uuid().nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  is_ad_hoc: z.boolean().optional().default(false),
  member_ids: z.array(z.string().uuid()).optional().default([]),
})

export async function GET(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("shifts")
    .select(`
      *,
      template:shift_templates(*),
      assignments:shift_assignments(
        member:members(*, role:roles(*))
      )
    `)
    .gte("date", start)
    .lte("date", end)
    .order("date")
    .order("start_time")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })

  const shifts = (data ?? []).map((s: any) => ({
    ...s,
    members: (s.assignments ?? []).map((a: any) => a.member),
    assignments: undefined,
  }))

  return NextResponse.json(shifts)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = ShiftSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { member_ids, ...shiftData } = parsed.data
  const supabase = createAdminClient()

  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .insert(shiftData)
    .select()
    .single()

  if (shiftError) return NextResponse.json({ error: "Database error" }, { status: 500 })

  if (member_ids.length > 0) {
    const assignments = member_ids.map((member_id) => ({
      shift_id: shift.id,
      member_id,
    }))
    const { error: assignError } = await supabase
      .from("shift_assignments")
      .insert(assignments)
    if (assignError) {
      // Roll back the shift insert to avoid orphaned rows
      await supabase.from("shifts").delete().eq("id", shift.id)
      return NextResponse.json({ error: "Assignment error" }, { status: 500 })
    }
  }

  return NextResponse.json({ ...shift, members: [] }, { status: 201 })
}
