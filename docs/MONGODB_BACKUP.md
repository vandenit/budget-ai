# MongoDB Backup & Restore Guide

This guide explains how to backup and restore your MongoDB Atlas database.

## Prerequisites

You need to have MongoDB tools installed:

```bash
# macOS (with Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb-org-tools

# Or download from: https://www.mongodb.com/try/download/database-tools
```

## Backup Your Database

### Quick Backup

```bash
chmod +x scripts/backup-mongodb.sh
./scripts/backup-mongodb.sh
```

This will:
1. Create a backup directory with timestamp: `backups/mongodb-YYYYMMDD-HHMMSS`
2. Dump all collections from your Atlas database
3. Show you the backup location

### Manual Backup

```bash
mongodump --uri="$MONGODB_URI" --out="./backups/my-backup"
```

## Restore Your Database

### Quick Restore

```bash
chmod +x scripts/restore-mongodb.sh
./scripts/restore-mongodb.sh ./backups/mongodb-20240115-143022
```

This will:
1. Show a warning (5 second delay to cancel)
2. Restore all collections from the backup
3. **WARNING**: This will overwrite existing data!

### Manual Restore

```bash
mongorestore --uri="$MONGODB_URI" --drop ./backups/my-backup
```

## Important Notes

### Before Starting Encryption

Before you start implementing encryption, take a backup:

```bash
./scripts/backup-mongodb.sh
```

This allows you to:
- ✅ Restore to a clean state if something goes wrong
- ✅ Compare encrypted vs unencrypted data
- ✅ Test encryption/decryption logic

### Backup Location

Backups are stored in `./backups/` directory with timestamp:
```
backups/
├── mongodb-20240115-143022/
│   ├── budget-ai/
│   │   ├── users.bson
│   │   ├── transactions.bson
│   │   ├── categories.bson
│   │   └── ...
│   └── ...
└── mongodb-20240115-150000/
    └── ...
```

### Backup Size

The backup size depends on your data:
- Small database (< 100 transactions): ~1-5 MB
- Medium database (1000+ transactions): ~10-50 MB
- Large database (10000+ transactions): ~100+ MB

### Restore Warnings

⚠️ **Important**: `mongorestore --drop` will:
- Delete all existing collections in the target database
- Restore collections from the backup
- This is irreversible!

Always verify you're restoring to the correct database before running.

## Workflow for Encryption Development

### 1. Take Initial Backup
```bash
./scripts/backup-mongodb.sh
# Backup saved to: backups/mongodb-20240115-143022
```

### 2. Start Encryption Implementation
- Modify schemas
- Add encryption logic
- Test with real data

### 3. If Something Goes Wrong
```bash
./scripts/restore-mongodb.sh ./backups/mongodb-20240115-143022
# Database restored to original state
```

### 4. Take New Backup After Changes
```bash
./scripts/backup-mongodb.sh
# Backup saved to: backups/mongodb-20240115-150000
```

## Troubleshooting

### "mongodump: command not found"
Install MongoDB tools:
```bash
brew install mongodb-community  # macOS
sudo apt-get install mongodb-org-tools  # Ubuntu
```

### "Error: MONGODB_URI not set"
Make sure your `.env` file has:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-ai
```

### "Error: connection refused"
- Check your MongoDB URI is correct
- Check your IP is whitelisted in Atlas
- Check your network connection

### "Error: authentication failed"
- Verify username and password in connection string
- Check user has access to the database
- Regenerate credentials in Atlas if needed

## Best Practices

1. **Take backups before major changes**
   ```bash
   ./scripts/backup-mongodb.sh
   ```

2. **Keep multiple backups**
   - Before encryption implementation
   - After each major feature
   - Before production deployments

3. **Test restore process**
   - Regularly test that backups can be restored
   - Don't wait until you need it!

4. **Document your backups**
   - Add notes about what each backup contains
   - Example: `backups/mongodb-20240115-143022-before-encryption/`

5. **Secure your backups**
   - Don't commit backups to git
   - Store important backups in secure location
   - Consider encrypting backup files

## Additional Resources

- [MongoDB mongodump documentation](https://www.mongodb.com/docs/database-tools/mongodump/)
- [MongoDB mongorestore documentation](https://www.mongodb.com/docs/database-tools/mongorestore/)
- [MongoDB Atlas Backup Guide](https://www.mongodb.com/docs/atlas/backup/)
