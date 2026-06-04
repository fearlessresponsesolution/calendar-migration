"use client"
import { useState } from "react"
import type { ShiftWithMembers, MemberWithRole, DbShiftTemplate } from "@/types"

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
  onClose: () => void
  onMutate: () => void
}

export default function DayEditorModal({
  date, shifts, members, templates, onClose, onMutate,
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="font-semibold">{formatDate(date)}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {shifts.length === 0 && !addingShift && (
            <p className="text-gray-500 text-sm">No shifts scheduled.</p>
          )}

          {shifts.map((shift) => (
            <ShiftEditor
              key={shift.id}
              shift={shift}
              members={members}
              onDelete={() => handleDeleteShift(shift.id)}
              onUpdateMembers={(ids) => handleUpdateMembers(shift.id, ids)}
            />
          ))}

          {addingShift && (
            <div className="border border-gray-700 rounded p-3 space-y-2">
              <div>
                <label className="text-xs text-gray-400">Template</label>
                <select
                  className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
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
                    <label className="text-xs text-gray-400">Start</label>
                    <input
                      type="time"
                      className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">End</label>
                    <input
                      type="time"
                      className="w-full bg-gray-700 rounded px-2 py-1 text-sm mt-1"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400">Members</label>
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
                      {m.role && <span className="text-xs text-gray-500">({m.role.name})</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddShift}
                  disabled={saving}
                  className="btn-sm bg-blue-700 hover:bg-blue-600 disabled:opacity-50"
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

        {!addingShift && (
          <div className="px-4 py-3 border-t border-gray-700">
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
  shift, members, onDelete, onUpdateMembers,
}: {
  shift: ShiftWithMembers
  members: MemberWithRole[]
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
    <div className="border border-gray-700 rounded p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">
          {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
          {shift.template && <span className="text-gray-500 ml-2 text-xs">({shift.template.name})</span>}
        </span>
        <button onClick={onDelete} className="text-red-400 text-xs hover:text-red-300">Delete</button>
      </div>

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
    </div>
  )
}
