import { rangesOverlap, detectConflicts } from "../conflicts"
import type { ShiftWithMembers, ShiftMember } from "@/types"

const alice: ShiftMember = { id: "m1", name: "Alice", color: "#f00", role: null }
const bob: ShiftMember = { id: "m2", name: "Bob", color: "#00f", role: null }

function makeShift(id: string, date: string, start: string, end: string, members: ShiftMember[]): ShiftWithMembers {
  return { id, date, start_time: start, end_time: end, template_id: null, template: null, is_ad_hoc: false, created_at: "", updated_at: "", members }
}

describe("rangesOverlap", () => {
  it("detects overlap in same-day shifts", () => {
    expect(rangesOverlap("08:00", "16:00", "12:00", "20:00")).toBe(true)
  })
  it("returns false for non-overlapping shifts", () => {
    expect(rangesOverlap("08:00", "16:00", "16:00", "24:00")).toBe(false)
  })
  it("handles midnight-spanning first shift", () => {
    expect(rangesOverlap("22:00", "06:00", "04:00", "12:00")).toBe(true)
  })
  it("handles midnight-spanning second shift", () => {
    expect(rangesOverlap("08:00", "16:00", "22:00", "06:00")).toBe(false)
  })
  it("detects overlap when both shifts span midnight", () => {
    expect(rangesOverlap("22:00", "06:00", "23:00", "07:00")).toBe(true)
  })
})

describe("detectConflicts", () => {
  it("returns empty array when no conflicts", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-01", "16:00", "24:00", [bob]),
    ]
    expect(detectConflicts(shifts)).toHaveLength(0)
  })
  it("detects a member double-booked on same day", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-01", "12:00", "20:00", [alice, bob]),
    ]
    const conflicts = detectConflicts(shifts)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].memberId).toBe("m1")
    expect(conflicts[0].shifts).toHaveLength(2)
  })
  it("does not flag the same member on different dates", () => {
    const shifts = [
      makeShift("s1", "2026-06-01", "08:00", "16:00", [alice]),
      makeShift("s2", "2026-06-02", "08:00", "16:00", [alice]),
    ]
    expect(detectConflicts(shifts)).toHaveLength(0)
  })
})
