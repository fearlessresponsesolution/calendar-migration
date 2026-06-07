import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const MemberSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  role_id: z.string().uuid().nullable().optional(),
  cert_level: z.enum(["Basic", "Senior", "Master"]).nullable().optional(),
  group_id: z.string().uuid().nullable().optional(),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("members")
    .select("*, role:roles(*), group:groups(*)")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = MemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("members")
    .insert(parsed.data)
    .select("*, role:roles(*), group:groups(*)")
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
