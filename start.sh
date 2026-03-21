#!/bin/bash
# Start redis
redis-server --daemonize yes

# Start worker and backend
python -m worker.main &

# Use Railway's dynamic PORT if available, else default to 7860 (Hugging Face)
PORT="${PORT:-7860}"
python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
