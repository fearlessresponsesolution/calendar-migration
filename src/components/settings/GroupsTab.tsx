"use client"
import { useState } from "react"
import type { DbGroup, MemberWithRole } from "@/types"

interface GroupsTabProps {
  groups: DbGroup[]
  members: MemberWithRole[]
  onMutateGroups: () => void
  onMutateMembers: () => void
}

export default function GroupsTab({ groups, members, onMutateGroups, onMutateMembers }: GroupsTabProps) {
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName("")
    onMutateGroups()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/groups/${id}`, { method: "DELETE" })
    onMutateGroups()
  }

  function startRename(group: DbGroup) {
    setRenamingId(group.id)
    setRenameValue(group.name)
  }

  async function commitRename(id: string) {
    if (!renameValue.trim()) return
    await fetch(`/api/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    })
    setRenamingId(null)
    onMutateGroups()
  }

  async function removeMember(memberId: string) {
    await fetch(`/api/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: null }),
    })
    onMutateMembers()
  }

  async function addMember(groupId: string, memberId: string) {
    if (!memberId) return
    await fetch(`/api/members/${memberId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId }),
    })
    onMutateMembers()
  }

  const unassignedMembers = members.filter((m) => m.group_id === null)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="form-input flex-1"
          placeholder="Group name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} disabled={saving || !newName.trim()} className="btn-sm" aria-label="Add group">
          Add Group
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const groupMembers = members.filter((m) => m.group_id === group.id)

          return (
            <div key={group.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
                {renamingId === group.id ? (
                  <input
                    className="form-input"
                    style={{ flex: 1, marginRight: 8 }}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(group.id); if (e.key === "Escape") setRenamingId(null) }}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{group.name}</span>
                )}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {renamingId === group.id ? (
                    <>
                      <button onClick={() => commitRename(group.id)} className="btn-sm" style={{ fontSize: 11 }}>Save</button>
                      <button onClick={() => setRenamingId(null)} className="btn-sm" style={{ fontSize: 11 }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startRename(group)} className="btn-sm" style={{ fontSize: 11 }}>Rename</button>
                      <button onClick={() => handleDelete(group.id)} className="btn-delete" style={{ fontSize: 11 }} aria-label={`Delete ${group.name}`}>Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Members:</span>
                {groupMembers.length === 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>None yet</span>
                )}
                {groupMembers.map((m) => (
                  <span key={m.id} style={{ fontSize: 11, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, display: "inline-block", flexShrink: 0 }} />
                    {m.name}
                    <button
                      onClick={() => removeMember(m.id)}
                      aria-label={`Remove ${m.name}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, lineHeight: 1, padding: "0 0 0 2px" }}
                    >×</button>
                  </span>
                ))}
                {unassignedMembers.length > 0 && (
                  <select
                    aria-label="Add member"
                    value=""
                    onChange={(e) => addMember(group.id, e.target.value)}
                    style={{ fontSize: 11, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    <option value="">+ Add member…</option>
                    {unassignedMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
