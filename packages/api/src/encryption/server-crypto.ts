/**
 * Server-side cryptographic functions for end-to-end encryption
 * Uses Node.js crypto module (not Web Crypto API)
 */

import crypto from 'crypto';

/**
 * Generate RSA key pair for server
 */
export function generateServerKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}

/**
 * Decrypt data encrypted with public key using private key
 */
export function decryptWithPrivateKey(
  encryptedData: string,
  privateKeyPem: string
): string {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer
    );
    return decrypted.toString('utf-8');
  } catch (error) {
    throw new Error(
      `Failed to decrypt with private key: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Encrypt data with public key
 */
export function encryptWithPublicKey(data: string, publicKeyPem: string): string {
  try {
    const buffer = Buffer.from(data, 'utf-8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(
      `Failed to encrypt with public key: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get server's private key from environment
 */
export function getServerPrivateKey(): string {
  const key = process.env.SERVER_PRIVATE_KEY;
  if (!key) {
    throw new Error('SERVER_PRIVATE_KEY not configured in environment');
  }
  return key;
}

/**
 * Get server's public key from environment
 */
export function getServerPublicKey(): string {
  const key = process.env.SERVER_PUBLIC_KEY;
  if (!key) {
    throw new Error('SERVER_PUBLIC_KEY not configured in environment');
  }
  return key;
}

/**
 * Verify that server keys are properly configured
 */
export function verifyServerKeysConfigured(): boolean {
  try {
    getServerPrivateKey();
    getServerPublicKey();
    return true;
  } catch {
    return false;
  }
}
