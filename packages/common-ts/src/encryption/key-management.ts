/**
 * Key management functions for end-to-end encryption
 */

import {
  UserEncryptionKey,
  MasterKey,
  ENCRYPTION_CONFIG,
  EncryptionError,
  DecryptionError,
  KeyDerivationError,
} from './types';
import {
  generateSalt,
  generateMasterKey,
  deriveKeyFromPassword,
  encrypt,
  decrypt,
  exportKey,
  importKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateIV,
} from './crypto';

/**
 * Generate a new user encryption key setup
 */
export async function generateUserEncryptionKey(password: string): Promise<UserEncryptionKey> {
  try {
    // Generate salt and master key
    const salt = generateSalt();
    const masterKey = await generateMasterKey();
    
    // Derive password-based key
    const passwordKey = await deriveKeyFromPassword({
      password,
      salt: arrayBufferToBase64(salt),
      iterations: ENCRYPTION_CONFIG.DEFAULT_ITERATIONS,
    });

    // Export master key and encrypt it with password-derived key
    const masterKeyRaw = await exportKey(masterKey);
    const iv = generateIV();
    
    const encryptedMasterKey = await window.crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      passwordKey,
      masterKeyRaw
    );

    return {
      encryptedMasterKey: arrayBufferToBase64(encryptedMasterKey),
      salt: arrayBufferToBase64(salt),
      iterations: ENCRYPTION_CONFIG.DEFAULT_ITERATIONS,
      version: ENCRYPTION_CONFIG.CURRENT_VERSION,
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    throw new KeyDerivationError(
      `Failed to generate user encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_GENERATION_FAILED'
    );
  }
}

/**
 * Unlock user's master key using password
 */
export async function unlockMasterKey(
  userKey: UserEncryptionKey,
  password: string
): Promise<MasterKey> {
  try {
    // Derive password-based key
    const passwordKey = await deriveKeyFromPassword({
      password,
      salt: userKey.salt,
      iterations: userKey.iterations,
    });

    // Decrypt master key
    const iv = base64ToArrayBuffer(userKey.iv);
    const encryptedMasterKey = base64ToArrayBuffer(userKey.encryptedMasterKey);
    
    const decryptedMasterKey = await window.crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      passwordKey,
      encryptedMasterKey
    );

    // Import the decrypted master key
    const masterKey = await importKey(decryptedMasterKey);

    return {
      key: masterKey,
      version: userKey.version,
    };
  } catch (error) {
    throw new DecryptionError(
      `Failed to unlock master key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_UNLOCK_FAILED'
    );
  }
}

/**
 * Store master key in browser's session storage (temporary)
 */
export function storeMasterKeyInSession(masterKey: MasterKey, userId: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    throw new EncryptionError('Session storage not available', 'STORAGE_UNAVAILABLE');
  }

  try {
    // Note: We can't directly store CryptoKey in sessionStorage
    // Instead, we'll need to export it and store the raw data
    // This is a simplified approach - in production, consider more secure storage
    const keyData = {
      version: masterKey.version,
      timestamp: Date.now(),
    };
    
    sessionStorage.setItem(`masterKey_${userId}`, JSON.stringify(keyData));
    
    // Store the actual key in a global variable (not ideal, but necessary for Web Crypto API)
    if (typeof window !== 'undefined') {
      (window as any).__encryptionKeys = (window as any).__encryptionKeys || {};
      (window as any).__encryptionKeys[userId] = masterKey.key;
    }
  } catch (error) {
    throw new EncryptionError(
      `Failed to store master key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KEY_STORAGE_FAILED'
    );
  }
}

/**
 * Retrieve master key from browser's session storage
 */
export function getMasterKeyFromSession(userId: string): CryptoKey | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const keyDataStr = sessionStorage.getItem(`masterKey_${userId}`);
    if (!keyDataStr) {
      return null;
    }

    const keyData = JSON.parse(keyDataStr);
    
    // Check if key is too old (1 hour)
    if (Date.now() - keyData.timestamp > 60 * 60 * 1000) {
      clearMasterKeyFromSession(userId);
      return null;
    }

    // Retrieve the actual key from global variable
    if (typeof window !== 'undefined' && (window as any).__encryptionKeys) {
      return (window as any).__encryptionKeys[userId] || null;
    }

    return null;
  } catch (error) {
    console.error('Failed to retrieve master key from session:', error);
    return null;
  }
}

/**
 * Clear master key from browser's session storage
 */
export function clearMasterKeyFromSession(userId: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    sessionStorage.removeItem(`masterKey_${userId}`);
    
    // Clear from global variable
    if (typeof window !== 'undefined' && (window as any).__encryptionKeys) {
      delete (window as any).__encryptionKeys[userId];
    }
  } catch (error) {
    console.error('Failed to clear master key from session:', error);
  }
}

/**
 * Verify if a password can unlock the user's master key
 */
export async function verifyPassword(
  userKey: UserEncryptionKey,
  password: string
): Promise<boolean> {
  try {
    await unlockMasterKey(userKey, password);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Change user's password (re-encrypt master key with new password)
 */
export async function changePassword(
  userKey: UserEncryptionKey,
  oldPassword: string,
  newPassword: string
): Promise<UserEncryptionKey> {
  try {
    // First unlock with old password
    const masterKey = await unlockMasterKey(userKey, oldPassword);
    
    // Generate new salt for new password
    const newSalt = generateSalt();
    
    // Derive new password-based key
    const newPasswordKey = await deriveKeyFromPassword({
      password: newPassword,
      salt: arrayBufferToBase64(newSalt),
      iterations: ENCRYPTION_CONFIG.DEFAULT_ITERATIONS,
    });

    // Export master key and encrypt with new password-derived key
    const masterKeyRaw = await exportKey(masterKey.key);
    const newIv = generateIV();
    
    const newEncryptedMasterKey = await window.crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv: newIv,
      },
      newPasswordKey,
      masterKeyRaw
    );

    return {
      encryptedMasterKey: arrayBufferToBase64(newEncryptedMasterKey),
      salt: arrayBufferToBase64(newSalt),
      iterations: ENCRYPTION_CONFIG.DEFAULT_ITERATIONS,
      version: ENCRYPTION_CONFIG.CURRENT_VERSION,
      iv: arrayBufferToBase64(newIv),
    };
  } catch (error) {
    throw new EncryptionError(
      `Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PASSWORD_CHANGE_FAILED'
    );
  }
}
