# End-to-End Encryption Strategies

## Challenge
We need to balance two competing requirements:
1. **Privacy**: Encrypt sensitive financial data (amounts) so server/DB admins cannot read it
2. **Functionality**: Backend needs to perform analyses, AI categorization, predictions, and forecasting

This document outlines different strategies to achieve both.

## Key Constraints
- Master key must NEVER leave the browser
- Backend cannot have access to private keys
- YNAB sync happens server-side (async job)
- AI categorization, predictions, and forecasting are core features

## Strategy 1: Full E2E Encryption (Maximum Privacy)

### Approach
- All amounts encrypted with user's private key
- Backend never sees unencrypted amounts
- All analyses done client-side

### Implementation
```
Frontend:
- Decrypt amounts in browser
- Run analyses locally (predictions, forecasting)
- Send only results to backend

Backend:
- Stores encrypted amounts
- Cannot perform analyses
- Acts as data store only
```

### Pros
- ✅ Maximum privacy
- ✅ Backend cannot read amounts even if compromised
- ✅ No sensitive data in transit

### Cons
- ❌ Analyses only work when user is online
- ❌ Complex client-side calculations
- ❌ Cannot share analyses between devices
- ❌ AI categorization must run on frontend (slow, limited)
- ❌ No real-time predictions
- ❌ Performance issues on mobile

### Security Level
🔒🔒🔒🔒🔒 (Maximum)

---

## Strategy 2: Hybrid Encryption (Recommended)

### Approach
- **At rest**: Amounts encrypted in database
- **In transit**: Amounts encrypted when sent to backend
- **For analysis**: Frontend decrypts → sends plain amounts to backend for analysis only
- **After analysis**: Backend returns encrypted results

### Implementation

#### Key Setup
```typescript
// User generates key pair on first login
- Private key: stored in browser sessionStorage (never leaves browser)
- Public key: sent to backend
- Sync key: generated for YNAB sync (encrypted with private key, stored in DB)
```

#### YNAB Sync Flow
```
1. Sync job (backend):
   - Fetches YNAB data
   - Encrypts amounts with PUBLIC key (hybrid: AES + ECDH)
   - Stores encrypted amounts in DB

2. Frontend:
   - Decrypts amounts with PRIVATE key
   - Displays to user
```

#### Analysis Flow
```
1. User requests analysis (e.g., spending forecast)
2. Frontend:
   - Decrypts amounts locally
   - Sends PLAIN amounts to backend (via HTTPS)
   - Marks request as "analysis request"

3. Backend:
   - Performs analysis/AI categorization
   - Returns results (encrypted or plain)
   - Does NOT store plain amounts

4. Frontend:
   - Receives results
   - Displays to user
   - Can cache results locally
```

#### AI Categorization Flow
```
1. User has uncategorized transaction
2. Frontend:
   - Decrypts transaction amount
   - Sends to backend: { payee, amount, memo, date }
   - Marks as "AI request"

3. Backend:
   - Calls AI API with plain data
   - Returns suggested category
   - Does NOT store plain amounts

4. Frontend:
   - Receives suggestion
   - User approves/edits
   - Sends encrypted category back to backend
```

### Pros
- ✅ Amounts encrypted at rest in DB
- ✅ Backend can perform analyses when needed
- ✅ AI categorization works
- ✅ Predictions and forecasting work
- ✅ Can share analyses between devices
- ✅ Good balance of privacy and functionality

### Cons
- ⚠️ Amounts sent plain to backend for analysis (but only when user requests)
- ⚠️ Requires HTTPS (standard practice anyway)
- ⚠️ More complex implementation
- ⚠️ Need to audit what data is sent for analysis

### Security Level
🔒🔒🔒🔒 (High)

### Data Breach Scenarios

**Scenario A: DB Breach**
- Attacker gets encrypted amounts
- Cannot decrypt without private key
- ✅ Safe

**Scenario B: API Server Compromised**
- Attacker can see analysis requests (plain amounts)
- But only for analyses user explicitly requested
- Cannot see historical data (still encrypted in DB)
- ⚠️ Partial exposure (acceptable for analysis requests)

**Scenario C: HTTPS Intercepted (MitM)**
- Attacker sees plain amounts during analysis requests
- Same as Scenario B
- ⚠️ Mitigated by HTTPS/TLS

---

## Strategy 3: Differential Encryption

### Approach
- Different data encrypted differently based on sensitivity
- Amounts: encrypted with private key (high sensitivity)
- Metadata: encrypted with symmetric key (medium sensitivity)
- Analyses: stored plain (low sensitivity, user-initiated)

### Implementation
```
Database:
- transaction.amount: encrypted (private key)
- transaction.payee: encrypted (symmetric key)
- transaction.memo: encrypted (symmetric key)
- analysis_results: plain (user-initiated, temporary)

Backend:
- Can decrypt metadata with symmetric key
- Cannot decrypt amounts
- Can perform analyses on plain amounts (when sent by frontend)
```

### Pros
- ✅ Granular control over what's encrypted
- ✅ Can search/filter on metadata
- ✅ Analyses still work

### Cons
- ❌ More complex key management
- ❌ Symmetric key still needs to be stored somewhere
- ❌ Not significantly better than Strategy 2

### Security Level
🔒🔒🔒 (Medium-High)

---

## Strategy 4: Deterministic Encryption (Not Recommended)

### Approach
- Use deterministic encryption so same amount always encrypts to same value
- Allows backend to aggregate/analyze without decryption
- Enables searching on encrypted data

### Implementation
```
- Same amount = same encrypted value
- Backend can SUM encrypted amounts (homomorphic-like)
- Backend can GROUP BY encrypted category
```

### Pros
- ✅ Backend can do some analyses without decryption
- ✅ Can search on encrypted data

### Cons
- ❌ Deterministic encryption is less secure (pattern analysis)
- ❌ Attacker can see which amounts repeat
- ❌ Vulnerable to frequency analysis attacks
- ❌ Not true E2E encryption

### Security Level
🔒🔒 (Low-Medium)

### Not Recommended
This approach sacrifices security for convenience. Not suitable for financial data.

---

## Recommendation: Strategy 2 - Hybrid Encryption (Revised)

### The Pragmatic Approach: "Encryption at Rest + On-Demand Decryption"

This is a practical middle ground that:
- Protects amounts at rest in database
- Allows backend to perform analyses when needed
- Maintains user privacy in normal operation
- Doesn't require complex client-side calculations

### Why This Approach?
1. **Amounts protected at rest** (encrypted in DB)
2. **Analyses work cleanly** (no messy data transfer)
3. **Practical implementation** (not overly complex)
4. **Acceptable security** for most threat models
5. **Admin cannot casually read data** (would need to intercept requests)

### Key Design Decisions

#### Private Key Management
- **Private key NEVER stored in database**
- Private key stays in browser (sessionStorage)
- Only sent to server when user explicitly requests analysis
- Encrypted with server's public key during transit

#### Server-Side Private Key
- Server generates its own RSA key pair
- Server private key stored in Kubernetes secret (admin can read, but that's OK)
- Used only to decrypt user's private key during analysis requests
- Never logged or exposed

#### Security Model
```
At Rest (Database):
- Amounts encrypted with user's public key
- User's private key: NOT stored
- Server's private key: in Kubernetes secret

During Analysis Request:
- User sends: encrypted private key (encrypted with server's public key)
- Server decrypts: user's private key (using server's private key)
- Server decrypts: amounts (using user's private key)
- Server performs: analysis
- Server forgets: user's private key (cleared from memory)

Threat Model:
✅ Protects against: DB breach, backup theft, casual admin snooping
✅ Protects against: Network interception (HTTPS)
⚠️ Does NOT protect against: Compromised server, malicious admin
⚠️ Does NOT protect against: Logging of private keys (must be careful)
```

### Implementation Phases

#### Phase 1: Core Infrastructure
- [ ] Generate RSA key pair on first login (frontend)
- [ ] Store private key in browser sessionStorage (never leave browser)
- [ ] Store public key in user document (MongoDB)
- [ ] Generate server RSA key pair (stored in Kubernetes secret)
- [ ] Implement RSA-OAEP encryption for private key transit

#### Phase 2: Database Encryption
- [ ] Update transaction schema for encrypted amounts
- [ ] Update category schema for encrypted amounts
- [ ] Update account schema for encrypted balances
- [ ] YNAB sync encrypts amounts with user's public key

#### Phase 3: Frontend Decryption
- [ ] Decrypt amounts on frontend (using private key from sessionStorage)
- [ ] Display decrypted data to user
- [ ] Cache decrypted data in sessionStorage

#### Phase 4: Analysis Flow
- [ ] Create "analysis request" endpoint
- [ ] Frontend sends encrypted private key (encrypted with server's public key)
- [ ] Backend decrypts private key (using server's private key)
- [ ] Backend decrypts amounts (using user's private key)
- [ ] Backend performs analysis
- [ ] Backend clears private key from memory
- [ ] Return results to frontend

#### Phase 5: AI Integration
- [ ] AI categorization receives decrypted amounts (server-side)
- [ ] AI API called with decrypted data
- [ ] Results returned to frontend
- [ ] Frontend stores encrypted category

#### Phase 6: Logging & Security
- [ ] Verify private keys are NEVER logged
- [ ] Verify request bodies are NOT logged
- [ ] Verify response bodies are NOT logged
- [ ] Log only: user, action, timestamp (metadata)
- [ ] Code review for accidental logging

#### Phase 7: Testing & Validation
- [ ] Verify amounts encrypted in DB
- [ ] Verify private key never stored in DB
- [ ] Verify private key cleared from memory after use
- [ ] Performance testing
- [ ] Security audit of logging

---

## Security Considerations

### What's Protected
- ✅ Amounts at rest in database
- ✅ Amounts in backups
- ✅ Historical data from DB breaches
- ✅ User's private key (never stored, only in browser)
- ✅ Casual admin snooping (would need to intercept requests)

### What's NOT Protected
- ⚠️ Amounts during analysis requests (but only when user initiates)
- ⚠️ Metadata (payee, category, memo)
- ⚠️ Amounts in browser memory (while decrypted)
- ⚠️ Server private key (admin can read from Kubernetes secret, but that's expected)

### Threat Model
- ✅ Protects against: DB admin reading data, DB breaches, backup theft
- ✅ Protects against: Casual snooping by admins
- ✅ Protects against: Network interception (HTTPS)
- ⚠️ Does NOT protect against: Compromised server, malicious admin
- ⚠️ Does NOT protect against: Malicious frontend code
- ⚠️ Does NOT protect against: Logging of private keys (must be careful)

### Admin Access Model
```
Admin can read:
- Server private key (from Kubernetes secret) ✅ Expected
- Encrypted amounts in DB ✅ But cannot decrypt
- Encrypted private keys in requests ⚠️ But only if intercepting

Admin CANNOT read:
- User's private key (never stored) ✅
- Decrypted amounts (unless intercepting request) ✅
- User's data (without user's private key) ✅
```

### Critical: Logging Safety
**MUST NOT LOG:**
- Request bodies (contains encrypted private key)
- Response bodies (contains decrypted amounts)
- Private keys in any form
- Decrypted amounts

**CAN LOG:**
- User ID
- Action type (e.g., "analysis_request")
- Timestamp
- HTTP status code
- Error messages (without sensitive data)

---

## Implementation Notes

### Key Management
- Private key: sessionStorage (cleared on logout)
- Public key: MongoDB user document
- Sync key: encrypted with private key, stored in DB

### Encryption Algorithm
- Use ECDH (Elliptic Curve Diffie-Hellman) for key exchange
- Use AES-256-GCM for symmetric encryption
- Hybrid approach: encrypt AES key with public key, encrypt data with AES

### Performance
- Decryption happens once per session
- Cache decrypted data in sessionStorage
- Minimal performance impact

### Multi-Device
- Each device has same private key (derived from password)
- Can decrypt data on any device
- No server-side key synchronization needed

---

## Kubernetes Secret Setup (Phase 1)

### Generate Server Key Pair
```bash
# Generate RSA private key
openssl genrsa -out server-private.pem 2048

# Generate public key
openssl rsa -in server-private.pem -pubout -out server-public.pem

# Convert to base64 for Kubernetes secret
cat server-private.pem | base64 -w 0
```

### Create Kubernetes Secret
```yaml
# kube/config/dev/api-encryption-secret.yml
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

### Load in API
```typescript
// packages/api/src/encryption/server-keys.ts
import fs from 'fs';

export function getServerPrivateKey(): string {
  const key = process.env.SERVER_PRIVATE_KEY;
  if (!key) {
    throw new Error('SERVER_PRIVATE_KEY not configured');
  }
  return key;
}

export function getServerPublicKey(): string {
  const key = process.env.SERVER_PUBLIC_KEY;
  if (!key) {
    throw new Error('SERVER_PUBLIC_KEY not configured');
  }
  return key;
}
```

### Important Notes
- Server private key is in Kubernetes secret (admin can read, expected)
- Server private key is ONLY used to decrypt user's private key
- User's private key is NEVER stored in database
- User's private key is ONLY sent during analysis requests
- Must ensure private keys are never logged

## Next Steps
1. ✅ Finalize Strategy 2 (Hybrid Encryption with On-Demand Decryption)
2. [ ] Design detailed key management flow
3. [ ] Plan database schema changes
4. [ ] Implement Phase 1 (Core Infrastructure)
5. [ ] Test with real YNAB data
6. [ ] Security audit of logging

