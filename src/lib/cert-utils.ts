import type { CSSProperties } from "react"

export type CertLevel = "Basic" | "Senior" | "Master"

const CERT_STYLES: Record<CertLevel, CSSProperties> = {
  Basic:  { background: "#1e3a2a", color: "#4ade80", border: "1px solid #166534" },
  Senior: { background: "#1e2d4a", color: "#60a5fa", border: "1px solid #1e40af" },
  Master: { background: "#2d1e4a", color: "#c084fc", border: "1px solid #6b21a8" },
}

export function certBadgeStyle(cert: CertLevel): CSSProperties {
  return {
    ...CERT_STYLES[cert],
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    borderRadius: 3,
    display: "inline-block",
  }
}
