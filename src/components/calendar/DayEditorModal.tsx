"use client"
import { useState } from "react"
import type { ShiftWithMembers, MemberWithRole, DbShiftTemplate, Appointment } from "@/types"
import AppointmentEditor from "./AppointmentEditor"
import { certBadgeStyle, type CertLevel } from "@/lib/cert-utils"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

interface DayEditorModalProps {
  date: string
  shifts: ShiftWithMembers[]
  members: MemberWithRole[]
  templates: DbShiftTemplate[]
  appointments: Appointment[]
  linkedMemberId: string | null
  isAdmin: boolean
  showAppointments: boolean
  onClose: () => void
  onMutate: () => void
  onMutateAppointments: () => void
}

export default function DayEditorModal({
  date, shifts, members, templates, appointments, linkedMemberId, isAdmin, showAppointments,
  onClose, onMutate, onMutateAppointments,
}: DayEditorModalProps) {
  const [addingShift, setAddingShift] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("16:00")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  async function handleAddShift() {
    setSaving(true)
    const template = templates.find((t) => t.id === selectedTemplateId)
    await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        template_id: selectedTemplateId || null,
        start_time: template ? template.start_time : startTime,
        end_time: template ? template.end_time : endTime,
        is_ad_hoc: !selectedTemplateId,
        member_ids: selectedMemberIds,
      }),
    })
    onMutate()
    setAddingShift(false)
    setSelectedTemplateId("")
    setSelectedMemberIds([])
    setSaving(false)
  }

  async function handleDeleteShift(id: string) {
    await fetch(`/api/shifts/${id}`, { method: "DELETE" })
    onMutate()
  }

  async function handleUpdateMembers(shiftId: string, memberIds: string[]) {
    await fetch(`/api/shifts/${shiftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: memberIds }),
    })
    onMutate()
  }

  function toggleMemberId(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col" style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(date)}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!showAppointments && shifts.length === 0 && !addingShift && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No shifts scheduled.</p>
          )}

          {!showAppointments && shifts.map((shift) => (
            <ShiftEditor
              key={shift.id}
              shift={shift}
              members={members}
              isAdmin={isAdmin}
              onDelete={() => handleDeleteShift(shift.id)}
              onUpdateMembers={(ids) => handleUpdateMembers(shift.id, ids)}
            />
          ))}

          {showAppointments && (
            <div>
              <AppointmentEditor
                date={date}
                linkedMemberId={linkedMemberId}
                appointments={appointments}
                isAdmin={isAdmin}
                onMutate={onMutateAppointments}
              />
            </div>
          )}

          {addingShift && (
            <div className="border border-[var(--border)] rounded p-3 space-y-2">
              <div>
                <label className="text-xs" style={{ color: "var(--text-muted)" }}>Template</label>
                <select
                  className="w-full rounded px-2 py-1 text-sm mt-1" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">Ad-hoc (custom times)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedTemplateId && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="shift-start-time" className="text-xs" style={{ color: "var(--text-muted)" }}>Start</label>
                    <input
                      id="shift-start-time"
                      type="time"
                      className="w-full rounded px-2 py-1 text-sm mt-1" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="shift-end-time" className="text-xs" style={{ color: "var(--text-muted)" }}>End</label>
                    <input
                      id="shift-end-time"
                      type="time"
                      className="w-full rounded px-2 py-1 text-sm mt-1" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs" style={{ color: "var(--text-muted)" }}>Members</label>
                <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(m.id)}
                        onChange={() => toggleMemberId(m.id)}
                      />
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.name}
                      {m.cert_level && (
                        <span style={certBadgeStyle(m.cert_level as CertLevel)}>{m.cert_level}</span>
                      )}
                      {m.role && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{m.role.name}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddShift}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Add Shift"}
                </button>
                <button onClick={() => setAddingShift(false)} className="btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!addingShift && isAdmin && !showAppointments && (
          <div className="px-4 py-3 border-t border-[var(--border)]">
            <button onClick={() => setAddingShift(true)} className="btn-sm">
              + Add Shift
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ShiftEditor({
  shift, members, isAdmin, onDelete, onUpdateMembers,
}: {
  shift: ShiftWithMembers
  members: MemberWithRole[]
  isAdmin: boolean
  onDelete: () => void
  onUpdateMembers: (ids: string[]) => void
}) {
  const [checkedIds, setCheckedIds] = useState<string[]>(shift.members.map((m) => m.id))
  const [dirty, setDirty] = useState(false)

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      setDirty(true)
      return next
    })
  }

  return (
    <div className="border border-[var(--border)] rounded p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: "var(--text)" }}>
          {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
          {shift.template && <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>({shift.template.name})</span>}
        </span>
        {isAdmin && (
          <button
            aria-label={`Delete ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)} shift`}
            onClick={onDelete}
            className="btn-delete text-xs"
          >Delete</button>
        )}
      </div>

      {isAdmin ? (
        <>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedIds.includes(m.id)}
                  onChange={() => toggle(m.id)}
                />
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.name}
                {m.cert_level && (
                  <span style={certBadgeStyle(m.cert_level as CertLevel)}>{m.cert_level}</span>
                )}
                {m.role && (
                  <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{m.role.name}</span>
                )}
              </label>
            ))}
          </div>
          {dirty && (
            <button
              onClick={() => { onUpdateMembers(checkedIds); setDirty(false) }}
              className="btn-sm text-xs"
            >
              Save assignments
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          {shift.members.map((m) => (
            <span key={m.id} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              {m.name}
            </span>
          ))}
          {shift.members.length === 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>No members assigned</span>
          )}
        </div>
      )}
    </div>
  )
}
