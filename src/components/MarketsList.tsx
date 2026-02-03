"use client";

import { useEffect, useState } from "react";
import { Address } from "viem";
import { useFactoryMarkets } from "@/hooks/useFactoryMarkets";
import { useMarketDetails, MarketDetails } from "@/hooks/useMarketDetails";
import { MarketCard } from "./MarketCard";
import { Market } from "@/types";

/**
 * Component that loads a single market's details
 */
function MarketLoader({ address }: { address: Address }) {
  const { market, isLoading, error } = useMarketDetails(address);
  const [formattedMarket, setFormattedMarket] = useState<Market | null>(null);

  useEffect(() => {
    if (market) {
      // Convert blockchain market to UI format
      const formatted: Market = {
        id: address,
        title: market.marketName,
        description: `Will BTC reach $${market.targetPrice.toLocaleString()} by ${new Date(market.resolutionTime * 1000).toLocaleDateString()}?`,
        category: "Crypto",
        endDate: new Date(market.resolutionTime * 1000).toISOString().split("T")[0],
        totalVolume: parseFloat(market.totalEthLocked),
        status: market.status,
        options: [
          {
            id: `${address}-yes`,
            label: "Yes",
            probability: market.yesProbability,
            totalShares: parseFloat(market.yesTokenSupply),
          },
          {
            id: `${address}-no`,
            label: "No",
            probability: market.noProbability,
            totalShares: parseFloat(market.noTokenSupply),
          },
        ],
      };
      setFormattedMarket(formatted);
    }
  }, [market, address]);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 animate-pulse">
        <div className="h-6 bg-zinc-200 rounded mb-4"></div>
        <div className="h-4 bg-zinc-200 rounded mb-2"></div>
        <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !formattedMarket) {
    return (
      <div className="bg-rose-50 border-4 border-rose-600 p-6">
        <div className="text-[10px] font-bold text-rose-900 uppercase">
          Failed to load market
        </div>
      </div>
    );
  }

  return <MarketCard market={formattedMarket} />;
}

/**
 * Component that fetches and displays all markets from the factory
 */
export function MarketsList() {
  const { markets, isLoading, error, marketCount } = useFactoryMarkets();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block bg-zinc-100 border-4 border-black p-6">
          <div className="text-[12px] font-bold text-zinc-900 uppercase">
            Loading markets...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-block bg-rose-50 border-4 border-rose-600 p-6">
          <div className="text-[12px] font-bold text-rose-900 uppercase mb-2">
            Error Loading Markets
          </div>
          <div className="text-[10px] text-rose-700">{error.message}</div>
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block bg-zinc-100 border-4 border-black p-8">
          <div className="text-[14px] font-bold text-zinc-900 uppercase mb-2">
            No Markets Yet
          </div>
          <div className="text-[10px] text-zinc-600 mb-4">
            Be the first to create a prediction market!
          </div>
          <a
            href="/create"
            className="inline-block text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 px-4 py-3 uppercase tracking-wide"
          >
            Create Market
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-[10px] text-zinc-600 uppercase font-bold">
        {marketCount} Total Market{marketCount !== 1 ? "s" : ""} • {markets.length} Active
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {markets.map((marketAddress) => (
          <MarketLoader key={marketAddress} address={marketAddress} />
        ))}
      </div>
    </div>
  );
}
