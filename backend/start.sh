#!/bin/bash

# Exit on error
set -e

# Apply database migrations
# echo "Running database migrations..."
# alembic upgrade head 
# (Uncomment above if/when you have alembic set up, currently using Base.metadata.create_all in main.py)

# Start the application
# Cloud Run injects the PORT environment variable (default 8080)
PORT=${PORT:-8000}
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
