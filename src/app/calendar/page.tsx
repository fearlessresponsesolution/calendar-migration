import { auth } from "@/auth"

export default async function CalendarPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Shift Calendar</h1>
      <p className="text-gray-400">
        Signed in as{" "}
        <span className="text-white font-mono">{session?.user?.email}</span>{" "}
        <span className="text-gray-500">({session?.user?.role})</span>
      </p>
      <p className="text-gray-600 mt-6 italic">Calendar coming in Phase 2.</p>
    </div>
  )
}
