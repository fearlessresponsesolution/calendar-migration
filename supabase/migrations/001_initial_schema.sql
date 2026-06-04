-- Auth allowlist + app roles
create table users (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  role         text not null default 'member' check (role in ('admin', 'member')),
  created_at   timestamptz default now(),
  created_by   uuid references users(id) on delete set null
);

-- Work roles (Nurse, Technician, Coordinator, etc.)
create table roles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null,
  created_at   timestamptz default now()
);

-- Schedule members (staff)
create table members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null,
  role_id      uuid references roles(id) on delete set null,
  user_id      uuid references users(id) on delete set null,
  created_at   timestamptz default now()
);

-- Named shift windows
create table shift_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  start_time   time not null,
  end_time     time not null,
  created_at   timestamptz default now()
);

-- Scheduled shift instances
create table shifts (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  template_id  uuid references shift_templates(id) on delete set null,
  start_time   time not null,
  end_time     time not null,
  is_ad_hoc    boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Many-to-many: shifts ↔ members
create table shift_assignments (
  shift_id     uuid references shifts(id) on delete cascade,
  member_id    uuid references members(id) on delete cascade,
  primary key (shift_id, member_id)
);

-- Member time-off / personal notes (no anon/real-time access)
create table appointments (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references members(id) on delete cascade,
  date             date not null,
  start_time       time,
  end_time         time,
  all_day          boolean not null default false,
  note             text not null,
  created_by_user  uuid references users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- App settings (tracks migration completion, etc.)
create table settings (
  key    text primary key,
  value  text not null
);

-- Enable RLS on all tables (default DENY — no policy = no access)
alter table users enable row level security;
alter table roles enable row level security;
alter table members enable row level security;
alter table shift_templates enable row level security;
alter table shifts enable row level security;
alter table shift_assignments enable row level security;
alter table appointments enable row level security;
alter table settings enable row level security;

-- Public schedule data: anon key can SELECT (drives real-time subscriptions)
create policy "anon read roles"
  on roles for select to anon using (true);
create policy "anon read members"
  on members for select to anon using (true);
create policy "anon read shift_templates"
  on shift_templates for select to anon using (true);
create policy "anon read shifts"
  on shifts for select to anon using (true);
create policy "anon read shift_assignments"
  on shift_assignments for select to anon using (true);

-- No anon SELECT on users, appointments, or settings
-- All INSERT/UPDATE/DELETE go through service role key (server-side only)

-- Indexes for common calendar query patterns
create index shifts_date_idx on shifts (date);
create index shifts_template_id_idx on shifts (template_id);
create index shift_assignments_member_id_idx on shift_assignments (member_id);
create index appointments_member_id_date_idx on appointments (member_id, date);
create index members_role_id_idx on members (role_id);
