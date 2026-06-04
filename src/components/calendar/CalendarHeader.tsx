const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

interface CalendarHeaderProps {
  year: number
  month: number
  conflictCount: number
  showAppointments: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleAppointments: () => void
  onToggleConflicts: () => void
  onOpenSettings: () => void
}

export default function CalendarHeader({
  year, month, conflictCount, showAppointments,
  onPrev, onNext, onToday, onToggleAppointments, onToggleConflicts, onOpenSettings,
}: CalendarHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-wrap">
      <span className="font-bold text-lg min-w-[140px]">
        {MONTH_NAMES[month]} {year}
      </span>

      <div className="flex items-center gap-1">
        <button
          aria-label="Previous month"
          onClick={onPrev}
          className="px-2 py-1 rounded hover:bg-gray-700 text-lg"
        >
          ‹
        </button>
        <button
          aria-label="Next month"
          onClick={onNext}
          className="px-2 py-1 rounded hover:bg-gray-700 text-lg"
        >
          ›
        </button>
      </div>

      <button onClick={onToday} className="btn-sm">Today</button>

      <button
        onClick={onToggleAppointments}
        className={`btn-sm ${showAppointments ? "ring-1 ring-blue-400" : ""}`}
      >
        Appointments
      </button>

      <button onClick={onToggleConflicts} className="btn-sm relative">
        Conflicts
        {conflictCount > 0 && (
          <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
            {conflictCount}
          </span>
        )}
      </button>

      <button onClick={onOpenSettings} className="btn-sm ml-auto">
        ⚙ Settings
      </button>
    </header>
  )
}
