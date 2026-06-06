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
import ImpersonationBanner from "@/components/ui/ImpersonationBanner"
import TourOverlay from "@/components/calendar/TourOverlay"

interface CalendarClientProps {
  linkedMemberId: string | null
  isAdmin: boolean
}

export default function CalendarClient({ linkedMemberId, isAdmin }: CalendarClientProps) {
  const cal = useCalendar()
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null)
  const [viewAsMemberId, setViewAsMemberId] = useState<string | null>(null)

  const viewAsMember = viewAsMemberId
    ? (cal.members.find((m) => m.id === viewAsMemberId) ?? null)
    : null

  const effectiveIsAdmin = isAdmin && viewAsMemberId === null
  const effectiveLinkedMemberId = viewAsMemberId ?? linkedMemberId

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
        isAdmin={effectiveIsAdmin}
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
      {viewAsMember && (
        <ImpersonationBanner
          member={viewAsMember}
          onExit={() => setViewAsMemberId(null)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CalendarGrid
            year={cal.year}
            month={cal.month}
            today={cal.today}
            shifts={cal.shifts}
            conflicts={cal.conflicts}
            showAppointments={cal.showAppointments}
            appointments={effectiveIsAdmin ? cal.appointments : cal.appointments.filter((a) => a.member_id === effectiveLinkedMemberId)}
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
            isAdmin={effectiveIsAdmin}
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
          linkedMemberId={effectiveLinkedMemberId}
          isAdmin={effectiveIsAdmin}
          showAppointments={cal.showAppointments}
          onClose={() => cal.setSelectedDate(null)}
          onMutate={cal.mutateShifts}
          onMutateAppointments={cal.mutateAppointments}
        />
      )}

      {cal.showSettings && isAdmin && (
        <SettingsModal
          roles={cal.roles}
          members={cal.members}
          templates={cal.templates}
          isAdmin={effectiveIsAdmin}
          onClose={() => cal.setShowSettings(false)}
          onMutateRoles={cal.mutateRoles}
          onMutateMembers={cal.mutateMembers}
          onMutateTemplates={cal.mutateTemplates}
          onViewAsMember={(memberId) => {
            setViewAsMemberId(memberId)
            cal.setShowSettings(false)
          }}
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
