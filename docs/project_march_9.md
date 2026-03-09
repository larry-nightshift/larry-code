Project March 9 — Recipe & Grocery Generator (Full Requirements)

Overview

Goal: Build a small web app that lets users save recipes, scale servings, and generate a consolidated grocery list (deduplicated quantities and normalized units). The app should be finishable in a weekend-day MVP and be production-ready in structure (clean models, APIs, frontend patterns) so we can expand later.

Primary user: Dominic (single-user first, multi-user-ready design)

Tech stack (MVP)
- Backend: Django + Django REST Framework (DRF), SQLite for dev
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Data exchange: JSON REST API

Non-Goals for MVP
- No external recipe scraping/parsing in MVP (future enhancement)
- No user-sharing or collaborative grocery lists (future)

---

Acceptance & Success Criteria (MVP)
1. Save a recipe with ingredients and steps.
2. Scale a recipe’s servings (client-side UI) and show correctly scaled ingredient quantities.
3. Create a grocery list by selecting multiple recipes and dates — grocery list aggregates identical ingredients and normalizes units where possible.
4. Export grocery list as CSV or copy-to-clipboard.
5. Clean, responsive UI with basic accessibility (keyboard focus + labels).

---

Backend Specification

Models

1) Recipe
- id (UUID)
- title (string, required)
- description (text, optional)
- servings (int, default 1)
- tags (simple CharField comma list or M2M Tag table optional)
- directions (text / ordered steps stored as JSON list optional)
- created_at, updated_at

2) Ingredient
- id
- recipe (FK → Recipe)  # recipe-scoped ingredient list
- name (string)  # e.g. "all-purpose flour"
- amount (decimal)  # stored in a canonical float/decimal
- unit (string)  # user-provided unit, e.g. "g", "cup", "tbsp", "whole"
- note (text, optional)  # e.g. "sifted"

3) GroceryList
- id
- title
- created_at
- items (relationship via GroceryItem)

4) GroceryItem
- id
- grocery_list (FK)
- name (string)  # normalized ingredient name for aggregation
- amount (decimal)
- unit (string)  # canonical unit after normalization, or original if not normalized
- source_recipes (JSON or M2M)  # list of recipes contributing to this line

Normalization / Units
- MVP will support simple normalization for common volume/weight units and counts:
  - grams (g), kilograms (kg), milliliters (ml), liters (l), teaspoons (tsp), tablespoons (tbsp), cups (cup), pieces/whole
- A small conversion table will be stored in code for converting between common units when possible (e.g. 1 cup flour ≈ 120 g for aggregation). These conversions are approximations and configurable.
- If ingredients have incompatible units or ambiguous names, the grocery list will include separate lines and include the raw unit.

API Endpoints (DRF)
- Auth (session-auth default): login / logout / me — optional for single-user MVP

Recipes
- GET /api/recipes/  — list (with optional search by title/tag)
- POST /api/recipes/ — create recipe (payload includes ingredients[] and optional directions[])
- GET /api/recipes/{id}/ — detail (includes ingredients)
- PATCH /api/recipes/{id}/ — edit
- DELETE /api/recipes/{id}/ — delete

Grocery lists
- GET /api/grocery-lists/ — list
- POST /api/grocery-lists/ — create (payload: title, recipe_ids[], date(optional))
- GET /api/grocery-lists/{id}/ — detail (expanded grocery items aggregated)
- POST /api/grocery-lists/{id}/aggregate/ — re-generate aggregation (optional)
- POST /api/grocery-lists/{id}/export/ — returns CSV for download

Utility
- GET /api/units/ — returns known units & conversion table (for client to use)

Implementation notes (backend)
- Use DRF ViewSets + Routers.
- Use decimal.Decimal for amounts to avoid float rounding issues (Django DecimalField).
- Write a small service/module `grocery/aggregation.py` that takes a list of recipe ingredients (with scaled amounts) and returns aggregated GroceryItem list.
- Keep the conversion table as code constants but allow easy future storage in DB.
- Add model/unit tests for aggregation logic and for unique recipe/ingredient behaviors.

---

Frontend Specification

Architecture
- Vite + React + TypeScript
- Feature folders:
  - src/features/recipes/*
  - src/features/grocery/*
  - src/components/* (shared Button, Card, Input, Modal)
  - src/api/* (fetch wrapper and typed endpoints)
- State & fetching: use React Query (TanStack Query) for API calls and caching.

Pages & UI
1) /recipes
- List of recipes with search & create button.
- Create/Edit form modal with: title, servings (int), ingredient rows (name/amount/unit/note), directions steps.

2) /recipes/:id
- Recipe detail page with ingredients and scale control (input for desired servings). Scaling happens client-side: formula amount * desired/recipe.servings.
- Button: “Add to grocery list” (choose target list or create new)

3) /grocery-lists
- List and create grocery lists (choose recipes, set date/title).

4) /grocery-lists/:id
- Aggregated grocery list UI grouped by normalized ingredient name with amount + unit.
- Controls: regenerate aggregation, export CSV, copy-to-clipboard.

Widgets / Small interactions
- Ingredient row: autocomplete on common ingredient names (small hint list).
- Unit dropdown with common units (tsp, tbsp, cup, g, kg, ml, l, whole)

UX & Accessibility
- Keyboard accessible forms
- Clear validation messages (ingredient name required, amount numeric)
- Mobile-first responsive layout

Testing (frontend)
- Unit tests for aggregation UI logic and small e2e smoke test: create recipe → add to grocery list → open list and verify aggregated line exists.

---

Dev & Run
- Backend dev run:
  cd backend
  source ../.venv/bin/activate
  pip install -r requirements.txt
  python manage.py migrate
  python manage.py runserver 8500

- Frontend dev run:
  cd frontend
  npm install
  npm run dev -- --host 0.0.0.0 --port 6173

---

Milestones (timeboxed for a single-day weekend sprint)
- Hour 0–1: project scaffold + models + serializer addresses for Recipe & Ingredient
- Hour 1–2: implement Recipe create/list/detail endpoints + migrations
- Hour 2–3: frontend recipe create/list/detail + scaling UI
- Hour 3–4: aggregation service + grocery list create endpoint
- Hour 4–5: grocery list UI + CSV export
- Hour 5–6: polish, tests, README

---

Open questions / decisions for you
1) Do you want ingredient name normalization (fuzzy matching) in MVP or a manual normalized name field? (manual is faster)
2) Should we support user accounts & auth now or start single-user and add auth later? (single-user speeds iteration)
3) CSV export format preferences (simple columns: name, amount, unit, sources)

If you confirm choices for the questions above I’ll produce the exact model/serializer/viewset code snippets and a frontend component skeleton and commit them to the repo. Otherwise I’ll draft the code and push when you say go.
