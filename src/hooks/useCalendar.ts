"use client"
import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
import type { ShiftWithMembers, MemberWithRole, DbRole, DbShiftTemplate, Conflict } from "@/types"
import { detectConflicts } from "@/lib/conflicts"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAppointments, setShowAppointments] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const pad = (n: number) => String(n).padStart(2, "0")
  const startDate = `${year}-${pad(month + 1)}-01`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`

  const { data: shifts = [], mutate: mutateShifts } = useSWR<ShiftWithMembers[]>(
    `/api/shifts?start=${startDate}&end=${endDate}`,
    fetcher
  )
  const { data: members = [], mutate: mutateMembers } = useSWR<MemberWithRole[]>(
    "/api/members",
    fetcher
  )
  const { data: roles = [], mutate: mutateRoles } = useSWR<DbRole[]>(
    "/api/roles",
    fetcher
  )
  const { data: templates = [], mutate: mutateTemplates } = useSWR<DbShiftTemplate[]>(
    "/api/shift-templates",
    fetcher
  )

  const conflicts: Conflict[] = detectConflicts(shifts)

  const prevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) { setYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const nextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) { setYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevMonth()
      if (e.key === "ArrowRight") nextMonth()
      if (e.key === "Escape") {
        setSelectedDate(null)
        setShowConflicts(false)
        setShowSettings(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prevMonth, nextMonth])

  return {
    year, month,
    today,
    shifts, mutateShifts,
    members, mutateMembers,
    roles, mutateRoles,
    templates, mutateTemplates,
    conflicts,
    selectedDate, setSelectedDate,
    showAppointments, setShowAppointments,
    showConflicts, setShowConflicts,
    showSettings, setShowSettings,
    prevMonth, nextMonth, goToToday,
  }
}
