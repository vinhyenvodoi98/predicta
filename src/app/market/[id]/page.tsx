"use client";

import { useState } from "react";
import Link from "next/link";
import { ComponentType } from "react";
import { markets } from "@/data/markets";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Confetti } from "@/components/Confetti";
import { Rocket, Lightbulb, Globe, Car, Chart, Target, Clock, Dice, Money } from "@/components/icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

const categoryIcons: Record<string, ComponentType<{ className?: string }>> = {
  Crypto: Rocket,
  Technology: Lightbulb,
  Space: Globe,
  Climate: Globe,
  Transportation: Car,
};

export default function MarketPage({ params }: PageProps) {
  const [shares, setShares] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const resolvedParams = Promise.resolve(params).then((p) => p);
  const [marketId, setMarketId] = useState<string>("");

  resolvedParams.then((p) => setMarketId(p.id));

  const market = markets.find((m) => m.id === marketId);
  const CategoryIcon = market ? (categoryIcons[market.category] || Chart) : Chart;

  if (!market) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <h1 className="text-2xl font-bold text-zinc-900">Market not found</h1>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
              Return to markets
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleShareChange = (optionId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setShares({ ...shares, [optionId]: numValue });
  };

  const handlePlacePrediction = (optionId: string) => {
    const shareCount = shares[optionId] || 0;
    if (shareCount > 0) {
      const option = market?.options.find((o) => o.id === optionId);
      setShowConfetti(true);
      setSuccessMessage(`🎉 ${shareCount} shares placed on "${option?.label}"!`);
      setShares({ ...shares, [optionId]: 0 });
      setSelectedOption("");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-indigo-100 via-purple-100 to-pink-100">
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-[10px] font-bold text-white bg-black hover:bg-zinc-800 mb-6 inline-flex items-center gap-2 px-4 py-2 border-4 border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all uppercase"
        >
          <span>←</span>
          Back
        </Link>

        {successMessage && (
          <div className="mb-6 p-4 bg-yellow-300 border-8 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce">
            <p className="text-black font-bold text-center text-[12px] uppercase">
              {successMessage}
            </p>
          </div>
        )}

        <Card className="mb-6 overflow-hidden bg-linear-to-b from-white to-zinc-100">
          <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="pt-2">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-[14px] font-bold text-zinc-900 uppercase leading-tight">{market.title}</h1>
              <Badge variant="info">
                <CategoryIcon className="w-3 h-3" />
              </Badge>
            </div>

            <p className="text-[8px] text-zinc-700 mb-6 leading-relaxed">{market.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black border-4 border-yellow-300">
                <span className="text-[8px] text-yellow-300 flex items-center gap-1 uppercase font-bold mb-2">
                  <Target className="w-3 h-3" />
                  Predictions
                </span>
                <p className="text-[16px] font-bold text-white">
                  {market.totalVolume.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-black border-4 border-pink-300">
                <span className="text-[8px] text-pink-300 flex items-center gap-1 uppercase font-bold mb-2">
                  <Clock className="w-3 h-3" />
                  Closes
                </span>
                <p className="text-[16px] font-bold text-white">
                  {new Date(market.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-linear-to-b from-white to-zinc-100">
          <div className="bg-black text-white p-3 -m-6 mb-6 border-b-4 border-yellow-300">
            <h2 className="text-[14px] font-bold flex items-center gap-2 uppercase">
              <Dice className="w-5 h-5" />
              Place Your Prediction
            </h2>
          </div>

          <div className="space-y-6">
            {market.options.map((option) => (
              <div
                key={option.id}
                className="p-6 border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-100 group bg-linear-to-b from-white to-zinc-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors uppercase">
                    {option.label}
                  </h3>
                  <span className="text-[24px] font-bold text-white bg-emerald-500 px-3 py-1 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    {(option.probability * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="relative h-6 bg-black border-4 border-black overflow-hidden mb-4">
                  <div
                    className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                    style={{ width: `${option.probability * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mb-4 text-[8px] text-zinc-700 font-bold uppercase">
                  <span className="flex items-center gap-1">
                    👥 {option.totalShares.toLocaleString()} shares
                  </span>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor={`shares-${option.id}`}
                      className="block text-[8px] font-bold text-zinc-900 mb-2 uppercase"
                    >
                      Amount:
                    </label>
                    <input
                      id={`shares-${option.id}`}
                      type="number"
                      min="0"
                      value={shares[option.id] || ""}
                      onChange={(e) => handleShareChange(option.id, e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all text-[14px] font-bold bg-white"
                    />
                  </div>
                  <Button
                    onClick={() => handlePlacePrediction(option.id)}
                    disabled={!shares[option.id] || shares[option.id] <= 0}
                    className="disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center gap-2"
                    size="lg"
                  >
                    <Rocket className="w-4 h-4" />
                    Go
                  </Button>
                </div>

                {shares[option.id] > 0 && (
                  <div className="mt-4 p-3 bg-yellow-300 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <p className="text-[10px] font-bold text-black uppercase flex items-center gap-2">
                      <Money className="w-4 h-4" />
                      Cost: ${(shares[option.id] * option.probability).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
