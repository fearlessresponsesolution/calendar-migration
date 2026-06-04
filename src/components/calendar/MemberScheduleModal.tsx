import type { ShiftWithMembers, MemberWithRole } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatTime(t: string) {
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${m !== "00" ? `:${m}` : ""}${hour >= 12 ? "pm" : "am"}`
}

interface MemberScheduleModalProps {
  member: MemberWithRole
  shifts: ShiftWithMembers[]
  year: number
  month: number
  onClose: () => void
}

export default function MemberScheduleModal({
  member, shifts, year, month, onClose,
}: MemberScheduleModalProps) {
  const memberShifts = shifts
    .filter((s) => s.members.some((m) => m.id === member.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <h2 className="font-semibold">{member.name}</h2>
            <span className="text-gray-500 text-sm">
              {MONTH_NAMES[month]} {year}
            </span>
          </div>
          <button
            aria-label="Close member schedule"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {memberShifts.length === 0 && (
            <p className="text-gray-500 text-sm">No shifts this month.</p>
          )}
          {memberShifts.map((shift) => {
            const [, m, d] = shift.date.split("-").map(Number)
            return (
              <div key={shift.id} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-16 flex-shrink-0">
                  {MONTH_NAMES[m - 1].slice(0, 3)} {d}
                </span>
                <span className="text-gray-200">
                  {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                </span>
                {shift.template && (
                  <span className="text-gray-500 text-xs">{shift.template.name}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
          {memberShifts.length} shift{memberShifts.length !== 1 ? "s" : ""} this month
        </div>
      </div>
    </div>
  )
}
