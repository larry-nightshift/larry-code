Project March 8 — Chunked Implementation Plan

Goal: Implement the "Personal Now Dashboard" MVP from the Notion requirements. Work is broken into small verifiable chunks. After each chunk is implemented, tested, committed, and pushed to origin/main, the assistant will report the commit hash + verification steps.

Chunks (atomic, commit/push after each):

Chunk A — Today Focus (backend)
- What: Create TodayFocus endpoint: model (user,date,text) already present in core_models.py; create serializer, ModelViewSet with GET/PUT upsert at /api/focus/today/; register route.
- Acceptance criteria:
  - GET /api/focus/today/ returns 204 or the JSON object for today when logged in.
  - PUT /api/focus/today/ with {text: "..."} creates/updates the TodayFocus for the logged-in user.
  - Commit + push with message: `mvp: focus backend`.

Chunk B — Today Focus (frontend)
- What: FocusCard component that fetches /api/focus/today/, displays text, allows inline edit and save.
- Acceptance criteria:
  - UI shows current focus or placeholder.
  - Edit -> Save triggers PUT and updates UI.
  - Commit + push: `mvp: focus frontend`.

Chunk C — Notes (backend)
- What: Note model + NoteSerializer + NoteViewSet at /api/notes/ (list/create/update/archive/pin), migrations.
- Acceptance criteria:
  - CRUD works via API when authenticated.
  - Commit + push: `mvp: notes backend`.

Chunk D — Notes (frontend)
- What: NotesList UI: create, list, pin, archive.
- Acceptance criteria:
  - Create a note, it appears in list.
  - Pin and Archive buttons work.
  - Commit + push: `mvp: notes frontend`.

Chunk E — Tasks (backend)
- What: Task model (text, status, due_date), TaskViewSet at /api/tasks/.
- Acceptance criteria: Create & toggle complete via API.
- Commit + push: `mvp: tasks backend`.

Chunk F — Tasks (frontend)
- What: TasksList UI: add task, mark done/undo, list.
- Acceptance criteria: UI works and persists to API.
- Commit + push: `mvp: tasks frontend`.

Chunk G — Widgets: Weather & Upcoming (backend + frontend)
- What: Weather proxy (Open-Meteo) with caching; UpcomingItem model + API + UI; Timer widget local.
- Acceptance criteria: Weather loads, Upcoming items add/display, Timer runs locally.
- Commit + push: `mvp: widgets`.

Chunk H — Global shell + Navigation
- What: Sidebar & Topnav, route /app/<feature>, app-switcher wired to features.
- Acceptance criteria: Navigation works, URLs load right features.
- Commit + push: `mvp: ui shell`.

Chunk I — Tests & README
- What: Add basic unit tests (models/API) and README run/test checklist + Notion link.
- Acceptance criteria: Tests run in dev; README explains how to run and verify.
- Commit + push: `mvp: tests & docs`.

Process & Updates
- After each chunk I will: commit, push to main, and post a brief update with commit hash, changed files, and three verification steps.
- If any chunk needs manual review or causes issues, I will pause and report immediately.

Notes
- Use Claude Code (Anthropic) for coding tasks (env: ANTHROPIC_API_KEY). Commit/push to main after each change. No secrets committed.
- Notion canonical requirements page: https://www.notion.so/Personal-Now-Dashboard-Requirements-Spec-Native-31db4389149c81caa885ff0f2feed57e
