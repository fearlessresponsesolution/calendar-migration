import type { Conflict, ShiftWithMembers, MemberWithRole } from "@/types"
import { getAvailableSwaps } from "@/lib/swaps"

interface ConflictsPanelProps {
  conflicts: Conflict[]
  allShifts: ShiftWithMembers[]
  allMembers: MemberWithRole[]
  onClose: () => void
}

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

export default function ConflictsPanel({ conflicts, allShifts, allMembers, onClose }: ConflictsPanelProps) {
  return (
    <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <h2 className="font-semibold text-sm">
          Conflicts{" "}
          <span className="text-red-400 font-bold">{conflicts.length}</span>
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
          aria-label="Close conflicts panel"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conflicts.length === 0 && (
          <p className="text-gray-500 text-sm">No conflicts this month.</p>
        )}
        {conflicts.map((c, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: c.memberColor }}
              />
              <span className="font-medium">{c.memberName}</span>
              <span className="text-gray-500 text-xs">{c.date}</span>
            </div>
            <ul className="space-y-0.5 pl-4">
              {c.shifts.map((s) => {
                const swaps = getAvailableSwaps(allShifts, allMembers, s.id, c.memberId)
                return (
                  <li key={s.id} className="text-gray-400 text-xs">
                    {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    {s.template && (
                      <span className="text-gray-600 ml-1">({s.template.name})</span>
                    )}
                    {swaps.length > 0 && (
                      <div className="text-gray-500 mt-0.5">
                        Swap with:{" "}
                        {swaps.map((m) => (
                          <span key={m.id} className="inline-flex items-center gap-0.5 mr-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: m.color }}
                            />
                            {m.name.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
