-- ─────────────────────────────────────────────────────────────────────────────
-- 002_physio_schema.sql
-- Physiotherapy schema: injuries, session logs, pain tracking, phase history
-- Depends on: 001_initial_schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM-LIKE CHECK CONSTRAINTS (avoid altering shared enums later)
-- ─────────────────────────────────────────────────────────────────────────────

-- All valid PhysioCondition values
create or replace function valid_physio_condition(val text) returns boolean as $$
begin
  return val in (
    'adhesive-capsulitis',
    'cervical-strain',
    'thoracic-kyphosis',
    'scapular-winging',
    'scapular-dyskinesia',
    'l4-l5-disc-herniation',
    'l5-s1-disc-herniation',
    'coccydynia',
    'patellofemoral-pain-syndrome',
    'it-band-syndrome',
    'achilles-tendinopathy',
    'plantar-fasciitis',
    'peroneal-tendon-injury',
    'rotator-cuff-strain',
    'shoulder-impingement',
    'piriformis-syndrome',
    'si-joint-dysfunction',
    'thoracic-outlet-syndrome',
    'cervicogenic-headache',
    'whiplash'
  );
end;
$$ language plpgsql immutable;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_injuries
-- Active and historical injury/condition records per user.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists user_injuries (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  condition     text not null check (valid_physio_condition(condition)),
  body_region   text not null,
  severity      text not null default 'moderate'
                  check (severity in ('mild', 'moderate', 'severe')),
  phase         text not null default 'acute'
                  check (phase in ('acute', 'subacute', 'chronic', 'maintenance')),
  onset_date    date not null default current_date,
  resolved_date date,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table user_injuries enable row level security;

create policy "Users can view own injuries"
  on user_injuries for select
  using (auth.uid() = user_id);

create policy "Users can insert own injuries"
  on user_injuries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own injuries"
  on user_injuries for update
  using (auth.uid() = user_id);

create policy "Users can delete own injuries"
  on user_injuries for delete
  using (auth.uid() = user_id);

create trigger trg_user_injuries_updated_at
  before update on user_injuries
  for each row execute function set_updated_at();

create index idx_user_injuries_user_active
  on user_injuries (user_id, is_active, condition);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: physio_sessions
-- One row per completed physiotherapy session.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists physio_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  injury_id       uuid references user_injuries(id) on delete set null,
  condition       text not null check (valid_physio_condition(condition)),
  phase           text not null check (phase in ('acute', 'subacute', 'chronic', 'maintenance')),
  slot            text not null check (slot in ('morning', 'evening')),
  pain_before     smallint not null check (pain_before between 0 and 10),
  pain_after      smallint not null check (pain_after between 0 and 10),
  session_notes   text,
  completed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table physio_sessions enable row level security;

create policy "Users can view own physio sessions"
  on physio_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own physio sessions"
  on physio_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own physio sessions"
  on physio_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own physio sessions"
  on physio_sessions for delete
  using (auth.uid() = user_id);

create index idx_physio_sessions_user_condition
  on physio_sessions (user_id, condition, completed_at desc);

create index idx_physio_sessions_user_date
  on physio_sessions (user_id, completed_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: physio_exercise_logs
-- One row per physio exercise completed within a session.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists physio_exercise_logs (
  id                  uuid primary key default uuid_generate_v4(),
  physio_session_id   uuid not null references physio_sessions(id) on delete cascade,
  user_id             uuid not null references user_profiles(id) on delete cascade,
  exercise_id         text not null,
  sets_completed      smallint check (sets_completed between 0 and 10),
  reps_completed      smallint check (reps_completed between 0 and 200),
  hold_seconds        smallint check (hold_seconds between 0 and 600),
  pain_during         smallint check (pain_during between 0 and 10),
  notes               text,
  logged_at           timestamptz not null default now()
);

alter table physio_exercise_logs enable row level security;

create policy "Users can view own physio exercise logs"
  on physio_exercise_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own physio exercise logs"
  on physio_exercise_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own physio exercise logs"
  on physio_exercise_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own physio exercise logs"
  on physio_exercise_logs for delete
  using (auth.uid() = user_id);

create index idx_physio_exercise_logs_session
  on physio_exercise_logs (physio_session_id);

create index idx_physio_exercise_logs_user_exercise
  on physio_exercise_logs (user_id, exercise_id, logged_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: physio_phase_history
-- Records every phase transition (progression or regression) for audit trail.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists physio_phase_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references user_profiles(id) on delete cascade,
  injury_id       uuid not null references user_injuries(id) on delete cascade,
  condition       text not null check (valid_physio_condition(condition)),
  from_phase      text not null check (from_phase in ('acute', 'subacute', 'chronic', 'maintenance')),
  to_phase        text not null check (to_phase in ('acute', 'subacute', 'chronic', 'maintenance')),
  direction       text not null check (direction in ('progression', 'regression')),
  triggered_by    text not null default 'user'
                    check (triggered_by in ('user', 'auto', 'clinician')),
  reason          text,
  transitioned_at timestamptz not null default now()
);

alter table physio_phase_history enable row level security;

create policy "Users can view own phase history"
  on physio_phase_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own phase history"
  on physio_phase_history for insert
  with check (auth.uid() = user_id);

create index idx_physio_phase_history_user_injury
  on physio_phase_history (user_id, injury_id, transitioned_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: physio_pain_logs
-- Standalone daily pain check-ins (separate from session logs).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists physio_pain_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  injury_id     uuid references user_injuries(id) on delete set null,
  condition     text not null check (valid_physio_condition(condition)),
  pain_level    smallint not null check (pain_level between 0 and 10),
  context       text check (context in ('rest', 'morning', 'during-activity', 'after-activity', 'end-of-day')),
  notes         text,
  logged_at     timestamptz not null default now()
);

alter table physio_pain_logs enable row level security;

create policy "Users can view own pain logs"
  on physio_pain_logs for select
  using (auth.uid() = user_id);

create policy "Users can upsert own pain logs"
  on physio_pain_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_physio_pain_logs_user_condition
  on physio_pain_logs (user_id, condition, logged_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: auto-update injury phase when physio_phase_history row is inserted
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function sync_injury_phase_on_transition()
returns trigger as $$
begin
  update user_injuries
  set phase = new.to_phase,
      updated_at = now()
  where id = new.injury_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_sync_injury_phase
  after insert on physio_phase_history
  for each row execute function sync_injury_phase_on_transition();

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: mark injury as resolved when phase reaches 'maintenance' for 30+ days
-- Called manually or via a scheduled job — not a trigger (too expensive inline).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function resolve_long_term_maintenance_injuries()
returns void as $$
begin
  update user_injuries
  set is_active = false,
      resolved_date = current_date,
      updated_at = now()
  where is_active = true
    and phase = 'maintenance'
    and updated_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEW: active_user_injuries
-- Convenience view joining injury + latest pain log per condition.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view active_user_injuries as
select
  ui.id,
  ui.user_id,
  ui.condition,
  ui.body_region,
  ui.severity,
  ui.phase,
  ui.onset_date,
  ui.notes,
  ui.created_at,
  ui.updated_at,
  latest_pain.pain_level   as latest_pain_level,
  latest_pain.logged_at    as latest_pain_logged_at
from user_injuries ui
left join lateral (
  select ppl.pain_level, ppl.logged_at
  from physio_pain_logs ppl
  where ppl.user_id = ui.user_id
    and ppl.condition = ui.condition
  order by ppl.logged_at desc
  limit 1
) latest_pain on true
where ui.is_active = true;
