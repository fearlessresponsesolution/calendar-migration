import { useRef, useEffect } from "react"
import type { ShiftWithMembers, MemberWithRole } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"]

interface WorkloadPanelProps {
  shifts: ShiftWithMembers[]
  members: MemberWithRole[]
  year: number
  month: number
  onClose: () => void
}

function shiftHours(shift: ShiftWithMembers): number {
  const [sh, sm] = shift.start_time.split(":").map(Number)
  const [eh, em] = shift.end_time.split(":").map(Number)
  const startMins = sh * 60 + sm
  let endMins = eh * 60 + em
  if (endMins <= startMins) endMins += 1440 // midnight-spanning
  return (endMins - startMins) / 60
}

export default function WorkloadPanel({ shifts, members, year, month, onClose }: WorkloadPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!window.matchMedia?.("(max-width: 639px)").matches) return
    closeRef.current?.focus()
    const panel = panelRef.current
    if (!panel) return
    function trapFocus(e: KeyboardEvent) {
      if (e.key !== "Tab") return
      const focusable = Array.from(
        panel!.querySelectorAll<HTMLElement>("button, input, select, [tabindex]:not([tabindex='-1'])")
      ).filter((el) => !(el as HTMLButtonElement).disabled)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", trapFocus)
    return () => document.removeEventListener("keydown", trapFocus)
  }, [])

  const stats = members
    .map((m) => {
      const memberShifts = shifts.filter(
        (s) => s.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) &&
          s.members.some((sm) => sm.id === m.id)
      )
      const totalHours = memberShifts.reduce((sum, s) => sum + shiftHours(s), 0)
      return { member: m, shiftCount: memberShifts.length, totalHours }
    })
    .sort((a, b) => b.totalHours - a.totalHours)

  const maxHours = stats.reduce((mx, s) => Math.max(mx, s.totalHours), 0) || 1

  return (
    <>
    <div
      className="fixed inset-0 lg:hidden"
      style={{ zIndex: 39, background: "rgba(0,0,0,0.5)" }}
      aria-hidden="true"
      onClick={onClose}
    />
    <aside data-panel="workload"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Workload"
      className="flex flex-col overflow-hidden flex-shrink-0 fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto lg:w-72"
      style={{ background: "var(--surface2)", borderLeft: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <strong style={{ fontSize: 13 }}>Workload · {MONTH_NAMES[month]} {year}</strong>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close workload panel"
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
        >×</button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "0 12px" }}>
        {stats.length === 0 && (
          <p style={{ textAlign: "center", padding: "32px 12px", color: "var(--text-muted)", fontSize: 13 }}>
            No members yet. Add members in ⚙ Settings.
          </p>
        )}
        {stats.map(({ member, shiftCount, totalHours }, idx) => (
          <div key={member.id}
            style={{ padding: "8px 0", borderBottom: idx < stats.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex items-center gap-1.5" style={{ fontSize: 13, marginBottom: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: member.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "var(--text)" }}>{member.name}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", paddingLeft: 14, marginBottom: 4 }}>
              {shiftCount} shift{shiftCount !== 1 ? "s" : ""} · {totalHours.toFixed(1)}h
              {member.role ? ` · ${member.role.name}` : ""}
            </div>
            <div style={{ paddingLeft: 14 }}>
              <div style={{ background: "var(--border)", borderRadius: 3, height: 5, width: "100%", overflow: "hidden" }}>
                <div
                  className="workload-bar"
                  style={{
                    height: 5, borderRadius: 3, background: member.color,
                    width: "100%",
                    transform: `scaleX(${totalHours / maxHours})`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
    </>
  )
}
