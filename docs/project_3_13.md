# Project 3/13 — Personal Link Vault + Reading Queue (3‑Day Weekend Build)

## 0) Five 3‑Day Weekend Project Ideas (pick 1)
1) **Personal Link Vault + Reading Queue** (selected) — save links fast, tag them, add notes, and keep a “read later” queue with lightweight status.
2) **Job Application Tracker** — roles, stages, follow-ups, contact log, reminders.
3) **Lightweight Expense Splitter** — groups, participants, expenses, balances, export.
4) **Music Practice Log** — sessions, pieces, goals, streaks, simple charts.
5) **Meeting Notes + Action Items Hub** — meeting notes, action items, due dates, weekly review.

### Already done in this repo (do not repeat)
From existing docs in `/home/dplouffe/projects/larry/docs/`:
- Personal “Now” Dashboard
- Recipe & Grocery Generator
- Personal CRM & Reminders
- Home Maintenance Scheduler
- Workout Planner + PR Tracker
- Home Inventory + Warranty Tracker
- Static-Site Content Manager

This document specifies **Personal Link Vault + Reading Queue**.

---

## 1) Goal & Product Definition
Build a small web app to:
- capture links quickly (URL + title + optional description)
- organize with tags and collections
- maintain a “Reading Queue” (read later) with status and priority
- search and filter your vault fast

**Primary user:** Dominic (single-user MVP; multi-user ready design).

**North-star UX:** paste a URL → hit save → it’s instantly searchable and can be queued to read later; review queue daily and mark done in one click.

### Non-goals (MVP)
- No web scraping/reader-mode extraction (beyond basic metadata fetch).
- No browser extension required (optional “bookmarklet” later).
- No social sharing.
- No offline mode.
- No PDF upload management (link-only MVP).

---

## 2) MVP Feature Requirements

### 2.1 Authentication
- User can log in / log out.
- All data is private per user.

**Acceptance criteria**
- Unauthenticated requests return 401.
- Users can only access their own data.

---

### 2.2 Link Capture (Create/Read/Update/Delete)
User can save a link with minimal friction.

**Fields (MVP)**
- `url` (required, unique per user)
- `title` (optional at create; can be auto-filled)
- `description` (optional)
- `notes` (optional, free text)
- `favicon_url` (optional)
- `site_name` (optional)
- `preview_image_url` (optional)
- `created_at`, `updated_at`

**Behavior**
- On create, backend attempts a **best-effort metadata fetch** (title + og:image + site name + favicon). If it fails, still save.
- URL normalization for uniqueness:
  - Trim whitespace
  - Remove trailing slashes
  - Lowercase hostname
  - Optionally drop common tracking query params (utm_*) in a normalization function

**Acceptance criteria**
- Paste URL → save succeeds even if metadata fetch fails.
- Editing title/notes updates immediately.
- Deleting a link removes it from lists and search.

---

### 2.3 Tags
User can create tags and apply multiple tags to a link.

**Tag fields**
- `name` (required, unique per user, case-insensitive)
- `color` (optional, hex)
- `created_at`

**Acceptance criteria**
- Create tags from a tag picker while editing a link.
- Filter links by 1+ tags.

---

### 2.4 Collections (simple folders)
Collections are optional groupings (e.g., “AI”, “DevOps”, “Reading List”).

**Collection fields**
- `name` (required, unique per user)
- `description` (optional)
- `is_archived` (boolean)

**Rules**
- A link can belong to **0..1** collection (MVP) to keep UI simple.

**Acceptance criteria**
- Assign/unassign collection from link edit view.
- Filter by collection.

---

### 2.5 Reading Queue
A queue is a per-link overlay: “I intend to read this.”

**Queue fields**
- `status` (enum): `QUEUED`, `READING`, `DONE`, `SKIPPED`
- `priority` (int 1–5, default 3)
- `queued_at` (datetime)
- `finished_at` (datetime, nullable)
- `due_date` (date, nullable)

**Queue UX**
- From any link row: quick actions
  - “Queue” / “Unqueue”
  - “Mark done”
- Queue page supports sorting by priority, due date, queued date.

**Acceptance criteria**
- Add link to queue from list in one click.
- Mark as done updates the queue instantly.

---

### 2.6 Search + Filters
User can find links fast.

**Search fields (MVP)**
- Title
- URL
- Notes
- Description

**Filters**
- Tag(s)
- Collection
- Queue status (queued vs not queued; done vs not)
- Site/hostname (optional quick filter)

**Acceptance criteria**
- Search results update within 300ms (debounced).
- Filters combine with search.

Implementation note: start with DB `icontains` queries; add PostgreSQL full-text later.

---

### 2.7 Import/Export (small but valuable)
- Export links as JSON (and optionally CSV).
- Import from a simple JSON format produced by the app.

**Acceptance criteria**
- Export downloads a file.
- Import validates payload; shows row-level errors without aborting everything.

---

## 3) Backend Specification (Django + DRF)

### 3.1 Data Model (proposed)
Use UUID primary keys.

#### Link
- `id` (UUID)
- `user` (FK → auth.User)
- `url` (URLField, required)
- `url_normalized` (CharField, required, indexed)
- `title` (CharField, blank)
- `description` (TextField, blank)
- `notes` (TextField, blank)
- `hostname` (CharField, blank, indexed)  # derived from URL
- `favicon_url` (URLField, blank)
- `site_name` (CharField, blank)
- `preview_image_url` (URLField, blank)
- `collection` (FK → Collection, null=True, blank=True)
- `created_at`, `updated_at`

Constraints:
- Unique together: (`user`, `url_normalized`)

#### Tag
- `id` (UUID)
- `user` (FK)
- `name` (CharField, required)
- `name_normalized` (CharField, indexed)
- `color` (CharField, blank)
- `created_at`

Constraints:
- Unique together: (`user`, `name_normalized`)

#### LinkTag (through table)
- `id` (UUID)
- `link` (FK → Link)
- `tag` (FK → Tag)

Constraints:
- Unique together: (`link`, `tag`)

#### Collection
- `id` (UUID)
- `user` (FK)
- `name` (CharField, required)
- `description` (TextField, blank)
- `is_archived` (bool default False)
- `created_at`, `updated_at`

Constraints:
- Unique together: (`user`, `name`)

#### ReadingQueueItem
- `id` (UUID)
- `user` (FK)
- `link` (OneToOneField → Link)
- `status` (choice)
- `priority` (PositiveSmallIntegerField)
- `queued_at` (DateTimeField)
- `due_date` (DateField, null=True)
- `finished_at` (DateTimeField, null=True)

Constraints:
- One-to-one ensures a link is queued at most once.

---

### 3.2 Services

#### URL normalization
- `normalize_url(raw_url) -> (normalized_url, hostname, normalized_key)`
- Remove `utm_*` params and common trackers: `gclid`, `fbclid`.

#### Metadata fetch (best-effort)
- On link create (or explicit “refresh metadata”), fetch HTML and extract:
  - `<title>`
  - `og:title`, `og:site_name`, `og:image`
  - favicon from `<link rel="icon">` or `/<favicon.ico>` fallback
- Timeouts: 3s connect, 5s read.
- Hard limit response bytes (e.g., 512KB) to avoid huge downloads.

Implementation options:
- MVP: synchronous fetch in request/response (simple).
- Better: background job (Celery/RQ) — out of scope for strict 3-day unless infra already exists.

---

### 3.3 API Endpoints (REST)
All endpoints require auth.

#### Links
- `GET /api/links/` — list with filters:
  - `q=` (search)
  - `tag=` (repeatable or comma)
  - `collection_id=`
  - `queued=` (true/false)
  - `queue_status=` (QUEUED|READING|DONE|SKIPPED)
  - `hostname=`
  - pagination
- `POST /api/links/` — create
- `GET /api/links/{id}/` — detail
- `PATCH /api/links/{id}/` — edit
- `DELETE /api/links/{id}/` — delete
- `POST /api/links/{id}/refresh_metadata/` — optional MVP

Payload notes:
- Link create/update supports `tag_ids: []` and `collection_id`.

#### Tags
- `GET /api/tags/`
- `POST /api/tags/`
- `PATCH /api/tags/{id}/`
- `DELETE /api/tags/{id}/` (should remove from links)

#### Collections
- `GET /api/collections/`
- `POST /api/collections/`
- `PATCH /api/collections/{id}/`
- `DELETE /api/collections/{id}/` (or soft-archive in UI)

#### Queue
- `GET /api/queue/` — list queued items with sort:
  - `status=`
  - `sort=priority|due_date|queued_at`
- `POST /api/links/{id}/queue/` — create/update queue item (idempotent)
- `PATCH /api/queue/{id}/` — update status/priority/due_date
- `DELETE /api/links/{id}/queue/` — unqueue

#### Import/Export
- `GET /api/export/links.json`
- `POST /api/import/links/`

---

### 3.4 Permissions
- Use `IsAuthenticated` and always filter by `request.user`.
- For nested operations (queue by link id), verify link ownership.

---

### 3.5 Validation rules
- URL must be valid and http/https only.
- Tag names: trim, collapse whitespace, max length (e.g., 32).
- Priority range enforced.
- Unique URL per user (by normalized key) returns a friendly 409:
  - include existing link id in response so UI can route to it.

---

### 3.6 Tests (MVP)
- URL normalization unit tests.
- Unique constraints: same link cannot be created twice.
- Queue item creation idempotency.
- Filtering/search basic tests.

---

## 4) Frontend Specification (React + Vite + TypeScript)

### 4.1 Pages / Routes
- `/login`
- `/links` — main vault list with search/filter
- `/links/new` — add link
- `/links/:id` — link detail/edit
- `/queue` — reading queue dashboard
- `/tags` — tag management
- `/collections` — collection management
- `/import-export` — import/export

### 4.2 Key UI Components
- `LinkCreateForm` (URL + title + tags + collection + “add to queue” toggle)
- `LinksTable` / `LinkCardList` (responsive)
  - quick actions: open, edit, queue/unqueue, mark done
- `TagPicker` (multi-select, create-on-type)
- `CollectionSelect`
- `QueuePanel` (status + priority + due date)
- `FiltersBar` (tags, collection, queued status, hostname)
- `SearchBox` (debounced)
- `ConfirmDialog` (delete)

### 4.3 State & Data fetching
- Use React Query (TanStack Query) for caching, optimistic updates.
- Query keys:
  - `links({q, tags, collection, queued, queue_status, hostname, page})`
  - `link(id)`
  - `tags()`
  - `collections()`
  - `queue({status, sort})`

Optimistic flows:
- Queue/unqueue from list should be optimistic.
- Mark done should be optimistic (and remove from “Queued” view).

### 4.4 UX details
- “Add link” box pinned at top of `/links` (fast capture).
- When a duplicate URL is detected (409), show:
  - “Already saved” + button to open existing link.
- Keyboard friendly:
  - Enter to submit add link
  - `/` focuses search

### 4.5 Accessibility (MVP)
- All form inputs have labels.
- Focus outlines preserved.
- Buttons have aria-labels when icon-only.

---

## 5) Non-Functional Requirements
- Performance: list view should feel instant up to ~5k links (pagination required).
- Security: CSRF/session auth or token auth (match existing project conventions).
- Robustness: metadata fetch failures must not block saving.
- Observability: basic request logging; surface metadata fetch errors in server logs.

---

## 6) Suggested 3‑Day Build Plan

### Day 1
- Models + migrations
- CRUD APIs for links/tags/collections
- Basic links list page + add link form

### Day 2
- Reading queue APIs + queue UI
- Search + filter UI
- Duplicate URL handling

### Day 3
- Import/export
- Metadata fetch polish
- Tests + basic styling/a11y pass

---

## 7) Definition of Done
- All MVP endpoints implemented with auth + ownership checks.
- Frontend routes functional; core flows work end-to-end:
  - add link → tag → queue → mark done → search/find
- Basic tests pass.
- App runs via existing repo build script.
