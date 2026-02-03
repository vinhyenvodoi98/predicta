/**
 * React hook for creating prediction markets via PredictionMarketFactory
 */

import { useState, useCallback } from "react";
import { usePublicClient, useWalletClient, useAccount } from "wagmi";
import { Address, parseAbiItem, decodeEventLog } from "viem";

// PredictionMarketFactory ABI functions
const FACTORY_ABI = [
  parseAbiItem("function createSimpleMarket(uint256 targetPrice, uint256 resolutionTime, string marketName) returns (address)"),
  parseAbiItem("function createMarket(uint256 targetPrice, uint256 resolutionTime, string marketName, bytes32 salt) returns (address market)"),
  parseAbiItem("event MarketCreated(address indexed marketAddress, uint256 targetPrice, uint256 resolutionTime, address indexed priceFeed, string marketName, uint256 indexed marketId)"),
] as const;

interface CreateMarketParams {
  targetPrice: string; // e.g., "50000" for $50,000
  expiryTime: number; // Unix timestamp
  description: string;
  useSalt?: boolean;
  salt?: `0x${string}`;
}

interface UseCreateMarketResult {
  isCreating: boolean;
  error: Error | null;
  createMarket: (params: CreateMarketParams) => Promise<Address>;
  txHash: `0x${string}` | null;
  marketAddress: Address | null;
}

/**
 * Hook for creating prediction markets
 */
export function useCreateMarket(
  factoryAddress: Address | undefined,
  chainId: number = 11155111 // Sepolia
): UseCreateMarketResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [marketAddress, setMarketAddress] = useState<Address | null>(null);

  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient({ chainId });
  const { data: walletClient } = useWalletClient({ chainId });

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(
    async (params: CreateMarketParams): Promise<Address> => {
      if (!factoryAddress) {
        throw new Error("Factory address not configured");
      }

      if (!userAddress || !publicClient || !walletClient) {
        throw new Error("Wallet not connected");
      }

      if (!walletClient.account) {
        throw new Error("No account found in wallet");
      }

      setIsCreating(true);
      setError(null);
      setTxHash(null);
      setMarketAddress(null);

      try {
        console.log(`[useCreateMarket] 🏭 Creating market...`);
        console.log(`[useCreateMarket] Target Price: ${params.targetPrice}`);
        console.log(`[useCreateMarket] Expiry: ${new Date(params.expiryTime * 1000).toISOString()}`);
        console.log(`[useCreateMarket] Description: ${params.description}`);

        // Convert target price to proper format (assuming 8 decimals like BTC/USD)
        const targetPriceScaled = BigInt(Math.floor(parseFloat(params.targetPrice) * 1e8));

        let hash: `0x${string}`;

        if (params.useSalt && params.salt) {
          // Create market with salt for deterministic address
          hash = await walletClient.writeContract({
            address: factoryAddress,
            abi: FACTORY_ABI,
            functionName: "createMarket",
            args: [targetPriceScaled, BigInt(params.expiryTime), params.description, params.salt],
            account: walletClient.account,
          });
        } else {
          // Create simple market
          hash = await walletClient.writeContract({
            address: factoryAddress,
            abi: FACTORY_ABI,
            functionName: "createSimpleMarket",
            args: [targetPriceScaled, BigInt(params.expiryTime), params.description],
            account: walletClient.account,
          });
        }

        setTxHash(hash);
        console.log(`[useCreateMarket] 📝 Transaction hash: ${hash}`);
        console.log(`[useCreateMarket] ⏳ Waiting for transaction confirmation...`);

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        console.log(`[useCreateMarket] ✅ Transaction confirmed in block ${receipt.blockNumber}`);

        // Parse MarketCreated event to get market address
        const marketCreatedLog = receipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === "MarketCreated";
          } catch {
            return false;
          }
        });

        if (!marketCreatedLog) {
          throw new Error("Market created but could not find MarketCreated event");
        }

        const decodedEvent = decodeEventLog({
          abi: FACTORY_ABI,
          data: marketCreatedLog.data,
          topics: marketCreatedLog.topics,
        });

        const createdMarketAddress = (decodedEvent.args as any).marketAddress as Address;
        setMarketAddress(createdMarketAddress);

        console.log(`[useCreateMarket] 🎉 Market created at: ${createdMarketAddress}`);

        return createdMarketAddress;
      } catch (err) {
        console.error("[useCreateMarket] Error creating market:", err);
        const error = err instanceof Error ? err : new Error("Failed to create market");
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [factoryAddress, userAddress, publicClient, walletClient]
  );

  return {
    isCreating,
    error,
    createMarket,
    txHash,
    marketAddress,
  };
}
