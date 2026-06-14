"use client"
import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import type { DbRole, MemberWithRole, DbShiftTemplate, DbGroup } from "@/types"
import RolesTab from "./RolesTab"
import MembersTab from "./MembersTab"
import ShiftTemplatesTab from "./ShiftTemplatesTab"
import GroupsTab from "./GroupsTab"
import UserAccessPanel from "@/components/admin/UserAccessPanel"
import MemberLinkingPanel from "@/components/admin/MemberLinkingPanel"
import MigrationPanel from "@/components/admin/MigrationPanel"

type Tab = "roles" | "members" | "templates" | "groups" | "admin"

interface SettingsModalProps {
  roles: DbRole[]
  members: MemberWithRole[]
  templates: DbShiftTemplate[]
  groups: DbGroup[]
  isAdmin: boolean
  onClose: () => void
  onMutateRoles: () => void
  onMutateMembers: () => void
  onMutateTemplates: () => void
  onMutateGroups: () => void
  onViewAsMember?: (memberId: string) => void
}

export default function SettingsModal({
  roles, members, templates, groups, isAdmin, onClose,
  onMutateRoles, onMutateMembers, onMutateTemplates, onMutateGroups,
  onViewAsMember = () => {},
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("roles")
  const [previewMemberId, setPreviewMemberId] = useState("")

  const tabStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = tabStripRef.current
    if (!strip) return
    const active = strip.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })
  }, [tab])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-h-[100dvh] flex flex-col sm:max-w-2xl sm:max-h-[85vh] sm:rounded-[6px]" style={{ background: "var(--surface2)", border: "1px solid var(--border)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="flex" style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {(["roles", "members", "templates", "groups"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 14px", cursor: "pointer", fontSize: 13, background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--accent)" : "var(--text-muted)",
                marginBottom: -1,
              }}
            >
              {t === "templates" ? "Shift Templates" : t === "groups" ? "Groups" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setTab("admin")}
              style={{
                padding: "8px 14px", cursor: "pointer", fontSize: 13, background: "none", border: "none",
                borderBottom: tab === "admin" ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === "admin" ? "var(--accent)" : "var(--text-muted)",
                marginBottom: -1,
              }}
            >
              Admin
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "roles" && (
            <RolesTab roles={roles} onMutate={onMutateRoles} />
          )}
          {tab === "members" && (
            <MembersTab members={members} roles={roles} onMutate={onMutateMembers} />
          )}
          {tab === "templates" && (
            <ShiftTemplatesTab templates={templates} onMutate={onMutateTemplates} />
          )}
          {tab === "groups" && (
            <GroupsTab
              groups={groups}
              onMutateGroups={onMutateGroups}
            />
          )}
          {tab === "admin" && isAdmin && <AdminTabContent />}

          {isAdmin && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", flexShrink: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
                Admin preview
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
                See the calendar as a specific member sees it.
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  aria-label="Select member to preview"
                  value={previewMemberId}
                  onChange={(e) => setPreviewMemberId(e.target.value)}
                  style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 8px", color: "var(--text)", fontSize: 12 }}
                >
                  <option value="">Select a member…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => { if (previewMemberId) onViewAsMember(previewMemberId) }}
                  disabled={!previewMemberId}
                  aria-label="View as member"
                  style={{ background: "var(--accent)", border: "none", borderRadius: 4, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", opacity: previewMemberId ? 1 : 0.5 }}
                >
                  View as member
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function AdminTabContent() {
  const { data: users = [], mutate: mutateUsers } = useSWR("/api/admin/users", fetcher)
  const { data: members = [] } = useSWR("/api/members", fetcher)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <UserAccessPanel users={users} onMutate={mutateUsers} />
        <MemberLinkingPanel members={members} users={users} onMutate={mutateUsers} />
      </div>
      <hr style={{ borderColor: "var(--border)" }} />
      <MigrationPanel />
    </div>
  )
}
