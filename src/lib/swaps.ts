import type { ShiftWithMembers, MemberWithRole } from "@/types"
import { rangesOverlap } from "./conflicts"

export function getAvailableSwaps(
  allShifts: ShiftWithMembers[],
  allMembers: MemberWithRole[],
  conflictingShiftId: string,
  conflictedMemberId: string
): { id: string; name: string; color: string }[] {
  const shift = allShifts.find((s) => s.id === conflictingShiftId)
  if (!shift) return []

  const assignedIds = new Set(shift.members.map((m) => m.id))

  return allMembers.filter((member) => {
    if (assignedIds.has(member.id)) return false
    if (member.id === conflictedMemberId) return false

    // Check if this member has any overlapping shifts on the same date
    const sameDay = allShifts.filter(
      (s) => s.date === shift.date && s.id !== conflictingShiftId
    )
    const hasConflict = sameDay.some(
      (s) =>
        s.members.some((m) => m.id === member.id) &&
        rangesOverlap(shift.start_time, shift.end_time, s.start_time, s.end_time)
    )
    return !hasConflict
  })
}
