FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (.dockerignore excludes .env, virtualenvs, caches and tests)
COPY . .

# Run as an unprivileged user. /app/storage holds the AI audit log (X11) and is private to it.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /app/storage/ai-audit \
    && chown -R appuser:appuser /app/storage \
    && chmod 700 /app/storage /app/storage/ai-audit
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
