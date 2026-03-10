Project March 10 — Personal CRM & Reminders (Full Requirements)

Overview

Goal: Build a lightweight personal CRM (contacts + interactions) with quick reminders. The app should let you capture people you meet, add interactions/notes, and set follow-up reminders. Designed as a discrete 3-day weekend project (MVP scope), it is intentionally small but structured for future growth.

Primary user: Dominic (single-user first; multi-user ready)

Stack
- Backend: Django + DRF
- Frontend: React + Vite + TypeScript + Tailwind
- DB: SQLite for dev

Non-goals (MVP)
- No calendar integrations (Google/Outlook) in MVP
- No email sending or SMS (reminders are app-only notifications / list)

Acceptance Criteria (MVP)
- Create, edit, delete contacts (name, email, phone, notes, tags)
- Log interactions (date, medium, notes) attached to contacts
- Add follow-up reminders (date/time) and view a “due soon” list
- Simple search for contacts by name/email/tag
- Responsive UI with accessible forms

---

Backend Specification

Models
1) Contact
- id (UUID)
- full_name (string, required)
- email (string, optional)
- phone (string, optional)
- company (string, optional)
- tags (CharField comma list for MVP)
- notes (text)
- created_at, updated_at

2) Interaction
- id
- contact (FK -> Contact)
- date (datetime)
- medium (choice: call, email, in-person, text, other)
- notes (text)
- created_at

3) Reminder
- id
- contact (FK -> Contact, optional)  # reminders can be contact-specific or general
- due_at (datetime)
- message (string)
- done (boolean default False)
- created_at, updated_at

API Endpoints (DRF)
- /api/contacts/ (GET, POST)
- /api/contacts/{id}/ (GET, PATCH, DELETE)
- /api/contacts/{id}/interactions/ (GET, POST)
- /api/interactions/{id}/ (PATCH, DELETE)
- /api/reminders/ (GET, POST)  — filter ?due_in=days
- /api/reminders/{id}/ (PATCH, DELETE)
- /api/search/contacts/?q=  — simple search endpoint

Implementation notes (backend)
- Use DRF ModelViewSets and nested routes for interactions under contacts.
- Permissions: single-user default. Use IsAuthenticated for endpoints.
- Add a simple Reminder service that can list due reminders for a timeframe.
- Tests: model tests for Reminder due calculation and Interaction creation.

---

Frontend Specification

Architecture
- Feature folder: src/features/crm/
  - ContactsList.tsx
  - ContactDetail.tsx (shows interactions + add interaction form)
  - Reminders.tsx (due soon list + mark done)
- Shared components: Card, FormField, Button, Modal
- Data fetching: React Query

Pages
1) /crm/contacts
- list of contacts with quick-add input
- search box (debounced) for name/email/tags

2) /crm/contact/{id}
- contact detail, interactions timeline, add interaction form (date, medium, notes), quick reminder form

3) /crm/reminders
- list of due reminders sorted by due_at, ability to mark done

UX
- Quick-add contact inline (name + optional email) on contacts page
- Interaction timeline shows date & notes in descending order
- Reminders view shows upcoming due items and a “snooze” (postpone) option

Accessibility & polish
- Ensure form labels, keyboard focus for modals, and readable contrasts

---

Testing & verification
- Backend: small test suite checking contact CRUD and reminder due calculation
- Frontend: smoke test to create contact -> add interaction -> add reminder -> see reminder in due list

---

Dev & run
- Backend:
  cd backend
  source ../.venv/bin/activate
  python manage.py makemigrations crm
  python manage.py migrate
  python manage.py runserver 8500

- Frontend:
  cd frontend
  npm install
  npm run dev -- --host 0.0.0.0 --port 6173

Verification steps (after deployment)
1) Create a contact via UI; verify GET /api/contacts/ returns it.
2) Go to contact detail; add an interaction; verify interaction appears in timeline and via API.
3) Add a reminder due in the next hour; visit /crm/reminders and verify it appears in "Due soon".

---

Open questions (quick decisions)
1) Reminder granularity: date-only vs date+time? (recommend date+time)
2) Tags implementation: free-text comma list vs a Tag model? (recommend free-text for MVP)
3) Should reminders include an optional repeat rule (no for MVP)

If you confirm the open questions I’ll scaffold the backend app `crm` and the frontend feature and push the first chunk (Contact model + API) to main.