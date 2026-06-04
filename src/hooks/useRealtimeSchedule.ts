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
  const [connected, setConnected] = useState(false)
  const channelsRef = useRef<RealtimeChannel[]>([])
  const onShiftRef = useRef(onShiftChange)
  const onMemberRef = useRef(onMemberChange)

  useEffect(() => { onShiftRef.current = onShiftChange }, [onShiftChange])
  useEffect(() => { onMemberRef.current = onMemberChange }, [onMemberChange])

  useEffect(() => {
    const supabase = getBrowserClient()

    function makeChannel(label: string, table: string, cb: () => void) {
      return supabase
        .channel(label)
        .on("postgres_changes", { event: "*", schema: "public", table }, cb)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setConnected(true)
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setConnected(false)
        })
    }

    const shiftsChannel = makeChannel("shifts", "shifts", () => onShiftRef.current())
    const assignmentsChannel = makeChannel("shift_assignments", "shift_assignments", () => onShiftRef.current())
    const membersChannel = makeChannel("members", "members", () => onMemberRef.current())
    const rolesChannel = makeChannel("roles", "roles", () => onMemberRef.current())

    channelsRef.current = [shiftsChannel, assignmentsChannel, membersChannel, rolesChannel]

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch))
      channelsRef.current = []
    }
  }, [])

  return { connected }
}
