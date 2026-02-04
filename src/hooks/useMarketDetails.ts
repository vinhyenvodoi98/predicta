/**
 * React hook for fetching market details from a market contract
 */

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Address, formatUnits } from "viem";
import BTCPredictionMarketABI from "@/config/abis/BTCPredictionMarket.abi.json";
import { calculateLMSRPrices } from "@/utils/lmsr";

export interface MarketDetails {
  address: Address;
  marketName: string;
  targetPrice: number;
  resolutionTime: number;
  resolved: boolean;
  btcAboveTarget: boolean;
  actualPrice: number;
  totalEthLocked: string;
  yesTokenSupply: string;
  noTokenSupply: string;
  yesToken: Address;
  noToken: Address;
  priceFeed: Address;
  usdc: Address;
  yesProbability: number;
  noProbability: number;
  status: "open" | "closed" | "resolved";
}

interface UseMarketDetailsResult {
  market: MarketDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch details for a specific market
 */
export function useMarketDetails(
  marketAddress: Address | undefined,
  chainId: number = 11155111
): UseMarketDetailsResult {
  const [market, setMarket] = useState<MarketDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient({ chainId });

  const fetchMarketDetails = async () => {
    if (!publicClient || !marketAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`[useMarketDetails] Fetching details for market ${marketAddress}...`);

      // Get market info using the convenient getMarketInfo function
      const marketInfo = await publicClient.readContract({
        address: marketAddress,
        abi: BTCPredictionMarketABI,
        functionName: "getMarketInfo",
      }) as any;

      // Try to get market name (might not be available in all contracts)
      let marketName = `BTC Prediction - ${marketAddress.slice(0, 6)}...${marketAddress.slice(-4)}`;
      try {
        const nameResult = await publicClient.readContract({
          address: marketAddress,
          abi: [
            {
              type: "function",
              name: "marketName",
              inputs: [],
              outputs: [{ name: "", type: "string" }],
              stateMutability: "view",
            },
          ],
          functionName: "marketName",
        }) as string;
        if (nameResult) marketName = nameResult;
      } catch {
        console.log(`[useMarketDetails] Using default name for ${marketAddress}`);
      }

      // Calculate probabilities using LMSR (Logarithmic Market Scoring Rule)
      const yesSharesNum = Number(formatUnits(marketInfo[6], 6));
      const noSharesNum = Number(formatUnits(marketInfo[7], 6));

      const lmsrPrices = calculateLMSRPrices(yesSharesNum, noSharesNum, 100);
      const yesProbability = lmsrPrices.yesPrice;
      const noProbability = lmsrPrices.noPrice;

      // Determine status
      let status: "open" | "closed" | "resolved" = "open";
      if (marketInfo._resolved) {
        status = "resolved";
      } else if (Date.now() / 1000 > Number(marketInfo._resolutionTime)) {
        status = "closed";
      }

      const details: MarketDetails = {
        address: marketAddress,
        marketName: marketName || "Unnamed Market",
        targetPrice: Number(marketInfo[0]) / 1e8, // Assuming 8 decimals
        resolutionTime: Number(marketInfo[1]),
        resolved: marketInfo[2],
        btcAboveTarget: marketInfo[3],
        actualPrice: Number(marketInfo[4]) / 1e8,
        totalEthLocked: formatUnits(marketInfo[5], 6), // USDC has 6 decimals
        yesTokenSupply: formatUnits(marketInfo[6], 6), // USDC has 6 decimals
        noTokenSupply: formatUnits(marketInfo[7], 6), // USDC has 6 decimals
        yesToken: marketInfo[8],
        noToken: marketInfo[9],
        priceFeed: marketInfo[10],
        usdc: marketInfo[11],
        yesProbability,
        noProbability,
        status,
      };

      setMarket(details);
    } catch (err) {
      console.error(`[useMarketDetails] Error fetching market details:`, err);
      const error = err instanceof Error ? err : new Error("Failed to fetch market details");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketDetails();
  }, [marketAddress, publicClient]);

  return {
    market,
    isLoading,
    error,
    refetch: fetchMarketDetails,
  };
}
