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
}

export default function DayCell({
  date, dayNumber, isToday, isOutside, shifts, hasConflict,
  showAppointments, onMemberClick, onClick,
}: DayCellProps) {
  if (isOutside) {
    return <div className="min-h-[80px] bg-gray-900/30" />
  }

  return (
    <div
      data-today={isToday || undefined}
      className={`min-h-[80px] border border-gray-800 p-1 cursor-pointer hover:bg-gray-800/50 transition-colors ${
        isToday ? "ring-1 ring-blue-500" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <button
          aria-label={String(dayNumber)}
          className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${
            isToday ? "bg-blue-500 text-white" : "text-gray-300"
          }`}
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          {dayNumber}
        </button>
        {hasConflict && (
          <span className="text-yellow-400 text-xs" title="Schedule conflict">⚠</span>
        )}
      </div>
      {!showAppointments &&
        shifts.map((shift) => (
          <ShiftBar key={shift.id} shift={shift} onMemberClick={onMemberClick} />
        ))}
    </div>
  )
}
