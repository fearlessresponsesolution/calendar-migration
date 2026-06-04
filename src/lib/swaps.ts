import type { ShiftWithMembers, MemberWithRole } from "@/types"

export function getAvailableSwaps(
  allShifts: ShiftWithMembers[],
  allMembers: MemberWithRole[],
  conflictingShiftId: string,
  conflictedMemberId: string
): { id: string; name: string; color: string }[] {
  return [] // implemented in Task 14
}
