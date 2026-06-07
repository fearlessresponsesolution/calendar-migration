"use client"
import { useState } from "react"
import type { DbGroup } from "@/types"

interface GroupsTabProps {
  groups: DbGroup[]
  onMutateGroups: () => void
}

export default function GroupsTab({ groups, onMutateGroups }: GroupsTabProps) {
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
        {groups.map((group) => (
          <div key={group.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px" }}>
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
          </div>
        ))}
      </div>
    </div>
  )
}
