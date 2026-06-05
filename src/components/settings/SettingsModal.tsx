"use client"
import { useState } from "react"
import useSWR from "swr"
import type { DbRole, MemberWithRole, DbShiftTemplate } from "@/types"
import RolesTab from "./RolesTab"
import MembersTab from "./MembersTab"
import ShiftTemplatesTab from "./ShiftTemplatesTab"
import UserAccessPanel from "@/components/admin/UserAccessPanel"
import MemberLinkingPanel from "@/components/admin/MemberLinkingPanel"
import MigrationPanel from "@/components/admin/MigrationPanel"

type Tab = "roles" | "members" | "templates" | "admin"

interface SettingsModalProps {
  roles: DbRole[]
  members: MemberWithRole[]
  templates: DbShiftTemplate[]
  isAdmin: boolean
  onClose: () => void
  onMutateRoles: () => void
  onMutateMembers: () => void
  onMutateTemplates: () => void
}

export default function SettingsModal({
  roles, members, templates, isAdmin, onClose,
  onMutateRoles, onMutateMembers, onMutateTemplates,
}: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("roles")

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col" style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
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
          {(["roles", "members", "templates"] as const).map((t) => (
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
              {t === "templates" ? "Shift Templates" : t.charAt(0).toUpperCase() + t.slice(1)}
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
          {tab === "admin" && isAdmin && <AdminTabContent />}
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
