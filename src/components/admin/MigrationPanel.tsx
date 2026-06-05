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
      <h3 className="text-sm font-semibold text-gray-300">Data Migration</h3>
      <p className="text-xs text-gray-500">
        Export from the old calendar app, then upload the{" "}
        <code className="bg-gray-700 px-1 rounded">migration.json</code> file.
      </p>

      {status === "success" && counts && (
        <div className="p-3 bg-green-900/40 border border-green-700 rounded text-sm">
          <p className="font-medium text-green-400 mb-1">Import successful</p>
          <ul className="text-gray-300 space-y-0.5 text-xs">
            <li>Roles: {counts.roles} &middot; Members: {counts.members} &middot; Templates: {counts.templates}</li>
            <li>Shifts: {counts.shifts} &middot; Appointments: {counts.appointments}</li>
            {counts.errors > 0 && <li className="text-yellow-400">Rows skipped: {counts.errors}</li>}
          </ul>
        </div>
      )}

      {status === "error" && (
        <div className="p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-xs">
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
        className="w-full py-2 px-3 border border-dashed border-gray-600 rounded text-sm text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
      >
        {status === "uploading" ? "Importing…" : "Upload migration.json"}
      </button>
    </div>
  )
}
