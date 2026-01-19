# /webapps/erd-ecosystem/apps/pmbok/backend/core/settings.py
"""
Django settings for core project...
"""

from pathlib import Path
from datetime import timedelta
import os
import urllib.request
from corsheaders.defaults import default_headers, default_methods

BASE_DIR = Path(__file__).resolve().parent.parent

# --- DEBUG: Controlado por variable de entorno ---
# En K8s local, esto será "1" (True). En Prod será "0" (False).
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() in (
    "1", "true", "yes", "on")
IS_PROD = not DEBUG


def _csv_env(name: str) -> list[str]:
    """Lee VAR='a,b,c' => ['a','b','c'] (limpia espacios y vacíos)."""
    raw = os.getenv(name, "")
    return [x.strip() for x in raw.split(",") if x.strip()]


def _add_origin(target_list: list[str], scheme: str, host: str, port: str | None = None):
    """Agrega 'scheme://host[:port]' sin duplicados."""
    origin = f"{scheme}://{host}" if not port else f"{scheme}://{host}:{port}"
    if origin not in target_list:
        target_list.append(origin)


# --- SECRET_KEY ---
SECRET_KEY = os.environ.get("SECRET_KEY", None) or (
    # Fallback solo para que collectstatic no falle en build
    "django-insecure-local-dev-key"
    if not IS_PROD
    else (_ for _ in ()).throw(RuntimeError("SECRET_KEY no definido en producción"))
)

# -----------------------------------------------------------------------------
# HOSTS PERMITIDOS (ALLOWED_HOSTS)
# -----------------------------------------------------------------------------
if not IS_PROD:
    # ✅ CURA DEL ERROR: En Local/K8s, los Health Checks usan IPs internas dinámicas.
    # Permitir '*' evita el error "DisallowedHost: 10.244.x.x"
    ALLOWED_HOSTS = ["*"]
else:
    # En Producción somos estrictos
    ALLOWED_HOSTS = [
        "api.elrincondeldetective.com",
        "pmbok-app-prod.eba-p9tjqp8p.us-east-1.elasticbeanstalk.com",
    ]
    # Hosts extra inyectados por entorno (ej. dominios temporales)
    ALLOWED_HOSTS.extend(_csv_env("EXTRA_ALLOWED_HOSTS"))


# --- Seguridad detrás de Proxy (Traefik/AWS ALB) ---
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

if IS_PROD:
    SECURE_SSL_REDIRECT = True
    # Dejar pasar health checks sin redirigir
    SECURE_REDIRECT_EXEMPT = [r"^healthz$", r"^version$"]
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = "Lax"
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"

# ------------------------------------------------------------
# CORS & CSRF (Configuración Dinámica)
# ------------------------------------------------------------

# Dominios de confianza base
CSRF_TRUSTED_ORIGINS = [
    "https://api.elrincondeldetective.com",
    "https://pmbok-app-prod.eba-p9tjqp8p.us-east-1.elasticbeanstalk.com",
    "https://api.ihexhubs.com",
]
CSRF_TRUSTED_ORIGINS.extend(_csv_env("EXTRA_CSRF_TRUSTED_ORIGINS"))

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://pmbok-6.elrincondeldetective.com",
    "https://elrincondeldetective.com",
    "https://www.elrincondeldetective.com",
    "https://main.dm5h6z9u3b12.amplifyapp.com",
    "https://ihexhubs.com",
    "https://www.ihexhubs.com",
]
CORS_ALLOWED_ORIGINS.extend(_csv_env("EXTRA_CORS_ALLOWED_ORIGINS"))

if not IS_PROD:
    # Configuración automática para entorno Local (Traefik)
    gateway_host = os.getenv("LOCAL_GATEWAY_HOST", "pmbok.localhost")
    gateway_scheme = os.getenv("LOCAL_GATEWAY_SCHEME", "http")
    gateway_port = os.getenv("GATEWAY_HTTP_PORT")  # Viene de .env.local.ports

    if gateway_port:
        for h in {gateway_host, "localhost", "127.0.0.1"}:
            _add_origin(CSRF_TRUSTED_ORIGINS, gateway_scheme, h, gateway_port)
            _add_origin(CORS_ALLOWED_ORIGINS, gateway_scheme, h, gateway_port)

    # Vite (Frontend dev server directo)
    vite_port = os.getenv("VITE_DEV_PORT")
    if vite_port:
        for h in {"localhost", "127.0.0.1"}:
            _add_origin(CSRF_TRUSTED_ORIGINS, "http", h, vite_port)
            _add_origin(CORS_ALLOWED_ORIGINS, "http", h, vite_port)

CORS_ALLOW_HEADERS = list(default_headers) + ["authorization", "content-type"]
CORS_ALLOW_METHODS = list(default_methods)
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_CREDENTIALS = False

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# ------------------------------------------------------------------
# BASE DE DATOS
# ------------------------------------------------------------------
# En Local Overlay pusimos DB_SSLMODE="disable". En Prod será "require".
DB_SSLMODE = os.environ.get("DB_SSLMODE", "require" if IS_PROD else "disable")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "postgres"),
        "USER": os.environ.get("DB_USER", "postgres"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("DB_HOST", "db"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "OPTIONS": {
            "sslmode": DB_SSLMODE
        },
    }
}

# --- APPS & MIDDLEWARE ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "api",
    "django_prometheus",  # Monitoreo
]

MIDDLEWARE = [
    "django_prometheus.middleware.PrometheusBeforeMiddleware",  # Primero
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Archivos estáticos
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS antes de Common
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_prometheus.middleware.PrometheusAfterMiddleware",  # Último
]

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

LANGUAGES = [("es", "Español"), ("en", "English")]
LOCALE_PATHS = [BASE_DIR / "locale"]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "api.CustomUser"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler", "stream": "ext://sys.stdout"},
    },
    "loggers": {
        # Silenciamos la advertencia de host en consola, pero con ALLOWED_HOSTS=['*'] ya no saldrá
        "django.security.DisallowedHost": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

TWO_FA_CODE_REGISTRATION_1 = "123456"
TWO_FA_CODE_REGISTRATION_2 = "789012"
TWO_FA_CODE_LOGIN = "112233"
