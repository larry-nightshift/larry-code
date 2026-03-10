Project 03_10_1 — Static-Site Content Manager (Full Requirements)

Overview

Goal: Provide a simple CMS for writing markdown posts, previewing, and publishing static HTML site output (a static site generator workflow). This is a compact 3-day-capable project: backend for storing markdown posts + simple publish flag and a frontend editor with live preview and static export.

Primary user: Dominic (single-user MVP)

Stack
- Backend: Django + DRF
- Frontend: React + Vite + TypeScript + Tailwind
- Static export: generate HTML files under output/ and create ZIP for download

MVP Features
1) Create / edit markdown posts (title, slug, metadata, body)
2) Live preview rendered HTML side-by-side with editor
3) Publish/unpublish flag and list of published posts
4) Export site: render all published posts to HTML and produce a ZIP
5) Simple templates (global header/footer) configurable in settings

Backend
Models
- Post
  - id (UUID)
  - title
  - slug (unique)
  - body_markdown
  - excerpt
  - metadata (json, tags, date)
  - published (bool)
  - created_at, updated_at

Endpoints
- GET /api/posts/ (list)
- POST /api/posts/ (create)
- GET /api/posts/{id}/
- PATCH /api/posts/{id}/
- DELETE /api/posts/{id}/
- POST /api/site/export/ -> triggers static export, returns path/zip link

Implementation notes
- Use a markdown rendering library (python-markdown) to render post content.
- Export: render each published post into an HTML file using a simple Jinja2/Django template, write to /home/dplouffe/projects/larry/output/site_{timestamp}/, then zip it.

Frontend
- Editor page: markdown textarea + live rendered preview panel (use a safe markdown renderer on client for instant preview)
- Posts list page: shows drafts and published, buttons for edit/publish/export
- Export button calls POST /api/site/export/ and shows the generated ZIP link

Run & dev
- Backend: python manage.py runserver 8500
- Frontend: npm run dev -- --host 0.0.0.0 --port 6173

Verification (smoke)
1) Create a post, save as published, visit post detail API → body_html present
2) Click Export → server creates ZIP; fetch the ZIP and unzip locally to see index.html + post pages

Notes
- The site generator is intentionally minimal: one template, no asset pipeline for MVP.
- Security: escaping and sanitization of rendered markdown is required; use a safe renderer and sanitize HTML output.
