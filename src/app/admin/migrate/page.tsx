import { createAdminClient } from "@/lib/supabase/server"
import MigrateClient from "./MigrateClient"

export const dynamic = "force-dynamic"

export default async function MigratePage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "migration_completed")
    .single()

  if (data?.value === "true") {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <p style={{ color: "var(--text-muted)" }}>Migration was already completed. Nothing to do.</p>
      </div>
    )
  }

  return <MigrateClient />
}
