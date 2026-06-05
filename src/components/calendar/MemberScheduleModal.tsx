import type { ShiftWithMembers, MemberWithRole } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

interface MemberScheduleModalProps {
  member: MemberWithRole
  shifts: ShiftWithMembers[]
  year: number
  month: number
  onClose: () => void
}

export default function MemberScheduleModal({
  member, shifts, year, month, onClose,
}: MemberScheduleModalProps) {
  const memberShifts = shifts
    .filter((s) => s.members.some((m) => m.id === member.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-sm max-h-[70vh] flex flex-col" style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full"
              style={{ width: 10, height: 10, backgroundColor: member.color }}
            />
            <h2 style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</h2>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {MONTH_NAMES[month]} {year}
            </span>
          </div>
          <button
            aria-label="Close member schedule"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {memberShifts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No shifts this month.</p>
          )}
          {memberShifts.map((shift) => {
            const [, m, d] = shift.date.split("-").map(Number)
            return (
              <div key={shift.id} className="flex items-center gap-3 text-sm">
                <span className="w-16 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {MONTH_NAMES[m - 1].slice(0, 3)} {d}
                </span>
                <span style={{ color: "var(--text)" }}>
                  {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                </span>
                {shift.template && (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{shift.template.name}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
          {memberShifts.length} shift{memberShifts.length !== 1 ? "s" : ""} this month
        </div>
      </div>
    </div>
  )
}
