#!/bin/bash

# Exit on error
set -e

# Handle Google Cloud Credentials
# If GOOGLE_CREDENTIALS_BASE64 is set, decode it to a file
if [ -n "$GOOGLE_CREDENTIALS_BASE64" ]; then
    echo "Decoding Google Credentials from GOOGLE_CREDENTIALS_BASE64..."
    echo "$GOOGLE_CREDENTIALS_BASE64" | base64 -d > /app/google_credentials.json
    export GOOGLE_APPLICATION_CREDENTIALS="/app/google_credentials.json"
elif [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
    # Fallback to direct JSON content if someone pasted it (might be risky with newlines)
    echo "Writing Google Credentials from GOOGLE_CREDENTIALS_JSON..."
    echo "$GOOGLE_CREDENTIALS_JSON" > /app/google_credentials.json
    export GOOGLE_APPLICATION_CREDENTIALS="/app/google_credentials.json"
fi

# Apply database migrations
# echo "Running database migrations..."
# alembic upgrade head 
# (Uncomment above if/when you have alembic set up, currently using Base.metadata.create_all in main.py)

# Start the application
# Cloud Run injects the PORT environment variable (default 8080)
PORT=${PORT:-8000}
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
