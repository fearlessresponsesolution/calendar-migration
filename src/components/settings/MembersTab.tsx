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

  async function handleColorChange(id: string, color: string) {
    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    })
    onMutate()
  }

  async function handleCertChange(id: string, value: string) {
    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cert_level: value || null }),
    })
    onMutate()
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {members.map((m) => (
          <div key={m.id} className="item-row">
            <span className="rounded-full flex-shrink-0" style={{ width: 12, height: 12, backgroundColor: m.color, display: "inline-block" }} />
            <span className="flex-1">{m.name}</span>
            {m.role && (
              <span
                className="text-xs px-1.5 rounded"
                style={{ color: m.role.color, backgroundColor: m.role.color + "22" }}
              >
                {m.role.name}
              </span>
            )}
            <select
              aria-label={`Cert level for ${m.name}`}
              value={m.cert_level ?? ""}
              onChange={(e) => handleCertChange(m.id, e.target.value)}
              style={{ background: "#252a3d", border: "1px solid #3a3f5c", borderRadius: 4, padding: "3px 6px", color: "#e2e8ff", fontSize: 11 }}
            >
              <option value="">— none —</option>
              <option value="Basic">Basic</option>
              <option value="Senior">Senior</option>
              <option value="Master">Master</option>
            </select>
            <input
              type="color"
              value={m.color}
              onChange={(e) => handleColorChange(m.id, e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", padding: 2, background: "none" }}
              title="Change member color"
            />
            <button
              onClick={() => handleDelete(m.id)}
              style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input
          className="form-input flex-1"
          placeholder="Member name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          className="form-input"
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
