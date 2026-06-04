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
      className="fixed z-50 bg-gray-700 rounded shadow-lg py-1 text-sm min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onCopyToNextDay(); onClose() }}
        className="w-full text-left px-4 py-1.5 hover:bg-gray-600"
      >
        Copy to next day
      </button>
      <button
        onClick={() => { onCopyToNextWeek(); onClose() }}
        className="w-full text-left px-4 py-1.5 hover:bg-gray-600"
      >
        Copy to next week
      </button>
    </div>
  )
}
