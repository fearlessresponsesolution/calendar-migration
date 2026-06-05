"use client"
import { useState } from "react"
import { useCalendar } from "@/hooks/useCalendar"
import CalendarHeader from "@/components/calendar/CalendarHeader"
import CalendarGrid from "@/components/calendar/CalendarGrid"
import CoverageFooter from "@/components/calendar/CoverageFooter"
import ConflictsPanel from "@/components/calendar/ConflictsPanel"
import WorkloadPanel from "@/components/calendar/WorkloadPanel"
import DayEditorModal from "@/components/calendar/DayEditorModal"
import SettingsModal from "@/components/settings/SettingsModal"
import MemberScheduleModal from "@/components/calendar/MemberScheduleModal"
import ReconnectingBanner from "@/components/ui/ReconnectingBanner"
import AppointmentModeBanner from "@/components/ui/AppointmentModeBanner"
import TourOverlay from "@/components/calendar/TourOverlay"

interface CalendarClientProps {
  linkedMemberId: string | null
  isAdmin: boolean
}

export default function CalendarClient({ linkedMemberId, isAdmin }: CalendarClientProps) {
  const cal = useCalendar()
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)

  const shiftsForSelectedDate = cal.selectedDate
    ? cal.shifts.filter((s) => s.date === cal.selectedDate)
    : []

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <CalendarHeader
        year={cal.year}
        month={cal.month}
        conflictCount={cal.conflicts.length}
        showAppointments={cal.showAppointments}
        showWorkload={cal.showWorkload}
        isAdmin={isAdmin}
        onPrev={cal.prevMonth}
        onNext={cal.nextMonth}
        onToday={cal.goToToday}
        onToggleAppointments={() => cal.setShowAppointments((v) => !v)}
        onToggleConflicts={() => cal.setShowConflicts((v) => !v)}
        onToggleWorkload={() => cal.setShowWorkload((v) => !v)}
        onOpenSettings={() => cal.setShowSettings(true)}
        onPrint={() => window.print()}
        onStartTour={() => cal.setShowTour(true)}
      />
      {cal.showAppointments && <AppointmentModeBanner />}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CalendarGrid
            year={cal.year}
            month={cal.month}
            today={cal.today}
            shifts={cal.shifts}
            conflicts={cal.conflicts}
            showAppointments={cal.showAppointments}
            appointments={isAdmin ? cal.appointments : cal.appointments.filter((a) => a.member_id === linkedMemberId)}
            linkedMemberId={linkedMemberId}
            members={cal.members}
            onSelectDate={cal.setSelectedDate}
            onMutate={cal.mutateShifts}
            onMemberClick={setViewingMemberId}
          />
          <CoverageFooter
            shifts={cal.shifts}
            templates={cal.templates}
            year={cal.year}
            month={cal.month}
          />
        </div>

        {cal.showConflicts && (
          <ConflictsPanel
            conflicts={cal.conflicts}
            allShifts={cal.shifts}
            allMembers={cal.members}
            onClose={() => cal.setShowConflicts(false)}
            onMutate={cal.mutateShifts}
            isAdmin={isAdmin}
          />
        )}
        {cal.showWorkload && (
          <WorkloadPanel
            shifts={cal.shifts}
            members={cal.members}
            year={cal.year}
            month={cal.month}
            onClose={() => cal.setShowWorkload(false)}
          />
        )}
      </div>

      {cal.selectedDate && (
        <DayEditorModal
          date={cal.selectedDate}
          shifts={shiftsForSelectedDate}
          members={cal.members}
          templates={cal.templates}
          appointments={cal.appointments.filter((a) => a.date === cal.selectedDate)}
          linkedMemberId={linkedMemberId}
          isAdmin={isAdmin}
          showAppointments={cal.showAppointments}
          onClose={() => cal.setSelectedDate(null)}
          onMutate={cal.mutateShifts}
          onMutateAppointments={cal.mutateAppointments}
        />
      )}

      {cal.showSettings && (
        <SettingsModal
          roles={cal.roles}
          members={cal.members}
          templates={cal.templates}
          isAdmin={isAdmin}
          onClose={() => cal.setShowSettings(false)}
          onMutateRoles={cal.mutateRoles}
          onMutateMembers={cal.mutateMembers}
          onMutateTemplates={cal.mutateTemplates}
        />
      )}

      {viewingMemberId && (
        <MemberScheduleModal
          member={cal.members.find((m) => m.id === viewingMemberId)!}
          shifts={cal.shifts}
          year={cal.year}
          month={cal.month}
          onClose={() => setViewingMemberId(null)}
        />
      )}

      <ReconnectingBanner visible={!cal.connected} />
      <TourOverlay active={cal.showTour} onEnd={() => cal.setShowTour(false)} />
    </div>
  )
}
