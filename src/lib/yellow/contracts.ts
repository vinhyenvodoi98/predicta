/**
 * Yellow Network Contract Addresses
 *
 * Contract addresses for Nitro Protocol on different chains
 */

import { Address } from "viem";
import { ContractAddresses } from "@erc7824/nitrolite";

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  // Sepolia testnet addresses
  if (chainId === 11155111) {
    return {
      custody: process.env.NEXT_PUBLIC_SEPOLIA_CUSTODY as Address || "0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6" as Address,
      adjudicator: process.env.NEXT_PUBLIC_SEPOLIA_ADJUDICATOR as Address || "0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C" as Address,
    };
  }

  // Base mainnet addresses
  if (chainId === 8453) {
    return {
      custody: "0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6" as Address,
      adjudicator: "0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C" as Address,
    };
  }

  // Default to Sepolia for development
  return {
    custody: "0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6" as Address,
    adjudicator: "0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C" as Address,
  };
}
