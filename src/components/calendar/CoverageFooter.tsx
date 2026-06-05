import type { ShiftWithMembers, DbShiftTemplate } from "@/types"

interface CoverageFooterProps {
  shifts: ShiftWithMembers[]
  templates: DbShiftTemplate[]
  year: number
  month: number
}

export default function CoverageFooter({ shifts, templates, year, month }: CoverageFooterProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <footer
      className="flex gap-4 flex-wrap flex-shrink-0"
      style={{ padding: "6px 16px", background: "var(--surface2)", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}
    >
      {templates.map((template) => {
        const covered = new Set(
          shifts
            .filter((s) => s.template_id === template.id && s.members.length > 0)
            .map((s) => s.date)
        ).size

        return (
          <span key={template.id}>
            {template.name}:{" "}
            <span style={{ color: covered === daysInMonth ? "var(--success)" : "var(--warn)" }}>
              {covered}/{daysInMonth}
            </span>
          </span>
        )
      })}
    </footer>
  )
}
