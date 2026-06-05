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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          {(["roles", "members", "templates"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-blue-400 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t === "templates" ? "Shift Templates" : t}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setTab("admin")}
              className={`px-4 py-2 text-sm transition-colors ${
                tab === "admin"
                  ? "border-b-2 border-blue-400 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
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
      <hr className="border-gray-700" />
      <MigrationPanel />
    </div>
  )
}
