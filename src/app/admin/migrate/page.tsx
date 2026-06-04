import { createAdminClient } from "@/lib/supabase/server"
import MigrateClient from "./MigrateClient"

export default async function MigratePage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "migration_completed")
    .single()

  if (data?.value === "true") {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <p className="text-gray-400">Migration was already completed. Nothing to do.</p>
      </div>
    )
  }

  return <MigrateClient />
}
