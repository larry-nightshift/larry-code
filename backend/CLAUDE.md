# Backend Development Guidelines

This document outlines best practices and conventions for the Django backend. Claude should always follow these patterns when working in this project.

## Project Structure

The backend uses a modular Django app structure with centralized API routing:

```
backend/
├── config/              # Django project settings
├── api/                 # Main API app (routing hub)
├── <app_name>/          # Feature-specific Django apps
│   ├── models.py
│   ├── views.py         # DRF ViewSets or APIViews
│   ├── serializers.py   # DRF Serializers
│   ├── urls.py          # App-specific routes
│   ├── tests.py         # Unit tests
│   └── migrations/      # Database migrations
├── core_models.py       # Shared base models
└── manage.py
```

## API Routing Pattern

**All new Django apps MUST follow this pattern:**

1. Create new app: `python manage.py startapp <app_name>`
2. Define API routes under `/api/<app_name>/`
3. Register app URLs in the app's `urls.py`
4. Include in `config/urls.py` via the main `api/` app

Example URL pattern:
```python
# api/urls.py
urlpatterns = [
    path('weather/', include('weather.urls')),
    path('journal/', include('journal.urls')),
]

# weather/urls.py
urlpatterns = [
    path('forecast/', WeatherForecastViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('current/', CurrentWeatherAPIView.as_view()),
]
# Resulting endpoints: /api/weather/forecast/, /api/weather/current/
```

## Django & DRF Best Practices

### Models
- Inherit from `models.Model` or use shared base models from `core_models.py`
- Always include `created_at` and `updated_at` timestamps
- Use descriptive model names and field names
- Add `__str__` method for admin readability
- Keep business logic in model methods, not views

### Serializers
- Use DRF's `ModelSerializer` for database models
- Validate input data in serializer methods (`validate_<field>`, `validate`)
- Keep serializers focused on one model or closely related models
- Create separate read/write serializers if needed

### Views
- Use `ViewSet` for CRUD operations on a resource
- Use `APIView` for custom endpoints with unique logic
- Implement proper permission classes (e.g., `IsAuthenticated`)
- Always include appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use `get_queryset()` for dynamic filtering based on permissions

### Authentication & Permissions
- Default: Session authentication (configured in settings)
- All views require authentication unless explicitly public
- Use DRF permission classes: `IsAuthenticated`, `IsAdminUser`, `IsAuthenticatedOrReadOnly`
- Validate user ownership before modifying objects

## Python & Code Style

- **Python version**: 3.11+
- **Code style**: PEP 8 compliant
  - Use 4-space indentation
  - Max line length: 88 characters (Black style)
  - Use meaningful variable names
- **Type hints**: Include type hints for functions
- **Imports**: Group as (stdlib, third-party, local) separated by blank lines

## Celery & Async Tasks

When adding background tasks:

```python
# tasks.py
from celery import shared_task

@shared_task
def process_weather_data(location):
    """Process weather data asynchronously."""
    # Task logic here
    pass

# views.py
from .tasks import process_weather_data

class WeatherViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        # Trigger async task instead of blocking
        process_weather_data.delay(request.data['location'])
        return Response({'status': 'processing'})
```

- Use `@shared_task` decorator for all async operations
- Keep tasks idempotent and retry-safe
- Use task names explicitly: `@shared_task(name='weather.process_data')`
- Add error handling and logging in tasks

## Testing

- Write unit tests in each app's `tests.py`
- Use Django's test framework: `TestCase`, `APITestCase`
- Test models, views, and serializers separately
- Use fixtures or factories for test data
- Mock external API calls (weather APIs, etc.)
- Run tests before committing: `python manage.py test`

## Migrations

- Always create migrations after model changes: `python manage.py makemigrations`
- Review migrations before applying: `python manage.py migrate`
- Never commit without migrations
- Name migrations descriptively

## Dependencies

Current stack:
- Django 4.x+
- Django REST Framework
- Celery (for async tasks)
- Redis (for task queue)
- corsheaders (for CORS support)

Add new dependencies thoughtfully and update `requirements.txt`.

## Database Conventions

- Use PostgreSQL in production (currently SQLite for dev)
- Migrations are mandatory for all schema changes
- Use transactions for related operations
- Index frequently queried fields

## Common Commands

```bash
# Create a new app
python manage.py startapp <app_name>

# Make and apply migrations
python manage.py makemigrations
python manage.py migrate

# Run tests
python manage.py test

# Start development server
python manage.py runserver

# Celery worker (when added)
celery -A config worker -l info
```

## Summary

- **Always create new apps with the `/api/<app_name>/` routing pattern**
- Follow DRF conventions for serializers, views, and permissions
- Write tests for all new features
- Use Celery for long-running operations
- Keep code clean, readable, and well-documented
