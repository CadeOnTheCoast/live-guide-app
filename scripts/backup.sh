#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "Creating backup in $BACKUP_DIR..."

# Backup Database
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env"
  exit 1
fi

echo "Dumping database..."
if pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup.sql"; then
  echo "✅ Database dump successful."
else
  echo "❌ Database dump failed. Make sure pg_dump is installed and DATABASE_URL is correct."
  # Don't exit, try to backup files anyway
fi

# Backup Data Directory
if [ -d "data" ]; then
  echo "Copying data directory..."
  cp -r data "$BACKUP_DIR/data"
  echo "✅ Data directory copied."
else
  echo "⚠️ Data directory not found."
fi

# Summary
echo "Backup complete: $BACKUP_DIR"
