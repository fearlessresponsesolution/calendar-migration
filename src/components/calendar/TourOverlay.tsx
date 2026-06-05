"use client"
import { useState, useEffect, useRef, useCallback } from "react"

interface TourStep {
  title: string
  text: string
  targetId: string | null
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Shift Calendar!",
    text: "This quick tour walks you through the key features. Click Next to continue, or press Escape to exit at any time.",
    targetId: null,
  },
  {
    title: "⚙ Settings — Start Here",
    text: "Before building a schedule, open Settings to create Roles (e.g. Nurse, Technician), add Members with auto-assigned colors, and define reusable Shift Templates like Morning (6am–2pm).",
    targetId: "tour-settings-btn",
  },
  {
    title: "Navigate Months",
    text: "Use the ‹ › arrows or keyboard ← → keys to move between months. Click Today to jump to the current month. All changes sync to the server automatically.",
    targetId: "tour-month-nav",
  },
  {
    title: "Add Shifts to a Day",
    text: "Click any day cell to open the Day Editor. Pick a shift template (which pre-fills the times) or set custom times, then check off which members to assign. Members on an overlapping shift that day are marked busy.",
    targetId: "tour-days-grid",
  },
  {
    title: "Copy Shifts Quickly",
    text: "Right-click any day cell to copy all its shifts forward: to the next day, next week, or fill the entire month with this week's repeating pattern.",
    targetId: "tour-days-grid",
  },
  {
    title: "👁 Appointment Overlay",
    text: "Click Appointments to switch the calendar into appointment mode. Click any day to record member unavailability — doctor appointments, PTO, training. Admins see all members; members see their own.",
    targetId: "tour-appt-btn",
  },
  {
    title: "⚠ Conflicts Dashboard",
    text: "When a member's appointment overlaps a shift, the badge shows the conflict count. Open Conflicts to see every issue and use the swap dropdown to reassign a free same-role replacement.",
    targetId: "tour-conflicts-btn",
  },
  {
    title: "Member Schedule View",
    text: "Click any member's name chip inside a shift bar to open their monthly schedule — a read-only list of every shift they're assigned to this month.",
    targetId: "tour-days-grid",
  },
  {
    title: "Coverage Summary",
    text: "The footer tracks how many days each shift template is covered this month. Green means fully covered; amber means some days have no one assigned to that shift.",
    targetId: "tour-coverage-footer",
  },
  {
    title: "🖨 Print the Calendar",
    text: "Click the print button for a full-screen landscape printout with shift bar colors preserved and all controls hidden — ready to post on a notice board.",
    targetId: "tour-print-btn",
  },
  {
    title: "You're all set!",
    text: "Your schedule saves to the server automatically — sign in from any device to access it. Click ? Tour any time to revisit this walkthrough.",
    targetId: null,
  },
]

interface SpotlightRect {
  top: number; left: number; width: number; height: number
}

interface TourOverlayProps {
  active: boolean
  onEnd: () => void
}

export default function TourOverlay({ active, onEnd }: TourOverlayProps) {
  const [step, setStep] = useState(0)
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const positionCard = useCallback((targetRect: DOMRect | null) => {
    const cardW = 300, cardH = 230, margin = 14
    const vw = window.innerWidth, vh = window.innerHeight
    let top: number, left: number
    if (!targetRect) {
      top = (vh - cardH) / 2
      left = (vw - cardW) / 2
    } else {
      top = targetRect.bottom + margin
      left = targetRect.left + (targetRect.width - cardW) / 2
      if (top + cardH > vh - margin) top = targetRect.top - cardH - margin
      top = Math.max(margin, Math.min(top, vh - cardH - margin))
      left = Math.max(margin, Math.min(left, vw - cardW - margin))
    }
    setCardPos({ top, left })
  }, [])

  useEffect(() => {
    if (!active) { setStep(0); return }
    const targetId = STEPS[step].targetId
    const target = targetId ? document.getElementById(targetId) : null
    if (target) {
      const r = target.getBoundingClientRect()
      const pad = 6
      setSpotlight({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
      positionCard(r)
    } else {
      setSpotlight(null)
      positionCard(null)
    }
  }, [active, step, positionCard])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && active) onEnd()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, onEnd])

  if (!active) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div data-tour>
      {spotlight ? (
        <div style={{
          position: "fixed", zIndex: 10001, borderRadius: 8, pointerEvents: "none",
          top: spotlight.top, left: spotlight.left, width: spotlight.width, height: spotlight.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          transition: "top 0.2s, left 0.2s, width 0.2s, height 0.2s",
        }} />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 10001, pointerEvents: "none" }} />
      )}

      <div
        ref={cardRef}
        style={{
          position: "fixed", zIndex: 10002, width: 300,
          top: cardPos.top, left: cardPos.left,
          background: "var(--surface2)", border: "1px solid var(--accent)",
          borderRadius: 10, padding: "18px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: i === step ? "var(--accent)" : "var(--border)",
              transition: "background 0.2s",
            }} />
          ))}
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.55, marginBottom: 14 }}>
          {current.text}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: "auto" }}>
            {step + 1} / {STEPS.length}
          </span>
          {step > 0 && (
            <button className="btn-sm" onClick={() => setStep((s) => s - 1)}
              aria-label="Back">← Back</button>
          )}
          <button
            className="btn-sm"
            style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}
            onClick={() => { if (isLast) onEnd(); else setStep((s) => s + 1) }}
            aria-label={isLast ? "Done" : "Next"}
          >
            {isLast ? "Done" : "Next →"}
          </button>
          {!isLast && (
            <button className="btn-sm" style={{ color: "var(--text-muted)" }} onClick={onEnd}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
