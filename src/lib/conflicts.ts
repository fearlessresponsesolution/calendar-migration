import type { ShiftWithMembers, Conflict, ShiftMember, Appointment, MemberWithRole } from "@/types"

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function rangesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const a = timeToMinutes(s1)
  const b = timeToMinutes(e1)
  const c = timeToMinutes(s2)
  const d = timeToMinutes(e2)

  const aSpans = b <= a
  const bSpans = d <= c

  if (!aSpans && !bSpans) return a < d && b > c
  if (aSpans && !bSpans) return !(d <= a && c >= b)
  if (!aSpans && bSpans) return !(b <= c && a >= d)
  return true
}

export function detectConflicts(
  shifts: ShiftWithMembers[],
  appointments: Appointment[] = [],
  members: MemberWithRole[] = [],
): Conflict[] {
  const byMember = new Map<string, { member: ShiftMember; shifts: ShiftWithMembers[] }>()

  for (const shift of shifts) {
    for (const member of shift.members) {
      if (!byMember.has(member.id)) {
        byMember.set(member.id, { member, shifts: [] })
      }
      byMember.get(member.id)!.shifts.push(shift)
    }
  }

  const conflicts: Conflict[] = []

  for (const { member, shifts: memberShifts } of byMember.values()) {
    const byDate = new Map<string, ShiftWithMembers[]>()
    for (const shift of memberShifts) {
      if (!byDate.has(shift.date)) byDate.set(shift.date, [])
      byDate.get(shift.date)!.push(shift)
    }

    for (const [date, dayShifts] of byDate) {
      const conflicting = new Set<ShiftWithMembers>()
      for (let i = 0; i < dayShifts.length; i++) {
        for (let j = i + 1; j < dayShifts.length; j++) {
          const a = dayShifts[i]
          const b = dayShifts[j]
          if (rangesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) {
            conflicting.add(a)
            conflicting.add(b)
          }
        }
      }
      if (conflicting.size > 0) {
        conflicts.push({
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          date,
          shifts: [...conflicting],
        })
      }
    }
  }

  for (const appt of appointments) {
    const member = members.find((m) => m.id === appt.member_id)
    if (!member) continue
    const dayShifts = shifts.filter((s) => s.date === appt.date && s.members.some((m) => m.id === appt.member_id))
    for (const shift of dayShifts) {
      const overlaps = appt.all_day
        ? true
        : appt.start_time != null && appt.end_time != null &&
          rangesOverlap(shift.start_time, shift.end_time, appt.start_time, appt.end_time)
      if (overlaps) {
        conflicts.push({
          memberId: member.id,
          memberName: member.name,
          memberColor: member.color,
          date: appt.date,
          shifts: [shift],
          appointment: appt,
        })
      }
    }
  }

  return conflicts
}
