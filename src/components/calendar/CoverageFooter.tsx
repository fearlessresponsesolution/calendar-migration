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
    <footer className="flex gap-4 px-4 py-2 bg-gray-800 border-t border-gray-700 text-sm flex-wrap">
      {templates.map((template) => {
        const covered = new Set(
          shifts
            .filter((s) => s.template_id === template.id && s.members.length > 0)
            .map((s) => s.date)
        ).size

        return (
          <span key={template.id} className="text-gray-400">
            {template.name}:{" "}
            <span className={covered === daysInMonth ? "text-green-400" : "text-yellow-400"}>
              {covered}/{daysInMonth}
            </span>
          </span>
        )
      })}
    </footer>
  )
}
