import { getAvailableSwaps } from "../swaps"
import type { ShiftWithMembers, ShiftMember, MemberWithRole } from "@/types"

function makeShiftMember(id: string, name: string, roleId: string | null = null): ShiftMember {
  return { id, name, color: "#fff", role: roleId ? { id: roleId, name: "RoleName", color: "#fff", created_at: "" } : null }
}

function makeFullMember(id: string, name: string, roleId: string | null = null): MemberWithRole {
  return { id, name, color: "#fff", role_id: roleId, user_id: null, created_at: "",
    role: roleId ? { id: roleId, name: "RoleName", color: "#fff", created_at: "" } : null }
}

function makeShift(id: string, date: string, start: string, end: string, members: ShiftMember[]): ShiftWithMembers {
  return { id, date, start_time: start, end_time: end, template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "", members }
}

describe("getAvailableSwaps", () => {
  it("returns free same-role members not on the shift", () => {
    const alice = makeShiftMember("m1", "Alice", "r1")
    const bob = makeFullMember("m2", "Bob", "r1")     // same role, free
    const carol = makeFullMember("m3", "Carol", "r2") // different role

    const allShifts = [makeShift("s1", "2026-06-10", "08:00", "16:00", [alice])]
    const allMembers = [makeFullMember("m1", "Alice", "r1"), bob, carol]

    const swaps = getAvailableSwaps(allShifts, allMembers, "s1", "m1")
    expect(swaps.some((c) => c.id === "m2")).toBe(true)  // Bob: same role, free
    expect(swaps.some((c) => c.id === "m3")).toBe(false) // Carol: different role
    expect(swaps.some((c) => c.id === "m1")).toBe(false) // Alice: conflicted member
  })

  it("excludes members with overlapping shifts on the same day", () => {
    const alice = makeShiftMember("m1", "Alice", "r1")
    const bob = makeShiftMember("m2", "Bob", "r1")

    const allShifts = [
      makeShift("s1", "2026-06-10", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-10", "10:00", "18:00", [bob]), // overlaps s1
    ]
    const allMembers = [makeFullMember("m1", "Alice", "r1"), makeFullMember("m2", "Bob", "r1")]
    const swaps = getAvailableSwaps(allShifts, allMembers, "s1", "m1")
    expect(swaps.some((c) => c.id === "m2")).toBe(false)
  })

  it("sets worksAdjacentBefore=true when candidate has a shift the day before", () => {
    const alice = makeShiftMember("m1", "Alice", "r1")
    const bob = makeShiftMember("m2", "Bob", "r1")
    const allShifts = [
      makeShift("s1", "2026-06-10", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-09", "08:00", "16:00", [bob]), // day before
    ]
    const allMembers = [makeFullMember("m1", "Alice", "r1"), makeFullMember("m2", "Bob", "r1")]
    const swaps = getAvailableSwaps(allShifts, allMembers, "s1", "m1")
    const bobSwap = swaps.find((c) => c.id === "m2")
    expect(bobSwap?.worksAdjacentBefore).toBe(true)
    expect(bobSwap?.worksAdjacentAfter).toBe(false)
  })

  it("sets worksAdjacentAfter=true when candidate has a shift the day after", () => {
    const alice = makeShiftMember("m1", "Alice", "r1")
    const bob = makeShiftMember("m2", "Bob", "r1")
    const allShifts = [
      makeShift("s1", "2026-06-10", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-11", "08:00", "16:00", [bob]), // day after
    ]
    const allMembers = [makeFullMember("m1", "Alice", "r1"), makeFullMember("m2", "Bob", "r1")]
    const swaps = getAvailableSwaps(allShifts, allMembers, "s1", "m1")
    const bobSwap = swaps.find((c) => c.id === "m2")
    expect(bobSwap?.worksAdjacentBefore).toBe(false)
    expect(bobSwap?.worksAdjacentAfter).toBe(true)
  })

  it("returns empty array when no same-role members are free", () => {
    const alice = makeShiftMember("m1", "Alice", "r1")
    const allShifts = [makeShift("s1", "2026-06-10", "08:00", "16:00", [alice])]
    const allMembers = [makeFullMember("m1", "Alice", "r1")]
    expect(getAvailableSwaps(allShifts, allMembers, "s1", "m1")).toEqual([])
  })
})
