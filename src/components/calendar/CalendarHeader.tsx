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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon fill="currentColor" points="10,3 5,8 10,13 11.4,11.6 7.8,8 11.4,4.4"/>
            </svg>
          </button>
          <span className="font-semibold text-sm" style={{ minWidth: 140, textAlign: "center" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button aria-label="Next month" onClick={onNext} className="nav-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon fill="currentColor" points="6,3 11,8 6,13 4.6,11.6 8.2,8 4.6,4.4"/>
            </svg>
          </button>
        </div>

        <button id="tour-today-btn" onClick={onToday} className="btn-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect fill="currentColor" x="1" y="3" width="12" height="10" rx="1.5"/>
            <rect fill="var(--surface)" x="3" y="6" width="2" height="2" rx="0.5"/>
            <rect fill="var(--surface)" x="6" y="6" width="2" height="2" rx="0.5"/>
            <rect fill="var(--surface)" x="9" y="6" width="2" height="2" rx="0.5"/>
            <rect fill="var(--surface)" x="3" y="9" width="2" height="2" rx="0.5"/>
            <rect fill="var(--surface)" x="6" y="9" width="2" height="2" rx="0.5"/>
            <rect fill="currentColor" x="3.5" y="1.5" width="1.5" height="3" rx="0.75"/>
            <rect fill="currentColor" x="9" y="1.5" width="1.5" height="3" rx="0.75"/>
          </svg>
          Today
        </button>

        <button
          id="tour-appt-btn"
          onClick={onToggleAppointments}
          aria-label={showAppointments ? "Switch to shifts view" : "Switch to appointments view"}
          className="btn-sm"
          style={showAppointments ? { borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(90,159,191,0.13)" } : undefined}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path fillRule="evenodd" fill="currentColor" d="M8 3C4.5 3 1 7.5 1 8s3.5 5 7 5 7-4.5 7-5-3.5-5-7-5zm0 8a3 3 0 110-6 3 3 0 010 6z"/>
            <circle fill="var(--surface2)" cx="8" cy="8" r="1.4"/>
          </svg>
          {showAppointments ? "← Shifts" : "Appointments"}
        </button>

        <button id="tour-conflicts-btn" onClick={onToggleConflicts} className="btn-sm">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path fillRule="evenodd" fill="currentColor" d="M8 1L15.5 14.5H.5L8 1zm-.75 5.5h1.5V11H7.25zm0 5h1.5V13H7.25z"/>
          </svg>
          Conflicts
          {conflictCount > 0 && (
            <span className="inline-flex items-center justify-center text-white"
              style={{ background: "var(--danger)", borderRadius: 10, fontSize: 11, minWidth: 18, height: 18, padding: "0 5px" }}>
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
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect fill="currentColor" x="1" y="7" width="3" height="6" rx="0.75"/>
            <rect fill="currentColor" x="5.5" y="3" width="3" height="10" rx="0.75"/>
            <rect fill="currentColor" x="10" y="5" width="3" height="8" rx="0.75"/>
          </svg>
          Workload
        </button>

        {isAdmin && (
          <button id="tour-settings-btn" onClick={onOpenSettings} className="btn-sm">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path fillRule="evenodd" fill="currentColor" d="M7.07 1a1 1 0 00-.97.76l-.28 1.13a5 5 0 00-.9.52l-1.1-.37a1 1 0 00-1.16.46l-.93 1.6a1 1 0 00.22 1.27l.89.72a5.1 5.1 0 000 1.02l-.9.72a1 1 0 00-.21 1.27l.93 1.6a1 1 0 001.16.46l1.1-.37a5 5 0 00.9.52l.28 1.13A1 1 0 007.07 15h1.86a1 1 0 00.97-.76l.28-1.13a5 5 0 00.9-.52l1.1.37a1 1 0 001.16-.46l.93-1.6a1 1 0 00-.22-1.27l-.89-.72a5.1 5.1 0 000-1.02l.9-.72a1 1 0 00.21-1.27l-.93-1.6a1 1 0 00-1.16-.46l-1.1.37a5 5 0 00-.9-.52L9.9 1.76A1 1 0 008.93 1H7.07zm.93 5a2 2 0 100 4 2 2 0 000-4z"/>
            </svg>
            Settings
          </button>
        )}

        <button id="tour-print-btn" onClick={onPrint} aria-label="Print calendar" className="btn-sm">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M4 2h8a1 1 0 011 1v2H3V3a1 1 0 011-1z"/>
            <rect fill="currentColor" x="1" y="5.5" width="14" height="6" rx="1.5"/>
            <rect fill="var(--surface2)" x="2.5" y="6.5" width="3" height="1.5" rx="0.5"/>
            <path fill="currentColor" d="M4 11.5h8V14H4z"/>
          </svg>
        </button>

        <button
          onClick={onStartTour}
          aria-label="Start tour"
          className="btn-sm"
          style={{ borderColor: "var(--accent)", color: "var(--accent-text)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path fill="currentColor" d="M2 2h7l-2 3 2 3H2V2z"/>
            <rect fill="currentColor" x="1" y="1.5" width="1.5" height="11" rx="0.5"/>
          </svg>
          Tour
        </button>
      </div>
    </header>
  )
}
