"use client"
import { useEffect, useState, useRef } from "react"
import { getBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeScheduleOptions {
  onShiftChange: () => void
  onMemberChange: () => void
}

export function useRealtimeSchedule({
  onShiftChange,
  onMemberChange,
}: UseRealtimeScheduleOptions) {
  const [connected, setConnected] = useState(true)
  const channelsRef = useRef<RealtimeChannel[]>([])

  useEffect(() => {
    const supabase = getBrowserClient()

    function makeChannel(name: string, cb: () => void) {
      return supabase
        .channel(name)
        .on("postgres_changes", { event: "*", schema: "public", table: name }, cb)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setConnected(true)
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnected(false)
          if (status === "CLOSED") setConnected(false)
        })
    }

    const shiftsChannel = makeChannel("shifts", onShiftChange)
    const assignmentsChannel = makeChannel("shift_assignments", onShiftChange)
    const membersChannel = makeChannel("members", onMemberChange)
    const rolesChannel = makeChannel("roles", onMemberChange)

    channelsRef.current = [shiftsChannel, assignmentsChannel, membersChannel, rolesChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [onShiftChange, onMemberChange])

  return { connected }
}
