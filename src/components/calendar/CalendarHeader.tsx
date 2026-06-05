const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

interface CalendarHeaderProps {
  year: number
  month: number
  conflictCount: number
  showAppointments: boolean
  showWorkload: boolean
  isAdmin: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleAppointments: () => void
  onToggleConflicts: () => void
  onToggleWorkload: () => void
  onOpenSettings: () => void
  onPrint: () => void
  onStartTour: () => void
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
  year, month, conflictCount, showAppointments, showWorkload, isAdmin,
  onPrev, onNext, onToday, onToggleAppointments, onToggleConflicts,
  onToggleWorkload, onOpenSettings, onPrint, onStartTour,
}: CalendarHeaderProps) {
  return (
    <header
      className="flex items-center gap-2 flex-wrap flex-shrink-0"
      style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "10px 16px" }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, marginRight: 4 }}>Shift Calendar</span>

      <div className="flex items-center gap-2 flex-wrap ml-auto">
      <div id="tour-month-nav" className="flex items-center gap-1.5">
        <button
          aria-label="Previous month"
          onClick={onPrev}
          style={navBtnStyle}
          onMouseOver={e => (e.currentTarget.style.background = "var(--border)")}
          onMouseOut={e => (e.currentTarget.style.background = "none")}
        >‹</button>
        <span className="font-semibold text-sm" style={{ minWidth: 140, textAlign: "center" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          aria-label="Next month"
          onClick={onNext}
          style={navBtnStyle}
          onMouseOver={e => (e.currentTarget.style.background = "var(--border)")}
          onMouseOut={e => (e.currentTarget.style.background = "none")}
        >›</button>
      </div>

      <button id="tour-today-btn" onClick={onToday} className="btn-sm">Today</button>

      <button
        id="tour-appt-btn"
        onClick={onToggleAppointments}
        aria-label={showAppointments ? "Switch to shifts view" : "Switch to appointments view"}
        className="btn-sm"
        style={showAppointments
          ? { borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(245,158,11,0.13)" }
          : undefined}
      >
        {showAppointments ? "👁 ← Shifts" : "👁 Appointments"}
      </button>

      <button id="tour-conflicts-btn" onClick={onToggleConflicts} className="btn-sm">
        ⚠ Conflicts
        {conflictCount > 0 && (
          <span
            className="inline-flex items-center justify-center text-white ml-1"
            style={{ background: "var(--danger)", borderRadius: 10, fontSize: 11, minWidth: 18, height: 18, padding: "0 5px" }}
          >
            {conflictCount}
          </span>
        )}
      </button>

      <button
        id="tour-workload-btn"
        onClick={onToggleWorkload}
        aria-label="Toggle workload panel"
        className="btn-sm"
        style={showWorkload ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
      >
        📊 Workload
      </button>

      {isAdmin && (
        <button id="tour-settings-btn" onClick={onOpenSettings} className="btn-sm">⚙ Settings</button>
      )}

      <button
        id="tour-print-btn"
        onClick={onPrint}
        aria-label="Print calendar"
        className="btn-sm"
      >🖨</button>

      <button
        onClick={onStartTour}
        aria-label="Start tour"
        className="btn-sm"
        style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
      >? Tour</button>
      </div>
    </header>
  )
}
