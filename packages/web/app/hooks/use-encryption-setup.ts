/**
 * Hook for managing end-to-end encryption setup
 */

'use client';

import { useCallback, useState } from 'react';
import {
  generateUserKeyPair,
  exportPublicKeyToPem,
  exportPrivateKeyToPem,
  storePrivateKeyInSession,
} from '@/lib/encryption/client-crypto';
import { apiPut, apiGet } from '@/app/api/client';

interface EncryptionSetupStatus {
  hasEncryption: boolean;
  version: number;
}

export function useEncryptionSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<EncryptionSetupStatus | null>(null);

  /**
   * Check if user has encryption set up
   */
  const checkSetupStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiGet('encryption/setup-status');
      if (response && typeof response === 'object') {
        setSetupStatus(response as EncryptionSetupStatus);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check encryption setup';
      setError(message);
      console.error('Failed to check encryption setup:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Setup encryption for user
   */
  const setupEncryption = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate key pair
      const keyPair = await generateUserKeyPair();

      // Export keys to PEM format
      const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
      const privateKeyPem = await exportPrivateKeyToPem(keyPair.privateKey);

      // Save public key to server
      const response = await apiPut('encryption/public-key', {
        publicKey: publicKeyPem,
      });

      if (response?.success) {
        // Store private key in session storage
        storePrivateKeyInSession(privateKeyPem, userId);

        // Update setup status
        setSetupStatus({
          hasEncryption: true,
          version: 1,
        });

        return {
          success: true,
          publicKey: publicKeyPem,
          privateKey: privateKeyPem,
        };
      } else {
        throw new Error('Failed to save public key to server');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to setup encryption';
      setError(message);
      console.error('Failed to setup encryption:', err);
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    setupStatus,
    checkSetupStatus,
    setupEncryption,
  };
}
