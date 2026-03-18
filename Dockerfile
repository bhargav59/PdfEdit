FROM python:3.12-slim

# Install system dependencies (Poppler for PDF handling)
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Combine requirements
COPY backend/requirements.txt ./backend-reqs.txt
COPY worker/requirements.txt ./worker-reqs.txt
RUN pip install --no-cache-dir -r backend-reqs.txt -r worker-reqs.txt

# Copy all code
COPY shared/ ./shared/
COPY backend/ ./backend/
COPY worker/ ./worker/
COPY start.sh ./start.sh

# Ensure storage directories exist
RUN mkdir -p /storage/uploads /storage/output
ENV STORAGE_PATH=/storage
ENV PYTHONPATH=/app

# Start both Worker and Backend
CMD ["./start.sh"]
