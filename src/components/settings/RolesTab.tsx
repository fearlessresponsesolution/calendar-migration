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
    <div className="space-y-4">
      <ul className="space-y-2">
        {roles.map((role) => (
          <li key={role.id} className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: role.color }}
            />
            <span className="flex-1 text-sm">{role.name}</span>
            <button
              onClick={() => handleDelete(role.id)}
              className="text-red-400 text-xs hover:text-red-300"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm"
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
