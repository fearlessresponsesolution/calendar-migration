"use client"
import { useState } from "react"
import type { Appointment } from "@/types"

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`
}

interface AppointmentEditorProps {
  date: string
  linkedMemberId: string | null
  appointments: Appointment[]
  isAdmin: boolean
  onMutate: () => void
}

export default function AppointmentEditor({
  date, linkedMemberId, appointments, isAdmin, onMutate,
}: AppointmentEditorProps) {
  const [note, setNote] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd() {
    if (!note.trim() || !linkedMemberId) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: linkedMemberId,
        date,
        note: note.trim(),
        all_day: allDay,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? "Failed to save appointment.")
    } else {
      setNote("")
      onMutate()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) onMutate()
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{formatDate(date)}</h3>

      {appointments.length === 0 && (
        <p className="text-gray-500 text-sm">No appointments for this day.</p>
      )}

      {appointments.map((appt) => (
        <div key={appt.id} className="border border-gray-700 rounded p-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-200">{appt.note}</span>
            {(isAdmin || appt.created_by_user) && (
              <button
                onClick={() => handleDelete(appt.id)}
                className="text-red-400 text-xs hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>
          <span className="text-gray-500 text-xs">
            {appt.all_day ? "All day" : `${appt.start_time?.slice(0, 5)} – ${appt.end_time?.slice(0, 5)}`}
          </span>
        </div>
      ))}

      {linkedMemberId && (
        <div className="border border-gray-700 rounded p-3 space-y-2">
          <input
            className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm"
            placeholder="Note (e.g. PTO, doctor appointment)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>

          {!allDay && (
            <div className="flex gap-2">
              <input type="time" className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <input type="time" className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving || !note.trim()}
            className="btn-sm disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Appointment"}
          </button>
        </div>
      )}
    </div>
  )
}
