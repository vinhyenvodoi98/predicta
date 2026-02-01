/**
 * React hook to get Yellow Network balance from real-time clearnode data
 */

import { useMemo } from "react";
import { Address } from "viem";
import { useYellow } from "@/contexts/YellowContext";

interface UnifiedBalance {
  user: Address;
  total: string; // BigInt as string
  breakdown: Array<{
    chainId: number;
    token: Address;
    tokenSymbol: string;
    amount: string; // BigInt as string
    channelId: string;
    status: string;
  }>;
  lastUpdated: number;
}

interface UseYellowBalanceResult {
  balance: UnifiedBalance | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Get unified balance from Yellow Network real-time data
 * Uses balances from YellowContext (received via clearnode WebSocket)
 */
export function useYellowBalance(
  userAddress: Address | undefined
): UseYellowBalanceResult {
  const { balances, isAuthenticated, isConnecting, error: yellowError } = useYellow();

  // Transform clearnode balances into unified balance format
  const balance = useMemo<UnifiedBalance | null>(() => {
    if (!userAddress || !isAuthenticated || balances.length === 0) {
      return null;
    }

    try {
      // Calculate total and create breakdown
      let totalAmount = BigInt(0);
      const breakdown = balances.map((bal: any, index: number) => {
        const amount = bal.amount || bal.balance || "0";
        const amountBigInt = typeof amount === "string" ? BigInt(amount) : BigInt(amount.toString());
        totalAmount += amountBigInt;

        return {
          chainId: 11155111, // Default to Sepolia
          token: (bal.asset || bal.token || "0x0000000000000000000000000000000000000000") as Address,
          tokenSymbol: bal.symbol || bal.asset || "ytest.usd",
          amount: amountBigInt.toString(),
          channelId: bal.channelId || `channel-${index}`,
          status: "OPEN",
        };
      });

      return {
        user: userAddress,
        total: totalAmount.toString(),
        breakdown,
        lastUpdated: Date.now(),
      };
    } catch (err) {
      console.error("[useYellowBalance] Error processing balances:", err);
      return null;
    }
  }, [userAddress, isAuthenticated, balances]);

  // Mock refetch function (real-time data updates automatically)
  const refetch = async () => {
    console.log("[useYellowBalance] Balance updates automatically via clearnode WebSocket");
  };

  return {
    balance,
    isLoading: isConnecting,
    error: yellowError,
    refetch,
  };
}

/**
 * Format balance from wei to ETH with decimals
 */
export function formatBalance(
  balanceWei: string | bigint,
  decimals: number = 4
): string {
  try {
    const wei = typeof balanceWei === "string" ? BigInt(balanceWei) : balanceWei;
    const eth = Number(wei) / 1e18;
    return eth.toFixed(decimals);
  } catch (error) {
    console.error("[formatBalance] Error:", error);
    return "0.00";
  }
}

/**
 * Format balance with symbol (e.g., "1.2345 ETH")
 */
export function formatBalanceWithSymbol(
  balanceWei: string | bigint,
  symbol: string = "ETH",
  decimals: number = 4
): string {
  const formatted = formatBalance(balanceWei, decimals);
  return `${formatted} ${symbol}`;
}

/**
 * Format balance as USD (mock - in production, use real price feeds)
 */
export function formatBalanceAsUSD(
  balanceWei: string | bigint,
  ethPriceUSD: number = 3000
): string {
  try {
    const wei = typeof balanceWei === "string" ? BigInt(balanceWei) : balanceWei;
    const eth = Number(wei) / 1e18;
    const usd = eth * ethPriceUSD;
    return usd.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    console.error("[formatBalanceAsUSD] Error:", error);
    return "$0.00";
  }
}
