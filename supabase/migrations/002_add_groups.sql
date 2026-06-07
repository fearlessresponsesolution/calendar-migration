-- Groups table
create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

-- All authenticated users can read groups
create policy "anon read groups"
  on groups for select to anon using (true);

-- Foreign keys on members and shifts (nullable — deleting a group nulls references)
alter table members add column group_id uuid references groups(id) on delete set null;
alter table shifts  add column group_id uuid references groups(id) on delete set null;

-- Indexes
create index members_group_id_idx on members(group_id);
create index shifts_group_id_idx on shifts(group_id);
