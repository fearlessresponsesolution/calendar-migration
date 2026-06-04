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

  return (
    <div
      className={`text-xs rounded px-1 py-0.5 mb-0.5 ${
        hasMembers ? "bg-blue-900/60" : "bg-gray-700/60 italic opacity-60"
      }`}
    >
      <div className="text-gray-400 text-[10px]">
        {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
      </div>
      {hasMembers ? (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {shift.members.map((m) => (
            <button
              key={m.id}
              className="flex items-center gap-0.5 hover:text-blue-300 transition-colors text-left"
              onClick={(e) => { e.stopPropagation(); onMemberClick?.(m.id) }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span className="truncate max-w-[60px]">{m.name.split(" ")[0]}</span>
              {m.role && (
                <span
                  className="rounded px-0.5 text-[9px] font-medium"
                  style={{ backgroundColor: m.role.color + "33", color: m.role.color }}
                >
                  {m.role.name.slice(0, 6)}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">Unassigned</div>
      )}
    </div>
  )
}
