# Project 3/10 — Habit & Streak Tracker (3‑Day Weekend Build)

## 0) Five 3‑Day Weekend Project Ideas (and why they fit)
1. **Habit & Streak Tracker** (selected) — CRUD + streak math + calendar UI + simple analytics.
2. **Home Maintenance Scheduler** — assets (appliances), recurring maintenance tasks, reminders, history log.
3. **Personal “Link Vault”** — save links, tags, notes, full‑text search, reading queue.
4. **Workout Planner + PR Tracker** — exercises, routines, logging sets/reps/weight, simple charts.
5. **Expense Splitter for Trips** — participants, expenses, settlements, export/share.

**Already done in this repo (do not repeat):**
- Personal “Now” Dashboard (project_march_8.md)
- Recipe & Grocery Generator (project_march_9.md)

This document specifies **Habit & Streak Tracker**.

---

## 1) Goal & Product Definition
Build a small web app that helps a user define habits, check them off daily/weekly, and track streaks with a calendar view and lightweight insights.

**Primary user:** Dominic (single-user MVP; design should be multi-user ready).

**North-star UX:** Open app → see today’s habits → check off in <5 seconds → streaks update correctly → calendar shows consistency.

### Non-goals (MVP)
- No push notifications.
- No social/sharing.
- No complex goal types (e.g., “spend < $X”, “run 10km”).

---

## 2) Core Requirements (MVP)

### 2.1 Authentication
- User can log in / log out.
- All habit and check-in data is private per user.

**Acceptance criteria**
- Unauthenticated requests to APIs return 401.
- A user cannot access or mutate other users’ habits/check-ins.

### 2.2 Habit Management
A user can create and manage habits.

**Habit fields (MVP)**
- Name (required)
- Description (optional)
- Schedule type: `DAILY` or `WEEKLY`
- If weekly: target times per week (integer, 1–7)
- Start date (defaults to today)
- Active (boolean)
- Color (optional; for UI)

**Acceptance criteria**
- Create/edit/archive (soft delete) habits.
- Archived habits are not shown on the Today view by default.

### 2.3 Check-ins (Completions)
A user can mark a habit completed for a given date.

**Rules**
- Check-ins are date-based (local date, not datetime).
- For daily habits: at most **one** check-in per day.
- For weekly habits: check-ins still occur on specific dates; weekly completion is derived from counts in that week.

**Acceptance criteria**
- Toggle completion for today.
- Toggle completion for any past date within a configurable window (MVP: last 90 days).
- Idempotent behavior (toggling the same date twice results in deletion of the check-in).

### 2.4 Streak Calculation
The app must compute streaks reliably.

**Definitions**
- **Daily habit streak:** consecutive days with a check-in.
- **Weekly habit streak:** consecutive weeks where weekly target is met.

**Acceptance criteria**
- Streak values are consistent between backend and frontend.
- Streaks respect the habit’s start date.

### 2.5 Views / UX (MVP)

#### A) Today
- Shows active habits.
- Each habit row shows:
  - name
  - schedule (daily or weekly target)
  - completion state for today
  - current streak
- Quick toggle completion.

#### B) Habit Detail
- Stats summary: current streak, best streak, total check-ins.
- Calendar heatmap or month grid showing completion by day.
- Ability to toggle completion for a date.

#### C) Insights
- Simple list/cards:
  - “Most consistent” (highest completion rate in last 30 days)
  - “At risk” (no check-in in last N days for daily habits; below pace for weekly)
  - Completion chart (last 14 days) optional

---

## 3) Non-Functional Requirements

### 3.1 Performance
- Today page should render with one request (or two max): a single endpoint returning habits + today completion + computed streaks.
- Calendar view should paginate or load a bounded date range (default last 90 days).

### 3.2 Reliability & Correctness
- Streak calculations must be unit-tested.
- Date handling must be explicit and consistent (server stores dates; client sends dates).

### 3.3 Security
- Use authenticated API patterns (cookie session auth + CSRF or token/JWT—pick one and be consistent).
- Validate all user inputs.

### 3.4 UX Quality
- Clear loading/empty/error states.
- Keyboard accessible toggles and forms.

---

## 4) Backend Technical Spec (Django + DRF)

### 4.1 Suggested Stack
- Django + Django REST Framework
- DB: SQLite OK for weekend; PostgreSQL-ready models.

### 4.2 Django App
- Create a new app: `habits`.
- API base path: `/api/habits/…`

### 4.3 Data Model

#### Habit
- `id` (UUID)
- `user` (FK → auth user)
- `name` (CharField, required)
- `description` (TextField, blank)
- `schedule_type` (choices: `DAILY`, `WEEKLY`)
- `weekly_target` (PositiveSmallIntegerField, null/blank; required when schedule_type=WEEKLY)
- `start_date` (DateField)
- `is_active` (BooleanField, default True)
- `is_archived` (BooleanField, default False)
- `color` (CharField, blank; e.g. hex)
- `created_at`, `updated_at`

**Constraints / indexes**
- Index: `(user, is_archived, is_active)`
- Validation: weekly_target in 1..7 when weekly.

#### HabitCheckin
- `id` (UUID)
- `user` (FK → auth user)  *(denormalized for easier permission checks and indexes)*
- `habit` (FK → Habit)
- `date` (DateField)
- `created_at`

**Constraints / indexes**
- Unique constraint: `(habit, date)`
- Index: `(user, date)` and `(habit, date)`
- Enforce: checkin.date >= habit.start_date

#### (Optional MVP) HabitStatsSnapshot
Skip for MVP unless needed for performance. Prefer computing on the fly for bounded ranges.

### 4.4 Streak / Analytics Logic
Implement in a pure-python service module, e.g. `habits/services/streaks.py`.

**Inputs**
- Habit definition
- Set/list of check-in dates (bounded range)
- “Today” date

**Outputs**
- `current_streak`
- `best_streak` (within available history; for MVP compute within last 365 days or since start_date)
- `completion_rate_30d` for daily habits
- Weekly pace for weekly habits

**Weekly definition (important)**
- Use ISO week (Mon–Sun) OR locale default; choose one and document.
- Weekly streak increments when `count(checkins in week) >= weekly_target`.

### 4.5 API Endpoints (DRF)
All endpoints require authentication.

#### Habits CRUD
- `GET /api/habits/habits/` — list habits (query params: `archived=false|true`, `active=true|false`)
- `POST /api/habits/habits/` — create habit
- `GET /api/habits/habits/{id}/` — habit detail
- `PATCH /api/habits/habits/{id}/` — update
- `DELETE /api/habits/habits/{id}/` — soft-archive (recommended) or hard delete (not recommended)

#### Today summary (optimized)
- `GET /api/habits/today/?date=YYYY-MM-DD`

**Response**
- List of active, non-archived habits with:
  - habit fields
  - `completed_today` (boolean)
  - `current_streak`
  - `best_streak`
  - For weekly habits: `week_progress` (e.g. 2/3 this week)

#### Check-ins
- `POST /api/habits/checkins/toggle/`

**Payload**
```json
{ "habit_id": "…", "date": "YYYY-MM-DD" }
```

**Behavior**
- If check-in exists → delete it.
- If not exists → create it.

**Response**
- `completed` boolean
- Updated streak fields for that habit.

#### Habit calendar
- `GET /api/habits/habits/{id}/calendar/?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response**
- Array of dates completed
- Optional: computed per-day metadata (not required)

#### Insights
- `GET /api/habits/insights/?window_days=30`

**Response**
- Most consistent habits
- At-risk habits
- Optional summary counts

### 4.6 Permissions
- Default permission: authenticated.
- Object-level permission: `habit.user == request.user` and `checkin.user == request.user`.

### 4.7 Validation & Edge Cases
- Prevent check-ins for archived habits (either disallow or allow but hide; MVP: disallow).
- Prevent check-ins before start_date.
- Ensure weekly_target required iff schedule_type=WEEKLY.

### 4.8 Testing (Minimum)
- Streak unit tests:
  - daily streak with gaps
  - daily streak around start_date
  - weekly streak meeting/missing targets
  - ISO week boundary behavior
- API tests:
  - cannot access another user’s habits
  - toggle endpoint idempotency
  - calendar endpoint returns correct dates

---

## 5) Frontend Technical Spec (React + Vite + TypeScript)

### 5.1 Stack
- React + Vite + TypeScript
- Data fetching: TanStack Query
- Routing: React Router
- Styling: Tailwind (or match existing repo conventions)

### 5.2 Frontend Architecture
- `src/api/habits.ts` — typed API client functions
- `src/features/habits/`:
  - `TodayPage.tsx`
  - `HabitDetailPage.tsx`
  - `InsightsPage.tsx`
  - components: `HabitRow`, `HabitFormModal`, `CalendarGrid`, `StreakBadge`

### 5.3 Pages & Components

#### A) TodayPage (`/` or `/habits/today`)
- Query: `GET /api/habits/today`
- Render list of habits.
- Each habit row has a checkbox/toggle button.

**Interactions**
- Toggle completion calls `POST /api/habits/checkins/toggle/` and updates list via optimistic update.

#### B) HabitDetailPage (`/habits/:id`)
- Query habit detail + calendar range (default last 90 days).
- CalendarGrid displays month view with completed days highlighted.
- Clicking a day toggles completion (within allowed window).

#### C) InsightsPage (`/habits/insights`)
- Query: `GET /api/habits/insights?window_days=30`
- Cards: Most consistent, At risk.

#### D) Habit Create/Edit
- Modal or dedicated route.
- Fields with validation:
  - name required
  - schedule type
  - weekly target conditional
  - start date

### 5.4 UI/UX Details
- Show streak as a badge.
- Weekly habits show a progress pill (e.g., “2/3 this week”).
- Calendar range selector optional; default to last 90 days.

### 5.5 Error Handling
- Global toast/snackbar for failed requests.
- Disable toggles while mutation is in-flight (or handle optimistic rollback).

### 5.6 Frontend Testing (MVP)
- Unit test streak badge rendering and calendar day toggle behavior.
- One e2e smoke test (optional): create habit → toggle today → streak increments.

---

## 6) Data/Date Conventions (Critical)
- Client sends dates as `YYYY-MM-DD`.
- Server stores `DateField` (no timezone).
- “Today” is determined on server; client may request an explicit date for testing.
- Weekly boundaries: **ISO week (Mon–Sun)** (document and test).

---

## 7) 3‑Day Build Plan

### Day 1
- Create `habits` app + models + migrations
- Implement Habit CRUD
- Implement check-in toggle endpoint
- Basic Today page UI

### Day 2
- Implement streak service + tests
- Today endpoint returning computed fields
- Habit detail + calendar endpoint
- Calendar UI

### Day 3
- Insights endpoint + UI
- Polish UX (empty states, loading)
- Hardening: permissions tests, validation, linting
- README updates

---

## 8) Open Implementation Choices (make a call; no user input required)
- Auth approach: use whatever the repo already uses (session auth recommended for single-user).
- Streak best_streak scope: compute from start_date up to today; if too slow, cap to 365 days and document.
