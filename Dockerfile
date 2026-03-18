FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils && rm -rf /var/lib/apt/lists/*

# Set up user for Hugging Face Spaces compatibility (requires non-root user 1000)
RUN useradd -m -u 1000 user
WORKDIR /app

# Combine requirements
COPY backend/requirements.txt ./backend-reqs.txt
COPY worker/requirements.txt ./worker-reqs.txt
RUN pip install --no-cache-dir -r backend-reqs.txt -r worker-reqs.txt

# Copy all code
COPY --chown=1000:1000 shared/ ./shared/
COPY --chown=1000:1000 backend/ ./backend/
COPY --chown=1000:1000 worker/ ./worker/
COPY --chown=1000:1000 start.sh ./start.sh

# Ensure storage directories exist and are writable by the user
RUN mkdir -p /storage/uploads /storage/output && chown -R 1000:1000 /storage
ENV STORAGE_PATH=/storage
ENV PYTHONPATH=/app

# Expose Hugging Face's default port
EXPOSE 7860

USER user

# Start both Worker and Backend
CMD ["./start.sh"]
