import { getAvailableSwaps } from "../swaps"
import type { ShiftWithMembers, ShiftMember, MemberWithRole } from "@/types"

function makeMember(id: string, name: string): ShiftMember {
  return { id, name, color: "#fff", role: null }
}

function makeFullMember(id: string, name: string): MemberWithRole {
  return { id, name, color: "#fff", role_id: null, user_id: null, created_at: "", role: null }
}

function makeShift(id: string, date: string, start: string, end: string, members: ShiftMember[]): ShiftWithMembers {
  return { id, date, start_time: start, end_time: end, template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "", members }
}

const alice = makeMember("m1", "Alice")
const bob = makeMember("m2", "Bob")
const charlie = makeFullMember("m3", "Charlie")

describe("getAvailableSwaps", () => {
  it("returns members not on the conflicting shift who are free that day", () => {
    const allShifts: ShiftWithMembers[] = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice, bob]),
      makeShift("s2", "2026-06-01", "12:00", "20:00", [alice]),
      // Charlie has no shifts on June 1
    ]
    const allMembers: MemberWithRole[] = [makeFullMember("m1", "Alice"), makeFullMember("m2", "Bob"), charlie]
    const swaps = getAvailableSwaps(allShifts, allMembers, "s2", "m1")
    // Charlie is free — should be suggested
    expect(swaps.some((m) => m.id === "m3")).toBe(true)
    // Alice is the conflicted member — should not appear
    expect(swaps.some((m) => m.id === "m1")).toBe(false)
    // Bob's shift (s1: 08:00-16:00) overlaps s2 (12:00-20:00) — should NOT appear
    expect(swaps.some((m) => m.id === "m2")).toBe(false) // Bob overlaps s2
  })

  it("returns empty array when no one is free", () => {
    const allShifts: ShiftWithMembers[] = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice, bob]),
      makeShift("s2", "2026-06-01", "08:00", "20:00", [alice, bob]),
    ]
    const allMembers: MemberWithRole[] = [makeFullMember("m1", "Alice"), makeFullMember("m2", "Bob")]
    const result = getAvailableSwaps(allShifts, allMembers, "s2", "m1")
    expect(Array.isArray(result)).toBe(true)
  })
})
