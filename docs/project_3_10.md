# Project 3/10 — Home Maintenance Scheduler (3‑Day Weekend Build)

## 0) Five 3‑Day Weekend Project Ideas (and why they fit)
1. **Home Maintenance Scheduler** (selected) — asset CRUD + recurring tasks + calendar + history log; very shippable in 3 days.
2. **Personal “Link Vault”** — save links, tags, notes; search + reading queue.
3. **Workout Planner + PR Tracker** — routines + workout log + simple charts.
4. **Expense Splitter for Trips** — participants + expenses + settlement suggestions.
5. **Plant Watering Tracker** — plant profiles + schedules + last-watered + reminders.

**Already done in this repo (do not repeat):**
- Personal “Now” Dashboard (project_march_8.md)
- Recipe & Grocery Generator (project_march_9.md)
- Habit & Streak Tracker (previous version of project_3_10.md)

This document specifies **Home Maintenance Scheduler**.

---

## 1) Goal & Product Definition
Build a small web app that helps a homeowner track **assets** (appliances, fixtures, vehicles, filters) and manage **recurring maintenance tasks** (e.g., “Replace HVAC filter every 90 days”, “Descale kettle monthly”), with a clear “What’s due” view and a maintenance history.

**Primary user:** Dominic (single-user MVP; multi-user ready).

**North-star UX:** Open app → see what’s due this week → mark completed in <10 seconds → next due date updates correctly → history remains searchable.

### Non-goals (MVP)
- No SMS/push notifications.
- No vendor integrations (e.g., Google Calendar).
- No barcode/receipt scanning.

---

## 2) Core Requirements (MVP)

### 2.1 Authentication
- User can log in / log out.
- All data is private per user.

**Acceptance criteria**
- Unauthenticated API requests return 401.
- A user cannot access or mutate other users’ assets/tasks/records.

---

### 2.2 Asset Management
A user can create and manage **assets**.

**Asset fields (MVP)**
- Name (required) — e.g., “Furnace”, “Dishwasher”, “Car”, “Water softener”
- Category (required) — enum: `HVAC`, `KITCHEN`, `PLUMBING`, `ELECTRICAL`, `VEHICLE`, `OUTDOOR`, `OTHER`
- Location (optional) — free text (e.g., “Basement”, “Kitchen”)
- Manufacturer (optional)
- Model number (optional)
- Serial number (optional)
- Purchase date (optional)
- Notes (optional)
- Is archived (boolean)

**Acceptance criteria**
- Create/edit/archive assets.
- Archived assets are hidden by default but can be viewed.

---

### 2.3 Maintenance Task Templates (Recurring Tasks)
A user can define recurring maintenance tasks, optionally linked to an asset.

**Task fields (MVP)**
- Title (required) — e.g., “Replace filter”
- Description (optional)
- Asset (optional FK)
- Recurrence type (required):
  - `EVERY_N_DAYS`
  - `EVERY_N_WEEKS`
  - `EVERY_N_MONTHS`
  - `EVERY_N_YEARS`
- Interval (required integer >= 1)
- Start date (defaults to today)
- Due date strategy (required):
  - `FROM_START_DATE` (pure schedule)
  - `FROM_LAST_COMPLETION` (most common: next due is computed from completion date)
- Grace window days (optional int, default 0): show as “due soon” before due date
- Priority (optional): `LOW`, `MEDIUM`, `HIGH`
- Is active (default true)
- Is archived (default false)

**Computed fields**
- Next due date (computed)
- Status (computed): `OVERDUE`, `DUE_SOON`, `UPCOMING`, `SCHEDULED`

**Acceptance criteria**
- Create/edit/archive task templates.
- A task can exist without an asset.
- Next due date is computed consistently on backend and frontend.

---

### 2.4 Maintenance Records (Completions / History)
The user can record that a task was completed.

**Record fields (MVP)**
- Task template (required FK)
- Completed date (required, date)
- Notes (optional)
- Cost (optional decimal)
- Performed by (optional) — free text (e.g., “me”, “HVAC company”)
- Attachment URL (optional, skip upload in MVP; store a URL)

**Behavior**
- When a completion record is created, the task’s “last completed date” updates and **next due date** recalculates according to strategy.

**Acceptance criteria**
- User can add a completion record from the Due view and from task detail.
- History shows records newest-first and is filterable by asset and date range.

---

### 2.5 Due View (Core UX)
The app shows a prioritized list of tasks.

**Sections**
- Overdue
- Due soon (within grace window OR within next 7 days)
- Upcoming (next 30 days)

Each row shows:
- Task title
- Asset name (if any)
- Next due date
- Status pill
- Quick actions: “Mark done”

**Acceptance criteria**
- Page loads with one request (or two max).
- Marking done immediately refreshes status and due date.

---

### 2.6 Search & Filtering
- Search tasks/assets by text (title/name).
- Filter tasks by category, asset, status.

**Acceptance criteria**
- Searching "filter" returns tasks like “Replace HVAC filter”.

---

## 3) Non-Functional Requirements

### 3.1 Performance
- “Due” view should render quickly with bounded queries.
- Avoid N+1 queries (prefetch related asset).

### 3.2 Reliability & Correctness
- Recurrence calculation must be unit-tested.
- Date handling is explicit (date-only, not datetime).

### 3.3 Security
- Strong object-level permissions.
- Validate all user inputs.

### 3.4 UX Quality
- Clear empty/loading/error states.
- Keyboard accessible forms and buttons.

---

## 4) Backend Technical Spec (Django + DRF)

### 4.1 Suggested Stack
- Django + Django REST Framework
- DB: SQLite acceptable for weekend; models should be PostgreSQL-ready.

### 4.2 Django Apps
- Create app: `maintenance`
- API base path: `/api/maintenance/…`

---

### 4.3 Data Model

#### Asset
- `id` (UUID)
- `user` (FK → auth user)
- `name` (CharField)
- `category` (CharField choices)
- `location` (CharField blank)
- `manufacturer` (CharField blank)
- `model_number` (CharField blank)
- `serial_number` (CharField blank)
- `purchase_date` (DateField null/blank)
- `notes` (TextField blank)
- `is_archived` (BooleanField default False)
- `created_at`, `updated_at`

**Constraints / Indexes**
- Index: `(user, is_archived, category)`

#### MaintenanceTask
(Recurring task template)
- `id` (UUID)
- `user` (FK)
- `asset` (FK → Asset, null/blank, on_delete=SET_NULL)
- `title` (CharField)
- `description` (TextField blank)
- `recurrence_type` (choices)
- `interval` (PositiveSmallIntegerField)
- `start_date` (DateField)
- `due_strategy` (choices: `FROM_START_DATE`, `FROM_LAST_COMPLETION`)
- `grace_days` (PositiveSmallIntegerField default 0)
- `priority` (choices: `LOW`, `MEDIUM`, `HIGH`; default `MEDIUM`)
- `is_active` (BooleanField default True)
- `is_archived` (BooleanField default False)
- **Denormalized helper fields (optional but recommended for speed):**
  - `last_completed_date` (DateField null/blank)
  - `next_due_date` (DateField null/blank)
- `created_at`, `updated_at`

**Constraints / Indexes**
- Index: `(user, is_archived, is_active, next_due_date)`
- Validation: interval >= 1; recurrence_type required

#### MaintenanceRecord
(Completion history)
- `id` (UUID)
- `user` (FK) *(denormalized for permission checks)*
- `task` (FK → MaintenanceTask)
- `completed_date` (DateField)
- `notes` (TextField blank)
- `cost` (DecimalField null/blank)
- `performed_by` (CharField blank)
- `attachment_url` (URLField blank)
- `created_at`

**Constraints / Indexes**
- Index: `(user, completed_date)` and `(task, completed_date)`

---

### 4.4 Recurrence & Status Logic
Implement in a pure-python service module, e.g. `maintenance/services/recurrence.py`.

**Key functions**
- `compute_next_due_date(task: MaintenanceTask, from_date: date) -> date`
  - `from_date` is either `task.start_date` or `record.completed_date` depending on strategy.
- `compute_status(next_due: date, today: date, grace_days: int) -> Status`

**Rules (MVP, must be documented and consistent)**
- All calculations are **date-only**.
- `DUE_SOON` if `today >= next_due - grace_days` and `today < next_due`.
- `OVERDUE` if `today > next_due`.
- `UPCOMING` if next_due within next 30 days but not due soon.
- `SCHEDULED` otherwise.

**Month/year recurrence**
- Use `dateutil.relativedelta` to add months/years.
- Day-of-month edge cases: if starting on 31st, adding a month should clamp to end-of-month (relativedelta does this sensibly).

**When creating/updating a task**
- If `next_due_date` is empty, compute from `start_date`.

**When creating a completion record**
- Update `last_completed_date` to record.completed_date.
- Recompute `next_due_date`:
  - If strategy `FROM_LAST_COMPLETION`: from record.completed_date
  - Else: from task.start_date, but advance forward until > today (or until after last completion) — choose one behavior and test it. Recommendation:
    - `FROM_START_DATE`: compute schedule anchored at start_date and choose the **next occurrence after today**.

---

### 4.5 API Endpoints (DRF)
All endpoints require authentication.

#### Assets
- `GET /api/maintenance/assets/?archived=false&category=HVAC&search=...`
- `POST /api/maintenance/assets/`
- `GET /api/maintenance/assets/{id}/`
- `PATCH /api/maintenance/assets/{id}/`
- `DELETE /api/maintenance/assets/{id}/` (soft archive)

#### Tasks
- `GET /api/maintenance/tasks/?archived=false&active=true&status=OVERDUE&asset_id=...&search=...`
- `POST /api/maintenance/tasks/`
- `GET /api/maintenance/tasks/{id}/`
- `PATCH /api/maintenance/tasks/{id}/`
- `DELETE /api/maintenance/tasks/{id}/` (soft archive)

#### Due Summary (optimized)
- `GET /api/maintenance/due/?date=YYYY-MM-DD&window_days=30`

**Response**
```json
{
  "today": "2026-03-10",
  "overdue": [ { "task": {..}, "asset": {..}, "next_due_date": "...", "status": "OVERDUE" } ],
  "due_soon": [ ... ],
  "upcoming": [ ... ]
}
```

#### Records
- `GET /api/maintenance/records/?task_id=...&asset_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/maintenance/records/`

**Create payload**
```json
{ "task_id": "…", "completed_date": "YYYY-MM-DD", "notes": "…", "cost": "19.99" }
```

**Behavior**
- On create: update task.last_completed_date and task.next_due_date; return updated task summary.

#### Task timeline / calendar (optional MVP)
- `GET /api/maintenance/tasks/{id}/timeline/?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Returns computed due dates + completion dates (helps build a calendar UI).

---

### 4.6 Permissions
- Default: authenticated.
- Object-level: `obj.user == request.user` for Asset/Task/Record.

---

### 4.7 Validation & Edge Cases
- Prevent record creation for archived tasks.
- If a task is linked to an archived asset, keep it but show asset as archived (or disallow linking on update).
- Ensure `next_due_date` is always set for active tasks.

---

### 4.8 Testing (Minimum)
- Recurrence unit tests:
  - every N days
  - monthly from Jan 31st
  - strategy FROM_LAST_COMPLETION vs FROM_START_DATE
- API tests:
  - cannot read other user’s tasks
  - due endpoint sections correct
  - creating record updates next_due_date

---

## 5) Frontend Technical Spec (React + Vite + TypeScript)

### 5.1 Stack
- React + Vite + TypeScript
- Data fetching: TanStack Query
- Routing: React Router
- Styling: Tailwind (or match existing repo conventions)

### 5.2 Frontend Architecture
- `src/api/maintenance.ts` — typed API client functions
- `src/features/maintenance/`:
  - `DuePage.tsx`
  - `AssetsPage.tsx`
  - `AssetDetailPage.tsx`
  - `TaskDetailPage.tsx`
  - `HistoryPage.tsx`
  - components: `DueTaskRow`, `TaskForm`, `AssetForm`, `StatusPill`, `RecordModal`, `FilterBar`

---

### 5.3 Pages & Components

#### A) DuePage (`/` or `/maintenance/due`)
- Query: `GET /api/maintenance/due`
- Render sections: Overdue, Due soon, Upcoming.

**Row content**
- Title, asset name, due date, status pill, priority indicator.

**Primary action: Mark done**
- Opens `RecordModal` prefilled with today’s date.
- On submit: `POST /api/maintenance/records/` then invalidates `due` query.

#### B) AssetsPage (`/maintenance/assets`)
- List assets with search + category filter.
- CTA: “Add asset”.

#### C) AssetDetailPage (`/maintenance/assets/:id`)
- Shows asset info + tasks linked to it.
- CTA: “Add task for this asset”.

#### D) TaskDetailPage (`/maintenance/tasks/:id`)
- Shows task definition + computed next due + last completed.
- Shows record history table.
- CTA: “Add completion record”.

#### E) HistoryPage (`/maintenance/history`)
- Query records by date range (default last 90 days).
- Filters: asset, task, cost present.

---

### 5.4 UI/UX Details
- Status colors:
  - OVERDUE: red
  - DUE_SOON: amber
  - UPCOMING: blue/gray
- Quick filters at top of DuePage: `All`, `HVAC`, `Kitchen`, `Vehicle`, `Overdue`.
- Empty states:
  - No tasks: prompt to create first task.
  - No overdue: show a small “All caught up” card.

---

### 5.5 Error Handling
- Global toast for errors.
- Disable submit buttons while in-flight; show inline form errors from API.

---

### 5.6 Frontend Testing (MVP)
- Component test: StatusPill rendering.
- Integration test: DuePage renders sections given mocked response.

---

## 6) Data/Date Conventions (Critical)
- Client sends dates as `YYYY-MM-DD`.
- Server stores date-only (Django `DateField`).
- “Today” determined on server; allow `?date=` override for testing.

---

## 7) 3‑Day Build Plan

### Day 1
- Create `maintenance` app, models, migrations
- Assets CRUD API + basic UI
- Tasks CRUD API + compute `next_due_date` on save

### Day 2
- Records API; on record create update task due dates
- Due summary endpoint
- DuePage UI with mark-done flow
- Unit tests for recurrence

### Day 3
- Task/Asset detail pages + history view
- Search/filter polish
- Permissions tests, edge cases, linting
- Small UX polish (empty states, quick filters)

---

## 8) Open Implementation Choices (make a call; no user input required)
- Prefer session auth if repo already uses it.
- Use `python-dateutil` for month/year recurrence.
- Store `next_due_date` denormalized on the task for simple querying; recompute on task update and record create.
