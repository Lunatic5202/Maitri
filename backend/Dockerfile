# Backend Dockerfile - runs FastAPI with uvicorn
FROM python:3.11-slim

WORKDIR /app

# system deps for soundfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

# copy pinned requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy source
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
