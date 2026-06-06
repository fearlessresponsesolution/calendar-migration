"use client"
import { useState } from "react"

interface User {
  id: string
  email: string
  role: "admin" | "member"
}

interface UserAccessPanelProps {
  users: User[]
  onMutate: () => void
}

export default function UserAccessPanel({ users, onMutate }: UserAccessPanelProps) {
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "member">("member")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd() {
    if (!newEmail.trim()) return
    setSaving(true)
    setError("")
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? "Failed to add user")
    } else {
      setNewEmail("")
      onMutate()
    }
    setSaving(false)
  }

  async function handleRoleChange(id: string, role: "admin" | "member") {
    await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    onMutate()
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
    if (res.ok || res.status === 204) onMutate()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>User Access</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 text-sm">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
              style={{ background: "var(--border)", color: "var(--text)" }}
            >
              {user.email[0]}
            </span>
            <span className="flex-1 truncate">{user.email}</span>
            <select
              aria-label={`Role for ${user.email}`}
              className="rounded px-2 py-1 text-xs"
              style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as "admin" | "member")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              aria-label={`Remove ${user.email}`}
              onClick={() => handleRemove(user.id)}
              className="btn-delete text-xs"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Add user</p>
        <div className="flex gap-2">
          <input
            aria-label="New user email address"
            className="flex-1 rounded px-3 py-1.5 text-sm"
            style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            aria-label="New user role"
            className="rounded px-2 py-1.5 text-sm"
            style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "admin" | "member")}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAdd} disabled={saving} className="btn-sm">
            Add
          </button>
        </div>
        {error && <p className="text-xs" style={{ color: "var(--danger-text)" }}>{error}</p>}
      </div>
    </div>
  )
}
