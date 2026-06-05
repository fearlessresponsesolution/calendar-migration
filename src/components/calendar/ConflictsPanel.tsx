import type { Conflict, ShiftWithMembers, MemberWithRole } from "@/types"
import { getAvailableSwaps } from "@/lib/swaps"

interface ConflictsPanelProps {
  conflicts: Conflict[]
  allShifts: ShiftWithMembers[]
  allMembers: MemberWithRole[]
  onClose: () => void
}

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

export default function ConflictsPanel({ conflicts, allShifts, allMembers, onClose }: ConflictsPanelProps) {
  return (
    <aside className="w-72 flex flex-col overflow-hidden" style={{ background: "var(--surface2)", borderLeft: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <strong style={{ fontSize: 13 }}>
          Conflicts{" "}
          <span style={{ color: "var(--danger)" }}>{conflicts.length}</span>
        </strong>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          aria-label="Close conflicts panel"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
        {conflicts.length === 0 && (
          <p className="text-center" style={{ padding: "32px 12px", color: "var(--success)", fontSize: 13 }}>
            No conflicts this month.
          </p>
        )}
        {conflicts.map((c, i) => (
          <div
            key={i}
            style={{ background: "var(--surface)", borderRadius: 6, padding: 10, marginBottom: 8, borderLeft: "3px solid var(--danger)" }}
          >
            <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              {c.date}
            </div>
            <div className="flex items-center gap-1.5 mb-1" style={{ fontSize: 13 }}>
              <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: c.memberColor, flexShrink: 0 }} />
              <span className="font-medium">{c.memberName}</span>
            </div>
            <ul style={{ paddingLeft: 16 }}>
              {c.shifts.map((s) => {
                const swaps = getAvailableSwaps(allShifts, allMembers, s.id, c.memberId)
                return (
                  <li key={s.id} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
                    {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    {s.template && (
                      <span style={{ marginLeft: 4, opacity: 0.6 }}>({s.template.name})</span>
                    )}
                    {swaps.length > 0 && (
                      <div style={{ marginTop: 2, fontSize: 11 }}>
                        Swap with:{" "}
                        {swaps.map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-0.5 mr-1">
                            <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: m.color }} />
                            {m.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
