export default function ReconnectingBanner({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-full shadow-lg z-50" style={{ background: "var(--warn)", color: "#000" }}>
      Reconnecting…
    </div>
  )
}
