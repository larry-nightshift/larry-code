#!/usr/bin/env python3
"""Scaffold a new Django app + React feature and register them in the project.
Usage: python scripts/new_app.py --name journal --title "Journal"
ROBUST
"""
from pathlib import Path
import argparse, subprocess, sys

ROOT = Path('/home/dplouffe/projects/larry')
BACKEND = ROOT / 'backend'
FRONTEND = ROOT / 'frontend'

def run(cmd, cwd=ROOT):
    print('>', ' '.join(cmd))
    r = subprocess.run(cmd, cwd=str(cwd))
    if r.returncode != 0:
        raise SystemExit(r.returncode)

def create_django_app(name):
    run(['bash','-lc', f'source {ROOT}/.venv/bin/activate && python {BACKEND}/manage.py startapp {name}'], cwd=ROOT)

def register_app_in_settings(name):
    settings = BACKEND / 'config' / 'settings.py'
    s = settings.read_text()
    marker = "'api',\n    'django.contrib.admin',"
    insert = f"'api',\n    '{name}',\n    'django.contrib.admin',"
    if insert not in s:
        s = s.replace(marker, insert)
        settings.write_text(s)
        print('updated settings.py')

def register_app_in_api_urls(name):
    api_urls = BACKEND / 'api' / 'urls.py'
    s = api_urls.read_text()
    include_line = f"    path('{name}/', include('{name}.urls')) ,\n"
    if include_line.strip() not in s:
        s = s.replace("urlpatterns = [\n    path('', include(router.urls)),\n]",
                      "urlpatterns = [\n    path('', include(router.urls)),\n" + include_line + "]")
        api_urls.write_text(s)
        print('updated api/urls.py')

def create_backend_urls(name):
    app_urls = BACKEND / name / 'urls.py'
    if not app_urls.exists():
        app_urls.write_text("from django.urls import path, include\nfrom rest_framework.routers import DefaultRouter\nfrom . import views\n\nrouter = DefaultRouter()\n# register viewsets here\n\nurlpatterns = [\n    path('', include(router.urls)),\n]\n")
        print('wrote', app_urls)

def create_frontend_feature(name, title):
    feat = FRONTEND / 'src' / 'features' / name
    feat.mkdir(parents=True, exist_ok=True)
    (feat / 'index.tsx').write_text(f"import {title.replace(' ','')} from './{title.replace(' ','')}List'\nexport default {title.replace(' ','')}\n")
    (feat / f'{title.replace(' ','')}List.tsx').write_text("import React from 'react'\nexport default function Component(){ return <div>TODO: feature</div> }")
    print('created frontend feature', feat)

def git_commit_and_push(msg):
    run(['git','add','.'], cwd=str(ROOT))
    run(['git','commit','-m', msg], cwd=str(ROOT))
    run(['git','push','origin','main'], cwd=str(ROOT))

if __name__=='__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--name', required=True)
    ap.add_argument('--title', required=True)
    args = ap.parse_args()
    name = args.name
    title = args.title
    create_django_app(name)
    create_backend_urls(name)
    register_app_in_settings(name)
    register_app_in_api_urls(name)
    create_frontend_feature(name, title)
    run(['bash','-lc', f'source {ROOT}/.venv/bin/activate && cd {BACKEND} && python manage.py makemigrations {name} || true && python manage.py migrate || true'], cwd=ROOT)
    git_commit_and_push(f"scaffold: new app {name}")
    print('done')
