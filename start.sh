#!/bin/bash
python -m worker.main &
python -m uvicorn backend.main:app --host 0.0.0.0 --port 7860
