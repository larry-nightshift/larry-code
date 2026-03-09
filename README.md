# Personal Now Dashboard - MVP

A minimal, focused daily dashboard for productivity and task management. Built as a React + Django full-stack application.

**Notion Requirements:** [Personal Now Dashboard Requirements Spec](https://www.notion.so/Personal-Now-Dashboard-Requirements-Spec-Native-31db4389149c81caa885ff0f2feed57e)

## Architecture

### Backend (Django + DRF)
- **Framework:** Django with Django REST Framework
- **Database:** SQLite (development)
- **API Authentication:** Session-based (Django auth)
- **Models:**
  - `TodayFocus`: User's daily focus statement (upsert at /api/focus/today/)
  - `Note`: Rich notes with pin/archive
  - `Task`: Todo items with status (TODO/DOING/DONE) and due dates
  - `UpcomingItem`: Calendar events with start times

### Frontend (React + TypeScript)
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **API Client:** Fetch-based with type-safe endpoints

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip, npm

### Backend Setup

```bash
cd backend

# Install dependencies
pip install django djangorestframework django-cors-headers

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173/`

## Features

### Core Dashboard (Home)
- **Today's Focus Card** - Set and track your main focus for the day
- **Tasks List** - Manage todos with status tracking (TODO → DOING → DONE)
- **Timer Widget** - Pomodoro timer (25 min default, 5 min break, customizable)
- **Weather Widget** - Current weather from Open-Meteo API
- **Upcoming Events** - Calendar of upcoming events with notes

### Full-Page Views
- **Focus** - Dedicated view for today's focus statement
- **Notes** - Create, pin, and archive notes
- **Tasks** - Full task management with due dates
- (Dashboard, Weather, and Upcoming available on home)

## API Endpoints

All endpoints require authentication (Django session).

### Today's Focus
- `GET /api/focus/today/` - Get today's focus (204 if none)
- `PUT /api/focus/today/` - Create/update today's focus

### Notes
- `GET/POST /api/notes/` - List and create notes
- `PATCH/DELETE /api/notes/{id}/` - Update and delete notes

### Tasks
- `GET/POST /api/tasks/` - List and create tasks
- `PATCH/DELETE /api/tasks/{id}/` - Update and delete tasks

### Upcoming Events
- `GET/POST /api/upcoming/` - List and create upcoming events
- `PATCH/DELETE /api/upcoming/{id}/` - Update and delete events

## Testing

### Backend Tests

Run the test suite:

```bash
cd backend
python manage.py test api.tests -v 2
```

**Test Coverage:**
- Model tests: TodayFocus, Note, Task, UpcomingItem
- API tests: Authentication, CRUD operations, user isolation, status transitions
- 22 tests total, all passing

Example test results:
```
test_create_today_focus - ✓
test_get_today_focus_no_content - ✓
test_put_today_focus_create - ✓
test_put_today_focus_update - ✓
test_create_note - ✓
test_list_notes - ✓
test_archive_note - ✓
test_create_task - ✓
test_update_task_status - ✓
test_create_upcoming_item - ✓
... (22 tests, 0 failures)
```

### Frontend Testing
Frontend components use React hooks and fetch-based API calls. Manual testing recommended:
1. Start both servers
2. Navigate to dashboard
3. Test each widget and CRUD operation
4. Verify data persists after page refresh

## Development Workflow

### Adding a New Feature

1. **Backend:** Add model, serializer, viewset to `api/models.py`, `api/serializers.py`, `api/views.py`
2. **Register:** Add viewset to router in `api/urls.py`
3. **Migrate:** `python manage.py makemigrations && python manage.py migrate`
4. **Tests:** Write tests in `api/tests.py`
5. **Frontend:** Create component in `frontend/src/components/`
6. **API Client:** Add methods to `frontend/src/lib/api.ts`

### Migrations
Migrations are tracked in `backend/api/migrations/`. Commit them with your code changes.

```bash
python manage.py makemigrations
python manage.py migrate
```

## Configuration

### Backend Settings
- `backend/config/settings.py`:
  - `DEBUG = True` for development
  - `ALLOWED_HOSTS = ['127.0.0.1', 'localhost']`
  - CORS allowed for `http://localhost:6173` (configurable)

### Frontend API Base
- `frontend/src/lib/api.ts`:
  - `API_BASE = 'http://localhost:8000/api'`
  - Adjust for production deployments

## Project Structure

```
larry/
├── backend/
│   ├── api/
│   │   ├── models.py          # TodayFocus, Note, Task, UpcomingItem
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # ViewSets with auth
│   │   ├── urls.py            # Router registration
│   │   ├── tests.py           # 22 comprehensive tests
│   │   └── migrations/
│   ├── config/
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   └── db.sqlite3
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FocusCard.tsx       # Today's focus
│   │   │   ├── NotesList.tsx       # Notes CRUD
│   │   │   ├── TasksList.tsx       # Tasks CRUD
│   │   │   ├── WeatherWidget.tsx   # Weather API
│   │   │   ├── UpcomingWidget.tsx  # Upcoming events
│   │   │   └── TimerWidget.tsx     # Pomodoro timer
│   │   ├── lib/
│   │   │   └── api.ts             # Type-safe API client
│   │   ├── App.tsx                # Main app + routing
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
└── docs/
    └── project_march_8.md  # Implementation plan
```

## Known Limitations

- **Frontend:** No persistent authentication state (relies on session cookies)
- **Weather:** Toronto hardcoded (future: user location settings)
- **Database:** SQLite (production should use PostgreSQL)
- **Styling:** Tailwind CSS not fully configured (works but with warnings)

## Future Enhancements

- User authentication / login page
- Settings page (location, time zone, theme)
- Note editing / rich text
- Task recurring / subtasks
- Weather location picker
- Analytics / productivity charts
- PWA support
- Dark mode toggle

## Verification Checklist

### Backend
- [ ] `python manage.py migrate` runs successfully
- [ ] `python manage.py test api.tests -v 2` passes (22/22 tests)
- [ ] `python manage.py runserver` starts on port 8000
- [ ] API endpoints accessible at `http://localhost:8000/api/`

### Frontend
- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts on port 5173
- [ ] Dashboard loads at `http://localhost:5173/`
- [ ] Can create/edit focus, notes, tasks, events
- [ ] Weather widget displays (Open-Meteo API working)
- [ ] Timer widget runs locally

### Integration
- [ ] Backend and frontend both running
- [ ] Can set focus and see it persist
- [ ] Can create notes/tasks and see them in API
- [ ] Navigation between tabs works
- [ ] Page refresh maintains data

## Support

For issues or questions, refer to:
- Notion spec: https://www.notion.so/Personal-Now-Dashboard-Requirements-Spec-Native-31db4389149c81caa885ff0f2feed57e
- Django docs: https://docs.djangoproject.com/
- React docs: https://react.dev/
- DRF docs: https://www.django-rest-framework.org/

---

**MVP Implementation Plan:** [docs/project_march_8.md](./docs/project_march_8.md)

Last updated: 2026-03-08
