'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEncryptionSetup } from '@/app/hooks/use-encryption-setup';

/**
 * Component that ensures encryption is set up for the logged-in user
 * Should be placed in the layout so it runs on every page load
 */
export function EncryptionSetupProvider() {
  const { user } = useUser();
  const { setupEncryption, checkSetupStatus, setupStatus } = useEncryptionSetup();

  useEffect(() => {
    if (!user) {
      return;
    }

    const setupEncryptionIfNeeded = async () => {
      try {
        // Check if user already has encryption set up
        await checkSetupStatus();
      } catch (error) {
        console.error('Failed to check encryption setup:', error);
      }
    };

    setupEncryptionIfNeeded();
  }, [user, checkSetupStatus]);

  // If user is logged in but doesn't have encryption, set it up
  useEffect(() => {
    if (!user || !user.sub || setupStatus === null) {
      return;
    }

    if (!setupStatus.hasEncryption) {
      console.log('🔐 Setting up encryption for user:', user.sub);
      setupEncryption(user.sub).then((result) => {
        if (result.success) {
          console.log('✅ Encryption setup successful');
        } else {
          console.error('❌ Encryption setup failed:', result.error);
        }
      });
    } else {
      console.log('✅ User already has encryption set up');
    }
  }, [user, setupStatus, setupEncryption]);

  return null;
}
