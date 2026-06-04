export default function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-800 text-yellow-200 text-sm px-4 py-2 rounded-full shadow-lg z-50">
      Reconnecting…
    </div>
  )
}
