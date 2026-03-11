# Project 3/11 — Workout Planner + PR Tracker (3‑Day Weekend Build)

## 0) Five 3‑Day Weekend Project Ideas (pick 1)
1) **Workout Planner + PR Tracker** (selected) — routines, workouts, sets, personal records, simple charts.
2) **Personal Link Vault + Reading Queue** — save links, tags, notes; search; read-later queue.
3) **Home Inventory + Warranty Tracker** — assets, receipts (URL), warranty expiry reminders.
4) **Meal Prep Scheduler** — plan meals for the week, generate a prep checklist, reuse templates.
5) **Meeting Notes + Action Items Hub** — notes per meeting, extracted action items, due dates.

### Already done in this repo (do not repeat)
From existing docs in `/home/dplouffe/projects/larry/docs/`:
- Personal “Now” Dashboard
- Recipe & Grocery Generator
- Personal CRM & Reminders
- Home Maintenance Scheduler
- Static-Site Content Manager

This document specifies **Workout Planner + PR Tracker**.

---

## 1) Goal & Product Definition
Build a small web app to:
- define workout routines (templates)
- log workouts quickly (exercise → sets → reps/weight/time)
- automatically calculate **PRs** (personal records)
- view progress over time (simple charts)

**Primary user:** Dominic (single-user MVP; multi-user ready design).

**North-star UX:** Open app → start workout → log sets fast → finish → see PRs and recent history immediately.

### Non-goals (MVP)
- No social sharing, no coach features.
- No wearable integrations.
- No complex periodization programming.
- No nutrition tracking.

---

## 2) Core Requirements (MVP)

### 2.1 Authentication
- User can log in / log out.
- All workout data is private per user.

**Acceptance criteria**
- Unauthenticated requests return 401.
- Users cannot access others’ data.

---

### 2.2 Exercise Library
The user can create and manage exercises.

**Exercise fields (MVP)**
- Name (required) — e.g., “Bench Press”, “Squat”, “Pull-up”
- Type (required) — enum:
  - `WEIGHT_REPS` (e.g., 3x5 @ 185)
  - `BODYWEIGHT_REPS` (e.g., 3x8 pull-ups)
  - `TIME` (e.g., plank 60s)
  - `DISTANCE_TIME` (optional MVP) (e.g., run 5km in 25:00)
- Muscle group (optional) — enum: `CHEST`, `BACK`, `LEGS`, `SHOULDERS`, `ARMS`, `CORE`, `FULL_BODY`, `CARDIO`, `OTHER`
- Notes (optional)
- Is archived (boolean)

**Acceptance criteria**
- Create/edit/archive exercises.
- Archived exercises are hidden by default but can be used for historical logs.

---

### 2.3 Routine Templates
The user can define routines (workout templates) composed of ordered routine items.

**Routine fields**
- Name (required) — e.g., “Push Day A”
- Description (optional)
- Is archived (boolean)

**RoutineItem fields**
- Routine (FK)
- Exercise (FK)
- Order index (int)
- Target sets (optional int)
- Target reps range (optional, e.g., 5–8)
- Target weight (optional decimal)
- Rest seconds (optional int)
- Notes (optional)

**Acceptance criteria**
- User can create a routine, add exercises, reorder items.
- Routine can be used to prefill a new workout log.

---

### 2.4 Workout Logging
The user can start and finish workouts and log sets.

**Workout fields**
- Started at (datetime)
- Ended at (datetime, optional until finished)
- Title (optional; default from routine)
- Routine (optional FK)
- Notes (optional)

**WorkoutExercise fields**
- Workout (FK)
- Exercise (FK)
- Order index (int)
- Notes (optional)

**SetEntry fields** (for weight/reps & bodyweight)
- WorkoutExercise (FK)
- Set number (int)
- Weight (decimal, nullable)
- Reps (int, nullable)
- RPE (optional decimal 0–10)
- Is warmup (boolean default false)
- Notes (optional)

**TimedEntry fields** (for time-based)
- WorkoutExercise (FK)
- Set number (int)
- Duration seconds (int)
- Notes (optional)

(Implementation can model these as a single `WorkoutSet` with nullable fields + validation by exercise type.)

**Acceptance criteria**
- Start a workout from a routine (prefills exercises).
- Add/remove exercises during a workout.
- Add sets quickly with minimal friction (keyboard-first is ideal).
- Finish workout persists everything.

---

### 2.5 Personal Records (PRs)
The system computes PRs per exercise for key metrics.

**PR definitions (MVP)**
- For `WEIGHT_REPS` exercises:
  - **Max weight** for a given rep count (simple): track best “weight” across all sets.
  - Optional: **estimated 1RM** (Epley) from each set: `1RM = weight * (1 + reps/30)`.
- For `BODYWEIGHT_REPS`:
  - Max reps in a set.
- For `TIME`:
  - Longest duration.

**Acceptance criteria**
- After logging a workout, PRs update.
- “PRs” page shows current bests and recent PR events.

**Note**: keep PR logic deterministic and unit tested.

---

### 2.6 History & Search
- View list of past workouts sorted newest-first.
- View workout detail (exercises + sets).
- Filter history by date range and exercise.

**Acceptance criteria**
- Searching “bench” shows workouts containing Bench Press.

---

### 2.7 Progress Visualization (simple)
- For a selected exercise, show a simple trend chart:
  - either estimated 1RM over time (for weight/reps)
  - or max reps/duration over time

**Acceptance criteria**
- Chart loads fast and handles empty states.

---

## 3) Non-Functional Requirements

### 3.1 Performance
- History pages should avoid N+1 queries (prefetch related exercises and sets).
- PR computation should be incremental (recompute for a single workout or exercise) but a full rebuild endpoint is acceptable for MVP.

### 3.2 Correctness
- Units are explicit:
  - Weight unit: default lbs (configurable later); store unit on user or as setting; for MVP assume lbs.
  - Time is stored in seconds.
- Validation depends on exercise type.

### 3.3 Security
- Object-level permissions: `obj.user == request.user`.
- CSRF/session handling consistent with the repo’s patterns.

### 3.4 UX Quality
- Fast data entry.
- Clear loading/empty/error states.
- Accessible forms (labels, focus states).

---

## 4) Backend Technical Spec (Django + DRF)

### 4.1 Suggested Stack
- Django + Django REST Framework
- DB: SQLite acceptable for dev; models PostgreSQL-ready.

### 4.2 Django Apps
Create app: `workouts`
- API base path: `/api/workouts/…`

### 4.3 Data Model

#### Exercise
- `id` (UUID)
- `user` (FK)
- `name` (CharField)
- `exercise_type` (choices: WEIGHT_REPS, BODYWEIGHT_REPS, TIME, DISTANCE_TIME)
- `muscle_group` (choices, blank allowed)
- `notes` (TextField blank)
- `is_archived` (Boolean default False)
- `created_at`, `updated_at`

**Indexes/constraints**
- Unique constraint: `(user, name)` (case-insensitive preferred; for MVP just enforce unique + normalize in serializer).
- Index: `(user, is_archived, name)`

#### Routine
- `id` (UUID)
- `user` (FK)
- `name` (CharField)
- `description` (TextField blank)
- `is_archived` (Boolean default False)
- `created_at`, `updated_at`

#### RoutineItem
- `id` (UUID)
- `routine` (FK → Routine)
- `exercise` (FK → Exercise)
- `order` (PositiveSmallIntegerField)
- `target_sets` (PositiveSmallIntegerField null/blank)
- `target_reps_min` (PositiveSmallIntegerField null/blank)
- `target_reps_max` (PositiveSmallIntegerField null/blank)
- `target_weight` (DecimalField null/blank)
- `rest_seconds` (PositiveIntegerField null/blank)
- `notes` (TextField blank)

**Indexes**
- `(routine, order)`

#### Workout
- `id` (UUID)
- `user` (FK)
- `routine` (FK → Routine, null/blank, on_delete=SET_NULL)
- `title` (CharField blank)
- `started_at` (DateTimeField)
- `ended_at` (DateTimeField null/blank)
- `notes` (TextField blank)
- `created_at`, `updated_at`

**Indexes**
- `(user, started_at)`

#### WorkoutExercise
- `id` (UUID)
- `workout` (FK → Workout, related_name `workout_exercises`)
- `exercise` (FK → Exercise)
- `order` (PositiveSmallIntegerField)
- `notes` (TextField blank)

**Indexes**
- `(workout, order)`

#### WorkoutSet
Single table to keep MVP simple; validate by exercise type.
- `id` (UUID)
- `workout_exercise` (FK → WorkoutExercise, related_name `sets`)
- `set_number` (PositiveSmallIntegerField)
- `weight` (DecimalField null/blank)
- `reps` (PositiveSmallIntegerField null/blank)
- `duration_seconds` (PositiveIntegerField null/blank)
- `distance_meters` (PositiveIntegerField null/blank) *(optional MVP)*
- `rpe` (DecimalField null/blank)
- `is_warmup` (BooleanField default False)
- `notes` (TextField blank)
- `created_at`

**Indexes**
- `(workout_exercise, set_number)`

#### PersonalRecord
A denormalized table for “current bests” + last achieved date.
- `id` (UUID)
- `user` (FK)
- `exercise` (FK)
- `record_type` (choices):
  - `MAX_WEIGHT`
  - `MAX_REPS`
  - `MAX_DURATION`
  - `BEST_EST_1RM` *(optional MVP but recommended)*
- `value_decimal` (DecimalField) *(store weight/1RM)*
- `value_int` (IntegerField null/blank) *(store reps/duration as int if preferred; or always use decimal)*
- `achieved_at` (DateTimeField)
- `workout` (FK → Workout, null/blank)
- `notes` (TextField blank)
- `created_at`, `updated_at`

**Indexes**
- Unique constraint: `(user, exercise, record_type)`

---

### 4.4 Services
Implement PR computation in a pure-python module:
- `workouts/services/prs.py`

Functions:
- `compute_pr_candidates(workout: Workout) -> list[CandidatePR]`
- `apply_pr_candidates(user, candidates) -> list[PersonalRecord]` (upsert bests)

Rules:
- Ignore warmup sets for PR calculations.
- For WEIGHT_REPS:
  - `MAX_WEIGHT`: max `weight` among sets with `reps >= 1`
  - `BEST_EST_1RM`: max Epley estimate among sets
- For BODYWEIGHT_REPS: `MAX_REPS` = max reps
- For TIME: `MAX_DURATION` = max duration_seconds

Testing:
- Unit tests for PR logic.

---

### 4.5 API Endpoints (DRF)
All endpoints require authentication.

#### Exercises
- `GET /api/workouts/exercises/?archived=false&search=bench`
- `POST /api/workouts/exercises/`
- `GET /api/workouts/exercises/{id}/`
- `PATCH /api/workouts/exercises/{id}/`
- `DELETE /api/workouts/exercises/{id}/` (soft archive)

#### Routines
- `GET /api/workouts/routines/?archived=false`
- `POST /api/workouts/routines/` (payload includes items[])
- `GET /api/workouts/routines/{id}/`
- `PATCH /api/workouts/routines/{id}/` (edit + reorder items)
- `DELETE /api/workouts/routines/{id}/` (soft archive)

#### Workouts
- `GET /api/workouts/workouts/?from=YYYY-MM-DD&to=YYYY-MM-DD&exercise_id=…`
- `POST /api/workouts/workouts/` (create workout; optionally from routine)
- `GET /api/workouts/workouts/{id}/` (includes workout_exercises + sets)
- `PATCH /api/workouts/workouts/{id}/` (finish workout, edit notes)
- `DELETE /api/workouts/workouts/{id}/` *(optional; or restrict)*

Convenience:
- `POST /api/workouts/workouts/from-routine/` payload `{ routine_id }` creates workout scaffold.

#### PRs
- `GET /api/workouts/prs/` (list current PRs)
- `GET /api/workouts/prs/exercise/{exercise_id}/` (detail + history points)
- `POST /api/workouts/prs/rebuild/` (admin-ish for MVP; recompute from all workouts)

#### Progress data (chart)
Option A (simple): serve time series from backend.
- `GET /api/workouts/progress/?exercise_id=…&metric=EST_1RM&from=…&to=…`

---

### 4.6 Serializers & Validation
- Validate `WorkoutSet` fields based on `exercise.exercise_type`:
  - WEIGHT_REPS: require weight and reps
  - BODYWEIGHT_REPS: require reps; weight must be null
  - TIME: require duration_seconds
- Enforce reasonable ranges (reps <= 1000, weight <= 2000, duration <= 6 hours).

---

## 5) Frontend Technical Spec (React + Vite + TypeScript)

### 5.1 Stack
- React + Vite + TypeScript
- Router: React Router
- Data: TanStack Query
- Forms: React Hook Form (optional) or controlled inputs
- Styling: Tailwind (or match repo)
- Charts: lightweight chart library (Recharts) or simple SVG/Canvas chart.

### 5.2 Frontend Architecture
Feature folders:
- `src/features/workouts/`:
  - `ExercisesPage.tsx`
  - `RoutinesPage.tsx`
  - `RoutineEditor.tsx`
  - `WorkoutStartPage.tsx`
  - `WorkoutSessionPage.tsx`
  - `WorkoutDetailPage.tsx`
  - `HistoryPage.tsx`
  - `PRsPage.tsx`
  - `ExerciseProgressPage.tsx`
- `src/api/workouts.ts` typed client
- shared UI: Button, Card, Input, Modal

### 5.3 Pages

#### A) Dashboard (`/`)
- CTA: “Start workout”
- “Recent workouts” list (last 5)
- “Recent PRs” list (last 5 PR events; if not tracked separately, show updated PRs with achieved_at)

#### B) Workout start (`/workouts/start`)
- Pick a routine (or “Blank workout”)
- On select routine: create workout scaffold and navigate to session page.

#### C) Workout session (`/workouts/session/:id`)
Core logging UI.
- List exercises in order with:
  - Add set button
  - Quick inputs for weight + reps (or reps only / duration)
  - Warmup toggle
  - Set list with edit/delete
- Add exercise (search dropdown)
- Finish workout button

**UX requirements**
- Keyboard-first data entry:
  - Enter saves set
  - Auto-focus next field
- Minimal modals; inline editing preferred.

#### D) Exercises (`/workouts/exercises`)
- Search + list
- Create/edit exercise

#### E) Routines (`/workouts/routines`)
- List routines
- Create/edit routine with reorder (drag/drop optional)

#### F) History (`/workouts/history`)
- Filters: date range, exercise
- List workouts

#### G) Workout detail (`/workouts/:id`)
- Read-only view of logged sets + computed summary (optional): total sets, estimated volume.

#### H) PRs (`/workouts/prs`)
- Grid/list by exercise showing best values per metric
- Link to progress chart per exercise

#### I) Exercise progress (`/workouts/progress/:exerciseId`)
- Metric selector (e.g., Est 1RM / Max weight / Max reps)
- Line chart over time

---

## 6) API Contracts (Frontend expectations)
- All datetimes returned as ISO strings.
- Workouts detail endpoint returns nested structure:
  - workout
  - workout_exercises[]
  - each includes sets[]

PRs list endpoint returns:
- `exercise_id`, `exercise_name`, `record_type`, `value`, `achieved_at`

Progress endpoint returns time series:
- `[ { "date": "YYYY-MM-DD", "value": 225.4 } ]`

---

## 7) Testing (Minimum)

### Backend
- PR computation tests (warmup ignored; 1RM formula; max weight logic)
- Permissions tests (cannot access others’ workouts)
- Serializer validation tests (type-based fields)

### Frontend
- Component tests for SetEntry row (validation + input)
- Smoke test flow (manual checklist is OK for MVP):
  1) Create exercise
  2) Create routine
  3) Start workout from routine
  4) Log a set
  5) Finish workout
  6) Confirm PR updated

---

## 8) 3‑Day Build Plan

### Day 1
- Backend models + migrations (Exercise, Routine, Workout, WorkoutSet)
- Basic CRUD endpoints for Exercises and Routines
- Frontend skeleton + Exercises page + Routines editor

### Day 2
- Workout session logging API + UI
- Finish workout flow
- PR computation service + PR endpoints

### Day 3
- History pages + workout detail
- Progress chart endpoint + UI
- Polish: empty states, validation, performance (prefetch, pagination)
- Tests + README

---

## 9) Open Implementation Choices (make a call; no user input required)
- Weight unit: assume **lbs** for MVP; store as decimal.
- PR metrics: implement `MAX_WEIGHT` + `BEST_EST_1RM` for WEIGHT_REPS; `MAX_REPS` and `MAX_DURATION` for other types.
- Warmups excluded from PRs.
