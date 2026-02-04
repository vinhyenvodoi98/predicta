"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { Address, parseUnits } from "viem";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useMarketDetails } from "@/hooks/useMarketDetails";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Confetti } from "@/components/Confetti";
import { Rocket, Target, Clock, Dice, Money } from "@/components/icons";
import { contracts } from "@/config/contracts";
import BTCPredictionMarketABI from "@/config/abis/BTCPredictionMarket.abi.json";
import { calculateLMSRCost } from "@/utils/lmsr";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MarketPage({ params }: PageProps) {
  const [shares, setShares] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingOption, setPendingOption] = useState<string>("");

  // Properly unwrap the Promise using React's use() hook
  const { id: marketId } = use(params);

  // Wallet connection
  const { address } = useAccount();

  // Fetch real market data from blockchain
  const { market: blockchainMarket, isLoading, error, refetch: refetchMarket } = useMarketDetails(marketId as Address);

  // Contract interaction hooks
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending } = useWriteContract();
  const { writeContract: writeMint, data: mintHash, isPending: isMintPending } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.fakeUsdc.address,
    abi: contracts.fakeUsdc.abi,
    functionName: "allowance",
    args: address ? [address, marketId as Address] : undefined,
    query: {
      enabled: !!address && !!marketId,
    },
  });

  // Handle successful approve
  useEffect(() => {
    if (isApproveSuccess && pendingOption && shares[pendingOption]) {
      refetchAllowance();
      // Proceed to mint after approval
      const amount = shares[pendingOption];
      const amountInUSDC = parseUnits(amount.toString(), 6);
      const functionName = pendingOption === "yes" ? "mintYes" : "mintNo";

      writeMint({
        address: marketId as Address,
        abi: BTCPredictionMarketABI,
        functionName,
        args: [amountInUSDC],
      });
    }
  }, [isApproveSuccess]);

  // Handle successful mint
  useEffect(() => {
    if (isMintSuccess && pendingOption) {
      const option = market?.options.find((o) => o.id === pendingOption);
      setShowConfetti(true);
      setSuccessMessage(`🎉 ${shares[pendingOption]} fUSDC placed on "${option?.label}"!`);
      setShares({ ...shares, [pendingOption]: 0 });
      setPendingOption("");

      // Refetch market data to update statistics
      refetchMarket();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
  }, [isMintSuccess]);

  const CategoryIcon = Rocket; // Always use Crypto icon for BTC markets

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-200 rounded mb-4"></div>
              <div className="h-4 bg-zinc-200 rounded mb-2"></div>
              <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !blockchainMarket) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <h1 className="text-2xl font-bold text-zinc-900">Market not found</h1>
            <p className="text-zinc-600 mt-2">{error?.message || "Unable to load market data"}</p>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
              Return to markets
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // Convert blockchain market to display format
  const market = {
    id: marketId,
    title: blockchainMarket.marketName,
    description: `Will BTC reach $${blockchainMarket.targetPrice.toLocaleString()} by ${new Date(blockchainMarket.resolutionTime * 1000).toLocaleDateString()}?`,
    category: "Crypto",
    endDate: new Date(blockchainMarket.resolutionTime * 1000).toISOString().split("T")[0],
    totalVolume: parseFloat(blockchainMarket.totalEthLocked),
    status: blockchainMarket.status,
    options: [
      {
        id: "yes",
        label: "Yes",
        probability: blockchainMarket.yesProbability,
        totalShares: parseFloat(blockchainMarket.yesTokenSupply),
      },
      {
        id: "no",
        label: "No",
        probability: blockchainMarket.noProbability,
        totalShares: parseFloat(blockchainMarket.noTokenSupply),
      },
    ],
  };

  const handleShareChange = (optionId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setShares({ ...shares, [optionId]: numValue });
  };

  const handlePlacePrediction = async (optionId: string) => {
    const shareCount = shares[optionId] || 0;
    if (shareCount <= 0 || !address || !marketId) return;

    try {
      setPendingOption(optionId);
      const amountInUSDC = parseUnits(shareCount.toString(), 6); // USDC has 6 decimals

      // Check if allowance is sufficient
      const currentAllowance = (allowance as bigint) || BigInt(0);

      if (currentAllowance < amountInUSDC) {
        // Need to approve first
        writeApprove({
          address: contracts.fakeUsdc.address,
          abi: contracts.fakeUsdc.abi,
          functionName: "approve",
          args: [marketId as Address, amountInUSDC],
        });
      } else {
        // Already approved, proceed to mint
        const functionName = optionId === "yes" ? "mintYes" : "mintNo";

        writeMint({
          address: marketId as Address,
          abi: BTCPredictionMarketABI,
          functionName,
          args: [amountInUSDC],
        });
      }
    } catch (error) {
      console.error("Prediction error:", error);
      setPendingOption("");
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
                    disabled={
                      !shares[option.id] ||
                      shares[option.id] <= 0 ||
                      !address ||
                      (pendingOption === option.id && (isApprovePending || isMintPending || isApproveConfirming || isMintConfirming))
                    }
                    className="disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center gap-2"
                    size="lg"
                  >
                    {pendingOption === option.id && (isApprovePending || isApproveConfirming) ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </>
                    ) : pendingOption === option.id && (isMintPending || isMintConfirming) ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        Go
                      </>
                    )}
                  </Button>
                </div>

                {shares[option.id] > 0 && (() => {
                  const cost = calculateLMSRCost(
                    parseFloat(blockchainMarket.yesTokenSupply),
                    parseFloat(blockchainMarket.noTokenSupply),
                    shares[option.id],
                    option.id === "yes",
                    100
                  );
                  return (
                    <div className="mt-4 p-3 bg-yellow-300 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-bold text-black uppercase flex items-center gap-2">
                        <Money className="w-4 h-4" />
                        Cost: ${cost.toFixed(2)} fUSDC
                      </p>
                      <p className="text-[8px] text-black mt-1">
                        Avg price: ${(cost / shares[option.id]).toFixed(4)} per share
                      </p>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
