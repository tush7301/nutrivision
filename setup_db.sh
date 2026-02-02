#!/bin/bash
set -e

PROJECT_ID="powerful-effort-299312"
REGION="us-central1"
INSTANCE_NAME="nutrivision-db"
DB_USER="nutrivision_user"
DB_PASS="nutrivision_pass_123" # Change this if you want
DB_NAME="nutrivision"
SERVICE_NAME="nutrivision-backend"

echo "Checking status of Cloud SQL instance '$INSTANCE_NAME'..."

# Loop until runnable
while true; do
    STATUS=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(state)" 2>/dev/null || echo "UNKNOWN")
    
    if [ "$STATUS" == "RUNNABLE" ]; then
        echo "Instance is RUNNABLE!"
        break
    else
        echo "Instance state is: $STATUS. Waiting 30 seconds..."
        sleep 30
    fi
done

echo "Creating database user..."
gcloud sql users create $DB_USER --instance=$INSTANCE_NAME --password=$DB_PASS --project=$PROJECT_ID || echo "User might already exist, skipping."

echo "Creating database..."
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME --project=$PROJECT_ID || echo "Database might already exist, skipping."

echo "Getting Connection Name..."
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(connectionName)")
echo "Connection Name: $CONNECTION_NAME"

echo "Updating Cloud Run Service..."
# Construct DATABASE_URL
# Format: postgresql+psycopg2://<USER>:<PASS>@/<DB_NAME>?host=/cloudsql/<CONNECTION_NAME>
DATABASE_URL="postgresql+psycopg2://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"

gcloud run services update $SERVICE_NAME \
    --project=$PROJECT_ID \
    --region=$REGION \
    --add-cloudsql-instances=$CONNECTION_NAME \
    --update-env-vars=DATABASE_URL=$DATABASE_URL

echo "Done! Cloud Run successfully connected to Cloud SQL."
