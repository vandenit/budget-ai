/**
 * Core cryptographic functions for end-to-end encryption
 */

import {
  EncryptedField,
  MasterKey,
  KeyDerivationParams,
  ENCRYPTION_CONFIG,
  EncryptionError,
  DecryptionError,
  KeyDerivationError,
} from './types';

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoAvailable(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.crypto !== 'undefined' && 
         typeof window.crypto.subtle !== 'undefined';
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  if (!isWebCryptoAvailable()) {
    throw new KeyDerivationError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }
  return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.SALT_LENGTH));
}

/**
 * Generate a random initialization vector
 */
export function generateIV(): Uint8Array {
  if (!isWebCryptoAvailable()) {
    throw new EncryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }
  return window.crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));
}

/**
 * Convert Uint8Array to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a key from password using PBKDF2
 */
export async function deriveKeyFromPassword(params: KeyDerivationParams): Promise<CryptoKey> {
  if (!isWebCryptoAvailable()) {
    throw new KeyDerivationError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(params.password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: typeof params.salt === 'string' ? base64ToArrayBuffer(params.salt) : params.salt,
        iterations: params.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        length: ENCRYPTION_CONFIG.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new KeyDerivationError(
      `Failed to derive key from password: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DERIVATION_FAILED'
    );
  }
}

/**
 * Generate a new master key for encryption
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  if (!isWebCryptoAvailable()) {
    throw new EncryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    return await window.crypto.subtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        length: ENCRYPTION_CONFIG.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new EncryptionError(
      `Failed to generate master key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_GENERATION_FAILED'
    );
  }
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(data: string, key: CryptoKey): Promise<EncryptedField> {
  if (!isWebCryptoAvailable()) {
    throw new EncryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    const iv = generateIV();
    const encoded = new TextEncoder().encode(data);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      encoded
    );

    return {
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(encrypted),
      version: ENCRYPTION_CONFIG.CURRENT_VERSION,
    };
  } catch (error) {
    throw new EncryptionError(
      `Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ENCRYPTION_FAILED'
    );
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(encryptedField: EncryptedField, key: CryptoKey): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new DecryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    const iv = base64ToArrayBuffer(encryptedField.iv);
    const encryptedData = base64ToArrayBuffer(encryptedField.data);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptionError(
      `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'DECRYPTION_FAILED'
    );
  }
}

/**
 * Export a CryptoKey to raw format
 */
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  if (!isWebCryptoAvailable()) {
    throw new EncryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    return await window.crypto.subtle.exportKey('raw', key);
  } catch (error) {
    throw new EncryptionError(
      `Failed to export key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_EXPORT_FAILED'
    );
  }
}

/**
 * Import a raw key to CryptoKey
 */
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  if (!isWebCryptoAvailable()) {
    throw new EncryptionError('Web Crypto API not available', 'CRYPTO_UNAVAILABLE');
  }

  try {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        length: ENCRYPTION_CONFIG.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new EncryptionError(
      `Failed to import key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_IMPORT_FAILED'
    );
  }
}
