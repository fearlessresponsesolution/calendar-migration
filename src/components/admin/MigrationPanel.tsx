"use client"
import { useState, useRef } from "react"

interface ImportCounts {
  roles: number
  members: number
  templates: number
  shifts: number
  appointments: number
  errors: number
}

export default function MigrationPanel() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [counts, setCounts] = useState<ImportCounts | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus("uploading")
    setErrorMessage("")

    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setStatus("error")
      setErrorMessage("File is not valid JSON.")
      return
    }

    const res = await fetch("/api/admin/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    })

    const body = await res.json()

    if (!res.ok) {
      setStatus("error")
      setErrorMessage(body.error?.formErrors?.join(", ") ?? body.error ?? "Import failed.")
    } else {
      setStatus("success")
      setCounts(body.counts)
    }

    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Data Migration</h3>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Export from the old calendar app, then upload the{" "}
        <code className="px-1 rounded" style={{ background: "var(--surface)" }}>migration.json</code> file.
      </p>

      {status === "success" && counts && (
        <div className="p-3 rounded text-sm" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid var(--success)" }}>
          <p className="font-medium mb-1" style={{ color: "var(--success)" }}>Import successful</p>
          <ul className="space-y-0.5 text-xs" style={{ color: "var(--text)" }}>
            <li>Roles: {counts.roles} &middot; Members: {counts.members} &middot; Templates: {counts.templates}</li>
            <li>Shifts: {counts.shifts} &middot; Appointments: {counts.appointments}</li>
            {counts.errors > 0 && <li style={{ color: "var(--warn)" }}>Rows skipped: {counts.errors}</li>}
          </ul>
        </div>
      )}

      {status === "error" && (
        <div className="p-3 rounded text-xs" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid var(--danger)", color: "var(--danger-text)" }}>
          {errorMessage}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
        disabled={status === "uploading"}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="btn-upload py-2 px-3 text-sm"
      >
        {status === "uploading" ? "Importing…" : "Upload migration.json"}
      </button>
    </div>
  )
}
