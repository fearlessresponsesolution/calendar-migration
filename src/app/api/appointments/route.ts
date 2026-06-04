import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/api-utils"

const AppointmentSchema = z.object({
  member_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  all_day: z.boolean().optional().default(false),
  note: z.string().min(1).max(1000),
})

async function getLinkedMemberId(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("user_id", userId)
    .eq("user_id", userId)
    .single()
  return data?.id ?? null
}

export async function GET(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)

  let memberIdFilter: string | null = null
  if (session.user.role !== "admin") {
    memberIdFilter = await getLinkedMemberId(session.user.userId)
    if (!memberIdFilter) return NextResponse.json([], { status: 200 })
  } else if (searchParams.get("member_id")) {
    memberIdFilter = searchParams.get("member_id")
  }

  const supabase = createAdminClient()
  const base = supabase.from("appointments").select("*")
  const scopedQuery = memberIdFilter ? base.eq("member_id", memberIdFilter) : base

  const { data, error: dbError } = await scopedQuery.order("date")
  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await request.json()
  const parsed = AppointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (session.user.role !== "admin") {
    const linkedId = await getLinkedMemberId(session.user.userId)
    if (parsed.data.member_id !== linkedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("appointments")
    .insert({ ...parsed.data, created_by_user: session.user.userId })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
