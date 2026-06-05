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

const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  border: "1px solid var(--border)",
  background: "none", color: "var(--text)",
  cursor: "pointer", fontSize: 16,
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 0.1s",
}

export default function CalendarHeader({
  year, month, conflictCount, showAppointments,
  onPrev, onNext, onToday, onToggleAppointments, onToggleConflicts, onOpenSettings,
}: CalendarHeaderProps) {
  return (
    <header
      className="flex items-center gap-2 flex-wrap flex-shrink-0"
      style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "10px 16px" }}
    >
      <div className="flex items-center gap-1.5">
        <button
          aria-label="Previous month"
          onClick={onPrev}
          style={navBtnStyle}
          onMouseOver={e => (e.currentTarget.style.background = "var(--border)")}
          onMouseOut={e => (e.currentTarget.style.background = "none")}
        >
          ‹
        </button>
        <span className="font-semibold text-sm" style={{ minWidth: 140, textAlign: "center" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          aria-label="Next month"
          onClick={onNext}
          style={navBtnStyle}
          onMouseOver={e => (e.currentTarget.style.background = "var(--border)")}
          onMouseOut={e => (e.currentTarget.style.background = "none")}
        >
          ›
        </button>
      </div>

      <button onClick={onToday} className="btn-sm">Today</button>

      <button
        onClick={onToggleAppointments}
        className="btn-sm"
        style={showAppointments ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
      >
        Appointments
      </button>

      <button onClick={onToggleConflicts} className="btn-sm">
        Conflicts
        {conflictCount > 0 && (
          <span
            className="inline-flex items-center justify-center text-white ml-1"
            style={{ background: "var(--danger)", borderRadius: 10, fontSize: 11, minWidth: 18, height: 18, padding: "0 5px" }}
          >
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
