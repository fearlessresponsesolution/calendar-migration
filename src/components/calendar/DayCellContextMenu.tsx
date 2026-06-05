"use client"
import { useEffect, useRef } from "react"

interface DayCellContextMenuProps {
  x: number
  y: number
  date: string
  hasShifts: boolean
  onClose: () => void
  onCopyToNextDay: () => void
  onCopyToNextWeek: () => void
  onFillMonth: () => void
}

export default function DayCellContextMenu({
  x, y, hasShifts, onClose, onCopyToNextDay, onCopyToNextWeek,
}: DayCellContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  if (!hasShifts) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 py-1 text-sm min-w-[180px]"
      style={{ left: x, top: y, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
    >
      <button
        onClick={() => { onCopyToNextDay(); onClose() }}
        className="w-full text-left px-4 py-1.5"
        style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 13 }}
        onMouseOver={e => (e.currentTarget.style.background = "var(--surface)")}
        onMouseOut={e => (e.currentTarget.style.background = "none")}
      >
        Copy to next day
      </button>
      <button
        onClick={() => { onCopyToNextWeek(); onClose() }}
        className="w-full text-left px-4 py-1.5"
        style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 13 }}
        onMouseOver={e => (e.currentTarget.style.background = "var(--surface)")}
        onMouseOut={e => (e.currentTarget.style.background = "none")}
      >
        Copy to next week
      </button>
    </div>
  )
}
