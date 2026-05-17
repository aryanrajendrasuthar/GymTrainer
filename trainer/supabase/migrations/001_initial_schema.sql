-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- Core schema: profiles, settings, workout sessions, exercise logs, progress
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ───────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Updated-at trigger function ──────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_profiles
-- Extends Supabase auth.users with app-specific profile data.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  name          text not null default '',
  age           smallint check (age between 10 and 120),
  gender        text check (gender in ('male', 'female', 'other')),
  height_cm     numeric(5,1) check (height_cm between 50 and 300),
  weight_kg     numeric(5,1) check (weight_kg between 20 and 500),
  body_fat_pct  numeric(4,1) check (body_fat_pct between 2 and 70),
  fitness_level text not null default 'beginner'
                  check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  goal          text not null default 'general-fitness'
                  check (goal in (
                    'muscle-gain', 'fat-loss', 'recomp',
                    'strength', 'greek-god', 'calisthenics', 'general-fitness'
                  )),
  split_id      text not null default 'full-body-3-day',
  equipment     text[] not null default '{}',
  units         text not null default 'kg' check (units in ('kg', 'lb')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_settings
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists user_settings (
  id                            uuid primary key default uuid_generate_v4(),
  user_id                       uuid not null references user_profiles(id) on delete cascade,
  progressive_overload_enabled  boolean not null default true,
  overload_amount               text not null default 'standard'
                                  check (overload_amount in ('conservative', 'standard', 'aggressive')),
  deload_reminder               boolean not null default true,
  weight_unit                   text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  rotation_enabled              boolean not null default true,
  show_previous_performance     boolean not null default true,
  show_rpe                      boolean not null default true,
  default_rest                  text not null default 'goal-based'
                                  check (default_rest in ('short', 'standard', 'long', 'goal-based')),
  physio_reminder               boolean not null default true,
  pain_tracking                 boolean not null default true,
  auto_advance_phase            boolean not null default false,
  reduce_motion                 boolean not null default false,
  compact_mode                  boolean not null default false,
  -- Notification settings (stored as jsonb for flexibility)
  notifications                 jsonb not null default '{
    "workoutReminders": true,
    "workoutReminderTime": "07:00",
    "workoutReminderDays": [1,2,3,4,5],
    "physioMorning": true,
    "physioMorningTime": "07:30",
    "physioEvening": true,
    "physioEveningTime": "20:00",
    "streakWarning": true,
    "progressiveOverloadMilestone": true
  }'::jsonb,
  updated_at                    timestamptz not null default now(),
  unique (user_id)
);

alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: workout_sessions
-- One row per training session.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists workout_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references user_profiles(id) on delete cascade,
  date                date not null,
  split_day           text not null,
  total_volume_kg     numeric(10,2) not null default 0,
  duration_minutes    smallint check (duration_minutes between 0 and 480),
  session_notes       text,
  completed_at        timestamptz,
  is_partial          boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table workout_sessions enable row level security;

create policy "Users can view own sessions"
  on workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on workout_sessions for delete
  using (auth.uid() = user_id);

create index idx_workout_sessions_user_date
  on workout_sessions (user_id, date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: exercise_logs
-- One row per exercise per session.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists exercise_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  session_id  uuid not null references workout_sessions(id) on delete cascade,
  exercise_id text not null,
  logged_at   timestamptz not null default now()
);

alter table exercise_logs enable row level security;

create policy "Users can view own exercise logs"
  on exercise_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own exercise logs"
  on exercise_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own exercise logs"
  on exercise_logs for delete
  using (auth.uid() = user_id);

create index idx_exercise_logs_user_exercise
  on exercise_logs (user_id, exercise_id, logged_at desc);

create index idx_exercise_logs_session
  on exercise_logs (session_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: set_logs
-- One row per set within an exercise log.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists set_logs (
  id                uuid primary key default uuid_generate_v4(),
  exercise_log_id   uuid not null references exercise_logs(id) on delete cascade,
  user_id           uuid not null references user_profiles(id) on delete cascade,
  set_number        smallint not null check (set_number between 1 and 20),
  reps_completed    smallint not null check (reps_completed between 0 and 200),
  weight_used       numeric(6,2) not null default 0 check (weight_used >= 0),
  weight_unit       text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  rpe               numeric(3,1) check (rpe between 1 and 10),
  notes             text,
  logged_at         timestamptz not null default now()
);

alter table set_logs enable row level security;

create policy "Users can view own set logs"
  on set_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own set logs"
  on set_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own set logs"
  on set_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own set logs"
  on set_logs for delete
  using (auth.uid() = user_id);

create index idx_set_logs_exercise_log
  on set_logs (exercise_log_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: personal_records
-- Best performance per exercise per user.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists personal_records (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  exercise_id           text not null,
  weight_used           numeric(6,2) not null check (weight_used >= 0),
  reps_at_weight        smallint not null check (reps_at_weight between 1 and 100),
  estimated_one_rep_max numeric(6,2) not null check (estimated_one_rep_max >= 0),
  achieved_at           timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table personal_records enable row level security;

create policy "Users can view own PRs"
  on personal_records for select
  using (auth.uid() = user_id);

create policy "Users can upsert own PRs"
  on personal_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_personal_records_user
  on personal_records (user_id, exercise_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: progression_flags
-- Records accept/ignore decisions on overload suggestions.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists progression_flags (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references user_profiles(id) on delete cascade,
  exercise_id         text not null,
  session_id          uuid references workout_sessions(id) on delete set null,
  current_weight_kg   numeric(6,2) not null,
  suggested_weight_kg numeric(6,2) not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'accepted', 'ignored', 'custom')),
  custom_weight_kg    numeric(6,2),
  created_at          timestamptz not null default now()
);

alter table progression_flags enable row level security;

create policy "Users can view own progression flags"
  on progression_flags for select
  using (auth.uid() = user_id);

create policy "Users can upsert own progression flags"
  on progression_flags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_progression_flags_user_exercise
  on progression_flags (user_id, exercise_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: body_weight_logs
-- Daily body weight tracking.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists body_weight_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references user_profiles(id) on delete cascade,
  weight_kg   numeric(5,1) not null check (weight_kg between 20 and 500),
  logged_at   timestamptz not null default now(),
  unique (user_id, logged_at::date)
);

alter table body_weight_logs enable row level security;

create policy "Users can view own weight logs"
  on body_weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can upsert own weight logs"
  on body_weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_body_weight_logs_user_date
  on body_weight_logs (user_id, logged_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: auto-create settings row on profile insert
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function create_default_settings()
returns trigger as $$
begin
  insert into user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_create_default_settings
  after insert on user_profiles
  for each row execute function create_default_settings();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: update PR on new set_log insert
-- Upserts the personal_records table when a new set is heavier than the stored PR.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function maybe_update_personal_record()
returns trigger as $$
declare
  v_exercise_id   text;
  v_weight_kg     numeric;
  v_e1rm          numeric;
begin
  -- Resolve exercise_id from exercise_logs
  select el.exercise_id
  into v_exercise_id
  from exercise_logs el
  where el.id = new.exercise_log_id;

  if v_exercise_id is null then
    return new;
  end if;

  -- Convert lb to kg if needed
  v_weight_kg := case
    when new.weight_unit = 'lb' then new.weight_used / 2.20462
    else new.weight_used
  end;

  -- Epley 1RM estimate
  v_e1rm := v_weight_kg * (1.0 + new.reps_completed::numeric / 30.0);

  insert into personal_records
    (user_id, exercise_id, weight_used, reps_at_weight, estimated_one_rep_max, achieved_at)
  values
    (new.user_id, v_exercise_id, v_weight_kg, new.reps_completed, round(v_e1rm, 2), now())
  on conflict (user_id, exercise_id)
  do update set
    weight_used           = excluded.weight_used,
    reps_at_weight        = excluded.reps_at_weight,
    estimated_one_rep_max = excluded.estimated_one_rep_max,
    achieved_at           = excluded.achieved_at
  where excluded.estimated_one_rep_max > personal_records.estimated_one_rep_max;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_pr_on_set
  after insert on set_logs
  for each row execute function maybe_update_personal_record();
