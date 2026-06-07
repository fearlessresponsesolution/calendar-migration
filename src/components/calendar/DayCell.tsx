import type { ShiftWithMembers, ApptEntry } from "@/types"
import ShiftBar from "./ShiftBar"

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

interface DayCellProps {
  date: string
  dayNumber: number
  isToday: boolean
  isOutside: boolean
  shifts: ShiftWithMembers[]
  hasConflict: boolean
  showAppointments: boolean
  apptEntries: ApptEntry[]
  onMemberClick?: (memberId: string) => void
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export default function DayCell({
  date, dayNumber, isToday, isOutside, shifts, hasConflict,
  showAppointments, apptEntries, onMemberClick, onClick, onContextMenu,
}: DayCellProps) {
  if (isOutside) {
    return <div style={{ minHeight: 90, background: "transparent", opacity: 0, pointerEvents: "none" }} />
  }

  const shiftCount = shifts.length
  const ariaLabel = `${dayNumber}, ${shiftCount} ${shiftCount === 1 ? "shift" : "shifts"}`

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-date={date}
      data-today={isToday || undefined}
      data-day-cell
      className="cursor-pointer text-left w-full"
      style={{
        minHeight: 115,
        background: "var(--surface)",
        borderRadius: 6,
        border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
        padding: 10,
        transition: "border-color 0.1s",
        position: "relative",
        display: "block",
        appearance: "none",
        WebkitAppearance: "none",
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      >

      <div className="flex items-center gap-1 mb-1">
        <span data-day-number style={{ fontSize: 12, fontWeight: 600, color: isToday ? "var(--accent)" : "var(--text)" }}>
          {dayNumber}
        </span>
        {hasConflict && (
          <span className="text-white"
            style={{ background: "var(--danger)", borderRadius: 8, fontSize: 9, padding: "1px 4px" }}>
            !
          </span>
        )}
      </div>

      {/* Mobile: member first names per shift, appointment member names */}
      <div data-mobile-count style={{ display: "none", flexDirection: "column", gap: 2, marginTop: 2 }}>
        {showAppointments ? (
          apptEntries.length > 0 && apptEntries.map((a) => (
            <span key={a.apptId} style={{
              fontSize: 9, fontWeight: 700, color: a.memberColor,
              whiteSpace: "nowrap", lineHeight: 1.3,
            }}>
              {a.memberName.split(" ")[0].slice(0, 6)}
            </span>
          ))
        ) : (
          shifts.map((shift, i) => (
            <div key={shift.id} style={{
              display: "flex", flexWrap: "wrap", gap: "1px 3px",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              paddingTop: i > 0 ? 2 : 0,
            }}>
              {shift.members.length > 0 ? (
                shift.members.map((m) => (
                  <span key={m.id} style={{
                    fontSize: 9, fontWeight: 700, color: m.color,
                    whiteSpace: "nowrap", lineHeight: 1.3,
                  }}>
                    {m.name.split(" ")[0].slice(0, 6)}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.3 }}>—</span>
              )}
            </div>
          ))
        )}
      </div>

      {showAppointments ? (
        apptEntries.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>—</span>
        ) : (
          apptEntries.map((a) => (
            <div
              key={a.apptId}
              data-appt-row
              style={{
                borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11,
                background: a.hasConflict ? "var(--surface-danger-tint)" : "var(--surface2)",
                border: `1px solid ${a.hasConflict ? "var(--danger)" : "var(--border)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.memberColor, display: "inline-block", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.memberName.split(" ")[0]}
                </span>
              </div>
              <div style={{ color: a.hasConflict ? "var(--danger)" : "var(--text-muted)", fontSize: 10, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.note} · {a.allDay ? "All day" : `${formatTime(a.startTime!)}–${formatTime(a.endTime!)}`}
                {a.hasConflict && " ⚠"}
              </div>
            </div>
          ))
        )
      ) : (
        shifts.map((shift) => (
          <div key={shift.id} data-shift-bar>
            <ShiftBar shift={shift} onMemberClick={onMemberClick} />
          </div>
        ))
      )}
    </button>
  )
}
