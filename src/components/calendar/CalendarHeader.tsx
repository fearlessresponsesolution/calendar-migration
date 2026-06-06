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

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="10,4 6,8 10,12" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6,4 10,8 6,12" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 8C1 8 3.5 3.5 8 3.5C12.5 3.5 15 8 15 8C15 8 12.5 12.5 8 12.5C3.5 12.5 1 8 1 8Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5L14 13.5H2L8 2.5Z" />
      <line x1="8" y1="7" x2="8" y2="10" />
      <line x1="8" y1="12" x2="8.01" y2="12" strokeWidth="2.5" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="12" x2="2" y2="7" />
      <line x1="7" y1="12" x2="7" y2="3" />
      <line x1="12" y1="12" x2="12" y2="8" />
      <line x1="0.5" y1="12" x2="13.5" y2="12" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.2 3.2L4.3 4.3M11.7 11.7L12.8 12.8M3.2 12.8L4.3 11.7M11.7 4.3L12.8 3.2" />
    </svg>
  )
}

function PrinterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5V2H12V5.5" />
      <rect x="2" y="5.5" width="12" height="6" rx="1.5" />
      <path d="M4 11.5V14H12V11.5" />
      <line x1="5" y1="8.5" x2="8.5" y2="8.5" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M6.5 6.5C6.5 5.7 7.2 5 8 5C8.8 5 9.5 5.7 9.5 6.5C9.5 7.3 8.5 8 8 8.8" />
      <line x1="8" y1="11" x2="8.01" y2="11" strokeWidth="2.5" />
    </svg>
  )
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>$</span>
        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, letterSpacing: "0.03em" }}>SHIFT.CAL</span>
        <span className="hdr-anim v2-cursor" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, color: "var(--accent)", marginLeft: -2 }}>█</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap ml-auto">
        <div id="tour-month-nav" className="flex items-center gap-1.5">
          <button aria-label="Previous month" onClick={onPrev} className="nav-btn">
            <ChevronLeft />
          </button>
          <span className="font-semibold text-sm" style={{ minWidth: 140, textAlign: "center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button aria-label="Next month" onClick={onNext} className="nav-btn">
            <ChevronRight />
          </button>
        </div>

        <button id="tour-today-btn" onClick={onToday} className="btn-sm">Today</button>

        <button
          id="tour-appt-btn"
          onClick={onToggleAppointments}
          aria-label={showAppointments ? "Switch to shifts view" : "Switch to appointments view"}
          className="btn-sm"
          style={showAppointments
            ? { borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(90,159,191,0.13)" }
            : undefined}
        >
          <EyeIcon />
          {showAppointments ? "← Shifts" : "Appointments"}
        </button>

        <button id="tour-conflicts-btn" onClick={onToggleConflicts} className="btn-sm">
          <WarningIcon />
          Conflicts
          {conflictCount > 0 && (
            <span
              className="inline-flex items-center justify-center text-white"
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
          style={showWorkload ? { borderColor: "var(--accent)", color: "var(--accent-text)" } : undefined}
        >
          <BarChartIcon />
          Workload
        </button>

        {isAdmin && (
          <button id="tour-settings-btn" onClick={onOpenSettings} className="btn-sm">
            <GearIcon />
            Settings
          </button>
        )}

        <button id="tour-print-btn" onClick={onPrint} aria-label="Print calendar" className="btn-sm">
          <PrinterIcon />
        </button>

        <button
          onClick={onStartTour}
          aria-label="Start tour"
          className="btn-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
        >
          <HelpIcon />
          Tour
        </button>
      </div>
    </header>
  )
}
