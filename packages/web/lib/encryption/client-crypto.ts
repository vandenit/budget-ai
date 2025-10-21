/**
 * Client-side cryptographic functions for end-to-end encryption
 * Uses Web Crypto API (browser only)
 */

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
  );
}

/**
 * Generate RSA key pair for user
 */
export async function generateUserKeyPair(): Promise<CryptoKeyPair> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export public key to PEM format
 */
export async function exportPublicKeyToPem(publicKey: CryptoKey): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported) as any);
  const base64 = btoa(exportedAsString);

  return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
}

/**
 * Export private key to PEM format
 */
export async function exportPrivateKeyToPem(privateKey: CryptoKey): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported) as any);
  const base64 = btoa(exportedAsString);

  return `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
}

/**
 * Import public key from PEM format
 */
export async function importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
  const binaryString = atob(pemContents.replace(/\n/g, ''));
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Import private key from PEM format
 */
export async function importPrivateKeyFromPem(pem: string): Promise<CryptoKey> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
  const binaryString = atob(pemContents.replace(/\n/g, ''));
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Encrypt data with public key
 */
export async function encryptWithPublicKey(
  data: string,
  publicKey: CryptoKey
): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const encoded = new TextEncoder().encode(data);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    encoded
  );

  const encryptedArray = new Uint8Array(encrypted);
  let encryptedString = '';
  for (let i = 0; i < encryptedArray.length; i++) {
    encryptedString += String.fromCharCode(encryptedArray[i]);
  }

  return btoa(encryptedString);
}

/**
 * Decrypt data with private key
 */
export async function decryptWithPrivateKey(
  encryptedData: string,
  privateKey: CryptoKey
): Promise<string> {
  if (!isWebCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const binaryString = atob(encryptedData);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    bytes.buffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Store private key in sessionStorage
 */
export function storePrivateKeyInSession(privateKeyPem: string, userId: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    throw new Error('Session storage not available');
  }

  sessionStorage.setItem(`privateKey_${userId}`, privateKeyPem);
}

/**
 * Get private key from sessionStorage
 */
export function getPrivateKeyFromSession(userId: string): string | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  return sessionStorage.getItem(`privateKey_${userId}`);
}

/**
 * Clear private key from sessionStorage
 */
export function clearPrivateKeyFromSession(userId: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  sessionStorage.removeItem(`privateKey_${userId}`);
}
