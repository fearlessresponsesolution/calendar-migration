import { createClient, SupabaseClient } from "@supabase/supabase-js"

let instance: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!instance) {
    instance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}
