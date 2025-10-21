/**
 * Type definitions for end-to-end encryption
 */

/**
 * Encrypted field format stored in database
 */
export interface EncryptedField {
  /** Base64 encoded initialization vector */
  iv: string;
  /** Base64 encoded encrypted data */
  data: string;
  /** Encryption version for future upgrades */
  version: number;
}

/**
 * User encryption key data
 */
export interface UserEncryptionKey {
  /** Encrypted master key (encrypted with password-derived key) */
  encryptedMasterKey: string;
  /** Salt for password-based key derivation */
  salt: string;
  /** Key derivation iterations */
  iterations: number;
  /** Key version for rotation */
  version: number;
  /** Initialization vector for master key encryption */
  iv: string;
}

/**
 * Decrypted master key for runtime use
 */
export interface MasterKey {
  /** The actual CryptoKey for encryption/decryption */
  key: CryptoKey;
  /** Key version */
  version: number;
}

/**
 * Key derivation parameters
 */
export interface KeyDerivationParams {
  /** User password */
  password: string;
  /** Salt for key derivation */
  salt: string;
  /** Number of PBKDF2 iterations */
  iterations: number;
}

/**
 * Encryption configuration
 */
export const ENCRYPTION_CONFIG = {
  /** AES-GCM algorithm name */
  ALGORITHM: 'AES-GCM' as const,
  /** Key length in bits */
  KEY_LENGTH: 256,
  /** IV length in bytes */
  IV_LENGTH: 12,
  /** Default PBKDF2 iterations */
  DEFAULT_ITERATIONS: 100000,
  /** Current encryption version */
  CURRENT_VERSION: 1,
  /** Salt length in bytes */
  SALT_LENGTH: 32,
} as const;

/**
 * Error types for encryption operations
 */
export class EncryptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class KeyDerivationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'KeyDerivationError';
  }
}
