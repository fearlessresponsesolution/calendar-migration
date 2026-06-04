"use client"
import { useCalendar } from "@/hooks/useCalendar"

interface CalendarClientProps {
  linkedMemberId: string | null
  isAdmin: boolean
}

export default function CalendarClient({ linkedMemberId, isAdmin }: CalendarClientProps) {
  const cal = useCalendar()

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header placeholder — replaced in Task 7 */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="font-bold text-lg">
          {["January","February","March","April","May","June","July","August","September","October","November","December"][cal.month]} {cal.year}
        </span>
        <button onClick={cal.prevMonth} className="px-2 py-1 rounded hover:bg-gray-700">‹</button>
        <button onClick={cal.nextMonth} className="px-2 py-1 rounded hover:bg-gray-700">›</button>
        <button onClick={cal.goToToday} className="px-2 py-1 rounded hover:bg-gray-700 text-sm">Today</button>
        <span className="ml-auto text-sm text-gray-400">
          {cal.conflicts.length} conflict{cal.conflicts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Calendar grid placeholder — replaced in Task 8 */}
      <div className="flex-1 p-4 text-gray-500 text-sm">
        Calendar grid coming in Task 8. Showing {cal.shifts.length} shifts, {cal.members.length} members.
      </div>
    </div>
  )
}
