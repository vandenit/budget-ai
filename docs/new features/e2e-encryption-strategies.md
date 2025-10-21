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

## Recommendation: Strategy 2 (Hybrid Encryption)

### Why?
1. **Best balance** of privacy and functionality
2. **Amounts protected at rest** (encrypted in DB)
3. **Analyses still work** (frontend sends plain data when needed)
4. **Practical implementation** (not overly complex)
5. **Acceptable security** for most threat models

### Implementation Phases

#### Phase 1: Core Infrastructure
- [ ] Generate RSA/ECDH key pairs on first login
- [ ] Store private key in browser sessionStorage
- [ ] Store public key in user document
- [ ] Implement hybrid encryption (AES + ECDH)

#### Phase 2: Database Encryption
- [ ] Update transaction schema for encrypted amounts
- [ ] Update category schema for encrypted amounts
- [ ] Update account schema for encrypted balances
- [ ] YNAB sync encrypts amounts with public key

#### Phase 3: Frontend Decryption
- [ ] Decrypt amounts on frontend
- [ ] Display decrypted data to user
- [ ] Cache decrypted data in sessionStorage

#### Phase 4: Analysis Flow
- [ ] Create "analysis request" endpoint
- [ ] Frontend sends plain amounts for analysis
- [ ] Backend performs analysis
- [ ] Return results to frontend

#### Phase 5: AI Integration
- [ ] AI categorization receives plain amounts
- [ ] AI API called with decrypted data
- [ ] Results returned to frontend
- [ ] Frontend stores encrypted category

#### Phase 6: Testing & Audit
- [ ] Verify amounts encrypted in DB
- [ ] Verify private key never sent to backend
- [ ] Audit what data is sent for analysis
- [ ] Performance testing

---

## Security Considerations

### What's Protected
- ✅ Amounts at rest in database
- ✅ Amounts in backups
- ✅ Historical data from DB breaches

### What's NOT Protected
- ⚠️ Amounts during analysis requests (but only when user initiates)
- ⚠️ Metadata (payee, category, memo)
- ⚠️ Amounts in browser memory (while decrypted)

### Threat Model
- ✅ Protects against: DB admin reading data, DB breaches, backup theft
- ⚠️ Does NOT protect against: compromised browser, malicious frontend code, HTTPS interception
- ⚠️ Does NOT protect against: server-side analysis requests (by design)

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

## Next Steps
1. Decide on Strategy 2 (Hybrid Encryption)
2. Design detailed key management flow
3. Plan database schema changes
4. Implement Phase 1 (Core Infrastructure)
5. Test with real YNAB data

