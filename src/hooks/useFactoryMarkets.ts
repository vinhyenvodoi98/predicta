/**
 * React hook for fetching markets from PredictionMarketFactory
 */

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Address } from "viem";
import { contracts, SEPOLIA_CHAIN_ID } from "@/config/contracts";

interface UseFactoryMarketsResult {
  markets: Address[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  marketCount: number;
}

/**
 * Hook to fetch all active markets from the factory
 */
export function useFactoryMarkets(
  chainId: number = SEPOLIA_CHAIN_ID
): UseFactoryMarketsResult {
  const [markets, setMarkets] = useState<Address[]>([]);
  const [marketCount, setMarketCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId });

  const fetchMarkets = async () => {
    if (!publicClient) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("[useFactoryMarkets] Fetching markets from factory...");

      // Get market count
      const count = await publicClient.readContract({
        address: contracts.factory.address,
        abi: contracts.factory.abi,
        functionName: "getMarketCount",
      }) as bigint;

      const countNum = Number(count);
      setMarketCount(countNum);
      console.log(`[useFactoryMarkets] Total markets: ${countNum}`);

      if (countNum === 0) {
        setMarkets([]);
        setIsLoading(false);
        return;
      }

      // Get all active markets (tradable markets)
      const activeMarkets = await publicClient.readContract({
        address: contracts.factory.address,
        abi: contracts.factory.abi,
        functionName: "getTradableMarkets",
      }) as Address[];

      console.log(`[useFactoryMarkets] Active markets:`, activeMarkets);
      setMarkets(activeMarkets);
    } catch (err) {
      console.error("[useFactoryMarkets] Error fetching markets:", err);
      const error = err instanceof Error ? err : new Error("Failed to fetch markets");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [publicClient]);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchMarkets,
    marketCount,
  };
}
