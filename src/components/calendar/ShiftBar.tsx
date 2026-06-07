import type { ShiftWithMembers } from "@/types"

function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return L > 0.2 ? "#0b0b0b" : "#ffffff"
}

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "pm" : "am"
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${ampm}`
}

interface ShiftBarProps {
  shift: ShiftWithMembers
  onMemberClick?: (memberId: string) => void
}

export default function ShiftBar({ shift, onMemberClick }: ShiftBarProps) {
  const hasMembers = shift.members.length > 0
  const textColor = "#0b0b0b"

  const barStyle: React.CSSProperties = hasMembers
    ? { background: "rgba(118,185,0,0.75)", borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11, color: textColor, cursor: "default" }
    : { borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11, background: "transparent", border: "1px dashed var(--accent)", color: "var(--accent)", cursor: "default" }

  return (
    <div style={barStyle}>
      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </div>
      {hasMembers ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {shift.members.map((m) => (
            <span
              key={m.id}
              role="button"
              tabIndex={0}
              title={m.name}
              style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, whiteSpace: "nowrap", cursor: "pointer", borderRadius: 3, padding: "0 2px", background: "none", border: "none", color: "inherit" }}
              onMouseOver={e => (e.currentTarget.style.background = textColor === "#0b0b0b" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)")}
              onMouseOut={e => (e.currentTarget.style.background = "none")}
              onClick={(e) => { e.stopPropagation(); onMemberClick?.(m.id) }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onMemberClick?.(m.id) } }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.name.split(" ")[0]}
              </span>
              {m.role && (
                <span style={{ borderRadius: 3, padding: "0 2px", fontSize: 9, fontWeight: 600, background: m.role.color, color: getContrastTextColor(m.role.color) }}>
                  {m.role.name.slice(0, 6)}
                </span>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10 }}>Unassigned</div>
      )}
    </div>
  )
}
