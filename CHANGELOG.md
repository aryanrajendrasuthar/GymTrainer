# Changelog

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2.0.1] — 2026-05-21

### Added — Yoga Exercise Library
- 8 new yoga poses added to the home & mobility exercise library: Mountain Pose (Tadasana), Tree Pose (Vrksasana), Warrior I (Virabhadrasana I), Warrior II (Virabhadrasana II), Wide-Legged Forward Fold (Prasarita Padottanasana), Downward-Facing Dog (Adho Mukha Svanasana), Happy Baby Pose (Ananda Balasana), Legs Up the Wall (Viparita Karani)
- All poses include shoulder/cervical/L4-L5 modifications documented inline in instructions and common mistakes
- All YouTube IDs verified and sourced from Yoga with Adriene's Foundations of Yoga series

### Added — Dad Split Yoga Integration
- Day 3 (Lower Body & Balance): Warrior II and Tree Pose replace standing hip flexor stretch and figure-four; alt variant uses Warrior I and Tree Pose
- Day 4 (Yoga Flow & Deep Flexibility): Full standing-to-floor yoga sequence — Mountain → Down Dog → Warrior I → Warrior II → Wide-Legged Fold → Happy Baby → Spinal Twist → Corpse; alt variant uses gentle floor-first flow with Legs Up Wall
- Day 6 (Active Recovery & Breathing): Mountain Pose and Legs Up Wall replace seated ankle circles and knee-to-chest; alt variant adds Happy Baby

### Added — Exercise Media in Workout & Physio Screens
- `ExerciseMediaTabs` (Video + Muscle Map) added to the live workout session screen — tapping the play button now opens a bottom sheet with both the YouTube tutorial and the anatomical muscle activation diagram, not just video
- `ExerciseMediaTabs` added to physio exercise cards — expanding any rehab exercise now shows the video and a red/green muscle map (affected vs rehabilitating) before the text instructions

---

## [2.0.0] — 2025-05-21

### Added — AI Coaching
- Voice coach: speech-to-text input with Groq-powered responses and text-to-speech playback
- Post-workout AI tip fetched after every completed session
- Weekly training summary generated from session history
- Freeform text coach on the `/coach` page with conversation history

### Added — Dashboard Polish (V-2)
- Lifetime stats card with all-time PRs, total volume, and workout count
- Recent PRs card with e1RM trend chips
- Weekly summary card with current-week volume and set count
- Week comparison card — this week vs last week across sessions, volume, duration, sets
- Weight nudge banner when logged body weight diverges from profile weight
- Goal check-in modal (28-day cycle) with progress rating and split nudge
- Today workout card with scheduled exercises and readiness indicators

### Added — Progress & Analytics
- Activity heatmap (13-week calendar with volume intensity shading)
- Training load card with ACWR zone bar and 12-week area chart
- Muscle balance radar chart
- Body fat trend chart
- Split adherence card
- Session rating chart
- TDEE card with macro breakdown
- Weekly volume targets card per muscle group
- Stagnation detection card
- Sleep/performance correlation chart
- Measurement trend chart
- Volume chart peak-week label

### Added — Physio Module
- Pain trend chart with phase indicators
- Add injury sheet with 24 conditions across 5 groups, phase + severity selection

### Added — Workout
- Rest timer with presets (1m / 1.5m / 2m / 3m), ring progress, audio chimes, vibration
- e1RM chip on completed sets in set logger
- Previous performance panel with avg weight chip
- Superset pairing with alternating exercise UI
- Session split sheet — split workout into "Now" and "Later" buckets
- Exercise picker with selected-count chip
- Custom exercise builder with muscle and equipment chips
- Readiness check before session start
- Cooldown card shown after last set
- Next exercise preview button

### Added — Settings & Profile
- Goal change sheet with split nudge on goal mismatch
- Profile edit sheet with live BMI indicator and unsaved-changes chip
- Theme toggle (dark / system)
- Weight unit toggle (kg / lb)

### Added — Infrastructure
- PWA manifest and service worker for offline-first install
- Data export (JSON download of all user data)
- Global error boundary with recovery UI
- Offline banner with sync status
- Keep-alive GitHub Actions workflow for Render free tier
- Cross-device data sync via `useDataSync` hook on app load

### Fixed
- All React hooks violations (no hooks after early returns)
- All ESLint unused-variable and unused-import errors (28 errors → 0)
- Unescaped entities in JSX
- Missing `useMemo` dependency arrays

---

## [1.0.0] — 2025-04-15

### Added — Sprint 1: Core
- Email/password authentication via Supabase Auth
- Google OAuth sign-in
- Onboarding flow: goal → split → profile → plan summary
- Exercise library with 200+ evidence-based exercises, muscle activation diagrams, cues
- Workout logging: set-by-set with weight, reps, RPE
- Session persistence and backend sync (fire-and-forget)

### Added — Sprint 2: Training & Progress
- Workout split management (PPL, Upper/Lower, Full Body, etc.)
- Physio condition system with phase-gated rehab protocols
- Body weight logging and chart
- Personal records detection and display
- Volume tracking by muscle group

### Added — Sprint 3: Intelligence
- Progression engine with overload recommendations
- Achievements system (40+ unlockable badges)
- In-app notification system (push + in-app)
- Glossary with 64 clinical terms and inline tooltips
- Warmup protocol cards per split type

### Added — Sprint 4: UX & Nutrition
- Nutrition log with macro tracking
- Deload suggestion banner (triggered by ACWR overreaching)
- Muscle volume chart
- Zustand v5 stores with IndexedDB persistence (offline-first)

### Added — Sprint 5: Sync & Polish
- Cross-device data sync on mount
- Pain trend chart for active physio conditions
- Session delete and native share
- e1RM display on completed sets

### Added — Sprint 6: Production
- Achievements page with tier grouping and lock states
- Offline banner
- JSON data export
- Global error boundary
- PWA install prompt
- Production build verification (TypeScript + ESLint clean)

---

[2.0.0]: https://github.com/aryansuthar/trainer/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/aryansuthar/trainer/releases/tag/v1.0.0
