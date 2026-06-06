import { MemberWithRole } from "@/types"
import { certBadgeStyle, CertLevel } from "@/lib/cert-utils"

interface ImpersonationBannerProps {
  member: MemberWithRole
  onExit: () => void
}

export default function ImpersonationBanner({ member, onExit }: ImpersonationBannerProps) {
  return (
    <div
      data-impersonation-banner
      style={{
        background: "rgba(109,40,217,0.13)",
        borderBottom: "1px solid rgba(167,139,250,0.27)",
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 12,
        color: "#c8baff",
        fontFamily: "monospace",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: member.color,
          flexShrink: 0,
        }}
      />
      <span>
        Viewing as <strong>{member.name}</strong>
      </span>
      {member.cert_level && (
        <span style={certBadgeStyle(member.cert_level as CertLevel)}>
          {member.cert_level}
        </span>
      )}
      <span>
        {member.role ? ` · ${member.role.name}` : ""}
      </span>
      <button
        aria-label="Exit member view"
        onClick={onExit}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: 4,
          padding: "2px 10px",
          color: "#c8baff",
          fontSize: 11,
          cursor: "pointer",
        }}
      >
        Exit member view
      </button>
    </div>
  )
}
