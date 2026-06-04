"use client"
import { useState } from "react"
import type { ShiftWithMembers, Conflict } from "@/types"
import DayCell from "./DayCell"
import DayCellContextMenu from "./DayCellContextMenu"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarGridProps {
  year: number
  month: number
  today: Date
  shifts: ShiftWithMembers[]
  conflicts: Conflict[]
  showAppointments: boolean
  onSelectDate: (date: string) => void
  onMutate: () => void
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export default function CalendarGrid({
  year, month, today, shifts, conflicts, showAppointments, onSelectDate, onMutate,
}: CalendarGridProps) {
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const conflictDates = new Set(conflicts.map((c) => c.date))

  const shiftsByDate = new Map<string, ShiftWithMembers[]>()
  for (const shift of shifts) {
    if (!shiftsByDate.has(shift.date)) shiftsByDate.set(shift.date, [])
    shiftsByDate.get(shift.date)!.push(shift)
  }

  async function copyShifts(fromDate: string, offsetDays: number) {
    const [y, m, d] = fromDate.split("-").map(Number)
    const toDate = new Date(Date.UTC(y, m - 1, d + offsetDays))
    const toDateStr = toDate.toISOString().split("T")[0]
    const dayShifts = shiftsByDate.get(fromDate) ?? []

    await Promise.all(
      dayShifts.map((shift) =>
        fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: toDateStr,
            template_id: shift.template_id,
            start_time: shift.start_time,
            end_time: shift.end_time,
            is_ad_hoc: shift.is_ad_hoc,
            member_ids: shift.members.map((m) => m.id),
          }),
        })
      )
    )
    onMutate()
  }

  const cells: React.ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <DayCell
        key={`out-${i}`}
        date="" dayNumber={0} isToday={false} isOutside
        shifts={[]} hasConflict={false} showAppointments={false}
        onClick={() => {}}
      />
    )
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = isoDate(year, month, d)
    cells.push(
      <DayCell
        key={dateStr}
        date={dateStr}
        dayNumber={d}
        isToday={dateStr === todayStr}
        isOutside={false}
        shifts={shiftsByDate.get(dateStr) ?? []}
        hasConflict={conflictDates.has(dateStr)}
        showAppointments={showAppointments}
        onMemberClick={setViewingMemberId}
        onClick={() => onSelectDate(dateStr)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY, date: dateStr })
        }}
      />
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-gray-500 py-1 border-b border-gray-800">
            {d}
          </div>
        ))}
        {cells}
      </div>

      {contextMenu && (
        <DayCellContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          date={contextMenu.date}
          hasShifts={(shiftsByDate.get(contextMenu.date)?.length ?? 0) > 0}
          onClose={() => setContextMenu(null)}
          onCopyToNextDay={() => copyShifts(contextMenu.date, 1)}
          onCopyToNextWeek={() => copyShifts(contextMenu.date, 7)}
        />
      )}
    </div>
  )
}
