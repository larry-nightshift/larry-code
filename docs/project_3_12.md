# Project 3/12 — Home Inventory + Warranty Tracker (3‑Day Weekend Build)

## 0) Five 3‑Day Weekend Project Ideas (pick 1)
1) **Home Inventory + Warranty Tracker** (selected) — track household assets, receipts, warranty expirations, and service history.
2) **Lightweight Expense Splitter** — create groups, add expenses, split rules, settle-up summary.
3) **Job Application Tracker** — pipeline stages, contacts, follow-ups, attachment links, reminders.
4) **Music Practice Log + Repertoire List** — sessions, pieces, goals, streaks, simple progress charts.
5) **Bug/Issue Triage Board (personal)** — capture issues, labels, priority, states, weekly review mode.

### Already done in this repo (do not repeat)
From existing docs in `/home/dplouffe/projects/larry/docs/`:
- Personal “Now” Dashboard
- Recipe & Grocery Generator
- Personal CRM & Reminders
- Workout Planner + PR Tracker
- Home Maintenance Scheduler
- Static-Site Content Manager

This document specifies **Home Inventory + Warranty Tracker**.

---

## 1) Goal & Product Definition
Build a small web app to catalog **things you own** (appliances, electronics, tools, furniture), attach **receipt links/files**, track **warranty windows**, and surface **upcoming expirations** and **service history**.

**Primary user:** Dominic (single-user MVP; multi-user ready design).

**North-star UX:** open app → search an item → see purchase date + warranty + receipt → add service note in under 20 seconds.

### Non-goals (MVP)
- No OCR/receipt parsing.
- No external retailer integrations.
- No push notifications (we’ll show “due soon” in the app; optional email later).
- No photo editing or complex media management.

---

## 2) Core Requirements (MVP)

### 2.1 Authentication
- User can log in / log out.
- All inventory data is private per user.

**Acceptance criteria**
- Unauthenticated requests return 401.
- Users cannot access others’ items/attachments.

---

### 2.2 Locations (simple)
User can define optional locations to group items.

**Location fields**
- Name (required) — e.g. “Kitchen”, “Garage”, “Basement”, “Office”
- Notes (optional)
- Is archived (boolean)

**Acceptance criteria**
- Create/edit/archive locations.
- Items can be assigned to a location (nullable).

---

### 2.3 Items (assets)
User can create and manage items.

**Item fields (MVP)**
- Name (required) — “Dyson V8 Vacuum”
- Category (required) — enum (see below)
- Brand (optional)
- Model number (optional)
- Serial number (optional)
- Purchase date (optional)
- Purchase price (optional decimal)
- Vendor/store (optional)
- Location (optional FK)
- Notes (optional)
- Status (required) — enum: `ACTIVE`, `SOLD`, `DISCARDED`
- Is archived (boolean)

**Item categories (enum, MVP)**
- `APPLIANCE`, `ELECTRONICS`, `COMPUTER`, `PHONE_TABLET`, `TOOL`, `FURNITURE`, `VEHICLE`, `MISC`

**Acceptance criteria**
- CRUD for items.
- List view supports search by name/brand/model/serial.
- Status changes (Sold/Discarded) keep item but remove from “Active” default view.

---

### 2.4 Warranties
User can track warranty coverage for an item.

**Warranty fields (MVP)**
- Item (FK)
- Provider (optional) — e.g. “Manufacturer”, “Best Buy”, “AppleCare”
- Type (required) — enum: `MANUFACTURER`, `EXTENDED`, `STORE`, `OTHER`
- Start date (required)
- End date (required)
- Terms (optional text)
- Claim instructions (optional text)
- Is active (computed in API responses: `today between start/end`)

**Acceptance criteria**
- Add multiple warranties per item (e.g., manufacturer + extended).
- Item detail shows current active warranty (if any) and upcoming expiry.
- A “Due soon” view shows warranties expiring in N days.

---

### 2.5 Receipts / Attachments
Support attaching receipts and relevant docs.

**Attachment types (MVP)**
- URL attachment (fastest) — link to email, cloud drive, invoice page
- File upload (optional but recommended) — PDF/JPG/PNG

**Attachment fields**
- Item (FK)
- Type — enum: `URL`, `FILE`
- Title (optional)
- URL (if type=URL)
- File (if type=FILE)
- Notes (optional)
- Created at

**Acceptance criteria**
- Add a receipt URL to an item.
- If file uploads are enabled, user can upload and download.
- Permission checks prevent cross-user access to files.

---

### 2.6 Service History (maintenance log)
User can record service/maintenance events for any item.

**ServiceEvent fields (MVP)**
- Item (FK)
- Occurred at (date or datetime; use datetime for consistency)
- Type (optional enum) — `REPAIR`, `MAINTENANCE`, `INSTALL`, `INSPECTION`, `OTHER`
- Cost (optional decimal)
- Vendor (optional)
- Notes (required)
- Attachments (optional later; not required for MVP)

**Acceptance criteria**
- Add service events from item detail.
- Service timeline shown newest-first.

---

### 2.7 Dashboard & Alerts (in-app)
Provide a simple “what needs attention” view.

**Dashboard widgets (MVP)**
- Warranties expiring soon (default: next 30 days)
- Recently added items (last 10)
- Recently serviced items (last 10 service events)

**Acceptance criteria**
- Dashboard loads in <2 seconds on localhost.
- Clear empty states (“No warranties expiring soon”).

---

## 3) Non-Functional Requirements

### 3.1 Performance
- Avoid N+1 on item list and item detail; use select_related/prefetch_related.
- Search should be case-insensitive and reasonably fast.

### 3.2 Security
- Object-level permissions: `obj.user == request.user`.
- If file uploads are supported, store outside repo, validate content type, and restrict access.

### 3.3 Reliability
- “Due soon” queries should be timezone-consistent.
- Soft delete/archive preferred over hard deletes for important data.

### 3.4 UX Quality
- Fast add flows (keyboard-friendly).
- Strong defaults: show ACTIVE items by default.

---

## 4) Backend Technical Spec (Django + DRF)

### 4.1 Suggested Stack
- Django + Django REST Framework
- DB: SQLite ok for dev, PostgreSQL-ready.
- Auth: session auth (cookie) or token/JWT depending on repo conventions.

### 4.2 Django Apps
Create app: `inventory`
- API base path: `/api/inventory/…`

### 4.3 Data Model

#### Location
- `id` (UUID)
- `user` (FK)
- `name` (CharField)
- `notes` (TextField blank)
- `is_archived` (BooleanField default False)
- `created_at`, `updated_at`

Constraints:
- Unique: `(user, name)` (case-insensitive preferred; MVP can normalize in serializer)

#### Item
- `id` (UUID)
- `user` (FK)
- `name` (CharField)
- `category` (CharField choices)
- `brand` (CharField blank)
- `model_number` (CharField blank)
- `serial_number` (CharField blank)
- `purchase_date` (DateField null/blank)
- `purchase_price` (DecimalField null/blank)
- `vendor` (CharField blank)
- `location` (FK → Location, null/blank, on_delete=SET_NULL)
- `notes` (TextField blank)
- `status` (choices: ACTIVE, SOLD, DISCARDED)
- `is_archived` (BooleanField default False)
- `created_at`, `updated_at`

Indexes:
- `(user, status, is_archived, name)`
- Consider trigram search later; MVP uses icontains.

#### Warranty
- `id` (UUID)
- `item` (FK → Item, related_name=`warranties`)
- `provider` (CharField blank)
- `warranty_type` (choices)
- `start_date` (DateField)
- `end_date` (DateField)
- `terms` (TextField blank)
- `claim_instructions` (TextField blank)
- `created_at`, `updated_at`

Indexes:
- `(item, end_date)`
- For due soon: `(end_date)` plus join on item.user.

Validation:
- `end_date >= start_date`.

#### Attachment
- `id` (UUID)
- `item` (FK → Item, related_name=`attachments`)
- `attachment_type` (choices: URL, FILE)
- `title` (CharField blank)
- `url` (URLField blank)
- `file` (FileField blank)  *(optional MVP; if implemented, configure MEDIA_ROOT)*
- `notes` (TextField blank)
- `created_at`

Validation:
- If URL, require url and file null.
- If FILE, require file and url blank.

#### ServiceEvent
- `id` (UUID)
- `item` (FK → Item, related_name=`service_events`)
- `occurred_at` (DateTimeField)
- `event_type` (choices)
- `cost` (DecimalField null/blank)
- `vendor` (CharField blank)
- `notes` (TextField)
- `created_at`, `updated_at`

Indexes:
- `(item, occurred_at)`

---

### 4.4 API Endpoints (DRF)
All endpoints require authentication.

#### Locations
- `GET /api/inventory/locations/?archived=false`
- `POST /api/inventory/locations/`
- `GET /api/inventory/locations/{id}/`
- `PATCH /api/inventory/locations/{id}/`
- `DELETE /api/inventory/locations/{id}/` (soft archive recommended)

#### Items
- `GET /api/inventory/items/?status=ACTIVE&search=dyson&location_id=…`
- `POST /api/inventory/items/`
- `GET /api/inventory/items/{id}/` (includes warranties + attachments + recent service events)
- `PATCH /api/inventory/items/{id}/`
- `DELETE /api/inventory/items/{id}/` (soft archive recommended)

Filters (MVP):
- `status` (default ACTIVE)
- `location_id`
- `category`
- `search` across name/brand/model/serial/vendor

#### Warranties
- `GET /api/inventory/warranties/?expiring_in=30` (computed: end_date <= today+30)
- `POST /api/inventory/warranties/`
- `GET /api/inventory/warranties/{id}/`
- `PATCH /api/inventory/warranties/{id}/`
- `DELETE /api/inventory/warranties/{id}/`

Optional nested convenience:
- `GET /api/inventory/items/{id}/warranties/`

#### Attachments
- `GET /api/inventory/items/{id}/attachments/`
- `POST /api/inventory/attachments/`  (or nested POST)
- `DELETE /api/inventory/attachments/{id}/`

If file upload supported:
- Use multipart/form-data.
- `GET /api/inventory/attachments/{id}/download/` or serve via authenticated media endpoint.

#### Service Events
- `GET /api/inventory/items/{id}/service-events/`
- `POST /api/inventory/service-events/` (or nested)
- `PATCH /api/inventory/service-events/{id}/`
- `DELETE /api/inventory/service-events/{id}/`

#### Dashboard
- `GET /api/inventory/dashboard/?expiring_in=30`
  - returns: `{ expiring_warranties: […], recent_items: […], recent_service_events: […] }`

---

### 4.5 Serializers & Permissions
- Base permission: IsAuthenticated.
- Object-level permission for Item/Location/Warranty/Attachment/ServiceEvent:
  - resolve via `item.user` (Warranty/Attachment/ServiceEvent derive ownership from item).

Serializer notes:
- Ensure user field is not user-controllable: set from request.
- For search, use DRF filter backend or custom filter in queryset.

---

### 4.6 Testing (minimum)
Backend tests (pytest or Django TestCase depending on repo):
- Permissions:
  - user A cannot access user B’s item detail.
- Warranty validation:
  - cannot create with end_date < start_date.
- Due soon logic:
  - `expiring_in` returns correct set.
- Attachment validation:
  - URL vs FILE mutual exclusivity.

---

## 5) Frontend Technical Spec (React + Vite + TypeScript)

### 5.1 Stack
- React + Vite + TypeScript
- Router: React Router
- Data fetching: TanStack Query
- Forms: React Hook Form (optional)
- Styling: Tailwind (or match repo conventions)

### 5.2 Frontend Architecture
Feature folders:
- `src/features/inventory/`
  - `DashboardPage.tsx`
  - `ItemsPage.tsx`
  - `ItemDetailPage.tsx`
  - `ItemForm.tsx`
  - `LocationsPage.tsx`
  - `WarrantiesPanel.tsx`
  - `AttachmentsPanel.tsx`
  - `ServiceHistoryPanel.tsx`
- `src/api/inventory.ts` (typed client)
- shared components: Button, Card, Input, Modal, Table/List

State rules:
- Server state in React Query.
- Local component state for form UI.

---

### 5.3 Pages & UX

#### A) Inventory Dashboard (`/inventory`)
Widgets:
- “Expiring soon” list (end date + days remaining + item name)
- “Recently added” items
- “Recent service” events

Interactions:
- Clicking an item goes to detail.
- Filter expiring window: 7/30/90 days.

#### B) Items List (`/inventory/items`)
- Search input (debounced)
- Filters: status, category, location
- List rows show: name, category, location, purchase date (optional), next warranty end (optional)
- CTA: “Add item”

Quick-add (optional MVP):
- Minimal “Add item” modal with name + category, then fill details later.

#### C) Item Detail (`/inventory/items/:id`)
Sections:
- Summary (name, brand/model/serial, status, location)
- Warranties (list + add)
- Attachments (links/files)
- Service history timeline + add event

UX requirements:
- Add warranty/event inline or via modal.
- Copy-to-clipboard for serial/model numbers.

#### D) Locations (`/inventory/locations`)
- List + create/edit/archive.

---

### 5.4 Frontend API Contracts
- Datetimes are ISO strings.
- Item detail response should include nested related data (bounded):
  - warranties[]
  - attachments[]
  - service_events[] (maybe last 20; paginate later)

Frontend expects computed fields:
- `warranty.is_active` (optional convenience)
- `warranty.days_remaining` (optional convenience)

---

### 5.5 Error Handling & Empty States
- Global toast on API errors.
- Empty states:
  - no items: show CTA to add item
  - no expiring warranties: show “All good”

---

## 6) 3‑Day Build Plan (timeboxed)

### Day 1
- Backend: create `inventory` app, models (Location, Item, Warranty) + migrations
- API: CRUD for items/locations/warranties, basic filtering
- Frontend: routing + Items list + Item create/edit form

### Day 2
- Attachments (URL first, file upload if time)
- Item detail page with warranties + attachments panels
- Dashboard endpoint + Dashboard page

### Day 3
- Service events (backend + UI)
- Polish: search, filters, empty states
- Tests + README + a small seed script/fixtures (optional)

---

## 7) Open Implementation Choices (make a call; no user input required)
- **Receipts:** implement URL attachments for sure; add file upload if repo already has media handling.
- **Dates:** use DateField for purchase/warranty boundaries; DateTimeField for service events.
- **Archiving:** prefer soft archive flags over hard deletes.
- **Search:** `icontains` across a small set of fields for MVP.
