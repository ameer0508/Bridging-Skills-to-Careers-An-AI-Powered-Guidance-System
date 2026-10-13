FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Local OCR (X1): Tesseract with only the approved languages (English, Hindi, Telugu, Tamil, Kannada,
# Malayalam), from the Debian archive. No Spanish data, on the owner's instruction. Free and offline;
# python -m app.multilingual.ocr_selfcheck verifies it in the Docker workflow.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       tesseract-ocr tesseract-ocr-eng tesseract-ocr-hin tesseract-ocr-tel tesseract-ocr-tam tesseract-ocr-kan tesseract-ocr-mal \
    && rm -rf /var/lib/apt/lists/*

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
