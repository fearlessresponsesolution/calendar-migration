"use client"
import { useState } from "react"
import type { DbRole, MemberWithRole } from "@/types"

const MEMBER_PALETTE = ["#60A5FA","#34D399","#FBBF24","#F87171","#A78BFA","#FB7185","#38BDF8","#4ADE80"]

interface MembersTabProps {
  members: MemberWithRole[]
  roles: DbRole[]
  onMutate: () => void
}

export default function MembersTab({ members, roles, onMutate }: MembersTabProps) {
  const [name, setName] = useState("")
  const [roleId, setRoleId] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setSaving(true)
    const usedColors = members.map((m) => m.color)
    const color =
      MEMBER_PALETTE.find((c) => !usedColors.includes(c)) ??
      MEMBER_PALETTE[members.length % MEMBER_PALETTE.length]

    await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, role_id: roleId || null }),
    })
    setName("")
    setRoleId("")
    onMutate()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: m.color }}
            />
            <span className="flex-1 text-sm">{m.name}</span>
            {m.role && (
              <span
                className="text-xs px-1.5 rounded"
                style={{ color: m.role.color, backgroundColor: m.role.color + "22" }}
              >
                {m.role.name}
              </span>
            )}
            <button
              onClick={() => handleDelete(m.id)}
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
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          className="bg-gray-700 rounded px-2 py-1.5 text-sm"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          <option value="">No role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button onClick={handleAdd} disabled={saving} className="btn-sm">
          Add
        </button>
      </div>
    </div>
  )
}
