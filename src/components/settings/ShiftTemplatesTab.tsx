"use client"
import { useState } from "react"
import type { DbShiftTemplate } from "@/types"

interface ShiftTemplatesTabProps {
  templates: DbShiftTemplate[]
  onMutate: () => void
}

export default function ShiftTemplatesTab({ templates, onMutate }: ShiftTemplatesTabProps) {
  const [name, setName] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("16:00")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    await fetch("/api/shift-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), start_time: startTime, end_time: endTime }),
    })
    setName("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/shift-templates/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {templates.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{t.name}</span>
            <span className="text-gray-400 text-xs">
              {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
            </span>
            <button
              onClick={() => handleDelete(t.id)}
              className="text-red-400 text-xs hover:text-red-300"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-2">
        <input
          className="bg-gray-700 rounded px-3 py-1.5 text-sm"
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="time"
          className="bg-gray-700 rounded px-2 py-1.5 text-sm"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          className="bg-gray-700 rounded px-2 py-1.5 text-sm"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <button onClick={handleAdd} disabled={saving} className="btn-sm">
        Add Template
      </button>
    </div>
  )
}
