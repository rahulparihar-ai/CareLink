FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the ai package as an importable package (from the repo root context).
COPY . .

EXPOSE 8001

CMD ["uvicorn", "ai.app.main:app", "--host", "0.0.0.0", "--port", "8001"]