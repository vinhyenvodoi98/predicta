/**
 * React hook for Yellow Network channel operations using NitroliteClient
 *
 * Handles channel creation, deposits, and withdrawals directly on-chain
 * without backend dependencies
 */

import { useState, useCallback } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  NitroliteClient,
  WalletStateSigner,
} from "@erc7824/nitrolite";
import { Address, parseEther } from "viem";
import { getContractAddresses } from "@/lib/yellow/contracts";

interface UseYellowChannelResult {
  isCreating: boolean;
  error: Error | null;
  createChannel: (params: {
    token: Address;
    amount: string; // ETH amount as string
    chainId?: number;
  }) => Promise<string>; // Returns channel ID
}

/**
 * Hook for creating and managing Yellow Network channels
 */
export function useYellowChannel(
  userAddress: Address | undefined,
  defaultChainId: number = 11155111 // Sepolia
): UseYellowChannelResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId: defaultChainId });
  const { data: walletClient } = useWalletClient({ chainId: defaultChainId });

  /**
   * Create a new channel with Yellow Network clearnode
   */
  const createChannel = useCallback(
    async (params: {
      token: Address;
      amount: string;
      chainId?: number;
    }): Promise<string> => {
      const chainId = params.chainId || defaultChainId;

      if (!userAddress || !publicClient || !walletClient) {
        throw new Error("Wallet not connected");
      }

      if (!walletClient.account) {
        throw new Error("No account found in wallet");
      }

      setIsCreating(true);
      setError(null);

      try {
        console.log(`[useYellowChannel] 🚀 Creating channel on chain ${chainId}...`);
        console.log(`[useYellowChannel] Token: ${params.token}, Amount: ${params.amount} ETH`);

        // Initialize NitroliteClient
        const nitroliteClient = new NitroliteClient({
          publicClient: publicClient as any,
          walletClient: walletClient as any,
          stateSigner: new WalletStateSigner(walletClient),
          addresses: getContractAddresses(chainId),
          chainId: chainId,
          challengeDuration: BigInt(3600), // 1 hour challenge period
        });

        // Get clearnode address (counterparty)
        const clearnodeAddress = process.env.NEXT_PUBLIC_CLEARNODE_ADDRESS as Address ||
          "0x0000000000000000000000000000000000000000" as Address;

        if (clearnodeAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error("Clearnode address not configured. Set NEXT_PUBLIC_CLEARNODE_ADDRESS env variable.");
        }

        // Parse amount
        const depositAmount = parseEther(params.amount);

        console.log(`[useYellowChannel] Opening channel with clearnode ${clearnodeAddress}...`);
        console.log(`[useYellowChannel] User deposit: ${depositAmount.toString()}`);

        // TODO: Implement proper channel creation using NitroliteClient
        // The exact method depends on the Yellow Network SDK documentation
        // Options to explore:
        // 1. nitroliteClient.deposit(token, amount)
        // 2. Direct custody contract interaction
        // 3. Off-chain coordination with clearnode first

        throw new Error(
          "Channel creation is not yet implemented. " +
          "This requires proper integration with Yellow Network custody contract. " +
          "Please refer to Yellow Network SDK documentation for the correct channel creation flow."
        );
      } catch (err) {
        console.error("[useYellowChannel] Error creating channel:", err);
        const error = err instanceof Error ? err : new Error("Failed to create channel");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [userAddress, defaultChainId, publicClient, walletClient]
  );

  return {
    isCreating,
    error,
    createChannel,
  };
}
