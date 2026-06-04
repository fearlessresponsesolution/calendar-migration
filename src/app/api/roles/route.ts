import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth, requireAdmin } from "@/lib/api-utils"

const RoleSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("roles")
    .select("*")
    .order("name")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = RoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("roles")
    .insert(parsed.data)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
