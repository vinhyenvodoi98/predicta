import Link from "next/link";
import { Market } from "@/types";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Rocket, Lightbulb, Globe, Car, Target, Clock, Chart } from "./icons";
import { ComponentType } from "react";

interface MarketCardProps {
  market: Market;
}

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  Crypto: Rocket,
  Technology: Lightbulb,
  Space: Globe,
  Climate: Globe,
  Transportation: Car,
};

export function MarketCard({ market }: MarketCardProps) {
  const highestOption = market.options.reduce((prev, current) =>
    prev.probability > current.probability ? prev : current
  );

  const CategoryIcon = categoryIcons[market.category] || Chart;

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-100 cursor-pointer group overflow-hidden relative bg-linear-to-b from-white to-zinc-50">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[10px] font-bold text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase">
              {market.title}
            </h3>
            <Badge variant="info">
              <CategoryIcon className="w-3 h-3" />
            </Badge>
          </div>

          <p className="text-[8px] text-zinc-600 line-clamp-2 leading-relaxed">
            {market.description}
          </p>

          <div className="flex flex-col gap-3 pt-3 border-t-4 border-black border-dotted">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-bold text-zinc-700 uppercase">
                {highestOption.label}
              </span>
              <span className="text-xl font-bold text-emerald-500 px-2 py-1 bg-black">
                {(highestOption.probability * 100).toFixed(0)}%
              </span>
            </div>

            <div className="relative h-4 bg-black border-2 border-black overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                style={{ width: `${highestOption.probability * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[8px] text-zinc-600 uppercase font-bold">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {market.totalVolume.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(market.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
