/**
 * React hook for fetching Yellow Network channels using NitroliteClient
 *
 * Fetches channels directly from the custody contract on-chain
 * instead of using backend API
 */

import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  NitroliteClient,
  WalletStateSigner,
  Channel,
} from "@erc7824/nitrolite";
import { Address } from "viem";
import { getContractAddresses } from "@/lib/yellow/contracts";

interface ChannelData {
  channelId: string;
  participants: [Address, Address];
  chainId: number;
  status: string;
}

interface UseYellowChannelsResult {
  channels: ChannelData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch channels from Yellow Network custody contract
 */
export function useYellowChannels(
  userAddress: Address | undefined,
  chainId: number = 11155111 // Sepolia
): UseYellowChannelsResult {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  const fetchChannels = useCallback(async () => {
    if (!userAddress || !publicClient || !walletClient) {
      setChannels([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useYellowChannels] 🔍 Fetching channels for ${userAddress} from custody contract...`);

      // Initialize NitroliteClient
      const nitroliteClient = new NitroliteClient({
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        stateSigner: new WalletStateSigner(walletClient),
        addresses: getContractAddresses(chainId),
        chainId: chainId,
        challengeDuration: BigInt(3600),
      });

      // Fetch open channels from custody contract
      const channelIds = await nitroliteClient.getOpenChannels();
      console.log(`[useYellowChannels] ✓ Found ${channelIds.length} channel(s) from custody contract`);

      if (channelIds.length === 0) {
        setChannels([]);
        setIsLoading(false);
        return;
      }

      // Fetch detailed data for each channel
      const channelDataPromises = channelIds.map(async (channelId) => {
        try {
          const channelData = await nitroliteClient.getChannelData(channelId);

          if (channelData) {
            // Extract participants from channel data (structure may vary)
            const participants: [Address, Address] = (channelData as any).participants ||
              [userAddress, "0x0000000000000000000000000000000000000000" as Address];

            return {
              channelId: channelId,
              participants,
              chainId: chainId,
              status: "OPEN", // Channels from custody contract are open
            };
          }
          return null;
        } catch (err) {
          console.warn(`[useYellowChannels] Failed to get data for channel ${channelId}:`, err);
          return null;
        }
      });

      const channelDataResults = await Promise.all(channelDataPromises);
      const validChannels = channelDataResults.filter((c): c is NonNullable<typeof c> => c !== null);

      setChannels(validChannels);
      console.log(`[useYellowChannels] ✓ Retrieved data for ${validChannels.length} channel(s)`);
    } catch (err) {
      console.error("[useYellowChannels] Error fetching channels:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch channels"));
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, chainId, publicClient, walletClient]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  return {
    channels,
    isLoading,
    error,
    refetch: fetchChannels,
  };
}
