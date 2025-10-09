# backend/Dockerfile
FROM public.ecr.aws/docker/library/python:3.11-slim-buster

# <- NUEVO: inyectar el SHA del build
ARG GIT_SHA=dev
ENV APP_GIT_SHA=${GIT_SHA} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings

WORKDIR /app

# Copia SOLO el backend (donde está manage.py, requirements.txt y entrypoint.sh)
COPY . .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Usa tu entrypoint
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8000
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
