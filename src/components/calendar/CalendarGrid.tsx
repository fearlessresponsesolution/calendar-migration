"use client"
import { useState } from "react"
import type { ShiftWithMembers, Conflict, Appointment, MemberWithRole, ApptEntry } from "@/types"
import { rangesOverlap } from "@/lib/conflicts"
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
  appointments: Appointment[]
  linkedMemberId: string | null
  members: MemberWithRole[]
  onSelectDate: (date: string) => void
  onMutate: () => void
  onMemberClick?: (memberId: string) => void
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function buildApptEntries(
  appointments: Appointment[],
  members: MemberWithRole[],
  dayShifts: ShiftWithMembers[],
  date: string,
): ApptEntry[] {
  return appointments
    .filter((a) => a.date === date)
    .flatMap((a) => {
      const member = members.find((m) => m.id === a.member_id)
      if (!member) return []
      const hasConflict = a.all_day
        ? dayShifts.some((s) => s.members.some((m) => m.id === a.member_id))
        : dayShifts.some(
            (s) =>
              s.members.some((m) => m.id === a.member_id) &&
              a.start_time != null &&
              a.end_time != null &&
              rangesOverlap(s.start_time, s.end_time, a.start_time, a.end_time)
          )
      return [{
        apptId: a.id,
        memberId: a.member_id,
        memberName: member.name,
        memberColor: member.color,
        note: a.note,
        allDay: a.all_day,
        startTime: a.start_time,
        endTime: a.end_time,
        hasConflict,
      }]
    })
}

export default function CalendarGrid({
  year, month, today, shifts, conflicts, showAppointments,
  appointments, linkedMemberId, members, onSelectDate, onMutate, onMemberClick,
}: CalendarGridProps) {
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
            date: toDateStr, template_id: shift.template_id,
            start_time: shift.start_time, end_time: shift.end_time,
            is_ad_hoc: shift.is_ad_hoc, member_ids: shift.members.map((m) => m.id),
          }),
        })
      )
    )
    onMutate()
  }

  async function fillMonthWithWeek(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number)
    const anchor = new Date(Date.UTC(y, m - 1, d))
    const weekStart = new Date(anchor)
    weekStart.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay())

    const template: ShiftWithMembers[][] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setUTCDate(weekStart.getUTCDate() + i)
      template.push(shiftsByDate.get(day.toISOString().split("T")[0]) ?? [])
    }

    if (template.every((s) => s.length === 0)) return

    const posts: Promise<Response>[] = []
    for (let week = 1; week <= 4; week++) {
      for (let i = 0; i < 7; i++) {
        if (template[i].length === 0) continue
        const target = new Date(weekStart)
        target.setUTCDate(weekStart.getUTCDate() + week * 7 + i)
        if (target.getUTCFullYear() !== year || target.getUTCMonth() !== month) continue
        const targetStr = target.toISOString().split("T")[0]
        if ((shiftsByDate.get(targetStr)?.length ?? 0) > 0) continue
        for (const shift of template[i]) {
          posts.push(
            fetch("/api/shifts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: targetStr, template_id: shift.template_id,
                start_time: shift.start_time, end_time: shift.end_time,
                is_ad_hoc: shift.is_ad_hoc, member_ids: shift.members.map((m) => m.id),
              }),
            })
          )
        }
      }
    }
    await Promise.all(posts)
    onMutate()
  }

  const cells: React.ReactNode[] = []

  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <DayCell key={`out-${i}`} date="" dayNumber={0} isToday={false} isOutside
        shifts={[]} hasConflict={false} showAppointments={false} apptEntries={[]}
        onClick={() => {}} />
    )
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = isoDate(year, month, d)
    const dayShifts = shiftsByDate.get(dateStr) ?? []
    const apptEntries = showAppointments
      ? buildApptEntries(appointments, members, dayShifts, dateStr)
      : []

    cells.push(
      <DayCell
        key={dateStr}
        date={dateStr}
        dayNumber={d}
        isToday={dateStr === todayStr}
        isOutside={false}
        shifts={dayShifts}
        hasConflict={conflictDates.has(dateStr)}
        showAppointments={showAppointments}
        apptEntries={apptEntries}
        onMemberClick={onMemberClick}
        onClick={() => onSelectDate(dateStr)}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY, date: dateStr })
        }}
      />
    )
  }

  return (
    <div id="tour-days-grid" data-calendar-grid className="flex-1 overflow-auto" style={{ padding: 8 }}>
      <div className="grid grid-cols-7" style={{ gap: 4 }}>
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-1"
            style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
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
          onFillMonth={() => fillMonthWithWeek(contextMenu.date)}
        />
      )}
    </div>
  )
}
