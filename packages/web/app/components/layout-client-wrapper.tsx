'use client';

import { ReactNode } from 'react';
import { EncryptionSetupProvider } from './encryption-setup-provider';

/**
 * Client-side wrapper for layout
 * Handles client-side initialization like encryption setup
 */
export function LayoutClientWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <EncryptionSetupProvider />
      {children}
    </>
  );
}
