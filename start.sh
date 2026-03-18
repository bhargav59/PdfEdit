#!/bin/bash

# Start the RQ worker in the background
python -m worker.main &

# Start the FastAPI backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
