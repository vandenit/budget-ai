#!/bin/bash

# Script to restore MongoDB Atlas database from backup
# Usage: ./scripts/restore-mongodb.sh <backup_directory>

set -e

# Check if backup directory is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore-mongodb.sh <backup_directory>"
  echo ""
  echo "Example:"
  echo "  ./scripts/restore-mongodb.sh ./backups/mongodb-20240115-143022"
  exit 1
fi

BACKUP_DIR="$1"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

# Get MongoDB URI from .env or environment
MONGODB_URI="${MONGODB_URI}"

if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI not set"
  echo "Please set MONGODB_URI environment variable or add it to .env"
  exit 1
fi

echo "=========================================="
echo "MongoDB Restore"
echo "=========================================="
echo "Backup directory: $BACKUP_DIR"
echo "Target database: $MONGODB_URI"
echo ""
echo "WARNING: This will overwrite existing data!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
echo ""

sleep 5

# Run mongorestore
echo "Restoring database..."
mongorestore --uri="$MONGODB_URI" --drop "$BACKUP_DIR"

echo ""
echo "=========================================="
echo "Restore completed successfully!"
echo "=========================================="
echo ""
