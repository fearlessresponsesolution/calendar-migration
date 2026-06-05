import type { ShiftWithMembers, MemberWithRole, SwapCandidate } from "@/types"
import { rangesOverlap } from "./conflicts"

function adjacentDate(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + offsetDays)).toISOString().split("T")[0]
}

export function getAvailableSwaps(
  allShifts: ShiftWithMembers[],
  allMembers: MemberWithRole[],
  conflictingShiftId: string,
  conflictedMemberId: string
): SwapCandidate[] {
  const shift = allShifts.find((s) => s.id === conflictingShiftId)
  if (!shift) return []

  const conflictedMember = allMembers.find((m) => m.id === conflictedMemberId)
  const conflictedRoleId = conflictedMember?.role_id ?? null

  const assignedIds = new Set(shift.members.map((m) => m.id))
  const dateBefore = adjacentDate(shift.date, -1)
  const dateAfter = adjacentDate(shift.date, 1)

  return allMembers
    .filter((member) => {
      if (member.id === conflictedMemberId) return false
      if (assignedIds.has(member.id)) return false
      if (member.role_id !== conflictedRoleId) return false

      const sameDay = allShifts.filter(
        (s) => s.date === shift.date && s.id !== conflictingShiftId
      )
      return !sameDay.some(
        (s) =>
          s.members.some((m) => m.id === member.id) &&
          rangesOverlap(shift.start_time, shift.end_time, s.start_time, s.end_time)
      )
    })
    .map((member) => ({
      id: member.id,
      name: member.name,
      color: member.color,
      worksAdjacentBefore: allShifts.some(
        (s) => s.date === dateBefore && s.members.some((m) => m.id === member.id)
      ),
      worksAdjacentAfter: allShifts.some(
        (s) => s.date === dateAfter && s.members.some((m) => m.id === member.id)
      ),
    }))
}
