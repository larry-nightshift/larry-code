# Personal “Now” Dashboard — Requirements & Technical Spec (Django + React)

## 0) Goal
Build a single-page dashboard optimized for **daily execution**: focus for today, quick notes, and a few useful widgets.

**Primary user:** Dominic (single-user MVP).  
**North-star UX:** open app → see today at a glance → add/update items in <10 seconds.

---

## 1) MVP Feature Requirements

### 1.1 Authentication & User
- User can sign in/out.
- MVP assumes **single-user**, but implement using standard Django auth patterns so multi-user is possible later.

**Acceptance criteria**
- Unauthenticated users are redirected (or receive 401) and cannot access data.

### 1.2 Today Focus
- User can set **Today’s Focus** (single text field, e.g., 1–3 sentences).
- User can update focus any time.
- Focus is stored per-day (date) so past days are viewable.

**Acceptance criteria**
- On first open each day, focus is blank until set.
- Can view/edit today; can view previous days read-only (MVP).

### 1.3 Quick Notes
- Create/edit/delete notes.
- Notes can be:
  - **Pinned** (always visible at top)
  - **Archived** (hidden by default)
- Notes support basic fields: title (optional), body (required).
- Notes have timestamps.

**Acceptance criteria**
- Notes list updates instantly after create/edit.
- Archive removes from main view.

### 1.4 Tasks (Lightweight)
- Create/edit/complete/uncomplete tasks.
- Tasks can be grouped by **Status** (Todo / Doing / Done) or (Open/Done) for MVP.
- Optional: tasks can be assigned to a date (default today).

**Acceptance criteria**
- “Add task” is a single input + enter.
- Completing a task moves it to Done.

### 1.5 Widgets (MVP = 3)

#### (A) Weather widget
- Shows:
  - current temp
  - today high/low
  - wind
  - precipitation probability or summary
- Data source: Open-Meteo (consistent with your existing job).

#### (B) Upcoming items widget (simple)
- MVP: show “Upcoming” as a list of manually-entered items (not calendar integration yet).
- Fields: title, starts_at (datetime), optional notes.

#### (C) Timer widget
- A simple focus timer (Pomodoro-ish): start/pause/reset.
- Store sessions (optional MVP) or local-only.

**Acceptance criteria**
- Weather loads within 2s and handles failure.
- Upcoming items can be added/removed.
- Timer works without backend (MVP), backend persistence optional.

---

## 2) Non-Functional Requirements

### 2.1 Performance
- Dashboard initial load target: < 1.5s on localhost.
- API calls should be cacheable; avoid refetch loops.

### 2.2 Security
- Use HttpOnly cookies for session auth (recommended) OR DRF token auth if you prefer API-first.
- CSRF protection enabled for cookie-based auth.
- Permissions: users can only access their own objects.

### 2.3 Reliability
- Clear error states in UI (empty, loading, error).
- Graceful degradation if weather API fails.

### 2.4 Code Quality
- Backend: type hints where useful; small services; unit tests for streak/date logic and permissions.
- Frontend: TypeScript, linting, consistent component patterns.

---

## 3) Backend (Django) Technical Spec

### 3.1 Stack
- Django + Django REST Framework (DRF)
- PostgreSQL recommended (SQLite acceptable for weekend MVP)
- `django-environ` or similar for env vars

### 3.2 Apps
- `accounts` (auth helpers)
- `dashboard` (today focus + upcoming items)
- `notes`
- `tasks`
- `weather` (proxy/cache)

### 3.3 Data Model (proposed)

#### TodayFocus
- `user` (FK)
- `date` (DateField, unique per user)
- `text` (TextField)
- `created_at`, `updated_at`

Unique constraint: `(user, date)`

#### Note
- `user` (FK)
- `title` (CharField, blank)
- `body` (TextField)
- `pinned` (BooleanField)
- `archived` (BooleanField)
- `created_at`, `updated_at`

Indexes: `(user, archived, pinned, updated_at)`

#### Task
- `user` (FK)
- `text` (CharField)
- `status` (choices: TODO, DOING, DONE) OR `completed` boolean
- `due_date` (DateField, nullable)
- `position` (int, optional for ordering)
- `created_at`, `updated_at`

Indexes: `(user, status, due_date)`

#### UpcomingItem
- `user` (FK)
- `title` (CharField)
- `starts_at` (DateTimeField)
- `notes` (TextField, blank)
- `created_at`, `updated_at`

Indexes: `(user, starts_at)`

#### WeatherSnapshot (optional cache)
- `user` (FK optional; could be global)
- `location_name` (CharField)
- `lat`, `lon`
- `data` (JSONField)
- `fetched_at` (DateTimeField)

### 3.4 API Design (DRF)

**Conventions**
- JSON only
- Use DRF ViewSets + Routers
- Pagination for lists (even if small)
- Filter by `archived`, `pinned`, `due_date`, etc.

#### Auth
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

(Implementation can use session auth or JWT; pick one and be consistent.)

#### Today Focus
- `GET /api/today-focus/?date=YYYY-MM-DD` (defaults to today)
- `PUT /api/today-focus/?date=YYYY-MM-DD` (upsert)

#### Notes
- `GET /api/notes/?archived=false`
- `POST /api/notes/`
- `GET /api/notes/:id/`
- `PATCH /api/notes/:id/`
- `DELETE /api/notes/:id/`

#### Tasks
- `GET /api/tasks/?due_date=YYYY-MM-DD&status=TODO`
- `POST /api/tasks/`
- `PATCH /api/tasks/:id/`
- `DELETE /api/tasks/:id/`

Optional actions:
- `POST /api/tasks/:id/complete/`
- `POST /api/tasks/:id/uncomplete/`

#### Upcoming
- `GET /api/upcoming/?from=<iso>&to=<iso>`
- `POST /api/upcoming/`
- `PATCH /api/upcoming/:id/`
- `DELETE /api/upcoming/:id/`

#### Weather
- `GET /api/weather/current?location=ottawa`
  - Backend fetches Open-Meteo and returns normalized fields.
  - Cache for 10–30 minutes.

### 3.5 Permissions
- Default permission: authenticated.
- Object-level: user must own object.
- Avoid exposing raw user IDs in requests.

### 3.6 Testing (minimum)
- Model constraint tests: TodayFocus unique per date.
- Permission tests: cannot access others’ notes/tasks.
- Weather endpoint: handles upstream failure.

---

## 4) Frontend (React) Technical Spec

### 4.1 Stack
- Vite + React + TypeScript
- Routing: React Router
- Data fetching: TanStack Query (React Query)
- Forms: React Hook Form (or controlled inputs for MVP)
- Styling: Tailwind OR CSS modules (pick one)

### 4.2 Architecture & Patterns
- Feature folders:
  - `src/features/notes/*`
  - `src/features/tasks/*`
  - `src/features/dashboard/*`
- Shared:
  - `src/api/client.ts` (fetch wrapper)
  - `src/components/*` (UI primitives)
  - `src/lib/*` (date utils)

**State rules**
- Server state in React Query.
- Local UI state in component state.
- Do not duplicate server data into global stores unless needed.

### 4.3 Pages

#### `/` Dashboard
- Today Focus card
- Tasks card
- Notes card
- Widgets row (Weather, Upcoming, Timer)

#### `/notes`
- Optional MVP: full notes view with archive toggle.

#### `/tasks`
- Optional MVP: task management view.

### 4.4 UX Requirements
- “Quick add” interactions:
  - Add task via input + Enter
  - Add note via modal or inline editor
- Inline editing preferred.
- Loading skeletons for widgets.
- Empty states that encourage action.

### 4.5 Error Handling
- Global toast for API failures.
- Inline retry for weather.

---

## 5) Deployment/Local Dev
- `docker-compose` optional; for weekend, document:
  - backend: `python -m venv`, `pip install -r requirements.txt`, `python manage.py runserver`
  - frontend: `pnpm install`, `pnpm dev`

Environment variables:
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DATABASE_URL`
- `ALLOWED_HOSTS`

---

## 6) Milestones (Weekend Plan)

**Day 1**
- Project scaffolding
- Auth + base layout
- Notes CRUD

**Day 2**
- Tasks CRUD
- Today Focus
- Weather widget + caching
- Polish + deploy/local readme

---

## 7) Open Questions (confirm before building)
1) Auth method: session cookie vs JWT?
2) Location: always Ottawa, or configurable?
3) Tasks: status columns or simple completed?
4) Timer: local-only or persisted?
