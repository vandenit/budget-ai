# End-to-End Encryption Setup Guide

This guide explains how to set up and use the end-to-end encryption POC.

## Overview

The encryption system uses RSA-2048 key pairs:
- **Server key pair**: Used to encrypt/decrypt user's private keys during transit
- **User key pair**: Used to encrypt amounts in the database

## Setup Instructions

### 1. Generate Server Keys

Run the key generation script:

```bash
chmod +x scripts/generate-encryption-keys.sh
./scripts/generate-encryption-keys.sh
```

This will output:
- Private key (PEM format)
- Public key (PEM format)
- Base64 encoded versions for Kubernetes

### 2. Configure Environment Variables

Add to `.env` file:

```bash
SERVER_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
SERVER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

### 3. Configure Kubernetes Secret

Update `kube/config/dev/api-encryption-secret.yml.template` with base64 encoded keys:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: budget-api-encryption-secret
  namespace: dev
type: Opaque
data:
  SERVER_PRIVATE_KEY: <base64-encoded-private-key>
  SERVER_PUBLIC_KEY: <base64-encoded-public-key>
```

Then apply:

```bash
kubectl apply -f kube/config/dev/api-encryption-secret.yml
```

### 4. Update API Deployment

The `kube/dev/api-deployment.yml.template` already includes the encryption secret in `envFrom`.

## API Endpoints

### Get Server Public Key
```
GET /encryption/server-public-key
```
Returns the server's public key (no auth required)

### Save User Public Key
```
POST /encryption/public-key
Authorization: Bearer <token>
Content-Type: application/json

{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### Get User Public Key
```
GET /encryption/public-key
Authorization: Bearer <token>
```
Returns the user's public key (used by sync service)

### Check Encryption Setup Status
```
GET /encryption/setup-status
Authorization: Bearer <token>
```
Returns:
```json
{
  "hasEncryption": true,
  "version": 1
}
```

## Frontend Usage

### 1. Check if Encryption is Set Up

```typescript
import { useEncryptionSetup } from '@/app/hooks/use-encryption-setup';

const { checkSetupStatus, setupStatus } = useEncryptionSetup();

useEffect(() => {
  checkSetupStatus();
}, []);

if (setupStatus?.hasEncryption) {
  // User has encryption set up
}
```

### 2. Setup Encryption

```typescript
const { setupEncryption } = useEncryptionSetup();

const result = await setupEncryption(userId);
if (result.success) {
  // Encryption set up successfully
  // Private key is stored in sessionStorage
}
```

### 3. Use Encryption Functions

```typescript
import {
  generateUserKeyPair,
  exportPublicKeyToPem,
  importPrivateKeyFromPem,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getPrivateKeyFromSession,
} from '@/lib/encryption/client-crypto';

// Get private key from session
const privateKeyPem = getPrivateKeyFromSession(userId);
const privateKey = await importPrivateKeyFromPem(privateKeyPem);

// Decrypt amounts
const decryptedAmount = await decryptWithPrivateKey(encryptedAmount, privateKey);
```

## Security Considerations

### What's Protected
- ✅ Amounts at rest in database (encrypted)
- ✅ User's private key (never stored, only in browser)
- ✅ Private key in transit (encrypted with server's public key)

### What's NOT Protected
- ⚠️ Server private key (admin can read from Kubernetes secret)
- ⚠️ Amounts during analysis requests (sent plain when user requests)
- ⚠️ Metadata (payee, category, memo)

### Important Notes
- **NEVER log private keys** or request/response bodies containing them
- **ALWAYS use HTTPS** for all encryption-related requests
- **Private keys are cleared from memory** after use
- **Server private key must be kept secure** in Kubernetes secret

## Troubleshooting

### "SERVER_PRIVATE_KEY not configured"
- Make sure environment variables are set
- Check Kubernetes secret is applied: `kubectl get secret budget-api-encryption-secret -n dev`

### "Web Crypto API not available"
- Only works in browser (HTTPS required in production)
- Check browser console for errors

### "Invalid public key format"
- Ensure key is in PEM format with BEGIN/END markers
- Check for newline characters

## Next Steps

1. ✅ POC: Key generation and storage
2. ⏳ Encrypt transaction amounts during YNAB sync
3. ⏳ Decrypt amounts on frontend
4. ⏳ Analysis flow with encrypted private key
5. ⏳ AI categorization with decrypted data
6. ⏳ Comprehensive testing and audit
