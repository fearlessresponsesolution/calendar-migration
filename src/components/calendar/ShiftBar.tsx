import type { ShiftWithMembers } from "@/types"

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
  const bgColor = hasMembers ? shift.members[0].color + "cc" : undefined

  const barStyle: React.CSSProperties = hasMembers
    ? { background: bgColor, borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11, color: "#fff", cursor: "default" }
    : { borderRadius: 3, padding: "3px 5px", marginBottom: 2, fontSize: 11, background: "transparent", border: "1px dashed var(--warn)", color: "var(--warn)", cursor: "default" }

  return (
    <div style={barStyle}>
      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </div>
      {hasMembers ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {shift.members.map((m) => (
            <button
              key={m.id}
              title={m.name}
              style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, whiteSpace: "nowrap", cursor: "pointer", borderRadius: 3, padding: "0 2px", background: "none", border: "none", color: "inherit" }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseOut={e => (e.currentTarget.style.background = "none")}
              onClick={(e) => { e.stopPropagation(); onMemberClick?.(m.id) }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                {m.name.split(" ")[0]}
              </span>
              {m.role && (
                <span style={{ borderRadius: 3, padding: "0 2px", fontSize: 9, fontWeight: 600, background: m.role.color + "33", color: m.role.color }}>
                  {m.role.name.slice(0, 6)}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10 }}>Unassigned</div>
      )}
    </div>
  )
}
