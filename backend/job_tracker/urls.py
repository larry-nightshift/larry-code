from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet,
    ApplicationViewSet,
    ContactViewSet,
    ActivityViewSet,
    ReminderViewSet,
    InterviewPrepNoteViewSet,
    DashboardAPIView,
    ExportViewSet,
)

router = DefaultRouter()
router.register(r"companies", CompanyViewSet, basename="company")
router.register(r"applications", ApplicationViewSet, basename="application")
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"export", ExportViewSet, basename="export")

urlpatterns = [
    path("", include(router.urls)),
    # Nested routes for activities, reminders, prep notes
    path(
        "applications/<uuid:application_id>/activities/",
        ActivityViewSet.as_view({"get": "list", "post": "create"}),
        name="activity-list",
    ),
    path(
        "applications/<uuid:application_id>/activities/<uuid:pk>/",
        ActivityViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="activity-detail",
    ),
    path(
        "applications/<uuid:application_id>/reminders/",
        ReminderViewSet.as_view({"get": "list", "post": "create"}),
        name="reminder-list",
    ),
    path(
        "applications/<uuid:application_id>/reminders/<uuid:pk>/",
        ReminderViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="reminder-detail",
    ),
    path(
        "applications/<uuid:application_id>/reminders/<uuid:pk>/complete/",
        ReminderViewSet.as_view({"post": "complete"}),
        name="reminder-complete",
    ),
    path(
        "applications/<uuid:application_id>/prep-notes/",
        InterviewPrepNoteViewSet.as_view({"get": "list", "post": "create"}),
        name="prep-note-list",
    ),
    path(
        "applications/<uuid:application_id>/prep-notes/<uuid:pk>/",
        InterviewPrepNoteViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"}),
        name="prep-note-detail",
    ),
    # Dashboard
    path(
        "dashboard/",
        DashboardAPIView.as_view({"get": "overview"}),
        name="dashboard",
    ),
    # Reminders list (for all applications)
    path(
        "reminders/",
        ReminderViewSet.as_view({"get": "list"}),
        name="reminders-all",
    ),
]
