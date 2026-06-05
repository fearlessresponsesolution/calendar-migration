import type { ShiftWithMembers } from "@/types"
import ShiftBar from "./ShiftBar"

interface DayCellProps {
  date: string
  dayNumber: number
  isToday: boolean
  isOutside: boolean
  shifts: ShiftWithMembers[]
  hasConflict: boolean
  showAppointments: boolean
  onMemberClick?: (memberId: string) => void
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export default function DayCell({
  date, dayNumber, isToday, isOutside, shifts, hasConflict,
  showAppointments, onMemberClick, onClick, onContextMenu,
}: DayCellProps) {
  if (isOutside) {
    return <div style={{ minHeight: 90, background: "transparent", opacity: 0, pointerEvents: "none" }} />
  }

  return (
    <div
      data-today={isToday || undefined}
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
      onMouseOver={e => {
        if (!isToday) e.currentTarget.style.borderColor = "var(--border)"
      }}
      onMouseOut={e => {
        if (!isToday) e.currentTarget.style.borderColor = "transparent"
      }}
    >
      <div className="flex items-center gap-1 mb-1">
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          {dayNumber}
        </span>
        {hasConflict && (
          <span
            className="text-white"
            style={{ background: "var(--danger)", borderRadius: 8, fontSize: 9, padding: "1px 4px" }}
          >
            !
          </span>
        )}
      </div>
      {!showAppointments &&
        shifts.map((shift) => (
          <ShiftBar key={shift.id} shift={shift} onMemberClick={onMemberClick} />
        ))}
    </div>
  )
}
