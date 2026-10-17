#!/bin/bash
cd ~/ForgeAI-Voice/backend || exit 1
source .venv/bin/activate
exec python -m uvicorn app.main:app --reload --port 8000
