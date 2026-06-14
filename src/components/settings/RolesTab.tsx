"use client"
import { useState } from "react"
import type { DbRole } from "@/types"

const PALETTE = ["#EF4444","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#06B6D4","#F97316"]

function nextColor(existing: string[]) {
  return PALETTE.find((c) => !existing.includes(c)) ?? PALETTE[existing.length % PALETTE.length]
}

interface RolesTabProps {
  roles: DbRole[]
  onMutate: () => void
}

export default function RolesTab({ roles, onMutate }: RolesTabProps) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color: nextColor(roles.map((r) => r.color)) }),
    })
    setName("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/roles/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {roles.map((role) => (
          <div key={role.id} className="item-row">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
            <span className="flex-1">{role.name}</span>
            <button
              onClick={() => handleDelete(role.id)}
              style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          className="form-input flex-1 min-w-0"
          placeholder="Role name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} disabled={saving} className="btn-sm">
          Add
        </button>
      </div>
    </div>
  )
}
