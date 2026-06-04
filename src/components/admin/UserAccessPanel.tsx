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
      <h3 className="text-sm font-semibold text-gray-300">User Access</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 text-sm">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold uppercase">
              {user.email[0]}
            </span>
            <span className="flex-1 truncate">{user.email}</span>
            <select
              className="bg-gray-700 rounded px-2 py-1 text-xs"
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as "admin" | "member")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => handleRemove(user.id)}
              className="text-red-400 text-xs hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-3 space-y-2">
        <p className="text-xs text-gray-500">Add user</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-700 rounded px-3 py-1.5 text-sm"
            placeholder="Email address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            className="bg-gray-700 rounded px-2 py-1.5 text-sm"
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
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </div>
  )
}
