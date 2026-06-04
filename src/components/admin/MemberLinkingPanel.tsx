"use client"

interface Member {
  id: string
  name: string
  color: string
  role_id: string | null
  user_id: string | null
}

interface User {
  id: string
  email: string
  role: "admin" | "member"
}

interface MemberLinkingPanelProps {
  members: Member[]
  users: User[]
  onMutate: () => void
}

export default function MemberLinkingPanel({ members, users, onMutate }: MemberLinkingPanelProps) {
  async function handleLink(userId: string, memberId: string | null) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    })
    onMutate()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">Member Linking</h3>
      <p className="text-xs text-gray-500">
        Link login accounts to schedule members to enable self-service appointments.
      </p>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {members.map((member) => {
          const linkedUser = users.find((u) => u.id === member.user_id)

          return (
            <div key={member.id} className="flex items-center gap-3 text-sm">
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <span className="flex-1">{member.name}</span>
              {!linkedUser && (
                <span
                  title="not linked to a login account"
                  className="text-yellow-400 text-xs"
                >
                  ⚠
                </span>
              )}
              <select
                className="bg-gray-700 rounded px-2 py-1 text-xs max-w-[180px]"
                value={linkedUser?.id ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    if (linkedUser) handleLink(linkedUser.id, null)
                  } else {
                    handleLink(e.target.value, member.id)
                  }
                }}
              >
                <option value="">— unlinked —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
