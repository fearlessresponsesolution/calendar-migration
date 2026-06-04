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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Data Migration</h1>
        <p className="text-gray-400 mb-6">
          Export data from the old calendar app, then upload the{" "}
          <code className="bg-gray-800 px-1 rounded text-sm">migration.json</code> file here.
        </p>

        {status === "success" && counts && (
          <div className="mb-6 p-4 bg-green-900/40 border border-green-700 rounded">
            <h2 className="font-semibold text-green-400 mb-2">Import successful</h2>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>Roles: {counts.roles}</li>
              <li>Members: {counts.members}</li>
              <li>Shift templates: {counts.templates}</li>
              <li>Shifts: {counts.shifts}</li>
              <li>Appointments: {counts.appointments}</li>
              {counts.errors > 0 && (
                <li className="text-yellow-400">Rows skipped: {counts.errors}</li>
              )}
            </ul>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700 rounded text-red-300 text-sm">
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
            className="w-full py-3 px-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {status === "uploading" ? "Importing…" : "Click to upload migration.json"}
          </button>
        </label>

        <p className="text-xs text-gray-600 mt-4">Admin only. Protected by middleware.</p>
      </div>
    </div>
  )
}
