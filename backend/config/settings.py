"""
Django settings for config project.
"""
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'dev'
DEBUG = True
ALLOWED_HOSTS = ['127.0.0.1','localhost']
INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'api',
    'weather',
    'journalapp',
    'recipes',
    'grocery',
    'habits',
    'maintenance',
    'posts',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{ 'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages'],},},]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'db.sqlite3',}}
LANGUAGE_CODE='en-us'
TIME_ZONE='America/Toronto'
USE_I18N=True
USE_TZ=True
STATIC_URL='static/'
CORS_ALLOWED_ORIGINS=['http://localhost:5173','http://127.0.0.1:5173','http://localhost:6173','http://127.0.0.1:6173']
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=['http://localhost:6173','http://127.0.0.1:6173']
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['rest_framework.authentication.SessionAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],}
