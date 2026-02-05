"use client";

import { useAccount } from "wagmi";
import { useYellowBalance, formatYellowBalance } from "@/hooks/useYellowBalance";

export function YellowBalance() {
  const { address } = useAccount();
  const { balance, isLoading, error } = useYellowBalance(address);

  // Show loading only if we're connecting and have no balance data yet
  if (isLoading && !balance) {
    return (
      <div className="bg-yellow-50 border-4 border-yellow-600 p-4 animate-pulse">
        <div className="text-[8px] font-bold text-yellow-700 uppercase mb-2">
          Yellow Network Balance
        </div>
        <div className="text-[14px] font-bold text-yellow-900">
          Loading...
        </div>
      </div>
    );
  }

  // Only show error if we have an error AND no balance data
  if (error && !balance) {
    return (
      <div className="bg-rose-50 border-4 border-rose-600 p-4">
        <div className="text-[8px] font-bold text-rose-700 uppercase mb-2">
          Yellow Network Balance
        </div>
        <div className="text-[10px] font-bold text-rose-900">
          Error loading balance
        </div>
        <div className="text-[8px] text-rose-600 mt-1">
          {error.message}
        </div>
      </div>
    );
  }

  if (!balance || !address) {
    return (
      <div className="bg-zinc-50 border-4 border-zinc-400 p-4">
        <div className="text-[8px] font-bold text-zinc-500 uppercase mb-2">
          Yellow Network Balance
        </div>
        <div className="text-[20px] font-bold text-zinc-400">
          0.0000 yUSD
        </div>
        <div className="text-[8px] text-zinc-500 mt-1">
          Connect wallet to view balance
        </div>
      </div>
    );
  }

  const totalFormatted = formatYellowBalance(balance.total, 4);

  return (
    <div className="bg-yellow-50 border-4 border-yellow-600 p-4">
      <div className="text-[8px] font-bold text-yellow-700 uppercase mb-2">
        Yellow Network Balance
      </div>
      <div className="text-[20px] font-bold text-yellow-900">
        {totalFormatted} yUSD
      </div>
      <div className="text-[8px] text-yellow-600 mt-1">
        Real-time balance from Yellow clearnode
      </div>

      {/* Breakdown */}
      {balance.breakdown && balance.breakdown.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[7px] font-bold text-yellow-700 uppercase">
            Breakdown
          </div>
          {balance.breakdown.map((item, index) => (
            <div
              key={`${item.channelId}-${index}`}
              className="flex items-center justify-between text-[8px] text-yellow-800"
            >
              <span className="font-bold">{item.tokenSymbol}</span>
              <span>{formatYellowBalance(item.amount, 4)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {balance.lastUpdated && (
        <div className="text-[7px] text-yellow-500 mt-2">
          Updated: {new Date(balance.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
