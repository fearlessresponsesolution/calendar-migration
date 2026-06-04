import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const UserCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createAdminClient()
  const { data, error: dbError } = await supabase
    .from("users")
    .select("id, email, role, created_at, created_by")
    .order("email")

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = UserCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .single()
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 })
  }

  const { data, error: dbError } = await supabase
    .from("users")
    .insert(parsed.data)
    .select("id, email, role")
    .single()

  if (dbError) return NextResponse.json({ error: "Database error" }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
