"use client"
import { useState } from "react"

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
  linkedMemberId: string | null
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleAppointments: () => void
  onToggleConflicts: () => void
  onToggleWorkload: () => void
  onOpenSettings: () => void
  onPrint: () => void
  onStartTour: () => void
  onAddAppointment: () => void
}

export default function CalendarHeader({
  year, month, conflictCount, showAppointments, showWorkload, isAdmin,
  linkedMemberId,
  onPrev, onNext, onToday, onToggleAppointments, onToggleConflicts,
  onToggleWorkload, onOpenSettings, onPrint, onStartTour, onAddAppointment,
}: CalendarHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  function drawerAction(fn: () => void) {
    fn()
    setDrawerOpen(false)
  }

  return (
    <>
      {/* ── Desktop header (hidden below sm) ── */}
      <header
        data-desktop-header
        className="hidden sm:flex items-center gap-2 flex-shrink-0 min-w-0"
        style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "10px 16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 4, flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>$</span>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, fontWeight: 700, letterSpacing: "0.03em" }}>SHIFT.CAL</span>
          <span className="hdr-anim v2-cursor" style={{ fontFamily: "var(--font-geist-mono)", fontSize: 15, color: "var(--accent)", marginLeft: -2 }}>█</span>
        </div>

        <div className="hdr-actions flex items-center gap-2 ml-auto flex-nowrap">
          <div id="tour-month-nav-desktop" className="flex items-center gap-1.5">
            <button aria-label="Previous month" onClick={onPrev} className="nav-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon fill="currentColor" points="10,3 5,8 10,13 11.4,11.6 7.8,8 11.4,4.4"/>
              </svg>
            </button>
            <span className="font-semibold text-sm hdr-month" style={{ textAlign: "center" }}>
              <span className="hidden sm:inline">{MONTH_NAMES[month]}</span>
              <span className="sm:hidden">{MONTH_NAMES[month].slice(0, 3)}</span>
              {" "}{year}
            </span>
            <button aria-label="Next month" onClick={onNext} className="nav-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon fill="currentColor" points="6,3 11,8 6,13 4.6,11.6 8.2,8 4.6,4.4"/>
              </svg>
            </button>
          </div>

          <button id="tour-today-btn" onClick={onToday} className="btn-sm" aria-label="Go to today">
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
            <span className="hdr-label">Today</span>
          </button>

          <button
            id="tour-appt-btn"
            onClick={onToggleAppointments}
            aria-label={showAppointments ? "Switch to shifts view" : "Switch to appointments view"}
            className="btn-sm"
            style={showAppointments ? { borderColor: "var(--warn)", color: "var(--warn)", background: "var(--surface-warn-tint)" } : undefined}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path fillRule="evenodd" fill="currentColor" d="M8 3C4.5 3 1 7.5 1 8s3.5 5 7 5 7-4.5 7-5-3.5-5-7-5zm0 8a3 3 0 110-6 3 3 0 010 6z"/>
              <circle fill="var(--surface2)" cx="8" cy="8" r="1.4"/>
            </svg>
            <span className="hdr-label">{showAppointments ? "← Shifts" : "Appointments"}</span>
          </button>

          <button id="tour-conflicts-btn" onClick={onToggleConflicts} className="btn-sm" aria-label="Toggle conflicts panel">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path fillRule="evenodd" fill="currentColor" d="M8 1L15.5 14.5H.5L8 1zm-.75 5.5h1.5V11H7.25zm0 5h1.5V13H7.25z"/>
            </svg>
            <span className="hdr-label">Conflicts</span>
            {conflictCount > 0 && (
              <span className="inline-flex items-center justify-center"
                style={{ background: "var(--danger)", borderRadius: 10, fontSize: 11, minWidth: 18, height: 18, padding: "0 5px", color: "var(--bg)" }}>
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
            <span className="hdr-label">Workload</span>
          </button>

          {isAdmin && (
            <button id="tour-settings-btn" onClick={onOpenSettings} className="btn-sm" aria-label="Open settings">
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path fillRule="evenodd" fill="currentColor" d="M7.07 1a1 1 0 00-.97.76l-.28 1.13a5 5 0 00-.9.52l-1.1-.37a1 1 0 00-1.16.46l-.93 1.6a1 1 0 00.22 1.27l.89.72a5.1 5.1 0 000 1.02l-.9.72a1 1 0 00-.21 1.27l.93 1.6a1 1 0 001.16.46l1.1-.37a5 5 0 00.9.52l.28 1.13A1 1 0 007.07 15h1.86a1 1 0 00.97-.76l.28-1.13a5 5 0 00.9-.52l1.1.37a1 1 0 001.16-.46l.93-1.6a1 1 0 00-.22-1.27l-.89-.72a5.1 5.1 0 000-1.02l.9-.72a1 1 0 00.21-1.27l-.93-1.6a1 1 0 00-1.16-.46l-1.1.37a5 5 0 00-.9-.52L9.9 1.76A1 1 0 008.93 1H7.07zm.93 5a2 2 0 100 4 2 2 0 000-4z"/>
              </svg>
              <span className="hdr-label">Settings</span>
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
            <span className="hdr-label">Tour</span>
          </button>
        </div>
      </header>

      {/* ── Mobile slim bar (hidden at sm+) ── */}
      <header
        data-mobile-header
        className="sm:hidden flex items-center justify-between flex-shrink-0"
        style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)", padding: "8px 12px", gap: 8 }}
      >
        <button
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="nav-btn"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect fill="currentColor" x="2" y="4" width="12" height="1.5" rx="0.75"/>
            <rect fill="currentColor" x="2" y="7.25" width="12" height="1.5" rx="0.75"/>
            <rect fill="currentColor" x="2" y="10.5" width="12" height="1.5" rx="0.75"/>
          </svg>
        </button>

        <div id="tour-month-nav" className="flex items-center gap-1.5">
          <button aria-label="Previous month" onClick={onPrev} className="nav-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon fill="currentColor" points="10,3 5,8 10,13 11.4,11.6 7.8,8 11.4,4.4"/>
            </svg>
          </button>
          <span className="font-semibold text-sm" style={{ minWidth: 80, textAlign: "center" }}>
            {MONTH_NAMES[month].slice(0, 3)} {year}
          </span>
          <button aria-label="Next month" onClick={onNext} className="nav-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon fill="currentColor" points="6,3 11,8 6,13 4.6,11.6 8.2,8 4.6,4.4"/>
            </svg>
          </button>
        </div>

        {linkedMemberId ? (
          <button
            onClick={onAddAppointment}
            style={{
              height: 36, borderRadius: 18,
              background: "var(--accent)", color: "var(--bg)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "0 12px",
              fontWeight: 600, fontSize: 13, whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Add appointment
          </button>
        ) : (
          <div />
        )}
      </header>

      {/* ── Hamburger drawer ── */}
      {drawerOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 59, background: "var(--overlay-bg)" }}
          />
          <div
            role="dialog"
            aria-label="Menu"
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60,
              background: "var(--surface)",
              borderRadius: "12px 12px 0 0",
              borderTop: "1px solid var(--border)",
              padding: "12px 0 32px",
            }}
          >
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 8px" }} />
            {[
              { label: "Today", action: onToday, ariaLabel: "Go to today" },
              {
                label: showAppointments ? "← Shifts" : "Appointments",
                action: onToggleAppointments,
                ariaLabel: showAppointments ? "Switch to shifts view" : "Switch to appointments view",
              },
              { label: `Conflicts${conflictCount > 0 ? ` (${conflictCount})` : ""}`, action: onToggleConflicts, ariaLabel: "Toggle conflicts panel" },
              { label: showWorkload ? "Hide Workload" : "Workload", action: onToggleWorkload, ariaLabel: "Toggle workload panel" },
              ...(isAdmin ? [{ label: "Settings", action: onOpenSettings, ariaLabel: "Open settings" }] : []),
              { label: "Print", action: onPrint, ariaLabel: "Print calendar" },
              { label: "Tour", action: onStartTour, ariaLabel: "Start tour" },
            ].map(({ label, action, ariaLabel }) => (
              <button
                key={ariaLabel}
                aria-label={ariaLabel}
                onClick={() => drawerAction(action)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 20px", fontSize: 15,
                  background: "none", border: "none", color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
