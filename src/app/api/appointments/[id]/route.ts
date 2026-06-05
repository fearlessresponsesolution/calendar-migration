import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

const AppointmentPatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  all_day: z.boolean().optional(),
  note: z.string().min(1).max(1000).optional(),
})

interface AppointmentMeta {
  created_by_user: string | null
  member_id: string | null
}

async function getAppointmentMeta(id: string): Promise<AppointmentMeta | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("appointments")
    .select("created_by_user, member_id")
    .eq("id", id)
    .single()
  if (!data) return null
  return { created_by_user: data.created_by_user ?? null, member_id: data.member_id ?? null }
}

async function getLinkedMemberId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id ?? null
}

async function isAuthorized(userId: string, appointmentId: string): Promise<boolean> {
  const [meta, linkedMemberId] = await Promise.all([
    getAppointmentMeta(appointmentId),
    getLinkedMemberId(userId),
  ])
  if (!meta) return false
  return meta.created_by_user === userId || (linkedMemberId !== null && meta.member_id === linkedMemberId)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  if (session.user.role !== "admin") {
    const authorized = await isAuthorized(session.user.userId, id)
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const body = await request.json()
  const parsed = AppointmentPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("appointments")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  if (session.user.role !== "admin") {
    const authorized = await isAuthorized(session.user.userId, id)
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const supabase = createAdminClient()
  const { error: dbError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
