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
    <div className="space-y-3">
      <div className="space-y-1.5">
        {templates.map((t) => (
          <div key={t.id} className="item-row">
            <span className="flex-1">{t.name}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
            </span>
            <button
              onClick={() => handleDelete(t.id)}
              style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <input
          className="form-input flex-1 min-w-[120px]"
          placeholder="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="time"
          className="form-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <input
          type="time"
          className="form-input"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <button onClick={handleAdd} disabled={saving} className="btn-sm">
          Add Template
        </button>
      </div>
    </div>
  )
}
