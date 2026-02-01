/**
 * Yellow Network Authentication Utilities
 *
 * Frontend-only utilities for session key generation
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts";

export interface SessionAllowance {
  asset: string;
  amount: string;
}

/**
 * Generate a new ephemeral session key pair
 */
export function generateSessionKey(): {
  privateKey: `0x${string}`;
  account: PrivateKeyAccount;
} {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, account };
}
