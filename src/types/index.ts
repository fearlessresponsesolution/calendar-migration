export interface DbRole {
  id: string
  name: string
  color: string
  created_at: string
}

export interface DbMember {
  id: string
  name: string
  color: string
  role_id: string | null
  user_id: string | null
  created_at: string
}

export interface MemberWithRole extends DbMember {
  role: DbRole | null
}

export interface DbShiftTemplate {
  id: string
  name: string
  start_time: string // "HH:MM:SS"
  end_time: string
  created_at: string
}

export interface ShiftMember {
  id: string
  name: string
  color: string
  role: DbRole | null
}

export interface DbShift {
  id: string
  date: string // "YYYY-MM-DD"
  template_id: string | null
  start_time: string
  end_time: string
  is_ad_hoc: boolean
  created_at: string
  updated_at: string
}

export interface ShiftWithMembers extends DbShift {
  template: DbShiftTemplate | null
  members: ShiftMember[]
}

export interface Conflict {
  memberId: string
  memberName: string
  memberColor: string
  date: string
  shifts: ShiftWithMembers[]
}

export type MonthSchedule = Map<string, ShiftWithMembers[]>

export interface Appointment {
  id: string
  member_id: string
  date: string
  start_time: string | null
  end_time: string | null
  all_day: boolean
  note: string
  created_by_user: string | null
  created_at: string
  updated_at: string
}

export interface ApptEntry {
  apptId: string
  memberId: string
  memberName: string
  memberColor: string
  note: string
  allDay: boolean
  startTime: string | null
  endTime: string | null
  hasConflict: boolean
}

export interface SwapCandidate {
  id: string
  name: string
  color: string
  worksAdjacentBefore: boolean
  worksAdjacentAfter: boolean
}
