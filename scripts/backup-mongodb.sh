#!/bin/bash

# Script to backup MongoDB Atlas database
# Usage: ./scripts/backup-mongodb.sh

set -e

# Get MongoDB URI from .env or environment
MONGODB_URI="${MONGODB_URI}"

if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI not set"
  echo "Please set MONGODB_URI environment variable or add it to .env"
  exit 1
fi

# Create backup directory with timestamp
BACKUP_DIR="./backups/mongodb-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "MongoDB Backup"
echo "=========================================="
echo "Backup directory: $BACKUP_DIR"
echo ""

# Run mongodump
echo "Dumping database..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR"

echo ""
echo "=========================================="
echo "Backup completed successfully!"
echo "=========================================="
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
echo "To restore this backup later, run:"
echo "  ./scripts/restore-mongodb.sh $BACKUP_DIR"
echo ""
