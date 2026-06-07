-- Remove group_id from members (groups are shift labels only, not member assignments)
alter table members drop column if exists group_id;
drop index if exists members_group_id_idx;
