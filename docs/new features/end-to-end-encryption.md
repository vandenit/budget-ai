# End-to-End Encryption

## Current status
- All financial data is stored in plain text in MongoDB
- Server and DB admins can read all user data
- No data segregation between users beyond basic access control

## Wanted status (MVP)
- Users can safely store their financial data
- Only the user can decrypt their own data
- Server/DB admins cannot read user data
- Basic key management in place
- Minimal impact on existing features

## Implementation Steps

### 1. Client-Side Key Generation
- [ ] Generate encryption key when user first logs in
- [ ] Derive key from user's password using PBKDF2
- [ ] Store encrypted key in browser's localStorage
- [ ] Add key verification on login

### 2. Basic Data Encryption
Start with most sensitive data:
- [ ] Encrypt transaction amounts
- [ ] Encrypt account balances
- [ ] Encrypt category budgeted amounts
- [ ] Store encryption metadata (version, algorithm)

### 3. API Layer Updates
- [ ] Update API endpoints to handle encrypted data
- [ ] Add encryption middleware for requests/responses
- [ ] Validate encrypted data format
- [ ] Error handling for encryption/decryption failures

### 4. Database Changes
- [ ] Update MongoDB schemas for encrypted fields
- [ ] Add indexes that work with encrypted data
- [ ] Migration script for existing data
- [ ] Backup strategy for encrypted data

### 5. Testing & Validation
- [ ] Unit tests for encryption/decryption
- [ ] Integration tests with encrypted data
- [ ] Performance testing
- [ ] Security audit of implementation

## Technical Decisions

### Encryption Algorithm
- Use AES-256-GCM for data encryption
- Use PBKDF2 for key derivation
- Store IV (Initialization Vector) with encrypted data

### Data Format
```typescript
interface EncryptedField {
  iv: string;          // Base64 encoded IV
  data: string;        // Base64 encoded encrypted data
  version: number;     // Encryption version for future upgrades
}
```

### Example Implementation
```typescript
// Key generation
const generateKey = async (password: string, salt: string) => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encryption
const encrypt = async (data: string, key: CryptoKey) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    version: 1
  };
};
```

## Future Enhancements
- Key rotation mechanism
- Backup key storage
- Recovery procedures
- Shared data between users (e.g., family budgets)
- Hardware security module (HSM) integration

## Security Considerations
- Key storage security
- Browser security limitations
- Network security (MitM attacks)
- Backup security
- Recovery procedures

## Impact on Features
- Slight performance impact due to encryption/decryption
- Need to handle offline access
- Search functionality limitations
- Analytics/reporting complexity

## Development Practices
- Regular security audits
- Code review focus on crypto implementation
- No crypto implementation shortcuts
- Proper error handling
- Comprehensive testing
- Clear documentation
- Follow Next.js best practices (refer to ./docs/nextjs/docs)

## First Milestone
Get basic encryption working for transaction amounts:
1. Implement key generation and storage
2. Update transaction model for encrypted amounts
3. Implement encryption/decryption in frontend
4. Update relevant API endpoints
5. Test with real YNAB data
6. Verify data is encrypted in MongoDB

This provides a foundation we can build upon while protecting the most sensitive data first. 