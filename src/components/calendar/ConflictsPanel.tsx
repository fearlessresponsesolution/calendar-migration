"use client"
import { useState } from "react"
import type { Conflict, ShiftWithMembers, MemberWithRole } from "@/types"
import { getAvailableSwaps } from "@/lib/swaps"

interface ConflictsPanelProps {
  conflicts: Conflict[]
  allShifts: ShiftWithMembers[]
  allMembers: MemberWithRole[]
  onClose: () => void
  onMutate: () => void
  isAdmin: boolean
}

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}


export default function ConflictsPanel({ conflicts, allShifts, allMembers, onClose, onMutate, isAdmin }: ConflictsPanelProps) {
  const [swapping, setSwapping] = useState<string | null>(null)

  async function applySwap(shiftId: string, conflictedMemberId: string, newMemberId: string) {
    const shift = allShifts.find((s) => s.id === shiftId)
    if (!shift) return
    setSwapping(shiftId)
    const newMemberIds = shift.members
      .map((m) => m.id)
      .filter((id) => id !== conflictedMemberId)
      .concat(newMemberId)
    await fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: newMemberIds }),
    })
    setSwapping(null)
    onMutate()
  }

  return (
    <aside data-panel="conflicts"
      className="flex flex-col overflow-hidden fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto lg:w-72"
      style={{ background: "var(--surface2)", borderLeft: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <strong style={{ fontSize: 13 }}>
          Conflicts{" "}
          {conflicts.length > 0 && <span style={{ color: "var(--danger-text)" }}>{conflicts.length}</span>}
        </strong>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          aria-label="Close conflicts panel">×</button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
        {conflicts.length === 0 && (
          <p className="text-center" style={{ padding: "32px 12px", color: "var(--success)", fontSize: 13 }}>
            No conflicts this month.
          </p>
        )}
        {conflicts.map((c, i) => (
          <div key={i} style={{ background: "var(--surface)", borderRadius: 6, padding: 10, marginBottom: 8, border: "1px solid var(--danger)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{c.date}</div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 13, marginBottom: 6 }}>
              <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: c.memberColor, flexShrink: 0 }} />
              <span className="font-medium">{c.memberName}</span>
            </div>
            {c.shifts.map((s) => {
              const swaps = getAvailableSwaps(allShifts, allMembers, s.id, c.memberId)
              return (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                    {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    {s.template && <span style={{ marginLeft: 4, opacity: 0.6 }}>({s.template.name})</span>}
                  </div>
                  {c.appointment && (
                    <div style={{ fontSize: 12, color: "var(--warn)", marginBottom: 4 }}>
                      Has an appointment during this shift
                    </div>
                  )}
                  {isAdmin ? (
                    swaps.length > 0 ? (
                      <>
                        <select
                          defaultValue=""
                          disabled={swapping === s.id}
                          onChange={(e) => {
                            if (e.target.value) applySwap(s.id, c.memberId, e.target.value)
                          }}
                          style={{
                            width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                            borderRadius: 6, color: "var(--text)", padding: "5px 8px", fontSize: 12,
                          }}
                        >
                          <option value="">— Assign swap member —</option>
                          {swaps.map((candidate) => {
                            const label = [
                              `${candidate.name}: ${candidate.totalHours.toFixed(1)}h`,
                              candidate.certLevel ?? null,
                              candidate.roleName ?? null,
                              candidate.worksAdjacentBefore ? '↑' : candidate.worksAdjacentAfter ? '↓' : null,
                            ].filter(Boolean).join(' · ')
                            return <option key={candidate.id} value={candidate.id}>{label}</option>
                          })}
                        </select>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                          Sorted by fewest hours · cert shown for reference · ↑↓ = adjacent days
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No available same-role swaps</span>
                    )
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </aside>
  )
}
