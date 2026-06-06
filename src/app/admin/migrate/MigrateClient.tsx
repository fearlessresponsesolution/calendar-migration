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

export default function MigrateClient() {
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
    <div className="min-h-screen p-8" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Data Migration</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          Export data from the old calendar app, then upload the{" "}
          <code className="px-1 rounded text-sm" style={{ background: "var(--surface)" }}>migration.json</code> file here.
        </p>

        {status === "success" && counts && (
          <div className="mb-6 p-4 rounded" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid var(--success)" }}>
            <h2 className="font-semibold mb-2" style={{ color: "var(--success)" }}>Import successful</h2>
            <ul className="text-sm space-y-1" style={{ color: "var(--text)" }}>
              <li>Roles: {counts.roles}</li>
              <li>Members: {counts.members}</li>
              <li>Shift templates: {counts.templates}</li>
              <li>Shifts: {counts.shifts}</li>
              <li>Appointments: {counts.appointments}</li>
              {counts.errors > 0 && (
                <li style={{ color: "var(--warn)" }}>Rows skipped: {counts.errors}</li>
              )}
            </ul>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 rounded text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid var(--danger)", color: "var(--danger-text)" }}>
            {errorMessage}
          </div>
        )}

        <label className="block">
          <span className="sr-only">Choose migration.json</span>
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
            className="btn-upload py-3 px-4"
          >
            {status === "uploading" ? "Importing…" : "Click to upload migration.json"}
          </button>
        </label>

        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>Admin only. Protected by middleware.</p>
      </div>
    </div>
  )
}
