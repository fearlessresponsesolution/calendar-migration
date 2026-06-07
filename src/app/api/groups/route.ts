import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const GroupSchema = z.object({
  name: z.string().min(1).max(80),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("groups")
    .select("*")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = GroupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("groups")
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
