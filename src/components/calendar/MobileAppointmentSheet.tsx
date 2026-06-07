"use client"
import { useState } from "react"
import type { Appointment, ShiftWithMembers, MemberWithRole } from "@/types"

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

function formatDateHeading(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const weekday = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" })
  return `${weekday}, ${MONTH_NAMES[m - 1]} ${d}`
}

function formatTime(t: string) {
  const [h, min] = t.split(":")
  const hour = parseInt(h)
  return `${hour % 12 || 12}${min !== "00" ? `:${min}` : ""}${hour >= 12 ? "pm" : "am"}`
}

interface MobileAppointmentSheetProps {
  date: string
  dateEditable?: boolean
  linkedMemberId: string
  appointments: Appointment[]
  shifts: ShiftWithMembers[]
  members: MemberWithRole[]
  onClose: () => void
  onMutate: () => void
}

export default function MobileAppointmentSheet({
  date: initialDate,
  dateEditable = false,
  linkedMemberId,
  appointments,
  shifts,
  members,
  onClose,
  onMutate,
}: MobileAppointmentSheetProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [note, setNote] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const memberMap = new Map(members.map((m) => [m.id, m]))
  const shiftsForDate = dateEditable ? shifts.filter((s) => s.date === currentDate) : shifts

  async function handleSave() {
    if (!note.trim()) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: linkedMemberId,
        date: currentDate,
        note: note.trim(),
        all_day: allDay,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? "Failed to save.")
    } else {
      setNote("")
      onMutate()
      onClose()
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) onMutate()
  }

  return (
    <>
      <div
        data-testid="sheet-backdrop"
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 49,
          background: "var(--overlay-bg)",
        }}
      />
      <div
        role="dialog"
        aria-label="Schedule appointment"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
          background: "var(--surface)",
          borderRadius: "12px 12px 0 0",
          borderTop: "1px solid var(--border)",
          padding: "12px 16px 32px",
          maxHeight: "60vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 12px" }} />

        {dateEditable ? (
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="sheet-date" style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Date
            </label>
            <input
              id="sheet-date"
              type="date"
              className="form-input w-full"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
            />
          </div>
        ) : (
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{formatDateHeading(currentDate)}</h2>
        )}

        {shiftsForDate.length > 0 && (
          <div style={{ marginBottom: 10, fontSize: 12, color: "var(--text-muted)" }}>
            {shiftsForDate.map((shift) => (
              <div key={shift.id}>
                {shift.members.map((m) => m.name.split(" ")[0]).join(", ") || "No members"}
              </div>
            ))}
          </div>
        )}

        {!dateEditable && appointments.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {appointments.map((appt) => {
              const member = memberMap.get(appt.member_id)
              return (
                <div
                  key={appt.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    background: "var(--surface2)", borderRadius: 6, padding: "6px 8px",
                    marginBottom: 4, fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: member?.color ?? "var(--text)" }}>
                      {member?.name ?? "Unknown"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      <span>{appt.note}</span>
                      {" · "}
                      <span>{appt.all_day ? "All day" : `${formatTime(appt.start_time!)}–${formatTime(appt.end_time!)}`}</span>
                    </div>
                  </div>
                  {appt.member_id === linkedMemberId && (
                    <button onClick={() => handleDelete(appt.id)} className="btn-delete" style={{ fontSize: 11 }}>
                      Delete
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            className="form-input w-full"
            placeholder="Note (e.g. PTO, doctor appointment)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </label>
          {!allDay && (
            <div style={{ display: "flex", gap: 8 }}>
              <input type="time" className="form-input flex-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <input type="time" className="form-input flex-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          )}
          {error && <p style={{ fontSize: 12, color: "var(--danger-text)" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !note.trim()}
              className="btn-primary flex-1"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={onClose} className="btn-sm">Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
