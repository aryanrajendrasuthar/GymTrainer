-- ─────────────────────────────────────────────────────────────────────────────
-- 003_schema_fixes.sql
-- Adds missing columns and fixes constraints introduced in Sprint 4/5.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── user_profiles: add activity_level ───────────────────────────────────────

alter table user_profiles
  add column if not exists activity_level text
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very-active'));

-- ─── body_weight_logs: add log_date, fix unique constraint ───────────────────
--
-- The original schema used a unique expression on (user_id, logged_at::date).
-- Expression-based unique constraints cannot be referenced by name in Supabase's
-- upsert onConflict clause, so we add an explicit log_date column instead.

alter table body_weight_logs
  add column if not exists log_date date;

-- Back-fill log_date from logged_at for any existing rows
update body_weight_logs
  set log_date = logged_at::date
  where log_date is null;

-- Make the column NOT NULL now that it's filled
alter table body_weight_logs
  alter column log_date set not null;

-- Drop the old expression-based unique constraint (if it exists)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'body_weight_logs'::regclass
      and contype = 'u'
      and conname like '%logged_at%'
  ) then
    execute 'alter table body_weight_logs drop constraint '
      || (select conname from pg_constraint
          where conrelid = 'body_weight_logs'::regclass
            and contype = 'u'
            and conname like '%logged_at%'
          limit 1);
  end if;
end $$;

-- Add the new named unique constraint
alter table body_weight_logs
  drop constraint if exists body_weight_logs_user_id_log_date_key;

alter table body_weight_logs
  add constraint body_weight_logs_user_id_log_date_key
    unique (user_id, log_date);

-- ─── GET /api/sessions — add missing is_partial default ──────────────────────
-- (No structural change needed; is_partial already has a default of false.)

-- ─── Index for log_date ───────────────────────────────────────────────────────

drop index if exists idx_body_weight_logs_user_date;

create index if not exists idx_body_weight_logs_user_log_date
  on body_weight_logs (user_id, log_date desc);
