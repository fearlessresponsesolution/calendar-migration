import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-utils"

const MigrationSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  roles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional().default("#6b7280"),
  })),
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    roleId: z.string().nullable().optional(),
  })),
  shiftTemplates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
  schedule: z.record(z.string(), z.array(z.object({
    id: z.string(),
    templateId: z.string().nullable().optional(),
    startTime: z.string(),
    endTime: z.string(),
    isAdHoc: z.boolean().optional().default(false),
    memberIds: z.array(z.string()).optional().default([]),
  }))),
  appointments: z.record(z.string(), z.array(z.object({
    id: z.string(),
    date: z.string(),
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
    allDay: z.boolean().optional().default(false),
    note: z.string(),
  }))).optional().default({}),
})

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const parsed = MigrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const supabase = createAdminClient()
  const idMap = new Map<string, string>()

  for (const r of data.roles) idMap.set(r.id, crypto.randomUUID())
  for (const m of data.members) idMap.set(m.id, crypto.randomUUID())
  for (const t of data.shiftTemplates) idMap.set(t.id, crypto.randomUUID())
  for (const shifts of Object.values(data.schedule)) {
    for (const s of shifts) idMap.set(s.id, crypto.randomUUID())
  }

  const counts = { roles: 0, members: 0, templates: 0, shifts: 0, appointments: 0, errors: 0 }

  const rolesRows = data.roles.map((r) => ({
    id: idMap.get(r.id)!,
    name: r.name,
    color: r.color,
  }))
  const { error: rolesErr } = await supabase.from("roles").upsert(rolesRows, { onConflict: "id" })
  if (rolesErr) counts.errors++
  else counts.roles = rolesRows.length

  const membersRows = data.members.map((m) => ({
    id: idMap.get(m.id)!,
    name: m.name,
    color: m.color,
    role_id: m.roleId ? idMap.get(m.roleId) ?? null : null,
  }))
  const { error: membersErr } = await supabase.from("members").upsert(membersRows, { onConflict: "id" })
  if (membersErr) counts.errors++
  else counts.members = membersRows.length

  const templatesRows = data.shiftTemplates.map((t) => ({
    id: idMap.get(t.id)!,
    name: t.name,
    start_time: t.startTime,
    end_time: t.endTime,
  }))
  const { error: templatesErr } = await supabase.from("shift_templates").upsert(templatesRows, { onConflict: "id" })
  if (templatesErr) counts.errors++
  else counts.templates = templatesRows.length

  const shiftsRows: object[] = []
  const assignmentRows: object[] = []

  for (const [date, dayShifts] of Object.entries(data.schedule)) {
    for (const shift of dayShifts) {
      const newShiftId = idMap.get(shift.id)!
      shiftsRows.push({
        id: newShiftId,
        date,
        template_id: shift.templateId ? idMap.get(shift.templateId) ?? null : null,
        start_time: shift.startTime,
        end_time: shift.endTime,
        is_ad_hoc: shift.isAdHoc ?? false,
      })
      for (const memberId of shift.memberIds ?? []) {
        const newMemberId = idMap.get(memberId)
        if (newMemberId) {
          assignmentRows.push({ shift_id: newShiftId, member_id: newMemberId })
        } else {
          counts.errors++
        }
      }
    }
  }

  if (shiftsRows.length > 0) {
    const { error: shiftsErr } = await supabase.from("shifts").upsert(shiftsRows, { onConflict: "id" })
    if (shiftsErr) counts.errors++
    else counts.shifts = shiftsRows.length
  }

  if (assignmentRows.length > 0) {
    const { error: assignErr } = await supabase.from("shift_assignments").upsert(assignmentRows, { onConflict: "shift_id,member_id" })
    if (assignErr) counts.errors++
  }

  const apptRows: object[] = []
  for (const [memberId, appts] of Object.entries(data.appointments ?? {})) {
    const newMemberId = idMap.get(memberId)
    if (!newMemberId) { counts.errors += appts.length; continue }
    for (const appt of appts) {
      apptRows.push({
        id: crypto.randomUUID(),
        member_id: newMemberId,
        date: appt.date,
        start_time: appt.startTime ?? null,
        end_time: appt.endTime ?? null,
        all_day: appt.allDay ?? false,
        note: appt.note,
      })
    }
  }
  if (apptRows.length > 0) {
    const { error: apptErr } = await supabase.from("appointments").insert(apptRows)
    if (apptErr) counts.errors++
    else counts.appointments = apptRows.length
  }

  await supabase.from("settings").upsert({ key: "migration_completed", value: "true" }, { onConflict: "key" })

  return NextResponse.json({ counts })
}
