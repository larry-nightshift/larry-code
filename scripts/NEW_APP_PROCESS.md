New app process (manual & automated)

Goal: reliably scaffold a new Django app + frontend feature and register both.

Manual steps (safe, explicit)
1) Backend app
   - cd /home/dplouffe/projects/larry/backend
   - source ../.venv/bin/activate
   - python manage.py startapp <appname>
   - edit backend/config/settings.py → add '<appname>' to INSTALLED_APPS
   - create backend/<appname>/urls.py with DRF router stub
   - edit backend/api/urls.py -> add: path('<appname>/', include('<appname>.urls')),
   - create serializers.py, views.py with a ModelViewSet
   - python manage.py makemigrations <appname>
   - python manage.py migrate

2) Frontend feature
   - cd /home/dplouffe/projects/larry/frontend
   - mkdir -p src/features/<appname>
   - create src/features/<appname>/index.tsx (exports default component)
   - create src/features/<appname>/<FeatureName>List.tsx (basic UI)
   - wire into App.tsx or sidebar config
   - npm run dev and test API calls

3) Git
   - git add -A
   - git commit -m "scaffold: new app <appname>"
   - git push origin main

Automated script
- scripts/new_app.py attempts to execute the manual steps, then commits and pushes.
- If the script fails, follow the manual steps above and inspect logs in scripts/new_app.log (if present).

Safety
- Do not add secrets to commits; ensure .gitignore includes .env/.venv/db files.
- Review changes before running in production.

Troubleshooting
- If Django complains about missing app, confirm the app folder lives under backend/ and the app module is importable (backend must be on PYTHONPATH or run manage.py from backend).
- If frontend route not appearing, restart Vite (npm run dev) after file changes.
