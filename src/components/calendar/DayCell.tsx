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
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      data-date={date}
      data-today={isToday || undefined}
      data-day-cell
      className="cursor-pointer"
      style={{
        minHeight: 90,
        background: "var(--surface)",
        borderRadius: 6,
        border: isToday ? "1px solid var(--accent)" : "1px solid transparent",
        padding: 5,
        transition: "border-color 0.1s",
        position: "relative",
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseOver={e => { if (!isToday) e.currentTarget.style.borderColor = "var(--border)" }}
      onMouseOut={e => { if (!isToday) e.currentTarget.style.borderColor = "transparent" }}
    >
      <div className="flex items-center gap-1 mb-1">
        <span data-day-number style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          {dayNumber}
        </span>
        {hasConflict && (
          <span className="text-white"
            style={{ background: "var(--danger)", borderRadius: 8, fontSize: 9, padding: "1px 4px" }}>
            !
          </span>
        )}
      </div>

      {showAppointments ? (
        apptEntries.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>—</span>
        ) : (
          apptEntries.map((a) => (
            <div
              key={a.apptId}
              style={{
                borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11,
                background: a.hasConflict ? "rgba(239,68,68,0.12)" : "var(--surface2)",
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
    </div>
  )
}
