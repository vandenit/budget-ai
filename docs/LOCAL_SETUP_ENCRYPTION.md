# Local Setup Guide - End-to-End Encryption

This guide helps you set up your local environment for testing the E2E encryption POC.

## Prerequisites

- Node.js 18+
- MongoDB Atlas account with connection string
- Auth0 account (or existing credentials)
- YNAB API key
- OpenAI API key

## Step 1: Generate Server Encryption Keys

First, generate the RSA key pair for the server:

```bash
chmod +x scripts/generate-encryption-keys.sh
./scripts/generate-encryption-keys.sh
```

This will output:
```
SERVER_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----

SERVER_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

**Save these values** - you'll need them in the next steps.

## Step 2: Setup API .env

Create or update `packages/api/.env.local`:

```bash
# Server configuration
PORT=4000
NODE_ENV=development

# MongoDB configuration (use your Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-ai?retryWrites=true&w=majority

# Auth0 configuration
AUTH0_ISSUER_BASE_URL=https://your-tenant.region.auth0.com
AUTH0_AUDIENCE=YOUR_AUTH0_AUDIENCE

# YNAB API configuration
YNAB_API_KEY=YOUR_YNAB_API_KEY_HERE

# Sync configuration
SYNC_SECRET=your-local-sync-secret-here

# OpenAI configuration
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# End-to-End Encryption (from Step 1)
SERVER_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----

SERVER_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

## Step 3: Setup Web .env

Create or update `packages/web/.env.local`:

```bash
# YNAB OAuth
YNAB_CLIENT_ID=YOUR_YNAB_CLIENT_ID_HERE
YNAB_CLIENT_SECRET=YOUR_YNAB_CLIENT_SECRET_HERE

# Auth0 configuration
AUTH0_SECRET=GENERATE_A_RANDOM_SECRET_HERE
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.region.auth0.com
AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET
AUTH0_AUDIENCE=https://your-tenant.region.auth0.com/api/v2/
AUTH0_SCOPE=openid profile
AUTH0_CALLBACK=api/defauth/callback

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=GENERATE_A_RANDOM_SECRET_HERE

# Sync configuration (must match API)
SYNC_SECRET=your-local-sync-secret-here

# API URLs
API_URL=http://localhost:4000
MATH_API_URL=http://localhost:5000

# OpenAI configuration
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Sentry (optional for local dev)
SENTRY_DISABLED=true
```

## Step 4: Backup Your Database

Before testing, take a backup of your current database:

```bash
./scripts/backup-mongodb.sh
# Backup saved to: backups/mongodb-YYYYMMDD-HHMMSS
```

## Step 5: Start Local Development

### Terminal 1 - API Server
```bash
cd packages/api
npm run dev
# Server running on http://localhost:4000
```

### Terminal 2 - Web Server
```bash
cd packages/web
npm run dev
# Web running on http://localhost:3000
```

### Terminal 3 - Math API (optional)
```bash
cd packages/mathapi
python -m uvicorn app.main:app --reload --port 5000
```

## Step 6: Test Encryption Setup

1. **Login to the app**
   - Go to http://localhost:3000
   - Login with Auth0

2. **Connect to YNAB**
   - Click "Connect to YNAB"
   - Authorize the app

3. **Trigger Sync**
   - The sync should automatically:
     - Generate encryption key for your user
     - Encrypt transaction amounts
     - Store encrypted data in MongoDB

4. **Verify Encryption**
   - Check MongoDB directly:
     ```bash
     mongosh "your-connection-string"
     use budget-ai
     db.localtransactions.findOne()
     ```
   - You should see `amount` as encrypted string (not a number)

## Troubleshooting

### "SERVER_PRIVATE_KEY not configured"
- Make sure you added the keys to `.env.local`
- Restart the API server after updating `.env.local`

### "Web Crypto API not available"
- Only works in browser (HTTPS required in production)
- Check browser console for errors

### "Failed to encrypt amount"
- Check that user has public key: `db.users.findOne({authId: "your-auth-id"})`
- Should have `encryption.publicKey` field

### "Sync skipped"
- Check API logs for encryption key generation errors
- Verify MongoDB connection is working

### Database Issues
- Restore from backup: `./scripts/restore-mongodb.sh ./backups/mongodb-YYYYMMDD-HHMMSS`
- Or clear collections and resync

## Testing Workflow

### 1. Initial Setup
```bash
# Generate keys
./scripts/generate-encryption-keys.sh

# Backup database
./scripts/backup-mongodb.sh

# Setup .env files (see steps 2-3)
```

### 2. Start Development
```bash
# Terminal 1
cd packages/api && npm run dev

# Terminal 2
cd packages/web && npm run dev
```

### 3. Test Encryption
- Login
- Connect YNAB
- Trigger sync
- Verify amounts are encrypted in MongoDB

### 4. If Something Goes Wrong
```bash
# Restore database
./scripts/restore-mongodb.sh ./backups/mongodb-YYYYMMDD-HHMMSS

# Restart servers
# (Ctrl+C in terminals, then npm run dev again)
```

## Next Steps

After local testing:
1. ✅ Verify encryption is working
2. ⏳ Implement frontend decryption (Phase 3)
3. ⏳ Test analysis flow with encrypted private key
4. ⏳ Implement AI categorization with decrypted data

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `SERVER_PRIVATE_KEY` | Server RSA private key | `-----BEGIN PRIVATE KEY-----...` |
| `SERVER_PUBLIC_KEY` | Server RSA public key | `-----BEGIN PUBLIC KEY-----...` |
| `AUTH0_*` | Auth0 configuration | See Auth0 dashboard |
| `YNAB_*` | YNAB OAuth | See YNAB app settings |
| `SYNC_SECRET` | Sync authentication | Any random string |
| `OPENAI_API_KEY` | OpenAI API | From OpenAI dashboard |

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API logs: `packages/api/npm run dev`
3. Check browser console: F12 in browser
4. Check MongoDB: `mongosh` and query collections
