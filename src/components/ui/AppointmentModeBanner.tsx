export default function AppointmentModeBanner() {
  return (
    <div
      data-appt-banner
      style={{
        padding: "5px 16px",
        background: "rgba(146,64,14,0.13)",
        borderBottom: "1px solid rgba(245,158,11,0.27)",
        fontSize: 11,
        color: "var(--warn)",
        flexShrink: 0,
      }}
    >
      👁 Appointment view — showing member availability. Click <strong>← Shifts</strong> to return to schedule.
    </div>
  )
}
